var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var BaseClass = require('../base').BaseClass;

var _appWrapper;
var appState;
var BaseComponent;


class ComponentHelper extends BaseClass {
    constructor() {
        super();

        _appWrapper = this.getAppWrapper();
        appState = _appWrapper.getAppState();

        this.allComponents = {};
        this.vueComponents = {};
        this.vueAppComponents = {};
        this.vueGlobalComponents = {};
        this.vueModalComponents = {};
        this.debugVueComponents = {};

        this.vueMixins = null;
        this.appVueMixins = null;

        this.vueDirectives = null;
        this.appVueDirectives = null;

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
        this.vueDirectives = await this.loadDirectives();
        await this.initializeComponents();
        return this;
    }

    async finalize () {
        return true;
    }

    async loadDirectives(){
        var vueDirectives = [];
        var appVueDirectives = [];

        this.log('Loading directives...', 'group', []);

        var directivesDir = this.getConfig('wrapper.directiveRoot');
        if (directivesDir){
            directivesDir = path.resolve(directivesDir);
            var directiveRegex = this.getConfig('wrapper.directiveExtensionRegex');
            if (fs.existsSync(directivesDir)){
                this.log('Loading wrapper directives', 'group', []);
                vueDirectives = await this.initDirectives(await _appWrapper.fileManager.loadFilesFromDir(directivesDir, directiveRegex, true));
                this.log('Loaded {1} wrapper directives', 'info', [Object.keys(vueDirectives).length]);
                this.log('Loading wrapper directives', 'groupend', []);
            } else {
                this.log('Wrapper directives dir "{1}" does not exist', 'warning', [directivesDir]);
            }
        }

        var appDirectivesDir = this.getConfig('appConfig.directiveRoot');
        if (appDirectivesDir){
            appDirectivesDir = path.resolve(appDirectivesDir);
            var appMixinRegex = this.getConfig('appConfig.directiveExtensionRegex');
            if (fs.existsSync(directivesDir)){
                this.log('Loading app directives', 'group', []);
                appVueDirectives = await this.initDirectives(await _appWrapper.fileManager.loadFilesFromDir(appDirectivesDir, appMixinRegex, true));
                this.log('Loaded {1} app directives', 'info', [Object.keys(appVueDirectives).length]);
                this.log('Loading app directives', 'groupend', []);
            } else {
                this.log('App directives dir "{1}" does not exist', 'warning', [appDirectivesDir]);
            }

            vueDirectives = _.merge(vueDirectives, appVueDirectives);
        }

        this.log('Loading directives...', 'groupend', []);
        return vueDirectives;
    }

    async initDirectives (vueDirectiveData){
        var vueDirectives = [];
        for (let directiveName in vueDirectiveData){
            this.log('Initializing directive "{1}"', 'info', [directiveName]);
            vueDirectives.push(vueDirectiveData[directiveName]);
            Vue.directive(directiveName, vueDirectiveData[directiveName]);
        }
        return vueDirectives;
    }

    async loadMixins(){
        var vueMixins = [];
        var appVueMixins = [];

        this.log('Loading mixins...', 'group', []);

        var mixinsDir = this.getConfig('wrapper.mixinRoot');
        if (mixinsDir){
            mixinsDir = path.resolve(mixinsDir);
            var mixinRegex = this.getConfig('wrapper.mixinExtensionRegex');
            if (fs.existsSync(mixinsDir)){
                this.log('Loading wrapper mixins', 'group', []);
                vueMixins = await this.initMixins(await _appWrapper.fileManager.loadFilesFromDir(mixinsDir, mixinRegex, true));
                this.log('Loaded {1} wrapper mixins', 'info', [Object.keys(vueMixins).length]);
                this.log('Loading wrapper mixins', 'groupend', []);
            } else {
                this.log('Wrapper mixins dir "{1}" does not exist', 'warning', [mixinsDir]);
            }
        }

        var appMixinsDir = this.getConfig('appConfig.mixinRoot');
        if (appMixinsDir){
            appMixinsDir = path.resolve(appMixinsDir);
            var appMixinRegex = this.getConfig('appConfig.mixinExtensionRegex');
            if (fs.existsSync(mixinsDir)){
                this.log('Loading app mixins', 'group', []);
                appVueMixins = await this.initMixins(await _appWrapper.fileManager.loadFilesFromDir(appMixinsDir, appMixinRegex, true));
                this.log('Loaded {1} app mixins', 'info', [Object.keys(appVueMixins).length]);
                this.log('Loading app mixins', 'groupend', []);
            } else {
                this.log('App mixins dir "{1}" does not exist', 'warning', [appMixinsDir]);
            }

            vueMixins = _.merge(vueMixins, appVueMixins);
        }

        this.log('Loading mixins...', 'groupend', []);
        return vueMixins;
    }

