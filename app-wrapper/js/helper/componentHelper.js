var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var BaseClass = require('../base').BaseClass;

var _appWrapper;

var BaseComponent;

class ComponentHelper extends BaseClass {
    constructor() {
        super();

        _appWrapper = this.getAppWrapper();

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

        var mixinsDir = this.getConfig('wrapper.mixinRoot');
        if (mixinsDir){
            mixinsDir = path.resolve(mixinsDir);
            var mixinRegex = this.getConfig('wrapper.mixinExtensionRegex');
            if (fs.existsSync(mixinsDir)){
                vueMixins = await this.initMixins(await _appWrapper.fileManager.loadFilesFromDir(mixinsDir, mixinRegex, true));
            }
        }

        var appMixinsDir = this.getConfig('appConfig.mixinRoot');
        if (appMixinsDir){
            appMixinsDir = path.resolve(appMixinsDir);
            var appMixinRegex = this.getConfig('appConfig.mixinExtensionRegex');
            if (fs.existsSync(mixinsDir)){
                appVueMixins = await this.initMixins(await _appWrapper.fileManager.loadFilesFromDir(appMixinsDir, appMixinRegex, true));
            }

            vueMixins = _.merge(vueMixins, appVueMixins);
        }
        return vueMixins;
    }

    async initMixins (vueMixinData){
        var vueMixins = [];
        for (let mixinName in vueMixinData){
            vueMixins.push(vueMixinData[mixinName]);
            Vue.mixin(vueMixinData[mixinName]);
        }
        return vueMixins;
    }

    async initFilters(){
        var vueFilters = [];
        var appVueFilters = [];

        var filtersDir = this.getConfig('wrapper.filterRoot');
        if (filtersDir){
            filtersDir = path.resolve(filtersDir);
            var filterRegex = this.getConfig('wrapper.filterExtensionRegex');
            if (fs.existsSync(filtersDir)){
                vueFilters = await _appWrapper.fileManager.loadFilesFromDir(filtersDir, filterRegex, true);
            }
        }

        var appFiltersDir = this.getConfig('appConfig.filterRoot');
        if (appFiltersDir){
            appFiltersDir = path.resolve(appFiltersDir);
            var appFilterRegex = this.getConfig('appConfig.filterExtensionRegex');
            if (fs.existsSync(filtersDir)){
                appVueFilters = await _appWrapper.fileManager.loadFilesFromDir(appFiltersDir, appFilterRegex, true);
            }

            vueFilters = _.merge(vueFilters, appVueFilters);
        }
        return vueFilters;
    }

    async loadDirComponents(componentDirs){
        var components = {};
        var componentCodeRegex = this.getConfig('wrapper.componentCodeRegex');
        for(let i=0; i<componentDirs.length;i++){
            if (fs.existsSync(componentDirs[i])){
                this.log('Loading components from directory "{1}".', 'debug', [componentDirs[i]], false);
                var newComponents = await _appWrapper.fileManager.loadFilesFromDir(componentDirs[i], componentCodeRegex, true);
                if (newComponents && _.isObject(newComponents) && _.keys(newComponents).length){
                    components = _.merge(components, newComponents);
                }
            } else {
                this.log('Component directory "{1}" does not exist.', 'warning', [componentDirs[i]], false);
            }
        }
        return components;
    }

    async initComponents (){
        let totalComponents = 0;
        this.addUserMessage('Component initialization starting...', 'debug', [], false, false);

        await this.loadComponents();

        var componentMapping = this.getConfig('wrapper.componentMapping');
        var appComponentMapping = this.getConfig('appConfig.appComponentMapping');

        this.log('Preparing wrapper components...', 'group', [], false);
        this.vueComponents = await this.prepareComponents(this.vueComponents, this.allComponents, componentMapping);
        totalComponents += _.keys(this.vueComponents).length;
        this.log('Preparing wrapper components...', 'groupend', [], false);

        this.log('Preparing app components...', 'group', [], false);
        this.vueAppComponents = await this.prepareComponents(this.vueAppComponents, this.allComponents, appComponentMapping);
        totalComponents += _.keys(this.vueAppComponents).length;
        this.log('Preparing app components...', 'groupend', [], false);

        this.log('Preparing modal components...', 'group', [], false);
        this.vueModalComponents = await this.prepareComponents(this.vueModalComponents, this.allComponents, {});
        totalComponents += _.keys(this.vueModalComponents).length;
        this.log('Preparing modal components...', 'groupend', [], false);

        this.log('Preparing global components...', 'group', [], false);
        this.vueGlobalComponents = await this.prepareComponents(this.vueGlobalComponents, this.allComponents, {});
        totalComponents += _.keys(this.vueGlobalComponents).length;
        this.log('Preparing global components...', 'groupend', [], false);

        this.vueComponents = _.merge(this.vueComponents, this.vueAppComponents);

        // add modal dialog components
        this.vueGlobalComponents['modal-dialog'].components = this.vueModalComponents;

        // register global components
        for(let globalComponentName in this.vueGlobalComponents){
            Vue.component(globalComponentName, this.vueGlobalComponents[globalComponentName]);
        }

        this.addUserMessage('Component initialization finished. {1} components initialized.', 'debug', [totalComponents], false, false);
    }

