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
        await this.initializeComponents();
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

    async initializeComponents(){
        this.vueComponents = {};
        this.vueGlobalComponents = {};
        this.vueModalComponents = {};

        let wrapperDirs = this.getConfig('wrapper.componentDirectories.component');
        let overrideDirs = this.getConfig('appConfig.componentDirectories.component');
        if (overrideDirs && overrideDirs.length){
            overrideDirs = _.map(overrideDirs, (dir) => {
                return path.resolve(dir);
            });
        } else {
            overrideDirs = [];
        }


        let wrapperMapping = this.getConfig('wrapper.componentMapping');
        for(let i=0; i<wrapperDirs.length; i++){
            let wrapperDir = path.resolve(wrapperDirs[i]);
            this.vueComponents = _.merge(this.vueComponents, await this.processComponents(wrapperDir, wrapperMapping, overrideDirs));
        }

        let appDirs = this.getConfig('appConfig.componentDirectories.component');
        let appMapping = this.getConfig('appConfig.componentMapping');
        for(let i=0; i<appDirs.length; i++){
            let appDir = path.resolve(appDirs[i]);
            this.vueComponents = _.merge(this.vueComponents, await this.processComponents(appDir, appMapping));
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
            this.vueModalComponents = _.merge(this.vueModalComponents, await this.processComponents(modalDir, modalMapping));
        }


        modalDirs = this.getConfig('appConfig.componentDirectories.modalComponent');
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
            this.vueModalComponents = _.merge(this.vueModalComponents, await this.processComponents(modalDir, modalMapping));
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
            this.vueGlobalComponents = _.merge(this.vueGlobalComponents, await this.processComponents(globalDir, globalMapping));
        }

        globalDirs = this.getConfig('appConfig.componentDirectories.globalComponent');
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
            this.vueGlobalComponents = _.merge(this.vueGlobalComponents, await this.processComponents(globalDir, globalMapping));
        }

        this.allComponents = _.merge(this.vueComponents, this.vueGlobalComponents, this.vueModalComponents);

        for(let globalComponentName in this.vueGlobalComponents){
            Vue.component(globalComponentName, this.vueGlobalComponents[globalComponentName]);
        }

    }

    async processComponents(componentBaseDir, componentMapping, overrideDirs){

        let componentNames = _.keys(componentMapping);
        let componentCount = componentNames.length;
        let additionalSubComponents;
        this.log('Initializing {1} components...', 'group', [componentCount]);
        let components = {};
        if (componentCount){
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
                return path.join(dir, componentName);
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
                message = 'Initializing child component "{1}" of {2} with {3} children.';
                type = 'group';
                data = [componentName, parentName, childCount];
            } else {
                message = 'Initializing child component "{1}" of {2}.';
                type = 'info';
                data = [componentName, parentName];
            }
        } else if (childCount) {
            message = 'Initializing component "{1}" with {2} children.';
            type = 'group';
            data = [componentName, childCount];
        } else {
            message = 'Initializing component "{1}".';
            type = 'info';
            data = [componentName];
        }
        // this.log(message, type, data, true);

        let loadDirs = _.union(componentOverrideDirs, [path.join(componentBaseDir, componentName)]);
        let component = await _appWrapper.fileManager.loadFileFromDirs(componentName + '.js', loadDirs, true);
        if (!component){
            return false;
        }

        component.template = await _appWrapper.fileManager.loadFileFromDirs(componentName + '.html', loadDirs);
        component.components = {};

        if (additionalSubComponents && _.keys(additionalSubComponents).length){
            component.components = _.merge(component.components, additionalSubComponents);
        }
        // component.updated = function(){
        //     console.log(componentName);
        // };
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
                    appState.config.appConfig.cssFiles.push(cssFile);
                }
            } else {
                let cssFileName = componentName + '.css';
                let cssFile = await _appWrapper.fileManager.getFirstFileFromDirs(cssFileName, loadDirs);
                if (cssFile){
                    if (await _appWrapper.fileManager.isFile(cssFile)){
                        appState.config.appConfig.cssFiles.push(cssFile);
                    }
                }
            }

            if (component.mixins){
                component.mixins.push(BaseComponent);
            } else {
                component.mixins = [BaseComponent];
            }
            component.filters = this.vueFilters;
        }
        if (type == 'group'){
            this.log(message, 'groupend', data);
        }
        // this.log('Component "{1}" initialized.', 'info', data);
        return component;
    }

}

exports.ComponentHelper = ComponentHelper;