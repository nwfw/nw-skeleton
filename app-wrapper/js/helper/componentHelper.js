var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var BaseClass = require('../base').BaseClass;

var _appWrapper;
var appUtil;
var appState;

var BaseComponent;

class ComponentHelper extends BaseClass {
    constructor() {
        super();

        _appWrapper = this.getAppWrapper();
        appUtil = this.getAppUtil();
        appState = this.getAppState();

        this.forceDebug = appUtil.getConfig('forceDebug.componentHelper');
        this.forceUserMessages = appUtil.getConfig('forceUserMessages.componentHelper');

        this.allComponents = {};
        this.vueComponents = {};
        this.vueAppComponents = {};
        this.vueGlobalComponents = {};
        this.vueModalComponents = {};
        this.debugVueComponents = {};

        this.vueMixins = null;
        this.appVueMixins = null;

        this.vueFilters = null;
        this.appVueFilters = null;

        BaseComponent = require('../mixin/baseComponent').component;

        return this;
    }

    async initialize () {
        _.noop(_appWrapper);
        await super.initialize();
        this.vueFilters = await this.initFilters();
        this.vueMixins = await this.loadMixins();
        await this.initComponents();
        return this;
    }

    async finalize () {
        return true;
    }

    async loadMixins(){
        var vueMixins = [];
        var appVueMixins = [];

        var mixinIndexFile = path.resolve(appState.config.wrapper.mixinRoot + '/index');
        if (fs.existsSync(mixinIndexFile + '.js')){
            vueMixins = await this.initMixins(mixinIndexFile);
        }

        var appMixinIndexFile = path.resolve(appState.config.appConfig.mixinRoot + '/index');
        if (fs.existsSync(appMixinIndexFile + '.js')){
            appVueMixins = await this.initMixins(appMixinIndexFile);
        }

        vueMixins = _.union(vueMixins, appVueMixins);
        return vueMixins;
    }

    async initMixins (mixinIndexFile){
        var vueMixins = [];
        var vueMixinData = require(mixinIndexFile).mixins;
        vueMixinData.forEach((MixinObj) => {
            vueMixins.push(MixinObj.mixin);
            Vue.mixin(MixinObj.mixin);
        });
        return vueMixins;
    }

    async initFilters(){
        var vueFilters = [];
        var appVueFilters = [];

        var filtersDir = appUtil.getConfig('wrapper.filterRoot');
        if (filtersDir){
            filtersDir = path.resolve(appState.config.wrapper.filterRoot);
            var filterRegex = appUtil.getConfig('wrapper.filterExtensionRegex');
            if (fs.existsSync(filtersDir)){
                vueFilters = await appUtil.loadFilesFromDir(filtersDir, filterRegex, true);
            }
        }

        var appFiltersDir = appUtil.getConfig('appConfig.filterRoot');
        if (appFiltersDir){
            appFiltersDir = path.resolve(appFiltersDir);
            var appFilterRegex = appUtil.getConfig('appConfig.filterExtensionRegex');
            if (fs.existsSync(filtersDir)){
                appVueFilters = await appUtil.loadFilesFromDir(appFiltersDir, appFilterRegex, true);
            }

            vueFilters = _.merge(vueFilters, appVueFilters);
        }
        return vueFilters;
    }

    async loadDirComponents(componentDirs){
        var components = {};
        for(let i=0; i<componentDirs.length;i++){
            if (fs.existsSync(componentDirs[i])){
                appUtil.log('Loading components from directory \'{1}\'.', 'debug', [componentDirs[i]], false, this.forceDebug);
                var newComponents = await appUtil.loadFilesFromDir(componentDirs[i], appState.config.wrapper.componentCodeRegex, true);
                if (newComponents && _.isObject(newComponents) && _.keys(newComponents).length){
                    components = _.merge(components, newComponents);
                }
            } else {
                appUtil.log('Component directory \'{1}\' does not exist.', 'warning', [componentDirs[i]], false, this.forceDebug);
            }
        }
        return components;
    }

    async initComponents (){
        await this.loadComponents();

        appUtil.log('Preparing wrapper components...', 'group', [], false, this.forceDebug);
        this.vueComponents = await this.prepareComponents(this.vueComponents, this.allComponents, appState.config.wrapper.componentMapping);
        appUtil.log('Preparing wrapper components...', 'groupend', [], false, this.forceDebug);

        appUtil.log('Preparing app components...', 'group', [], false, this.forceDebug);
        this.vueAppComponents = await this.prepareComponents(this.vueAppComponents, this.allComponents, appState.config.appConfig.appComponentMapping);
        appUtil.log('Preparing app components...', 'groupend', [], false, this.forceDebug);

        appUtil.log('Preparing modal components...', 'group', [], false, this.forceDebug);
        this.vueModalComponents = await this.prepareComponents(this.vueModalComponents, this.allComponents, {});
        appUtil.log('Preparing modal components...', 'groupend', [], false, this.forceDebug);

        appUtil.log('Preparing global components...', 'group', [], false, this.forceDebug);
        this.vueGlobalComponents = await this.prepareComponents(this.vueGlobalComponents, this.allComponents, {});
        appUtil.log('Preparing global components...', 'groupend', [], false, this.forceDebug);

        this.vueComponents = _.merge(this.vueComponents, this.vueAppComponents);

        // add modal dialog components
        this.vueGlobalComponents['modal-dialog'].components = this.vueModalComponents;

        // register global components
        var globalComponentNames = _.keys(this.vueGlobalComponents);
        for(let i=0; i<globalComponentNames.length;i++){
            Vue.component(globalComponentNames[i], this.vueGlobalComponents[globalComponentNames[i]]);
        }
    }