    async loadComponents (){
        this.log('Loading components...', 'group', [], false);

        var globalComponents = await this.loadDirComponents(this.getConfig('wrapper.componentDirectories.globalComponent'));
        globalComponents = _.merge(globalComponents, await this.loadDirComponents(this.getConfig('appConfig.componentDirectories.globalComponent')));

        var components = await this.loadDirComponents(this.getConfig('wrapper.componentDirectories.component'));

        var modalComponents = await this.loadDirComponents(this.getConfig('wrapper.componentDirectories.modalComponent'));
        modalComponents = _.merge(modalComponents, await this.loadDirComponents(this.getConfig('appConfig.componentDirectories.modalComponent')));

        var appComponents = await this.loadDirComponents(this.getConfig('appConfig.componentDirectories.component'));


        this.allComponents = _.merge(components, globalComponents, modalComponents, appComponents);

        this.log('Loading components...', 'groupend', [], false);

        this.log('Initializing components...', 'group', [], false);


        this.vueGlobalComponents = await this.initComponentGroup(globalComponents);
        this.vueModalComponents = await this.initComponentGroup(modalComponents);
        this.vueComponents = await this.initComponentGroup(components);
        this.vueAppComponents = await this.initComponentGroup(appComponents);

        this.log('Initializing components...', 'groupend', [], false);
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
        return components;
    }

    async initVueComponent(componentName, componentData, additionalSubComponents){
        this.log('* Initializing component "{1}"...', 'debug', [componentName], false);
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

        var initializedMessage = '* Componenent "{1}" initialized';
        var initializedMessageData = [componentName];
        var subComponentNames = component.components ? _.keys(component.components) : [];
        var subComponentCount = component.components && subComponentNames.length ? subComponentNames.length : 0;
        if (subComponentCount){
            initializedMessage += ' with {2} sub-components ({3}).';
            initializedMessageData.push(subComponentCount);
            initializedMessageData.push('"' + subComponentNames.join('", "') + '".');
        } else {
            initializedMessage += '.';
        }

        component.filters = this.vueFilters;

        this.log(initializedMessage, 'debug', initializedMessageData, false);
        return component;
    }

    async mapComponentChildren (parentComponent, allComponents, childComponentsMapping) {
        if (!(!_.isUndefined(parentComponent) && parentComponent)){
            if (childComponentsMapping && childComponentsMapping.name && allComponents && allComponents[childComponentsMapping.name]){
                parentComponent = allComponents[childComponentsMapping.name];
            }
        }

        if (!(!_.isUndefined(parentComponent) && parentComponent)){
            this.log('Error preparing child component "{1}" - no parent component!', 'error', [childComponentMapping.name], false);
            return;
        }

        var parentComponentName = parentComponent.name;

        var childMapping = childComponentsMapping.components;
        var childNames = '"' + _.map(childMapping, function(item){
            return item.name;
        }).join('", "') + '"';

        this.log('Mapping {1} children ({2}) for component "{3}"...', 'group', [childMapping.length, childNames, parentComponentName], false);

        for (var i = 0; i<childComponentsMapping.components.length; i++){
            var childComponentMapping = childComponentsMapping.components[i];
            var childComponentName = childComponentMapping.name;

            var childComponent;

            if (childComponentMapping.components){
                this.log('Preparing child component "{1}" of "{2}" with {3} children...', 'debug', [childComponentName, parentComponentName, childComponentMapping.components.length], false);
                childComponent = await this.mapComponentChildren(allComponents[childComponentName], allComponents, childComponentMapping);
            } else {
                childComponent = allComponents[childComponentName];
                this.log('Preparing child component "{1}" of "{2}" without children...', 'debug', [childComponentName, parentComponentName], false);
            }

            parentComponent.components[childComponentName] = childComponent;
            this.log('Registered sub-component "{1}" for parent "{2}".', 'debug', [childComponentName, parentComponentName], false, self.forceDebug);
        }

        this.log('Mapping {1} children ({2}) for component "{3}"...', 'groupend', [childMapping.length, childNames, parentComponentName], false);
        return parentComponent;
    }

    async prepareComponents(components, allComponents, componentMapping){
        if (componentMapping && _.isObject(componentMapping) && _.keys(componentMapping).length){
            for (var parentComponentName in componentMapping){
                let currentComponentMapping = componentMapping[parentComponentName];
                if (currentComponentMapping){
                    if (currentComponentMapping.name){
                        if (currentComponentMapping.components && currentComponentMapping.components.length){
                            this.log('Preparing component "{1}" with {2} children...', 'debug', [parentComponentName, currentComponentMapping.components.length], false);
                            components[parentComponentName] = await this.mapComponentChildren(components[parentComponentName], allComponents, currentComponentMapping);
                        } else {
                            this.log('Preparing component "{1}" without children...', 'debug', [parentComponentName], false);
                        }
                    } else {
                        this.log('Component "{1}" nas no "name" property!', 'error', [parentComponentName], false);
                    }
                } else {
                    this.log('Preparing component "{1}" without children and config...', 'debug', [parentComponentName], false);
                }
            }
        }
        return components;
    }

}

exports.ComponentHelper = ComponentHelper;