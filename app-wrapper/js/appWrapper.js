var _ = require('lodash');
var path = require('path');
var fs = require('fs');

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

        this.boundMethods = {
            cleanup: null,
            saveUserConfig: null,
            onWindowClose: null
        };

        this.timeouts = {
            cleanupTimeout: null,
            windowCloseTimeout: null,
            modalContentVisibleTimeout: null,
            appStatusChangingTimeout: null
        };

        this.intervals = {

        };

        this.debugWindow = null;
        this.mainWindow = null;

        this.closeModalPromise = null;

        this.closeWindowResolve = null;
        this.closeWindowPromise = null;

        this.cleanupCancelled = false;

        this.initialAppConfig = initialAppConfig;

        window.getAppWrapper = () => {
            return this;
        };

        window.getFeApp = () => {
            return window.feApp;
        };

        return this;
    }

    async initialize(){
        this.appConfig = new AppConfig(this.initialAppConfig);

        appState.config = await this.appConfig.initializeConfig();
        appState.config = await this.appConfig.loadUserConfig();

        if (appUtil.getConfig('debugToFile')){
            fs.writeFileSync(path.resolve(appState.config.debugMessagesFilename), '', {flag: 'w'});
        }
        if (appUtil.getConfig('userMessagesToFile')){
            fs.writeFileSync(path.resolve(appState.config.userMessagesFilename), '', {flag: 'w'});
        }

        this.helpers = await this.initializeHelpers(appUtil.getConfig('wrapper.systemHelperDirectories'));

        App = require(path.join(process.cwd(), appState.config.wrapper.appFile)).App;

        await this.helpers.staticFilesHelper.loadCssFiles();
        await this.helpers.staticFilesHelper.loadJsFiles();

        this.setDynamicAppStateValues();

        this.fileManager = new FileManager();
        this.windowManager = new WindowManager();

        this.appTemplates = new AppTemplates();
        this.templateContents = await this.appTemplates.initializeTemplates();

        this.helpers = _.merge(this.helpers, await this.initializeHelpers(appUtil.getConfig('wrapper.helperDirectories')));

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
        if (appUtil.getConfig('appConfig.showInitializationStatus')){
            let showInitializationProgress = appUtil.getConfig('appConfig.showInitializationProgress');
            this.operationStart(this.appTranslations.translate('Initializing application'), false, true, showInitializationProgress);
        }


        await this.finalize();
        if (appUtil.getConfig('appConfig.showInitializationStatus')){
            if (appUtil.getConfig('appConfig.showInitializationProgress')){
                this.operationUpdate(100, 100);
            }
            this.operationFinish(this.appTranslations.translate('Application initialized'));
        }

        return this;
    }

    async finalize () {
        var retValue = await this.app.finalize();
        window.appState.appReady = true;
        return retValue;
    }

    addEventListeners() {
        if (!window.isDebugWindow){
            this.windowManager.win.on('close', this.boundMethods.onWindowClose);
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
        var classHelpers = await this.loadHelpers(helperDirs);

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
            appUtil.log('No wrapper helper dirs defined', 'warning', [], false, this.forceDebug);
            appUtil.log('You should define this in ./config/config.js file under \'appConfig.templateDirectories.helperDirectories\' variable', 'debug', [], false, this.forceDebug);
            helperDirs = [];
        } else {
            appUtil.log('Loading wrapper helpers from {1} directories.', 'group', [helperDirs.length], false, this.forceDebug);
            var currentHelpers;
            for (let i=0; i<helperDirs.length; i++){
                var helperDir = path.resolve(helperDirs[i]);
                currentHelpers = await appUtil.loadFilesFromDir(helperDir, '/\.js$/', true);
                if (currentHelpers && _.isObject(currentHelpers) && _.keys(currentHelpers).length){
                    helpers = _.merge(helpers, currentHelpers);
                }
            }
            appUtil.log('Loading wrapper helpers from {1} directories.', 'groupend', [helperDirs.length], false, this.forceDebug);
        }

        return helpers;
    }

    async initializeFeApp(){
        var appState = appUtil.getAppState();

        appUtil.log('Initializing Vue app...', 'debug', [], false, this.forceDebug);

        let vm = new Vue({
            el: '#app-body',
            template: window.indexTemplate,
            data: appState,
            mixins: this.helpers.componentHelper.vueMixins,
            components: this.helpers.componentHelper.vueComponents,
            translations: appState.translations,
            created: () => {
                appState.appInitialized = true;
                this.finalize();
            }
        });
        if (window.isDebugWindow){
            appUtil.addUserMessage('Debug window application initialized', 'info', [], false,  false, true, true);
        } else {
            appUtil.addUserMessage('Application initialized', 'info', [], false,  false, true, true);
            if (appState.activeConfigFile && appState.activeConfigFile != '../../config/config.js'){
                appUtil.addUserMessage('Active config file: \'{1}\'', 'info', [appState.activeConfigFile], false, false, true, true);
            }
        }

        return vm;
    }

    async reinitializeFeApp(){
        window.getFeApp().$destroy();
        return await this.initializeFeApp();
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
            eventTargetAttrName = 'data-event-target';
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
                    handlerObj = this;
                    if (eventMethodPath){
                        handlerObj = _.get(handlerObj, eventMethodPath);
                    }
                    if (handlerObj && handlerObj[eventMethod] && _.isFunction(handlerObj[eventMethod])){
                        return await handlerObj[eventMethod](e);
                    } else {
                        appUtil.log('Can\'t find event handler \'{1}\'', 'warning', [eventHandlerName], false, this.forceDebug);
                        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
                            e.preventDefault();
                        }
                    }
                }
            } else {
                appUtil.log('Element {1} doesn\'t have attribute \'{2}\'', 'warning', [target.tagName + '.' + target.className.split(' ').join(','), dataHandlerAttrName], false, this.forceDebug);
            }
        } else {
            appUtil.log('Can\'t find event target \'{1}\'', 'warning', [e], false, this.forceDebug);
            if (e && e.preventDefault && _.isFunction(e.preventDefault)){
                e.preventDefault();
            }
        }
    }

    async onWindowClose () {
        this.helpers.modalHelper.closeCurrentModal(true);
        if (!appState.isDebugWindow){
            appState.appError = false;
            this.windowManager.closeWindowForce();
        }
    }

    async cleanup(){
        var returnPromise;
        appUtil.addUserMessage('Performing pre-close cleanup...', 'info', [], false, false, this.forceUserMessages, this.forceDebug);
        var resolveReference;
        returnPromise = new Promise((resolve) => {
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

    async beforeUnload () {
        this.helpers.modalHelper.closeCurrentModal(true);
        if (!appState.isDebugWindow){
            await this.shutdownApp();
        }
        this.windowManager.reloadWindow(null, true);
    }

    resetAppStatus (){
        appState.appBusy = false;
    }

    operationStart(operationText, cancelable, appBusy, useProgress, progressText){
        if (!operationText){
            operationText = '';
        }
        if (!cancelable){
            cancelable = false;
        }

        appState.appOperation = {
            operationText,
            useProgress,
            progressText,
            appBusy,
            cancelable
        };

        if (_.isUndefined(appBusy)){
            appBusy = true;
        }

        appState.appStatusChanging = true;
        appState.appBusy = appBusy;

        clearTimeout(this.timeouts.appStatusChangingTimeout);
        if (useProgress){
            this.helpers.htmlHelper.startProgress(100, appState.appOperation.progressText);
        }
    }

    operationUpdate(completed, total, progressText){
        if (!progressText){
            progressText = appState.appOperation.progressText;
        }
        if (appState.appOperation.useProgress){
            this.helpers.htmlHelper.updateProgress(completed, total, progressText);
        }
    }

    operationFinish(operationText, timeoutDuration){
        if (operationText){
            appState.appOperation.operationText = operationText;
        }

        let appBusy = appState.appOperation.appBusy ? false : appState.appBusy;

        if (!timeoutDuration){
            timeoutDuration = 1000;
        }

        appState.appBusy = appBusy;

        if (appState.appOperation.useProgress){
            this.helpers.htmlHelper.clearProgress();
        }

        clearTimeout(this.timeouts.appStatusChangingTimeout);

        this.timeouts.appStatusChangingTimeout = setTimeout(() => {
            appState.appStatusChanging = false;
            appState.appOperation = {
                cancelable: null,
                operationText: null,
                useProgress: null,
                progressText: null,
                appBusy: null
            };
        }, timeoutDuration);
    }

    operationCancel (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
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
            appState.closeWindowReject = reject;
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
        this.helpers.modalHelper.closeCurrentModal();
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

    userMessageLevelSelectFocus () {
        appState.userMessagesData.selectFocused = true;
    }

    userMessageLevelSelectBlur () {
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