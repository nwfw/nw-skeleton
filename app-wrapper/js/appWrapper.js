var _ = require('lodash');
var path = require('path');
var fs = require('fs');

var appStateConfig;
var config;

var App;
var appUtil = require('./appUtil').appUtil;
var DebugHelper = require('./debugHelper').DebugHelper;
var AppTemplates = require('./appTemplates').AppTemplates;
var AppTranslations = require('./appTranslations').AppTranslations;
var WindowManager = require('./windowManager').WindowManager;
var FileManager = require('./fileManager').FileManager;
var HtmlHelper = require('./htmlHelper').HtmlHelper;

class AppWrapper {

	constructor (initialAppConfig) {

		this.forceDebug = false;
		this.forceUserMessages = false;

		this.app = null;

		this.templateContents = null;
		this.translations = null;

		this.vueComponents = {};
		this.vueAppComponents = {};
		this.vueGlobalComponents = {};
		this.vueModalComponents = {};
		this.debugVueComponents = {};

		this.vueMixins = null;
		this.appVueMixins = null;

		this.windowManager = null;
		this.fileManager = null;
		this.debugHelper = null;

		this.jsFileLoadResolves = {};

		this.boundMethods = {
			cleanup: null,
			saveUserConfig: null,
			onWindowClose: null
		};

		this.timeouts = {
			cleanupTimeout: null,
			windowCloseTimeout: null,
			modalContentVisibleTimeout: null
		};

		this.intervals = {
			syncStoppedInterval : null
		},

		this.debugWindow = null;
		this.mainWindow = null;

		this.closeModalPromise = null;

		this.closeWindowResolve = null;
		this.closeWindowPromise = null;

		this.cleanupCancelled = false;

		this.initialAppConfig = initialAppConfig;

		window.getAppWrapper = () => {
			return this;
		}

		window.getFeApp = () => {
			return window.feApp;
		}

		return this;
	}

	async initialize(){
		var self = this;
		var appState = appUtil.getAppState();

		appStateConfig = require('../../config/appWrapperConfig').config;

		appState.config = this.initializeConfig();

		this.loadUserConfig();

		if (appUtil.getConfig("debugToFile")){
			fs.writeFileSync(path.resolve(appState.config.debugMessagesFilename), '', {flag: 'w'});
		}
		if (appUtil.getConfig("userMessagesToFile")){
			fs.writeFileSync(path.resolve(appState.config.userMessagesFilename), '', {flag: 'w'});
		}

		var mainAppFile = path.join(process.cwd(), appState.config.app.appFile);

		App = require(mainAppFile).App;

		var cssFiles = appUtil.getConfig('appConfig.initCssFiles');

		for (var i=0; i<cssFiles.length; i++){
			await this.loadCss(cssFiles[i]);
		}

		cssFiles = appUtil.getConfig('appConfig.cssFiles');

		for (var i=0; i<cssFiles.length; i++){
			await this.loadCss(cssFiles[i]);
		}

		if (window.isDebugWindow){
			cssFiles = appUtil.getConfig('appConfig.debugCssFiles');

			for (var i=0; i<cssFiles.length; i++){
				await this.loadCss(cssFiles[i]);
			}
			for (var i=0; i<appState.config.appConfig.debugCssFiles.length; i++){
				await this.loadCss(appState.config.appConfig.debugCssFiles[i]);
			}
		}

		var jsFiles = appUtil.getConfig('appConfig.initJsFiles');

		for (var i=0; i<jsFiles.length; i++){
			await this.loadJs(jsFiles[i]);
		}

		var jsFiles = appUtil.getConfig('appConfig.jsFiles');

		for (var i=0; i<jsFiles.length; i++){
			await this.loadJs(jsFiles[i]);
		}

		appState.languageData.currentLanguage = appUtil.getConfig('currentLanguage');
		appState.languageData.currentLocale = appUtil.getConfig('currentLocale');
		appState.hideDebug = appUtil.getConfig('hideDebug');
		appState.debug = appUtil.getConfig('debug');
		appState.debugLevel = appUtil.getConfig('debugLevel');
		appState.debugLevels = appUtil.getConfig('debugLevels');
		appState.userMessageLevel = appUtil.getConfig('userMessageLevel');
		appState.maxUserMessages = appUtil.getConfig('maxUserMessages');
		appState.autoAddLabels = appUtil.getConfig('autoAddLabels');

		appState.closeModalResolve = null;

		this.debugHelper = new DebugHelper();

		if (window.isDebugWindow){
			this.mainWindow = window.opener;
		}

		await this.initializeLanguage();

		this.app = new App();

		this.htmlHelper = new HtmlHelper();
		this.fileManager = new FileManager();

		this.windowManager = new WindowManager();

		if (appState.config.devTools){
			this.windowManager.winState.devTools = true;
		}

		this.addBoundMethods();
		await this.initializeTemplates();

		this.addEventListeners();

		await this.app.initialize();

		window.feApp = await this.initializeFeApp();

		this.htmlHelper.updateProgress(0, 100, this.appTranslations.translate("Initializing application"));
		await appUtil.wait(200);
		this.htmlHelper.updateProgress(10, 100, this.appTranslations.translate("Initializing application"));
		await appUtil.wait(200);

		return this;
	}

