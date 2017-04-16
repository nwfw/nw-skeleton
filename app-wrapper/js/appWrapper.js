var _ = require('lodash');
var path = require('path');
var fs = require('fs');
var util = require('util');

var App;
var appUtil = require('./appUtil').appUtil;

var AppTemplates = require('./appTemplates').AppTemplates;
var AppTranslations = require('./appTranslations').AppTranslations;

var WindowManager = require('./windowManager').WindowManager;
var FileManager = require('./fileManager').FileManager;

var AppConfig = require('./appConfig').AppConfig;

class AppWrapper {

	constructor (initialAppConfig) {

		this.forceDebug = false;
		this.forceUserMessages = false;

		this.app = null;

		this.templateContents = null;
		this.translations = null;

		this.helperData = {};
		this.helpers = {};

		this.windowManager = null;
		this.fileManager = null;
		this.appConfig = null;

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

		this.appConfig = new AppConfig(this.initialAppConfig);

		appState.config = await this.appConfig.initializeConfig();
		appState.config = await this.appConfig.loadUserConfig();

		if (appUtil.getConfig("debugToFile")){
			fs.writeFileSync(path.resolve(appState.config.debugMessagesFilename), '', {flag: 'w'});
		}
		if (appUtil.getConfig("userMessagesToFile")){
			fs.writeFileSync(path.resolve(appState.config.userMessagesFilename), '', {flag: 'w'});
		}

		var mainAppFile = path.join(process.cwd(), appState.config.wrapper.appFile);

		App = require(mainAppFile).App;

		await this.loadCssFiles();
		await this.loadJsFiles();

		this.setDynamicAppStateValues();

		this.fileManager = new FileManager();
		this.windowManager = new WindowManager();

		this.appTemplates = new AppTemplates();
		this.templateContents = await this.appTemplates.initializeTemplates();

		this.helpers = await this.initializeHelpers(appUtil.getConfig('wrapper.helperDirectories'));

		if (window.isDebugWindow){
			this.mainWindow = window.opener;
		}

		await this.initializeLanguage();

		this.app = new App();

		if (appUtil.getConfig('devTools')){
			this.windowManager.winState.devTools = true;
		}

		this.addBoundMethods();
		this.addEventListeners();

		await this.app.initialize();

		window.feApp = await this.initializeFeApp();

		await this.finalize();

		return this;
	}

	async finalize () {
		var retValue = await this.app.finalize();
		window.appState.appReady = true;
		return retValue;
	}