    async initMixins (vueMixinData){
        var vueMixins = [];
        for (let mixinName in vueMixinData){
            this.log('Initializing mixin "{1}"', 'info', [mixinName]);
            vueMixins.push(vueMixinData[mixinName]);
            Vue.mixin(vueMixinData[mixinName]);
        }
        return vueMixins;
    }

    async initFilters(){
        var vueFilters = [];
        var appVueFilters = [];

        this.log('Initializing filters...', 'group', []);

        var filtersDir = this.getConfig('wrapper.filterRoot');
        if (filtersDir){
            filtersDir = path.resolve(filtersDir);
            var filterRegex = this.getConfig('wrapper.filterExtensionRegex');
            if (fs.existsSync(filtersDir)){
                this.log('Loading wrapper filters', 'info', []);
                vueFilters = await _appWrapper.fileManager.loadFilesFromDir(filtersDir, filterRegex, true);
                this.log('Loaded {1} wrapper filters - "{2}"', 'info', [Object.keys(vueFilters).length, Object.keys(vueFilters).join('", "')]);
            } else {
                this.log('Wrapper filters dir "{1}" does not exist', 'warning', [filtersDir]);
            }
        }

        var appFiltersDir = this.getConfig('appConfig.filterRoot');
        if (appFiltersDir){
            appFiltersDir = path.resolve(appFiltersDir);
            var appFilterRegex = this.getConfig('appConfig.filterExtensionRegex');
            if (fs.existsSync(filtersDir)){
                this.log('Loading app filters', 'info', []);
                appVueFilters = await _appWrapper.fileManager.loadFilesFromDir(appFiltersDir, appFilterRegex, true);
                this.log('Loaded {1} app filters - "{2}"', 'info', [Object.keys(appVueFilters).length, Object.keys(appVueFilters).join('", "')]);
            } else {
                this.log('App filters dir "{1}" does not exist', 'warning', [appFiltersDir]);
            }

            vueFilters = _.merge(vueFilters, appVueFilters);
        }

        this.log('Initializing filters...', 'groupend', []);
        return vueFilters;
    }

    async loadDirComponents(componentDirs){
        var components = {};
        var componentCodeRegex = this.getConfig('wrapper.componentCodeRegex');
        for(let i=0; i<componentDirs.length;i++){
            if (fs.existsSync(componentDirs[i])){
                this.log('Loading components from directory "{1}".', 'debug', [componentDirs[i]]);
                var newComponents = await _appWrapper.fileManager.loadFilesFromDir(componentDirs[i], componentCodeRegex, true);
                if (newComponents && _.isObject(newComponents) && _.keys(newComponents).length){
                    components = _.merge(components, newComponents);
                }
            } else {
                this.log('Component directory "{1}" does not exist.', 'warning', [componentDirs[i]]);
            }
        }
        return components;
    }

    async getComponentModuleData () {
        let componentModulesConfig = this.getConfig('appConfig.componentModules');
        let componentModulesConfigTypes = [];
        let componentModuleData = {};
        let componentModules = {};

        if (componentModulesConfig && _.isObject(componentModulesConfig)){
            componentModulesConfigTypes = Object.keys(componentModulesConfig);
        }

        for (let i=0; i<componentModulesConfigTypes.length;i++){
            componentModules[componentModulesConfigTypes[i]] = {};
            componentModuleData[componentModulesConfigTypes[i]] = [];
            for (let j=0; j<componentModulesConfig[componentModulesConfigTypes[i]].length; j++){
                let moduleConfig = componentModulesConfig[componentModulesConfigTypes[i]][j];
                if (moduleConfig){
                    if (moduleConfig.moduleName){
                        let moduleName = moduleConfig.moduleName;
                        let moduleData;
                        try {
                            moduleData = _appWrapper.app.localRequire(moduleName);
                            if (moduleData){
                                if (moduleData.componentDir){
                                    if (moduleConfig.parentComponent){
                                        moduleData.parentComponent = moduleConfig.parentComponent;
                                    }
                                    componentModuleData[componentModulesConfigTypes[i]].push(moduleData);
                                }
                                if (moduleData.config){
                                    appState.config = _appWrapper.mergeDeep(appState.config, moduleData.config);
                                }
                            }
                        } catch (ex){
                            this.addUserMessage('Problem loading component module "{1}"', 'error', [moduleName]);
                            this.log(ex, 'error');
                            appState.appError.text = 'Problem loading component module "' + moduleName + '"';
                            appState.appError.error = true;
                        }
                    } else {
                        this.addUserMessage('Problem loading component module of type "{1}" - no "moduleName" config property', 'error', [componentModulesConfigTypes[i]]);
                        appState.appError.text = 'Problem loading component module of type "' + componentModulesConfigTypes[i] + '" - no "moduleName" config property';
                        appState.appError.error = true;
                    }
                }
            }
        }
        return componentModuleData;
    }