	async loadConfig () {
		var processPath = path.dirname(process.execPath);
		var userConfigPath;
		var userConfigFile;

		return this.initialAppConfig;
	}

	initializeConfig () {
		var theConfig = appUtil.mergeDeep({}, appStateConfig, this.initialAppConfig);
		return theConfig;
	}

	loadUserConfig () {
		if (localStorage && localStorage.config){
			appUtil.log("Loading user config...", "info", [], false, this.forceDebug);
			var appState = appUtil.getAppState();
			var userConfig = {};
			try {
				userConfig = JSON.parse(localStorage.config);
			} catch (e) {
				appUtil.log("Can't parse user config.!", "warning", [], false, this.forceDebug);
			}
			if (userConfig && _.keys(userConfig).length){
				appState.hasUserConfig = true;
			} else {
				appState.hasUserConfig = false;
			}
			userConfig = _.merge({}, appState.config, userConfig);
			appState.config = userConfig;

		} else {
			appUtil.log("No user config found.", "info", [], false, this.forceDebug);
		}
	}

	saveUserConfig () {
		if (localStorage){
			var appState = appUtil.getAppState();
			var userConfig = appUtil.difference(config, appState.config);
			appUtil.log("Saving user config...", "info", [], false, this.forceDebug);
			try {
				localStorage.config = JSON.stringify(userConfig);
				appUtil.addUserMessage("Configuration data saved", "info", [], false,  false, true, this.forceDebug);
				if (userConfig && _.keys(userConfig).length){
					appState.hasUserConfig = true;
				} else {
					appState.hasUserConfig = false;
				}
			} catch (e) {
				appUtil.addUserMessage("Configuration data could not be saved - '{1}'", "error", [e], false,  false, this.forceUserMessages, this.forceDebug);
			}
		} else {
			appUtil.log("Can't save user config.", "warning", [], false, this.forceDebug);
		}
	}

	async clearUserConfig () {
		if (localStorage){
			var appState = appUtil.getAppState();
			var userConfig = {};
			appUtil.log("Clearing user config...", "info", [], false, this.forceDebug);
			try {
				localStorage.config = JSON.stringify(userConfig);
				appUtil.addUserMessage("Configuration data cleared", "info", [], false,  false, true, this.forceDebug);
				appState.hasUserConfig = false;
				this.loadUserConfig();
				this.windowManager.win.reload();
			} catch (ex) {
				appUtil.addUserMessage("Configuration data could not be cleared - '{1}'", "error", [ex], false,  false, this.forceUserMessages, this.forceDebug);
			}
		} else {
			appUtil.log("Can't clear user config.", "warning", [], false, this.forceDebug);
		}
	}

	async clearUserConfigHandler (e) {
		if (e && e.preventDefault && _.isFunction(e.preventDefault)){
			e.preventDefault();
		}
		var confirmed = await this.htmlHelper.confirm(this.appTranslations.translate('Are you sure?'), this.appTranslations.translate('This will delete your saved configuration data.'))
		if (confirmed){
			this.clearUserConfig();
		} else {
			this.closeCurrentModal();
		}
	}

	setConfigVar(name, value){
		appState.config[name] = value;
		this.saveUserConfig();
	}

	setConfig(data){
		if (data && _.isObject(data)){
			appState.config = _.merge(appState.config, data);
			this.saveUserConfig();
		}
	}

	async finalize () {
		this.htmlHelper.updateProgress(80, 100, this.appTranslations.translate("Initializing application"));
		await appUtil.wait(200);
		var retValue = await this.app.finalize();
		window.appState.appReady = true;
		this.htmlHelper.clearProgress();
		return retValue;
	}

