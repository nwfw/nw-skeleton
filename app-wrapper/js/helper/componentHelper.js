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

		this.forceDebug = false;
		this.forceUserMessages = false;

		this.allComponents = {};
		this.vueComponents = {};
		this.vueAppComponents = {};
		this.vueGlobalComponents = {};
		this.vueModalComponents = {};
		this.debugVueComponents = {};

		this.vueMixins = null;
		this.appVueMixins = null;

		BaseComponent = require('../mixins/baseComponent').component;

		return this;
	}

	async initialize () {
		await super.initialize();

		this.vueMixins = await this.initVueMixins();
		// this.appVueMixins = await this.initVueMixins();
		// this.vueMixins = _.merge(this.vueMixins, this.appVueMixins);

		this.vueGlobalComponents = await this.initVueGlobalComponents();
		this.vueComponents = await this.initVueComponents();
		this.vueAppComponents = await this.initAppVueComponents();
		this.vueComponents = _.merge(this.vueComponents, this.vueAppComponents);
		this.allComponents = _.merge(this.vueComponents, this.vueGlobalComponents);

		appUtil.log("Preparing components...", "group", [], false, this.forceDebug);
		this.vueComponents = await this.prepareComponents(this.vueComponents, this.allComponents, appState.config.app.componentMapping);
		appUtil.log("Preparing components...", "groupend", [], false, this.forceDebug);

		appUtil.log("Preparing app components...", "group", [], false, this.forceDebug);
		this.vueComponents = await this.prepareComponents(this.vueComponents, this.allComponents, appState.config.appConfig.appComponentMapping);
		appUtil.log("Preparing app components...", "groupend", [], false, this.forceDebug);

		appUtil.log("Preparing global components...", "group", [], false, this.forceDebug);
		this.vueGlobalComponents = await this.prepareComponents(this.vueGlobalComponents, this.allComponents, {});
		appUtil.log("Preparing global components...", "groupend", [], false, this.forceDebug);
	}

	async initVueMixins (){
		appUtil.addUserMessage("Initializing global vue mixins...", "debug", [], false, false, this.forceUserMessages, true);
		var vueMixins = [];
		var vueMixinData = require(path.resolve(appState.config.app.mixinRoot + '/index')).mixins;
		vueMixinData.forEach((MixinObj) => {
			vueMixins.push(MixinObj.mixin);
			Vue.mixin(MixinObj.mixin);
		});
		appUtil.addUserMessage("{1} global Vue mixins initialized.", "debug", [vueMixins.length], false, false, this.forceUserMessages, true);
		return vueMixins;
	}

	async initVueAppMixins (){
		var vueMixins = [];
		if (fs.existsSync(path.resolve(appState.config.appConfig.appMixinRoot))){
			appUtil.addUserMessage("Initializing vue app mixins...", "debug", [], false, false, this.forceUserMessages, true);
			var vueMixinData = require(path.resolve(appState.config.appConfig.appMixinRoot + '/index')).mixins;
			vueMixinData.forEach((MixinObj) => {
				vueMixins.push(MixinObj.mixin);
				Vue.mixin(MixinObj.mixin);
			});
			appUtil.addUserMessage("{1} Vue app mixins initialized.", "debug", [vueMixins.length], false, false, this.forceUserMessages, true);
		}
		return vueMixins;
	}

	async loadVueComponents () {
		return await appUtil.loadFilesFromDir(appState.config.app.componentCodeRoot, appState.config.app.componentCodeRegex, true);
	}

	async loadVueGlobalComponents () {
		var files = {};
		var appFiles = {};
		if (fs.existsSync(appState.config.app.globalComponentCodeRoot)){
			files = await appUtil.loadFilesFromDir(appState.config.app.globalComponentCodeRoot, appState.config.app.componentCodeRegex, true);
		}
		if (fs.existsSync(appState.config.appConfig.appGlobalComponentCodeRoot)){
			appFiles = await appUtil.loadFilesFromDir(appState.config.appConfig.appGlobalComponentCodeRoot, appState.config.app.componentCodeRegex, true);
		}
		var allFiles = _.merge(files, appFiles);
		return allFiles;

	}

	async loadVueModalComponents () {
		return await appUtil.loadFilesFromDir(appState.config.app.modalComponentCodeRoot, appState.config.app.componentCodeRegex, true);
	}

	async loadAppVueComponents () {
		return await appUtil.loadFilesFromDir(appState.config.appConfig.appComponentCodeRoot, appState.config.appConfig.appComponentCodeRegex, true);
	}

	async initVueGlobalComponents (){
		appUtil.addUserMessage("Initializing vue global components...", "debug", [], false, false, this.forceUserMessages, true);

		var componentData = await this.loadVueGlobalComponents();

		appUtil.addUserMessage("Loading vue modal components...", "debug", [], false, false, this.forceUserMessages, true);
		this.vueModalComponents = await this.loadVueModalComponents();
		var modalComponentNames = _.keys(this.vueModalComponents);
		appUtil.addUserMessage("{1} vue modal components loaded.", "debug", [modalComponentNames.length], false, false, this.forceUserMessages, true);

		var subComponentCount = 0;
		var components = {};
		var initializedMessage = '';
		var initializedMessageData = [];

		for (var componentName in componentData){
			var subComponents = {};
			if (componentName == 'modal-dialog'){
				subComponents = this.vueModalComponents;
			}
			components[componentName] = await this.initVueComponent(componentName, componentData[componentName], subComponents);
		}

		appUtil.addUserMessage("Global component initialization finished. {1} global vue components initialized.", "debug", [_.keys(components).length], false, false, this.forceUserMessages, true);

		return components;

	}

	async initVueComponents (){
		appUtil.addUserMessage("Initializing vue components...", "debug", [], false, false, this.forceUserMessages, true);

		var componentData = await this.loadVueComponents();

		var self = this;
		var appState = appUtil.getAppState();
		var subComponentCount = 0;
		var components = {};
		var initializedMessage = '';
		var initializedMessageData = [];

		for (var componentName in componentData){
			components[componentName] = await this.initVueComponent(componentName, componentData[componentName]);
			var baseComponent = _.cloneDeep(BaseComponent);
			components[componentName] = Object.assign(baseComponent, components[componentName]);
		}

		appUtil.addUserMessage("Component initialization finished. {1} vue root components initialized.", "debug", [_.keys(components).length], false, false, this.forceUserMessages, true);

		return components;

	}

	async initDebugVueComponents (){
		appUtil.addUserMessage("Initializing debug vue components...", "debug", [], false, false, this.forceUserMessages, true);

		var componentData = await this.loadVueComponents();

		var self = this;
		var appState = appUtil.getAppState();
		var subComponentCount = 0;
		var components = {};
		var initializedMessage = '';
		var initializedMessageData = [];
		var componentName = 'app-debug';

		components[componentName] = await this.initVueComponent(componentName, componentData[componentName]);

		appUtil.addUserMessage("Component initialization finished. {1} vue root components initialized.", "debug", [_.keys(components).length], false, false, this.forceUserMessages, true);

		return components;

	}

	async initAppVueComponents () {
		appUtil.log("Initializing app vue components...", "debug", [], false, this.forceDebug);

		var componentData = await this.loadAppVueComponents();

		var self = this;
		var subComponentCount = 0;
		var components = {};
		var initializedMessage = '';
		var initializedMessageData = [];

		for (var componentName in componentData){
			components[componentName] = await this.initVueComponent(componentName, componentData[componentName]);
		}

		appUtil.log("App component initialization finished. {1} app vue components initialized.", "debug", [_.keys(components).length], false, this.forceDebug);

		return components;
	}

	async initVueComponent(componentName, componentData, additionalSubComponents){
		appUtil.log("* Initializing component '{1}'...", "debug", [componentName], false, this.forceDebug);
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

		var initializedMessage = "* Componenent '{1}' initialized";
		var initializedMessageData = [componentName];
		var subComponentNames = component.components ? _.keys(component.components) : [];
		var subComponentCount = component.components && subComponentNames.length ? subComponentNames.length : 0;
		if (subComponentCount){
			initializedMessage += " with {2} sub-components ({3}).";
			initializedMessageData.push(subComponentCount);
			initializedMessageData.push("'" + subComponentNames.join("', '") + "'.");
		} else {
			initializedMessage += '.';
		}

		appUtil.log(initializedMessage, "debug", initializedMessageData, false, this.forceDebug);
		return component;
	}

	async mapComponentChildren (parentComponent, allComponents, childComponentsMapping) {
		var parentComponentName = parentComponent.name;

		var childMapping = childComponentsMapping.components;
		var childNames = "'" + _.map(childMapping, function(item){
			return item.name;
		}).join("', '") + "'";

		appUtil.log("Mapping {1} children ({2}) for component '{3}'...", "group", [childMapping.length, childNames, parentComponentName], false, this.forceDebug);

		var originalMapping = _.cloneDeep(childComponentsMapping);
		var currentMapping = _.cloneDeep(childComponentsMapping);

		for (var i = 0; i<childComponentsMapping.components.length; i++){
			var childComponentMapping = childComponentsMapping.components[i];
			var childComponentName = childComponentMapping.name;

			var childComponent;

			if (childComponentMapping.components){
				appUtil.log("Preparing child component '{1}' of '{2}' with {3} children...", "debug", [childComponentName, parentComponentName, childComponentMapping.components.length], false, this.forceDebug);
				childComponent = await this.mapComponentChildren(allComponents[childComponentName], allComponents, childComponentMapping);
			} else {
				childComponent = allComponents[childComponentName];
				appUtil.log("Preparing child component '{1}' of '{2}' without children...", "debug", [childComponentName, parentComponentName], false, this.forceDebug);
			}

			parentComponent.components[childComponentName] = childComponent;
			appUtil.log("Registered sub-component '{1}' for parent '{2}'.", "debug", [childComponentName, parentComponentName], false, self.forceDebug);
		}

		appUtil.log("Mapping {1} children ({2}) for component '{3}'...", "groupend", [childMapping.length, childNames, parentComponentName], false, this.forceDebug);
		return parentComponent;
	}

	async prepareComponents(components, allComponents, componentMapping){
		if (componentMapping && _.isObject(componentMapping) && _.keys(componentMapping).length){
			for (var parentComponentName in componentMapping){
				if (componentMapping[parentComponentName].components && componentMapping[parentComponentName].components.length){
					appUtil.log("Preparing component '{1}' with {2} children...", "debug", [parentComponentName, componentMapping[parentComponentName].components.length], false, this.forceDebug);

					components[parentComponentName] = await this.mapComponentChildren(components[parentComponentName], allComponents, componentMapping[parentComponentName]);

				} else {
					appUtil.log("Preparing component '{1}' without children...", "debug", [parentComponentName], false, this.forceDebug);
				}
			}
		}
		return components;
	}

}

exports.ComponentHelper = ComponentHelper;