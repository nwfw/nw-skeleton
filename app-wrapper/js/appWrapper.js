var _ = require('lodash');
var path = require('path');

var App;
let BaseClass = require('./base').BaseClass;

var AppTranslations = require('./lib/appTranslations').AppTranslations;

var WindowManager = require('./lib/windowManager').WindowManager;
var FileManager = require('./lib/fileManager').FileManager;

var AppConfig = require('./lib/appConfig').AppConfig;

class AppWrapper extends BaseClass {

    constructor (initialAppConfig) {

        super();

        this.needsConfig = false;

        this.app = null;

        this.templateContents = null;
        this.translations = null;

        this.helperData = {};
        this.helpers = {};

        this.windowManager = null;
        this.fileManager = null;
        this.appConfig = null;

        if (initialAppConfig && initialAppConfig.debug && initialAppConfig.debug.forceDebug && !_.isUndefined(initialAppConfig.debug.forceDebug.AppWrapper)){
            this.forceDebug = initialAppConfig.debug.forceDebug.AppWrapper;
        }

        if (initialAppConfig && initialAppConfig.userMessages && initialAppConfig.userMessages.forceUserMessages && !_.isUndefined(initialAppConfig.userMessages.forceUserMessages.AppWrapper)){
            this.forceUserMessages = initialAppConfig.userMessages.forceUserMessages.AppWrapper;
        }

        this.boundMethods = {
            cleanup: null,
            saveUserConfig: null,
            onWindowClose: null,
            onDebugWindowClose: null,
        };

        this.timeouts = {
            cleanupTimeout: null,
            windowCloseTimeout: null,
            modalContentVisibleTimeout: null,
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

        this.noop = _.noop;

        appState = this.getAppState();

        return this;
    }

    async initialize(){


        let isDebugWindow = false;
        if (this.initialAppConfig.isDebugWindow){
            isDebugWindow = true;
            delete this.initialAppConfig.isDebugWindow;
        }

        this.appConfig = new AppConfig(this.initialAppConfig);
        await this.appConfig.initialize({silent: true});
        // appState is available from here;

        await super.initialize();


        if (isDebugWindow){
            appState.isDebugWindow = true;
            isDebugWindow = null;
        }

        this.fileManager = new FileManager();
        await this.fileManager.initialize();

        appState.config = await this.appConfig.initializeConfig();
        await this.initializeLogging();
        await this.appConfig.initializeLogging();
        await this.fileManager.initializeLogging();

        this.log('Initializing application.', 'group', []);

        var tmpDataDir = this.getConfig('appConfig.tmpDataDir');
        if (tmpDataDir){
            tmpDataDir = path.resolve(tmpDataDir);
            this.fileManager.createDirRecursive(tmpDataDir);
        }

        if (this.getConfig('debug.debugToFile') && !this.getConfig('debug.debugToFileAppend')){
            this.fileManager.createDirFileRecursive(this.getConfig('debug.debugMessagesFilename'));
        }
        if (this.getConfig('userMessages.userMessagesToFile') && !this.getConfig('userMessages.userMessagesToFileAppend')){
            this.fileManager.createDirFileRecursive(this.getConfig('userMessages.userMessagesFilename'));
        }

        appState.config = await this.appConfig.loadUserConfig();
        await this.initializeLogging();
        await this.appConfig.initializeLogging();
        await this.fileManager.initializeLogging();

        this.windowManager = new WindowManager();
        await this.windowManager.initialize();

        this.setDynamicAppStateValues();

        this.helpers = await this.initializeHelpers(this.getConfig('wrapper.systemHelperDirectories'));

        appState.platformData = this.getHelper('util').getPlatformData();

        appState.appDir = await this.getAppDir();
        appState.appRootDir = path.join(appState.appDir, '../');

        this.getHelper('menu').initializeAppMenu();

        App = require(path.join(process.cwd(), this.getConfig('wrapper.appFile'))).App;

        await this.helpers.staticFilesHelper.initializeThemes();
        await this.helpers.staticFilesHelper.loadJsFiles();

        this.helpers = _.merge(this.helpers, await this.initializeHelpers(this.getConfig('wrapper.helperDirectories')));

        appState.initializationTime = this.getHelper('format').formatDate(new Date(), {}, true);

        await this.helpers.staticFilesHelper.loadCssFiles();

        appState.userData = await this.getHelper('userData').loadUserData();

        var globalKeyHandlers = this.getConfig('appConfig.globalKeyHandlers');
        if (globalKeyHandlers && globalKeyHandlers.length){
            for(let j=0; j<globalKeyHandlers.length; j++){
                this.getHelper('keyboard').registerGlobalShortcut(globalKeyHandlers[j]);
            }
        }

        if (appState.isDebugWindow){
            this.mainWindow = window.opener;
        }

        await this.initializeLanguage();

        this.getHelper('menu').initializeTrayIcon();

        this.app = new App();

        if (this.getConfig('debug.devTools')){
            this.windowManager.winState.devTools = true;
        }

        this.addEventListeners();

        await this.app.initialize();

        await this.initializeFeApp();
        if (this.getConfig('appConfig.showInitializationStatus')){
            let showInitializationProgress = this.getConfig('appConfig.showInitializationProgress');
            this.getHelper('appOperation').operationStart(this.appTranslations.translate('Initializing application'), false, true, showInitializationProgress);
        }

        // await this.finalize();
        if (this.getConfig('appConfig.showInitializationStatus')){
            if (this.getConfig('appConfig.showInitializationProgress')){
                this.getHelper('appOperation').operationUpdate(100, 100);
            }
            this.getHelper('appOperation').operationFinish(this.appTranslations.translate('Application initialized'));
        }

        return this;
    }

    async finalize () {
        appState.status.appLoaded = true;
        await this.wait(parseInt(parseFloat(this.getHelper('style').getCssVarValue('--long-animation-duration'), 10) * 1000, 10));
        var retValue = await this.app.finalize();
        if (retValue){
            appState.status.appInitialized = true;
            appState.status.appReady = true;
        }
        this.getHelper('menu').setupAppMenu();
        window.feApp.$watch('appState.config', this.appConfig.configChanged.bind(this.appConfig), {deep: true});
        this.log('Initializing application.', 'groupend', []);
        return retValue;
    }

    addEventListeners() {
        if (!appState.isDebugWindow){
            this.windowManager.win.on('close', this.boundMethods.onWindowClose);
        } else {
            this.windowManager.win.on('close', this.boundMethods.onDebugWindowClose);
        }
    }

    removeEventListeners() {
        if (!appState.isDebugWindow){
            this.windowManager.win.removeListener('close', this.boundMethods.onWindowClose);
        } else {
            this.windowManager.win.removeListener('close', this.boundMethods.onDebugWindowClose);
        }

    }

    _addBoundMethods () {
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
        await this.appTranslations.initialize();
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
            this.log('No wrapper helper dirs defined', 'warning', []);
            this.log('You should define this in ./config/config.js file under "appConfig.templateDirectories.helperDirectories" variable', 'debug', []);
            helperDirs = [];
        } else {
            this.log('Loading wrapper helpers from {1} directories.', 'group', [helperDirs.length]);
            var currentHelpers;
            for (let i=0; i<helperDirs.length; i++){
                var helperDir = path.resolve(helperDirs[i]);
                currentHelpers = await this.fileManager.loadFilesFromDir(helperDir, /\.js$/, true);
                if (currentHelpers && _.isObject(currentHelpers) && _.keys(currentHelpers).length){
                    helpers = _.merge(helpers, currentHelpers);
                }
            }
            this.log('Loading wrapper helpers from {1} directories.', 'groupend', [helperDirs.length]);
        }

        return helpers;
    }