	addEventListeners() {
		if (!window.isDebugWindow){
			var appState = appUtil.getAppState();
			this.windowManager.win.on('close', this.boundMethods.onWindowClose);
			// WatchJs.watch(appState.config, this.boundMethods.saveUserConfig);
		} else {
			this.windowManager.win.on('close', window.opener.getAppWrapper().debugHelper.onDebugWindowClose.bind(window.opener.getAppWrapper().debugHelper));
		}
	}

	removeEventListeners() {
		this.windowManager.win.removeListener('close', this.boundMethods.onWindowClose);
	}

	addBoundMethods () {
		if (this.boundMethods){
			var keys = _.keys(this.boundMethods);
			for (let i=0; i<keys.length; i++){
				if (this[keys[i]] && _.isFunction(this[keys[i]]) && this[keys[i]].bind && _.isFunction(this[keys[i]].bind)){
					this.boundMethods[keys[i]] = this[keys[i]].bind(this);
				}
			}
		}
	}

	removeBoundMethods () {
		var keys = _.keys(this.boundMethods);
		for (let i=0; i<keys.length; i++){
			this.boundMethods[keys[i]] = null;
		}
		this.boundMethods = {};
	}

	async initializeLanguage () {
		this.appTranslations = new AppTranslations();
		return await this.appTranslations.initializeLanguage();
	}

	async initializeTemplates () {
		this.appTemplates = new AppTemplates();
		this.templateContents = await this.appTemplates.loadTemplates();
		return true;
	}

	async initializeFeApp(){
		var self = this;
		var appState = appUtil.getAppState();

		this.vueMixins = await this.initVueMixins();
		this.appVueMixins = await this.initVueMixins();
		this.vueMixins = _.merge(this.vueMixins, this.appVueMixins);

		this.vueGlobalComponents = await this.initVueGlobalComponents();
		this.vueComponents = await this.initVueComponents();
		this.vueAppComponents = await this.initAppVueComponents();
		this.vueComponents = _.merge(this.vueComponents, this.vueAppComponents);

		appUtil.log("Mapping component children...", "debug", [], false, this.forceDebug);

		var componentNames = _.keys(appState.config.app.componentMapping);
		for(var i=0; i < componentNames.length; i++){
			var parentComponentName = componentNames[i];
			if (this.vueComponents[parentComponentName]){
				await this.mapComponentChildren(parentComponentName, appState.config.app.componentMapping[parentComponentName]);
			}
		};


		appUtil.log("Mapping app component children...", "debug", [], false, this.forceDebug);
		_.each(appState.config.appConfig.appComponentMapping, function(childComponents, parentComponentName){
			_.each(childComponents.components, function(childComponent){
				var childComponentName = childComponent.name;
				self.vueComponents[parentComponentName].components[childComponentName] = self.vueComponents[childComponentName];
				appUtil.log("Registered sub-component '{1}' for parent '{2}'.", "debug", [childComponentName, parentComponentName], false, self.forceDebug);
			})
		});

		var globalComponentNames = _.keys(this.vueGlobalComponents);
		for(var i=0; i < globalComponentNames.length; i++){
			appUtil.log("Registering global Vue component '{1}'...", "debug", [globalComponentNames[i]], false, this.forceDebug);
			Vue.component(globalComponentNames[i], this.vueGlobalComponents[globalComponentNames[i]]);
			appUtil.log("Global Vue component '{1} registered.'", "debug", [globalComponentNames[i]], false, this.forceDebug);
		}
		appUtil.log("Initializing Vue app...'", "debug", [], false, this.forceDebug);
		var vm = new Vue({
			el: '#app-body',
			template: window.indexTemplate,
			data: appState,
			components: this.vueComponents,
			translations: appState.translations,
			// methods: {
			// 	showModalConfirm: this.showModalCloseConfirm.bind(this)
			// },
			created: function(){
				window.appState.appInitialized = true;
				self.finalize();
			}
		});
		if (window.isDebugWindow){
			appUtil.addUserMessage("Debug window application initialized", "info", [], false,  false, true, true);
		} else {
			appUtil.addUserMessage("Application initialized", "info", [], false,  false, true, true);
			if (appState.activeConfigFile != '../../config/config.js'){
				appUtil.addUserMessage("Active config file: '{1}'", "info", [appState.activeConfigFile], false, false, true, true);
			}
		}

		return vm;
	}