    async loadComponents (){
        appUtil.log('Loading components...', 'group', [], false, this.forceDebug);

        var components = await this.loadDirComponents(appUtil.getConfig('wrapper.componentDirectories.component'));

        var globalComponents = await this.loadDirComponents(appUtil.getConfig('wrapper.componentDirectories.globalComponent'));
        globalComponents = _.merge(globalComponents, await this.loadDirComponents(appUtil.getConfig('appConfig.componentDirectories.globalComponent')));

        var modalComponents = await this.loadDirComponents(appUtil.getConfig('wrapper.componentDirectories.modalComponent'));
        modalComponents = _.merge(modalComponents, await this.loadDirComponents(appUtil.getConfig('appConfig.componentDirectories.modalComponent')));

        var appComponents = await this.loadDirComponents(appUtil.getConfig('appConfig.componentDirectories.component'));


        this.allComponents = _.merge(components, globalComponents, modalComponents, appComponents);

        appUtil.log('Loading components...', 'groupend', [], false, this.forceDebug);

        appUtil.log('Initializing components...', 'group', [], false, this.forceDebug);


        this.vueGlobalComponents = await this.initComponentGroup(globalComponents);
        this.vueModalComponents = await this.initComponentGroup(modalComponents);
        this.vueComponents = await this.initComponentGroup(components);
        this.vueAppComponents = await this.initComponentGroup(appComponents);

        appUtil.log('Initializing components...', 'groupend', [], false, this.forceDebug);
    }

    async initComponentGroup (componentData){
        var components = {};

        for (var componentName in componentData){
            var subComponents = {};
            if (componentName == 'modal-dialog'){
                subComponents = this.vueModalComponents;
            }
            components[componentName] = await this.initVueComponent(componentName, componentData[componentName], subComponents);

        }
        appUtil.addUserMessage('Component initialization finished. {1} vue root components initialized.', 'debug', [_.keys(components).length], false, false, this.forceUserMessages, true);
        return components;
    }

    async initVueComponent(componentName, componentData, additionalSubComponents){
        appUtil.log('* Initializing component \'{1}\'...', 'debug', [componentName], false, this.forceDebug);
        var component = componentData;

        if (component.mixins){
            component.mixins.push(BaseComponent);
        } else {
            component.mixins = [BaseComponent];
        }

        if (additionalSubComponents){
            if (!component.components) {
                component.components = {};
            }
        }

        if (additionalSubComponents && _.keys(additionalSubComponents).length){
            component.components = _.merge(component.components, additionalSubComponents);
        }

        var initializedMessage = '* Componenent \'{1}\' initialized';
        var initializedMessageData = [componentName];
        var subComponentNames = component.components ? _.keys(component.components) : [];
        var subComponentCount = component.components && subComponentNames.length ? subComponentNames.length : 0;
        if (subComponentCount){
            initializedMessage += ' with {2} sub-components ({3}).';
            initializedMessageData.push(subComponentCount);
            initializedMessageData.push('\'' + subComponentNames.join('\', \'') + '\'.');
        } else {
            initializedMessage += '.';
        }

        component.filters = this.vueFilters;

        appUtil.log(initializedMessage, 'debug', initializedMessageData, false, this.forceDebug);
        return component;
    }

    async mapComponentChildren (parentComponent, allComponents, childComponentsMapping) {
        var parentComponentName = parentComponent.name;

        var childMapping = childComponentsMapping.components;
        var childNames = '\'' + _.map(childMapping, function(item){
            return item.name;
        }).join('\', \'') + '\'';

        appUtil.log('Mapping {1} children ({2}) for component \'{3}\'...', 'group', [childMapping.length, childNames, parentComponentName], false, this.forceDebug);

        for (var i = 0; i<childComponentsMapping.components.length; i++){
            var childComponentMapping = childComponentsMapping.components[i];
            var childComponentName = childComponentMapping.name;

            var childComponent;

            if (childComponentMapping.components){
                appUtil.log('Preparing child component \'{1}\' of \'{2}\' with {3} children...', 'debug', [childComponentName, parentComponentName, childComponentMapping.components.length], false, this.forceDebug);
                childComponent = await this.mapComponentChildren(allComponents[childComponentName], allComponents, childComponentMapping);
            } else {
                childComponent = allComponents[childComponentName];
                appUtil.log('Preparing child component \'{1}\' of \'{2}\' without children...', 'debug', [childComponentName, parentComponentName], false, this.forceDebug);
            }

            parentComponent.components[childComponentName] = childComponent;
            appUtil.log('Registered sub-component \'{1}\' for parent \'{2}\'.', 'debug', [childComponentName, parentComponentName], false, self.forceDebug);
        }

        appUtil.log('Mapping {1} children ({2}) for component \'{3}\'...', 'groupend', [childMapping.length, childNames, parentComponentName], false, this.forceDebug);
        return parentComponent;
    }

    async prepareComponents(components, allComponents, componentMapping){
        if (componentMapping && _.isObject(componentMapping) && _.keys(componentMapping).length){
            for (var parentComponentName in componentMapping){
                if (componentMapping[parentComponentName].components && componentMapping[parentComponentName].components.length){
                    appUtil.log('Preparing component \'{1}\' with {2} children...', 'debug', [parentComponentName, componentMapping[parentComponentName].components.length], false, this.forceDebug);

                    components[parentComponentName] = await this.mapComponentChildren(components[parentComponentName], allComponents, componentMapping[parentComponentName]);

                } else {
                    appUtil.log('Preparing component \'{1}\' without children...', 'debug', [parentComponentName], false, this.forceDebug);
                }
            }
        }
        return components;
    }

}

exports.ComponentHelper = ComponentHelper;