    async applyComponentModuleData(componentModuleData, dirs, mapping, type) {
        if (componentModuleData && componentModuleData[type] && componentModuleData[type].length){
            for (let i=0; i<componentModuleData[type].length; i++){
                if (componentModuleData[type][i]) {
                    if (componentModuleData[type][i].componentDir){
                        dirs = _.uniq(_.concat(dirs, componentModuleData[type][i].componentDir));
                    }
                    if (componentModuleData[type][i].componentMapping && componentModuleData[type][i].componentMapping.length){
                        for (let j=0; j<componentModuleData[type][i].componentMapping.length; j++){
                            let currentMappingData = componentModuleData[type][i].componentMapping[j];

                            for (let currentMappingName in currentMappingData){
                                let currentMapping = currentMappingData[currentMappingName];
                                if (type == 'component' && componentModuleData[type][i].parentComponent){
                                    let parentMapping = this.getComponentMapping(mapping, componentModuleData[type][i].parentComponent);
                                    if (parentMapping && _.isObject(parentMapping)){
                                        if (!parentMapping.components){
                                            parentMapping.components = {};
                                        }
                                        parentMapping.components[currentMapping.name] = currentMapping;
                                    }
                                } else {
                                    if (!mapping.components){
                                        mapping.components = {};
                                    }
                                    mapping.components[currentMapping.name] = currentMapping;
                                }
                            }
                        }
                    }
                }
            }
        }
        return {dirs: dirs, mapping: mapping};
    }