	async mapComponentChildren (parentComponentName, childComponentsMapping) {
		var self = this;
		for (var i = 0; i<childComponentsMapping.components.length; i++){
			var childComponentMapping = childComponentsMapping.components[i];
			var childComponentName = childComponentMapping.name;

			if (childComponentMapping.components){
				await self.mapComponentChildren(childComponentName, childComponentMapping);
			}

			if (self.vueComponents[parentComponentName]){
				self.vueComponents[parentComponentName].components[childComponentName] = self.vueComponents[childComponentName];
				appUtil.log("Registered sub-component '{1}' for parent '{2}'.", "debug", [childComponentName, parentComponentName], false, self.forceDebug);
			} else if (self.vueGlobalComponents[parentComponentName]){
				self.vueGlobalComponents[parentComponentName].components[childComponentName] = self.vueComponents[childComponentName];
				appUtil.log("Registered sub-component '{1}' for parent '{2}'.", "debug", [childComponentName, parentComponentName], false, self.forceDebug);
			} else if (self.vueModalComponents[parentComponentName]){
				self.vueModalComponents[parentComponentName].components[childComponentName] = self.vueComponents[childComponentName];
				appUtil.log("Registered sub-component '{1}' for parent '{2}'.", "debug", [childComponentName, parentComponentName], false, self.forceDebug);
			}

		}
	}

	async reinitializeFeApp(){
		window.getFeApp().$destroy();
		return await this.initializeFeApp();
	}

	getAppUtil () {
		return appUtil;
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
		// return await appUtil.loadFilesFromDir('./app/js/components', "/\.js$/", true);
	}

	async loadVueGlobalComponents () {
		var globalComponents = await appUtil.loadFilesFromDir(appState.config.app.globalComponentCodeRoot, appState.config.app.componentCodeRegex, true);
		var formControlComponents = await appUtil.loadFilesFromDir(path.resolve(appState.config.app.globalComponentCodeRoot + '/form/'), appState.config.app.componentCodeRegex, true);
		var components = _.merge(globalComponents, formControlComponents);
		return components;
		// return await appUtil.loadFilesFromDir('./app/js/components/global', "/\.js$/", true);
	}