    async initializeFeApp(){
        this.log('Initializing Vue app...', 'debug', []);
        let utilHelper = this.getHelper('util');

        window.feApp = new Vue({
            el: '.nw-app-wrapper',
            template: window.indexTemplate,
            data: appState,
            mixins: this.helpers.componentHelper.vueMixins,
            filters: this.helpers.componentHelper.vueFilters,
            components: this.helpers.componentHelper.vueComponents,
            translations: appState.translations,
            mounted: async () => {
                if (this.getConfig('appConfig.disableRightClick') && !this.getConfig('debug.enabled')){
                    document.body.addEventListener('contextmenu', utilHelper.boundMethods.prevent, false);
                }
                return await this.finalize();
            }
        });
        if (appState.isDebugWindow){
            this.addUserMessage('Debug window application initialized', 'info', [], false,  false);
        } else {
            if (appState.activeConfigFile && appState.activeConfigFile != '../../config/config.js'){
                this.addUserMessage('Active config file: "{1}"', 'info', [appState.activeConfigFile], false, false);
            }
            this.addUserMessage('Application initialized', 'info', [], false, false);
        }

        return window.feApp;
    }

    async reinitializeFeApp(){
        window.getFeApp().$destroy();
        return await this.initializeFeApp();
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
                do {
                    target = target.parentNode;
                    eventHandlerName = target.getAttribute(dataHandlerAttrName);
                } while (!eventHandlerName);
            }