    async initializeComponents(){
        this.vueComponents = {};
        this.vueGlobalComponents = {};
        this.vueModalComponents = {};

        let componentModuleData = await this.getComponentModuleData();

        let wrapperDirs = this.getConfig('wrapper.componentDirectories.component');
        let overrideDirs = this.getConfig('appConfig.componentDirectories.component');
        if (overrideDirs && overrideDirs.length){
            overrideDirs = _.map(overrideDirs, (dir) => {
                return path.resolve(dir);
            });
        } else {
            overrideDirs = [];
        }
        this.log('Initializing components...', 'group', []);

        let wrapperMapping = this.getConfig('wrapper.componentMapping');
        for(let i=0; i<wrapperDirs.length; i++){
            let wrapperDir = path.resolve(wrapperDirs[i]);
            this.vueComponents = _.merge(this.vueComponents, await this.processComponents(wrapperDir, wrapperMapping, overrideDirs, 'wrapper'));
        }

        let appDirs = this.getConfig('wrapper.componentDirectories.component');
        overrideDirs = this.getConfig('appConfig.componentDirectories.component');
        let appMapping = this.getConfig('appConfig.componentMapping');
        let appliedData = await this.applyComponentModuleData(componentModuleData, overrideDirs, appMapping, 'component');
        if (appliedData){
            if (appliedData.dirs){
                overrideDirs = appliedData.dirs;
            }
            if (appliedData.mapping){
                appMapping = appliedData.mapping;
            }
        }


        for(let i=0; i<appDirs.length; i++){
            let appDir = path.resolve(appDirs[i]);
            this.vueComponents = _.merge(this.vueComponents, await this.processComponents(appDir, appMapping, overrideDirs, 'app'));
        }

        let modalDirs = this.getConfig('wrapper.componentDirectories.modalComponent');
        for(let i=0; i<modalDirs.length; i++){
            let modalDir = path.resolve(modalDirs[i]);
            let modalMapping = {};
            let files = await _appWrapper.fileManager.readDir(modalDir);
            for (let j=0; j<files.length;j++){
                let filePath = path.join(modalDir, files[j]);
                if (await _appWrapper.fileManager.isDir(filePath)){
                    modalMapping[files[j]] = {name: files[j]};
                }
            }
            this.vueModalComponents = _.merge(this.vueModalComponents, await this.processComponents(modalDir, modalMapping, null, 'wrapper modal'));
        }


        modalDirs = this.getConfig('appConfig.componentDirectories.modalComponent');
        appliedData = await this.applyComponentModuleData(componentModuleData, modalDirs, {}, 'modalComponent');
        if (appliedData){
            if (appliedData.dirs){
                modalDirs = appliedData.dirs;
            }
        }
        for(let i=0; i<modalDirs.length; i++){
            let modalDir = path.resolve(modalDirs[i]);
            let modalMapping = {};
            let files = await _appWrapper.fileManager.readDir(modalDir);
            for (let j=0; j<files.length;j++){
                let filePath = path.join(modalDir, files[j]);
                if (await _appWrapper.fileManager.isDir(filePath)){
                    modalMapping[files[j]] = {name: files[j]};
                }
            }
            this.vueModalComponents = _.merge(this.vueModalComponents, await this.processComponents(modalDir, modalMapping, null, 'app modal'));
        }



        let globalDirs = this.getConfig('wrapper.componentDirectories.globalComponent');
        for(let i=0; i<globalDirs.length; i++){
            let globalDir = path.resolve(globalDirs[i]);
            let globalMapping = {};
            let files = await _appWrapper.fileManager.readDir(globalDir);
            for (let j=0; j<files.length;j++){
                let filePath = path.join(globalDir, files[j]);
                if (await _appWrapper.fileManager.isDir(filePath)){
                    globalMapping[files[j]] = {name: files[j]};
                }
            }
            this.vueGlobalComponents = _.merge(this.vueGlobalComponents, await this.processComponents(globalDir, globalMapping, null, 'wrapper global'));
        }

        globalDirs = this.getConfig('appConfig.componentDirectories.globalComponent');
        appliedData = await this.applyComponentModuleData(componentModuleData, globalDirs, {}, 'globalComponent');
        if (appliedData){
            if (appliedData.dirs){
                globalDirs = appliedData.dirs;
            }
        }

        for(let i=0; i<globalDirs.length; i++){
            let globalDir = path.resolve(globalDirs[i]);
            let globalMapping = {};
            let files = await _appWrapper.fileManager.readDir(globalDir);
            for (let j=0; j<files.length;j++){
                let filePath = path.join(globalDir, files[j]);
                if (await _appWrapper.fileManager.isDir(filePath)){
                    globalMapping[files[j]] = {name: files[j]};
                }
            }
            this.vueGlobalComponents = _.merge(this.vueGlobalComponents, await this.processComponents(globalDir, globalMapping, null, 'app global'));
        }

        this.allComponents = _.merge(this.vueComponents, this.vueGlobalComponents, this.vueModalComponents);

        for(let globalComponentName in this.vueGlobalComponents){
            Vue.component(globalComponentName, this.vueGlobalComponents[globalComponentName]);
        }

        this.log('Initializing components...', 'groupend', []);
    }

    async processComponents(componentBaseDir, componentMapping, overrideDirs, type){
        let componentNames = _.keys(componentMapping);
        let componentCount = componentNames.length;
        let additionalSubComponents;
        let components = {};
        if (!type){
            type = '';
        }
        if (componentCount){
            this.log('Initializing {1} {2} components...', 'group', [componentCount, type]);
            for (let i=0; i<componentNames.length;i++){
                let currentName = componentNames[i];
                if (currentName == 'modal-dialog'){
                    additionalSubComponents = this.vueModalComponents;
                }
                let currentMapping = componentMapping && componentMapping[currentName] ? componentMapping[currentName] : {};
                let component = await this.initializeComponent(componentBaseDir, currentName, currentMapping, '', additionalSubComponents, overrideDirs);
                if (component){
                    components[currentName] = component;
                }
            }
            this.log('Initializing {1} components...', 'groupend', [componentCount]);
        }
        return components;
    }