	async loadVueModalComponents () {
		return await appUtil.loadFilesFromDir(appState.config.app.modalComponentCodeRoot, appState.config.app.componentCodeRegex, true);
		// return await appUtil.loadFilesFromDir('./app/js/components/modal', "/\.js$/", true);
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

		var appState = appUtil.getAppState();
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

	async callViewHandler (e) {
		var target = e.target;
		var eventType = e.type;
		var eventHandlerName = '';
		var dataHandlerAttrName = '';
		var eventTargetAttrName = '';
		var eventTargetInstruction = '';
		if (target){
			eventTargetAttrName = "data-event-target";
			eventTargetInstruction = target.getAttribute(eventTargetAttrName);
			if (eventTargetInstruction && eventTargetInstruction == 'parent'){
				target = target.parentNode;
			}

			dataHandlerAttrName = ['data', eventType, 'handler'].join('-');
			eventHandlerName = target.getAttribute(dataHandlerAttrName);

			if (!eventHandlerName){
				target = target.parentNode;
				eventHandlerName = target.getAttribute(dataHandlerAttrName);
				if (!eventHandlerName){
					target = e.target;
				}
			}

			if (eventHandlerName){
				var eventChunks = eventHandlerName.split('.');
				var eventMethod;
				var eventMethodPath = '';
				if (eventChunks && eventChunks.length && eventChunks.length > 1){
					eventMethod = _.takeRight(eventChunks);
					eventMethodPath = _.slice(eventChunks, 0, eventChunks.length-1);
				} else {
					eventMethod = eventHandlerName;
				}

				var handlerObj = this;
				if (eventMethodPath && eventMethodPath.length){
					for (let i=0; i<eventMethodPath.length; i++){
						if (handlerObj && handlerObj[eventMethodPath[i]] && !_.isUndefined(handlerObj[eventMethodPath[i]])){
							handlerObj = handlerObj[eventMethodPath[i]];
						}
					}
				}

				if (handlerObj[eventMethod] && _.isFunction(handlerObj[eventMethod])){
					return await handlerObj[eventMethod](e);
				} else {
					appUtil.log("Can't find event handler '{1}'", "warning", [eventHandlerName], false, this.forceDebug);
					if (e && e.preventDefault && _.isFunction(e.preventDefault)){
						e.preventDefault();
					}
				}
			} else {
				appUtil.log("Element {1} doesn't have attribute '{2}'", "warning", [target.tagName + '.' + target.className.split(' ').join(','), dataHandlerAttrName], false, this.forceDebug);
			}
		} else {
			appUtil.log("Can't find event target '{1}'", "warning", [e], false, this.forceDebug);
			if (e && e.preventDefault && _.isFunction(e.preventDefault)){
				e.preventDefault();
			}
		}
	}

	checkSyncStopped (callback) {
		var appState = appUtil.getAppState();
		if (appUtil.getStateVar('syncInProgress') || (appUtil.getStateVar('stopSync') && !appUtil.getStateVar('stopSuccessful'))){
			return false;
		} else {
			if (callback && _.isFunction(callback)){
				callback(true);
			}
			return true;
		}
	}

	async onWindowClose () {
		var appState = appUtil.getAppState();
		this.closeCurrentModal(true);
		if (!appState.isDebugWindow){
			appState.appError = false;
			if (appState.syncInProgress || (appState.stopSync && !appState.stopSuccessful)){
				this.confirmCloseModalAction = async (e) => {
					if (e && e.preventDefault && _.isFunction(e.preventDefault)){
						e.preventDefault();
					}
					this.modalBusy(this.appTranslations.translate('Please wait until synchronization stops...'));

					this.windowCloseTimeout = setTimeout(() => {
						clearTimeout(this.windowCloseTimeout);
						this.cleanupCancelled = true;
						appUtil.addUserMessage('Could not stop synchronization, please try closing again', 'error', [], true, false, true, true);
						setTimeout(() => {
							this.closeCurrentModal(true);
						}, 1000);
					}, appState.config.windowCloseTimeoutDuration);

					this.cleanupCancelled = false;
					var canClose = await this.cleanup();
					if (!this.cleanupCancelled && canClose){
						clearTimeout(this.windowCloseTimeout);
						this.modalBusy(this.appTranslations.translate('Synchronization stopped, closing...'));
						this.beforeWindowClose();
						setTimeout(() => {
							this.windowManager.closeWindowForce();
						}, 1000);
					} else {
						clearTimeout(this.windowCloseTimeout);
						this.modalBusy(this.appTranslations.translate('Could not stop synchronization'));
						appUtil.addUserMessage('Could not stop synchronization', 'error', [], true, false, true, true);
						setTimeout(() => {
							this.closeCurrentModal(true);
						}, 1000);
					}
				};
				await this.showModalCloseConfirm();
			} else {
				await this.cleanup();
				this.windowManager.closeWindowForce();
			}
		} else {
			this.windowManager.closeWindowForce();
		}
	}

	async cleanup(){
		var appState = appUtil.getAppState();
		var returnPromise;
		appUtil.addUserMessage("Performing pre-close cleanup...", "info", [], false, false, this.forceUserMessages, this.forceDebug);
		if (appState.syncInProgress || (appState.stopSync && !appState.stopSuccessful)){
			appUtil.addUserMessage("Trying to stop syncing...", "warning", [], false, false, this.forceUserMessages, this.forceDebug);
			var syncStopped = this.app.doStopSynchronization();
			if (syncStopped){
				return true;
			}
			returnPromise = new Promise((resolve, reject) => {
				var _resolve = (result) => {
					if (result){
						this.beforeWindowClose();
					}
					resolve(result);
				};
				this.intervals.syncStoppedInterval = setInterval(this.checkSyncStopped.bind(this, _resolve), 300);
			});
		} else {
			var resolveReference;
			returnPromise = new Promise((resolve, reject) => {
				resolveReference = resolve;
			});
			setTimeout(async () => {
				await this.shutdownApp();
				await appUtil.finalizeLogs();
				resolveReference(true);
			}, 200);
		}
		return returnPromise;
	}

	async shutdownApp () {
		if (this.debugWindow && this.debugWindow.getAppWrapper && _.isFunction(this.debugWindow.getAppWrapper)){
			this.debugHelper.onDebugWindowClose();
		}
		appState.mainLoaderTitle = this.appTranslations.translate('Please wait while application shuts down...');
		appState.appShuttingDown = true;

		await appUtil.wait(500);
		return true;
	}

	beforeWindowClose () {
		this.removeEventListeners();
		this.removeBoundMethods();
	}

	changeLanguage (selectedLanguageName, selectedLanguage, selectedLocale, skipOtherWindow) {
		return this.appTranslations.changeLanguage(selectedLanguageName, selectedLanguage, selectedLocale, skipOtherWindow);
	}

	async beforeUnload (e) {
		var appState = appUtil.getAppState();
		this.closeCurrentModal(true);
		if (appState.syncInProgress || (appState.stopSync && !appState.stopSuccessful)){

			if (e && e.preventDefault && _.isFunction(e.preventDefault)){
				e.preventDefault();
			}
			appState.modalData.currentModal = _.cloneDeep(appState.defaultModal);
			this.modalBusy(this.appTranslations.translate('Please wait until synchronization stops...'));
			this.openCurrentModal();

			this.windowReloadTimeout = setTimeout(() => {
				clearTimeout(this.windowReloadTimeout);
				this.cleanupCancelled = true;
				appUtil.addUserMessage('Could not stop synchronization, please try reloading again', 'error', [], true, false, true, true);
				setTimeout(() => {
					this.closeCurrentModal(true);
				}, 5000);
			}, appState.config.windowReloadTimeoutDuration);

			this.cleanupCancelled = false;
			var canReload = await this.cleanup();
			if (!this.cleanupCancelled && canReload){
				this.modalBusy(this.appTranslations.translate('Synchronization stopped, reloading...'));
				clearTimeout(this.windowReloadTimeout);
				await this.shutdownApp();
				this.windowManager.reloadWindow(null, true);
			} else {
				clearTimeout(this.windowReloadTimeout);
				this.modalBusy(this.appTranslations.translate('Could not stop synchronization'));
				appUtil.addUserMessage('Could not stop synchronization', 'error', [], true, false, true, true);
				setTimeout(() => {
					this.closeCurrentModal(true);
				}, 1000);
			}
		} else {
			await this.shutdownApp();
			this.windowManager.reloadWindow(null, true);
		}
	}

	resetAppStatus (){
		appState.syncInProgress = false;
		appState.appBusy = false;
		appState.stopSync = false;
	}

	async showModalCloseConfirm (e){
		if (e && e.preventDefault && _.isFunction(e.preventDefault)){
			e.preventDefault();
		}

		var appState = appUtil.getAppState();
		appState.modalData.currentModal = _.cloneDeep(appState.closeModal);

		appState.modalData.currentModal.bodyComponent = 'modal-body';
		appState.modalData.currentModal.title = this.appTranslations.translate('Are you sure?');
		appState.modalData.currentModal.body = this.appTranslations.translate('Action is being executed in the background. Are you sure wou want to exit?');
		appState.modalData.currentModal.confirmButtonText = this.appTranslations.translate('Confirm');
		appState.modalData.currentModal.cancelButtonText = this.appTranslations.translate('Cancel');
		this._confirmModalAction = this.confirmCloseModalAction;
		this.closeWindowPromise = new Promise((resolve, reject) => {
			appState.closeWindowResolve = resolve;
		});
		this.openCurrentModal(true);
		return this.closeWindowPromise;
	}

	/**
	 * Placeholder method that handles modal confirm action
	 *
	 * @param  {Event} Optional event passed to method
	 * @return {mixed} Return value depends on particular confirm modal handler method
	 */
	 confirmModalAction (e) {
	 	return this._confirmModalAction(e);
	 }

	/**
	 * Placeholder method that handles modal cancel/close action
	 *
	 * @param  {Event} Optional event passed to method
	 * @return {mixed} Return value depends on particular cancel/close modal handler method
	 */
	 cancelModalAction (e) {
	 	return this._cancelModalAction(e);
	 }

	/**
	 * Internal method that is overwritten when particular modal is opened.
	 * Overwritten method contains all logic for modal confirmation
	 *
	 * @param  {Event} Optional event passed to method
	 * @return {mixed} Return value depends on particular confirm modal handler method
	 */
	 _confirmModalAction (e) {
	 	if (e && e.preventDefault && _.isFunction(e.preventDefault)){
	 		e.preventDefault();
	 	}
	 }

	/**
	 * Internal method that is overwritten when particular modal is opened.
	 * Overwritten method contains all logic for modal cancelling or closing
	 *
	 * @param  {Event} Optional event passed to method
	 * @return {mixed} Return value depends on particular cancel/close modal handler method
	 */
	 _cancelModalAction (e) {
	 	return this.__cancelModalAction(e);
	 }


	/**
	 * Default confirm modal action - do not change
	 *
	 * @param  {Event} Optional event passed to method
	 * @return {void}
	 */
	 __confirmModalAction (e) {
	 	if (e && e.preventDefault && _.isFunction(e.preventDefault)){
	 		e.preventDefault();
	 	}
	 }

	/**
	 * Default cancel/close modal action - do not change
	 *
	 * @param  {Event} Optional event passed to method
	 * @return {void}
	 */
	 __cancelModalAction (e) {
	 	if (e && e.preventDefault && _.isFunction(e.preventDefault)){
	 		e.preventDefault();
	 	}
	 	this.closeCurrentModal();
	 }

	 closeCurrentModal (force){
	 	var appState = appUtil.getAppState();
	 	if (!appState.modalData.currentModal.busy || force) {
	 		this._confirmModalAction = this.__confirmModalAction;
	 		this._cancelModalAction = this.__cancelModalAction;
	 		if (appState.closeModalResolve && _.isFunction(appState.closeModalResolve)){
	 			appState.closeModalResolve(false);
	 		}
	 		appState.modalData.modalVisible = false;
	 		this.modalNotBusy();
	 	} else {
	 		appUtil.log("Can't close modal because it is busy", "warning", [], false, this.forceDebug);
	 	}
	 }

	 openCurrentModal (showContentImmediately) {
	 	var appState = appUtil.getAppState();
	 	appState.modalData.modalVisible = true;
	 	if (!showContentImmediately){
	 		setTimeout(() => {
	 			if (appState.modalData.currentModal.bodyComponent != appState.modalData.currentModal.defaultBodyComponent){
	 				appState.modalData.currentModal.bodyComponent = appState.modalData.currentModal.defaultBodyComponent;
	 			}
	 			this.modalNotBusy();
	 		}, 300);
	 	} else {
	 		if (appState.modalData.currentModal.bodyComponent != appState.modalData.currentModal.defaultBodyComponent){
	 			appState.modalData.currentModal.bodyComponent = appState.modalData.currentModal.defaultBodyComponent;
	 		}
	 		this.modalNotBusy();
	 	}
	 }

	 confirmCloseModalAction (e){
	 	if (e && e.preventDefault && _.isFunction(e.preventDefault)){
	 		e.preventDefault();
	 	}
	 	var appState = appUtil.getAppState();
	 	appState.modalData.modalVisible = false;
	 	if (appState.closeModalResolve && _.isFunction(appState.closeModalResolve)){
	 		appState.closeModalResolve(true);
	 	}
	 }



	 modalBusy (message) {
	 	var appState = appUtil.getAppState();
	 	if (message){
	 		appState.modalData.currentModal.busyText = message;
	 	}
	 	appState.modalData.currentModal.busy = true;
	 }

	 modalNotBusy () {
	 	var appState = appUtil.getAppState();
	 	appState.modalData.currentModal.busy = false;
	 	appState.modalData.currentModal.busyText = appState.defaultModal.busyText;
	 }

	 async loadCss (href) {

	 	var parentEl = document.getElementsByTagName('head')[0];
	 	// if (!href.match(/^\//)){
	 	// 	href = '../css/' + href;
	 	// }

	 	if (!parentEl){
	 		throw new Error('No <head> element!');
	 	} else {
	 		appUtil.log("Adding CSS file '{1}'...", "debug", [href], false, this.forceDebug);
	 		var cssNode = document.createElement('link');

	 		cssNode.setAttribute('rel', 'stylesheet');
	 		cssNode.setAttribute('type', 'text/css');
	 		cssNode.setAttribute('href', href);

	 		parentEl.appendChild(cssNode);
	 	}
	 	return true;
	 }

	 async loadJs (href) {

	 	var parentEl = document.getElementsByTagName('head')[0];
	 	if (!href.match(/^\//)){
	 		href = '../js/' + href;
	 	}

	 	var returnPromise = new Promise((resolve, reject) => {
	 		this.jsFileLoadResolves[href] = resolve;
	 	});

	 	if (!parentEl){
	 		throw new Error('No <head> element!');
	 	} else {
	 		appUtil.log("Adding JS file '{1}'...", "debug", [href], false, this.forceDebug);
	 		var jsNode = document.createElement('script');

	 		jsNode.setAttribute('type', 'text/javascript');
	 		jsNode.setAttribute('src', href);

	 		jsNode.onload = () => {
	 			this.jsFileLoadResolves[href](true);
	 			this.jsFileLoadResolves[href] = null;
	 		}

	 		parentEl.appendChild(jsNode);
	 	}
	 	return returnPromise;
	}

	async openConfigEditorHandler (e) {
		if (e && e.preventDefault && _.isFunction(e.preventDefault)){
			e.preventDefault();
		}
		this.openConfigEditor();
	}
	async openConfigEditor () {
		// this.windowManager.noHandlingKeys = true;

		appState.modalData.currentModal = _.cloneDeep(appState.configEditorModal);
		appState.modalData.currentModal.title = this.appTranslations.translate('Config editor');
		appState.modalData.currentModal.confirmButtonText = this.appTranslations.translate('Save');
		appState.modalData.currentModal.cancelButtonText = this.appTranslations.translate('Cancel');
		this.modalBusy(this.appTranslations.translate('Please wait...'));
		this._confirmModalAction = this.saveConfig.bind(this);
		this._cancelModalAction = function(evt){
			if (evt && evt.preventDefault && _.isFunction(evt.preventDefault)){
				evt.preventDefault();
			}
			// this.windowManager.noHandlingKeys = false;
			this.modalNotBusy();
			// clearTimeout(this.appTranslations.timeouts.translationModalInitTimeout);
			this._cancelModalAction = this.__cancelModalAction;
			return this.__cancelModalAction();
		};
		this.openCurrentModal();
	}

	async saveConfig (e) {
		if (e && e.preventDefault && _.isFunction(e.preventDefault)){
			e.preventDefault();
		}
		var form = e.target;
		var newConfig = {};
		_.each(form, function(input){
			var currentConfig = newConfig;
			var appConfig = _.cloneDeep(appState.config);
			var dataPath = input.getAttribute("data-path");
			if (dataPath && dataPath.split){
				var pathChunks = _.drop(dataPath.split('.'), 1);
				var chunkCount = pathChunks.length - 1;
				_.each(pathChunks, function(pathChunk, i){
					if (i == chunkCount){
						if (input.getAttribute('type') == 'checkbox'){
							currentConfig[pathChunk] = input.checked;
							// console.log(input);
							// console.log(input.getAttribute('name'));
							// console.log(currentConfig[pathChunk]);
							// console.log(appConfig[pathChunk]);
						} else {
							currentConfig[pathChunk] = input.value;
						}
					} else {
						if (_.isUndefined(currentConfig[pathChunk])){
							if (!_.isNaN(parseInt(pathChunks[i+1], 10))){
								currentConfig[pathChunk] = [];
							} else {
								currentConfig[pathChunk] = {};
							}
						}
					}
					currentConfig = currentConfig[pathChunk];
					appConfig = appConfig[pathChunk];
				});
			}
		});
		var oldConfig = _.cloneDeep(appState.config);
		var difference = appUtil.difference(oldConfig, newConfig);
		// console.log(newConfig);
		// console.log(difference);
		if (difference && _.isObject(difference) && _.keys(difference).length){
			// console.log(difference);
			appState.config = appUtil.mergeDeep({}, appState.config, difference);
			// appState.config = _.cloneDeep(newConfig);
			this.saveUserConfig();
			this.closeCurrentModal();
		} else {
			this.closeCurrentModal();
		}
	}

	showUserMessageSettings (e) {
		if (e && e.preventDefault && _.isFunction(e.preventDefault)){
			e.preventDefault();
		}
		appState.userMessagesData.toolbarVisible = !appState.userMessagesData.toolbarVisible;
	}

	toggleUserMessages (e) {
		if (e && e.preventDefault && _.isFunction(e.preventDefault)){
			e.preventDefault();
		}
		appState.userMessagesData.messagesExpanded = !appState.userMessagesData.messagesExpanded;
		setTimeout(() => {
			var ul = document.querySelector('.user-message-list');
			ul.scrollTop = ul.scrollHeight;
		}, 50);
	}

	userMessageLevelSelectFocus (e) {
		appState.userMessagesData.selectFocused = true;
	}

	userMessageLevelSelectBlur (e) {
		appState.userMessagesData.selectFocused = false;
	}

}
exports.AppWrapper = AppWrapper;