            if (eventHandlerName){
                return await this.callObjMethod(eventHandlerName, [e, target]);
            } else {
                this.log('Element {1} doesn\'t have attribute "{2}"', 'warning', [target.tagName + '.' + target.className.split(' ').join(','), dataHandlerAttrName]);
            }
        } else {
            this.log('Can\'t find event target "{1}"', 'warning', [e]);
            if (e && e.preventDefault && _.isFunction(e.preventDefault)){
                e.preventDefault();
            }
        }
    }

    async onWindowClose () {
        let modalHelper = this.getHelper('modal');
        let appOperationHelper = this.getHelper('appOperation');
        modalHelper.closeCurrentModal(true);
        let confirmed = true;
        if (appState.appOperation.operationActive){
            appOperationHelper.showCancelModal(false);
            return;
        }
        if (confirmed){
            await this.cleanup();
            if (!appState.isDebugWindow){
                appState.appError.error = false;
                this.windowManager.closeWindowForce();
            }
        } else {
            return;
        }
    }

    async cleanup(){
        let utilHelper = this.getHelper('util');
        var returnPromise;
        this.addUserMessage('Performing pre-close cleanup...', 'info', [], false, false);
        var resolveReference;
        returnPromise = new Promise((resolve) => {
            resolveReference = resolve;
        });
        setTimeout(async () => {
            if (this.getConfig('appConfig.disableRightClick') && !this.getConfig('debug.enabled')){
                document.body.removeEventListener('contextmenu', utilHelper.boundMethods.prevent);
            }
            await this.shutdownApp();
            await this.finalizeLogs();
            if (window && window.feApp && window.feApp.$destroy && _.isFunction(window.feApp.$destroy)){
                window.feApp.$destroy();
            }
            resolveReference(true);
        }, 200);
        return returnPromise;
    }

    async shutdownApp () {
        this.addUserMessage('Shutting down...', 'info', [], true, false, true, false);
        this.log('Shutting down...', 'group', []);
        await this.getHelper('menu').removeAppMenu();
        await this.getHelper('menu').removeTrayIcon();
        if (this.debugWindow && this.debugWindow.getAppWrapper && _.isFunction(this.debugWindow.getAppWrapper)){
            this.debugWindow.getAppWrapper().onDebugWindowClose();
        }
        appState.mainLoaderTitle = this.appTranslations.translate('Please wait while application shuts down...');
        appState.status.appShuttingDown = true;
        if (this.app && this.app.shutdown && _.isFunction(this.app.shutdown)){
            await this.app.shutdown();
        }
        this.clearTimeouts();
        this.clearIntervals();
        await this.fileManager.unwatchAllFiles();
        await this.fileManager.unwatchAll();
        this.addUserMessage('Shutdown complete.', 'info', [], true, false, true, true);
        this.log('Shutting down...', 'groupend', []);
        await this.wait(appState.config.longPauseDuration);
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
        let modalHelper = this.getHelper('modal');
        let appOperationHelper = this.getHelper('appOperation');
        modalHelper.closeCurrentModal(true);
        let confirmed = true;
        if (appState.appOperation.operationActive){
            appOperationHelper.showCancelModal(true);
            return;
        }
        if (confirmed){
            await this.cleanup();
            if (!appState.isDebugWindow){
                appState.appError.error = false;
                this.windowManager.reloadWindow(null, true);
            }
        } else {
            return;
        }
    }

    async onDebugWindowUnload (){
        this.windowManager.win.removeListener('close', this.boundMethods.onDebugWindowClose);
    }

    async onDebugWindowClose (){
        this.log('Closing standalone debug window', 'info', []);
        if (this.mainWindow && this.mainWindow.appState && this.mainWindow.appState.debugMessages){
            this.mainWindow.appState.debugMessages = _.cloneDeep(appState.debugMessages);
            this.mainWindow.appState.allDebugMessages = _.cloneDeep(appState.allDebugMessages);
            this.mainWindow.appState.hasDebugWindow = false;
            this.mainWindow.appWrapper.debugWindow = null;
        }
        this.windowManager.closeWindowForce();
        this.addUserMessage('Debug window closed', 'info', [], false,  false);
    }

    setAppStatus (appBusy, appStatus){
        if (!appStatus){
            if (appBusy){
                appStatus = 'busy';
            } else {
                appStatus = 'idle';
            }
        }
        appState.status.appBusy = appBusy;
        appState.status.appStatus = appStatus;
    }

    resetAppStatus (){
        this.setAppStatus(false);
    }

    async showModalCloseConfirm (e){
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }

        let modalHelper = this.getHelper('modal');
        appState.modalData.currentModal = modalHelper.getModalObject('closeModal');

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
        appState.modalData.modalVisible = false;
        appState.modalData.modalElement = null;
        if (appState.closeModalResolve && _.isFunction(appState.closeModalResolve)){
            appState.closeModalResolve(true);
        }
    }

    setDynamicAppStateValues () {
        appState.languageData.currentLanguage = this.getConfig('currentLanguage');
        appState.languageData.currentLocale = this.getConfig('currentLocale');
        appState.closeModalResolve = null;
    }

    clearTimeouts (){
        for (let name in this.timeouts){
            clearTimeout(this.timeouts[name]);
        }
    }

    clearIntervals (){
        for (let name in this.intervals){
            clearInterval(this.intervals[name]);
        }
    }

    getHelper(helperName){
        var helper = false;
        if (this.app && this.app.helpers){
            helper = _.get(this.app.helpers, helperName);
            if (!helper){
                helper = _.get(this.app.helpers, helperName + 'Helper');
            }
        }
        if (!helper){
            if (this.helpers){
                helper = _.get(this.helpers, helperName);
                if (!helper){
                    helper = _.get(this.helpers, helperName + 'Helper');
                }
            }
        }
        return helper;
    }

    async getObjMethod(methodString, methodArgs, context, silent){
        var methodChunks = methodString.split('.');
        var targetMethod;
        var methodPath = '';
        var objMethod = false;
        if (methodChunks && methodChunks.length && methodChunks.length > 1){
            targetMethod = _.takeRight(methodChunks);
            methodPath = _.slice(methodChunks, 0, methodChunks.length-1).join('.');
        } else {
            targetMethod = methodString;
        }


        var handlerObj = this.app;
        if (methodPath){
            handlerObj = _.get(handlerObj, methodPath);
        }

        if (handlerObj && handlerObj[targetMethod] && _.isFunction(handlerObj[targetMethod])){
            if (context && _.isObject(context)){
                objMethod = async function() {
                    return await handlerObj[targetMethod].apply(context, methodArgs);
                };
            } else {
                objMethod = async function() {
                    return await handlerObj[targetMethod].apply(handlerObj, methodArgs);
                };
            }
        } else {
            handlerObj = this;
            if (methodPath){
                handlerObj = _.get(handlerObj, methodPath);
            }
            if (handlerObj && handlerObj[targetMethod] && _.isFunction(handlerObj[targetMethod])){
                if (context && _.isObject(context)){
                    objMethod = async function() {
                        return await handlerObj[targetMethod].apply(context, methodArgs);
                    };
                } else {
                    objMethod = async function() {
                        return await handlerObj[targetMethod].apply(handlerObj, methodArgs);
                    };
                }
            } else {
                if (!silent){
                    this.log('Can\'t find object method "{1}"', 'warning', [methodString]);
                }
            }
        }
        return objMethod;
    }

    async callObjMethod(methodString, methodArgs, context){
        var objMethod = await this.getObjMethod(methodString, methodArgs, context);
        if (objMethod && _.isFunction(objMethod)){
            return await objMethod();
        } else {
            return false;
        }
    }

    exitApp(){
        this.windowManager.closeWindow();
    }

    async finalizeLogs(){
        await this.finalizeUserMessageLog();
        await this.finalizeDebugMessageLog();
        return true;
    }

    async finalizeUserMessageLog(){
        if (this.getConfig('debug.debugToFile')){
            let debugLogFile = path.resolve(this.getConfig('debug.debugMessagesFilename'));
            this.log('Finalizing debug message log...', 'info', []);
            let debugLogContents = '[\n' + await this.fileManager.readFileSync(debugLogFile) + '\n]';
            await this.fileManager.writeFileSync(debugLogFile, debugLogContents, {flag: 'w'});
            this.log('Finalized debug message log.', 'info', []);
        }
        return true;
    }

    async finalizeDebugMessageLog(){
        if (this.getConfig('userMessages.userMessagesToFile')){
            let messageLogFile = path.resolve(this.getConfig('userMessages.userMessagesFilename'));
            this.log('Finalizing user message log...', 'info', []);
            let messageLogContents = '[\n' + await this.fileManager.readFileSync(messageLogFile) + '\n]';
            await this.fileManager.writeFileSync(messageLogFile, messageLogContents, {flag: 'w'});
            this.log('Finalized user message log...', 'info', []);
        }
        return true;
    }
    getAppState () {
        var win = nw.Window.get().window;
        var appStateFile;
        var appAppState;
        var initialAppState;
        if (win && win.appState){
            return win.appState;
        } else {
            initialAppState = require('./appState').appState;
            appStateFile = path.resolve('./app/js/appState');
            try {
                appAppState = require(appStateFile).appState;
                initialAppState = this.mergeDeep(initialAppState, appAppState);
            } catch (ex) {
                console.error(ex);
            }

            if (win){
                win.appState = initialAppState;
            }
            return initialAppState;
        }
    }

    mergeDeep (){
        var destination = arguments[0];
        var sources = Array.prototype.slice.call(arguments, 1);
        var result = _.cloneDeep(destination);

        for (let i=0; i < sources.length; i++){
            var source = sources[i];
            var destinationKeys = _.keys(result);
            var sourceKeys = _.keys(source);
            var newKeys = _.difference(sourceKeys, destinationKeys);
            var oldKeys = _.intersection(sourceKeys, destinationKeys);

            for (let j=0; j<newKeys.length; j++){
                result[newKeys[j]] = _.cloneDeep(source[newKeys[j]]);
            }

            for (let j=0; j<oldKeys.length; j++){
                if (_.isArray(source[oldKeys[j]])){
                    result[oldKeys[j]] = _.concat(result[oldKeys[j]], source[oldKeys[j]]);
                } else if (_.isObject(source[oldKeys[j]])){
                    result[oldKeys[j]] = this.mergeDeep(result[oldKeys[j]], source[oldKeys[j]]);
                } else if (_.isFunction(source[oldKeys[j]])){
                    console.log('func');
                } else {
                    result[oldKeys[j]] = _.cloneDeep(source[oldKeys[j]]);
                }
            }

        }
        return result;
    }

    async wait(duration){
        this.log('Waiting {1} ms', 'debug', [duration]);
        var returnPromise = new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, duration);
        });
        return returnPromise;
    }

    async nextTick (){
        var returnPromise = new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, 0);
        });
        return returnPromise;
    }

    async onNextTick(callable){
        await this.nextTick();
        callable();
    }

    async getAppDir(){
        let utilHelper = this.getHelper('util');
        let appDir;
        let processPath = path.dirname(process.execPath);
        let workingDir = path.resolve('./');

        if (utilHelper.isWindows()){
            if (process.execPath.match(/nw\.exe/)){
                appDir = path.join(workingDir, 'app');
            } else {
                appDir = processPath;
            }
        } else if (utilHelper.isMac()){
            if (process.execPath.match(/nwjs\sHelper$/)){
                appDir = path.join(workingDir, 'app');
            } else {
                appDir = processPath;
            }
        }

        return appDir;
    }

}
exports.AppWrapper = AppWrapper;