    async initializeComponent(componentBaseDir, componentName, componentMapping, parentName, additionalSubComponents, overrideDirs){

        let componentOverrideDirs = [];
        if (!overrideDirs){
            overrideDirs = [];
        } else {
            componentOverrideDirs = _.map(overrideDirs, (dir) => {
                return path.join(path.resolve(dir), componentName);
            });
        }

        let childCount = 0;
        if (componentMapping && componentMapping.components){
            childCount = _.keys(componentMapping.components).length;
        }
        let message = '';
        let data = [];
        let type = 'info';
        if (parentName){
            if (childCount){
                message = 'Initializing child component "{1}" of "{2}"" with {3} children.';
                type = 'group';
                data = [componentName, parentName, childCount];
            } else {
                message = 'Initializing child component "{1}" of "{2}".';
                type = 'group';
                data = [componentName, parentName];
            }
        } else if (childCount) {
            message = 'Initializing component "{1}" with {2} children.';
            type = 'group';
            data = [componentName, childCount];
        } else {
            message = 'Initializing component "{1}".';
            type = 'group';
            data = [componentName];
        }

        this.log(message, type, data);

        let loadDirs = _.union(componentOverrideDirs, [path.join(componentBaseDir, componentName)]);

        let component = await _appWrapper.fileManager.loadFileFromDirs(componentName + '.js', loadDirs, true);
        if (!component){
            this.log('Problem loading component "{1}"', 'error', [componentName]);
            return false;
        } else {
            this.log('Loaded component "{1}"', 'info', [componentName]);
        }

        await this.loadComponentTemplate(component, loadDirs);
        component.components = {};

        if (additionalSubComponents && _.keys(additionalSubComponents).length){
            component.components = _.merge(component.components, additionalSubComponents);
        }
        if (componentMapping){
            if (childCount){

                for (let i in componentMapping.components){
                    let childComponent = await this.initializeComponent(componentBaseDir, i, componentMapping.components[i], componentName, [], overrideDirs);
                    component.components[i] = childComponent;
                }
            }

            if (componentMapping.dataName){
                component.data = () => {
                    let componentData = _.get(this.appData, componentMapping.dataName, {noData: true});
                    return componentData;
                };
            }
            if (componentMapping.data){
                component.data = () => {
                    return componentMapping.data;
                };
            }
            if (componentMapping.componentCssFiles){
                for(let i=0; i<componentMapping.componentCssFiles.length; i++){
                    let cssFile = path.join(componentBaseDir , componentName, componentMapping.componentCssFiles[i]);
                    appState.componentCssFiles.push(cssFile);
                }
            } else {
                let cssFileName = componentName + '.css';
                let cssFile = await _appWrapper.fileManager.getFirstFileFromDirs(cssFileName, loadDirs);
                if (cssFile){
                    if (await _appWrapper.fileManager.isFile(cssFile)){
                        appState.componentCssFiles.push(cssFile);
                    }
                }
            }
            let componentStateFile = await _appWrapper.fileManager.getFirstFileFromDirs('componentState.js', loadDirs);
            if (componentStateFile){
                if (await _appWrapper.fileManager.isFile(componentStateFile)){
                    let componentState = await _appWrapper.fileManager.loadFile(componentStateFile, true);
                    if (componentState && _.isObject(componentState)) {
                        _.merge(appState, componentState);
                    }
                }
            }

            if (component.mixins){
                component.mixins.push(BaseComponent);
            } else {
                component.mixins = [BaseComponent];
            }

            if (component.filters){
                component.filters = _.union(component.filters, this.vueFilters);
            } else {
                component.filters = this.vueFilters;
            }
        }
        if (type == 'group'){
            this.log(message, 'groupend', data);
        }
        return component;
    }

    async loadComponentTemplate (component, loadDirs) {
        let templateContents = await _appWrapper.fileManager.loadFileFromDirs(component.name + '.html', loadDirs);
        if (templateContents){
            this.log('Loaded component template "{1}"', 'info', [component.name + '.html']);
            component.template = templateContents;
        } else {
            this.log('Problem loading template for component "{1}".', 'error', [component.name]);
        }
        return component;
    }

    getComponentMapping(mapping, componentName){
        let returnValue = false;
        if (mapping[componentName]){
            returnValue = mapping[componentName];
        } else {
            for (let name in mapping){
                if (mapping[name] && mapping[name].components){
                    returnValue = this.getComponentMapping(mapping[name].components, componentName);
                    if (returnValue){
                        break;
                    }
                }
            }
        }
        return returnValue;
    }

}

exports.ComponentHelper = ComponentHelper;