	addEventListeners() {
		if (!window.isDebugWindow){
			var appState = appUtil.getAppState();
			this.windowManager.win.on('close', this.boundMethods.onWindowClose);
			// WatchJs.watch(appState.config, this.boundMethods.saveUserConfig);
		} else {
			this.windowManager.win.on('close', window.opener.getAppWrapper().helpers.debugHelper.onDebugWindowClose.bind(window.opener.getAppWrapper().debugHelper));
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

	async initializeHelpers(helperDirs){
		var helpers = {};
		var classHelpers = await this.loadHelpers(helperDirs)

		for (let helperIdentifier in classHelpers){
			helpers[helperIdentifier] = new classHelpers[helperIdentifier]();
			if (helpers[helperIdentifier] && !_.isUndefined(helpers[helperIdentifier].initialize) && _.isFunction(helpers[helperIdentifier].initialize)){
				await helpers[helperIdentifier].initialize();
			}
		}

		return helpers;
	}

	async loadHelpers (helperDirs) {
		var helpers = {};

		if (!(helperDirs && _.isArray(helperDirs) && helperDirs.length)){
			appUtil.log("No wrapper helper dirs defined", "warning", [], false, this.forceDebug);
			appUtil.log("You should define this in ./config/config.js file under 'appConfig.templateDirectories.helperDirectories' variable", "debug", [], false, this.forceDebug);
			helperDirs = [];
		} else {
			appUtil.log("Loading wrapper helpers from {1} directories.", "group", [helperDirs.length], false, this.forceDebug);
			var currentHelpers;
			for (let i=0; i<helperDirs.length; i++){
				var helperDir = path.resolve(helperDirs[i])
				currentHelpers = await appUtil.loadFilesFromDir(helperDir, '/\.js$/', true);
				if (currentHelpers && _.isObject(currentHelpers) && _.keys(currentHelpers).length){
					helpers = _.merge(helpers, currentHelpers);
				}
			}
			appUtil.log("Loading wrapper helpers from {1} directories.", "groupend", [helperDirs.length], false, this.forceDebug);
		}

		return helpers;
	}

	async initializeFeApp(){
		var self = this;
		var appState = appUtil.getAppState();

		appUtil.log("Initializing Vue app...'", "debug", [], false, this.forceDebug);

		var vm = new Vue({
			el: '#app-body',
			template: window.indexTemplate,
			data: appState,
			mixins: this.helpers.componentHelper.vueMixins,
			components: this.helpers.componentHelper.vueComponents,
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
			if (appState.activeConfigFile && appState.activeConfigFile != '../../config/config.js'){
				appUtil.addUserMessage("Active config file: '{1}'", "info", [appState.activeConfigFile], false, false, true, true);
			}
		}

		return vm;
	}

	async reinitializeFeApp(){
		window.getFeApp().$destroy();
		return await this.initializeFeApp();
	}

	async loadCssFiles() {
		var cssFiles = appUtil.getConfig('appConfig.initCssFiles');
		var appCssFiles = appUtil.getConfig('appConfig.cssFiles');
		var debugCssFiles = appUtil.getConfig('appConfig.debugCssFiles');
		var appDebugCssFiles = appUtil.getConfig('appConfig.appDebugCssFiles');

		var totalCssFiles = 0;
		var cssFileCount = 0;
		var appCssFileCount = 0;
		var debugCssFileCount = 0;
		var appDebugCssFileCount = 0;

		if (cssFiles && cssFiles.length){
			cssFileCount = cssFiles.length;
		}
		if (appCssFiles && appCssFiles.length){
			appCssFileCount = appCssFiles.length;
		}

		if (debugCssFiles && debugCssFiles.length){
			debugCssFileCount = debugCssFiles.length;
		}

		if (appDebugCssFiles && appDebugCssFiles.length){
			appDebugCssFileCount = appDebugCssFiles.length;
		}

		totalCssFiles = cssFileCount + appCssFileCount;

		if (window.isDebugWindow){
			totalCssFiles += debugCssFileCount + appDebugCssFileCount;
		}

		if (totalCssFiles){
			appUtil.log("Loading {1} CSS files", "group", [totalCssFiles], false, this.forceDebug);
			if (cssFileCount){
				appUtil.log("Loading {1} wrapper CSS files", "group", [cssFileCount], false, this.forceDebug);
				for (let i=0; i<cssFiles.length; i++){
					await this.loadCss(cssFiles[i]);
				}
				appUtil.log("Loading {1} wrapper CSS files", "groupend", [cssFileCount], false, this.forceDebug);
			}
			if (appCssFileCount){
				appUtil.log("Loading {1} app CSS files", "group", [appCssFileCount], false, this.forceDebug);
				for (let i=0; i<appCssFiles.length; i++){
					await this.loadCss(appCssFiles[i]);
				}
				appUtil.log("Loading {1} app CSS files", "groupend", [appCssFileCount], false, this.forceDebug);
			}
			if (window.isDebugWindow){
				if (debugCssFileCount){
					appUtil.log("Loading {1} debug window wrapper CSS files", "group", [debugCssFileCount], false, this.forceDebug);
					for (let i=0; i<debugCssFiles.length; i++){
						await this.loadCss(debugCssFiles[i]);
					}
					appUtil.log("Loading {1} debug window wrapper CSS files", "groupend", [debugCssFileCount], false, this.forceDebug);
				}
				if (appDebugCssFileCount){
					appUtil.log("Loading {1} debug window app CSS files", "group", [appDebugCssFileCount], false, this.forceDebug);
					for (let i=0; i<appDebugCssFiles.length; i++){
						await this.loadCss(appDebugCssFiles[i]);
					}
					appUtil.log("Loading {1} debug window app CSS files", "groupend", [appDebugCssFileCount], false, this.forceDebug);
				}
			}
			appUtil.log("Loading {1} CSS files", "groupend", [totalCssFiles], false, this.forceDebug);
		}
	}

	async loadJsFiles() {
		var jsFiles = appUtil.getConfig('appConfig.initJsFiles');
		var appJsFiles = appUtil.getConfig('appConfig.jsFiles');

		var jsFileCount = 0;
		var appJsFileCount = 0;
		var totalJsFileCount = 0;

		if (jsFiles && jsFiles.length){
			jsFileCount = jsFiles.length;
		}

		if (appJsFiles && appJsFiles.length){
			appJsFileCount = appJsFiles.length;
		}

		totalJsFileCount = jsFileCount + appJsFileCount;

		if (totalJsFileCount){
			appUtil.log("Loading {1} JS files", "group", [totalJsFileCount], false, this.forceDebug);
			if (jsFileCount){
				appUtil.log("Loading {1} wrapper JS files", "group", [jsFileCount], false, this.forceDebug);
				for (let i=0; i<jsFiles.length; i++){
					await this.loadJs(jsFiles[i]);
				}
				appUtil.log("Loading {1} wrapper JS files", "groupend", [jsFileCount], false, this.forceDebug);
			}
			if (appJsFileCount){
				appUtil.log("Loading {1} app JS files", "group", [appJsFileCount], false, this.forceDebug);
				for (let i=0; i<appJsFiles.length; i++){
					await this.loadJs(appJsFiles[i]);
				}
				appUtil.log("Loading {1} app JS files", "groupend", [appJsFileCount], false, this.forceDebug);
			}
			appUtil.log("Loading {1} JS files", "groupend", [totalJsFileCount], false, this.forceDebug);
		}
	}

	getAppUtil () {
		return appUtil;
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
			do {
				eventTargetInstruction = target.getAttribute(eventTargetAttrName);
				if (eventTargetInstruction && eventTargetInstruction == 'parent'){
					target = target.parentNode;
				}
			} while (eventTargetInstruction == 'parent');

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
					eventMethodPath = _.slice(eventChunks, 0, eventChunks.length-1).join('.');
				} else {
					eventMethod = eventHandlerName;
				}

				var handlerObj = this.app;
				if (eventMethodPath){
					handlerObj = _.get(handlerObj, eventMethodPath);
				}

				if (handlerObj && handlerObj[eventMethod] && _.isFunction(handlerObj[eventMethod])){
					return await handlerObj[eventMethod](e, target);
				} else {
					var handlerObj = this;
					if (eventMethodPath){
						handlerObj = _.get(handlerObj, eventMethodPath);
					}
					if (handlerObj && handlerObj[eventMethod] && _.isFunction(handlerObj[eventMethod])){
						return await handlerObj[eventMethod](e);
					} else {
						appUtil.log("Can't find event handler '{1}'", "warning", [eventHandlerName], false, this.forceDebug);
						if (e && e.preventDefault && _.isFunction(e.preventDefault)){
							e.preventDefault();
						}
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

	async onWindowClose () {
		var appState = appUtil.getAppState();
		this.closeCurrentModal(true);
		if (!appState.isDebugWindow){
			appState.appError = false;
			this.windowManager.closeWindowForce();
		}
	}

	async cleanup(){
		var appState = appUtil.getAppState();
		var returnPromise;
		appUtil.addUserMessage("Performing pre-close cleanup...", "info", [], false, false, this.forceUserMessages, this.forceDebug);
		var resolveReference;
		returnPromise = new Promise((resolve, reject) => {
			resolveReference = resolve;
		});
		setTimeout(async () => {
			await this.shutdownApp();
			await appUtil.finalizeLogs();
			resolveReference(true);
		}, 200);
		return returnPromise;
	}

	async shutdownApp () {
		if (this.debugWindow && this.debugWindow.getAppWrapper && _.isFunction(this.debugWindow.getAppWrapper)){
			this.helpers.debugHelper.onDebugWindowClose();
		}
		appState.mainLoaderTitle = this.appTranslations.translate('Please wait while application shuts down...');
		appState.appShuttingDown = true;
		if (this.app && this.app.shutdown && _.isFunction(this.app.shutdown)){
			await this.app.shutdown();
		}
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
		this.closeCurrentModal(true);
		if (!appState.isDebugWindow){
			await this.shutdownApp();
		}
		this.windowManager.reloadWindow(null, true);
	}

	resetAppStatus (){
		appState.appBusy = false;
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

	 setDynamicAppStateValues () {
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
	 }

	}
	exports.AppWrapper = AppWrapper;