/**
 * @fileOverview AppWrapper class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

const _ = require('lodash');
const os = require('os');
const fs = require('fs');
const path = require('path');

const AppBaseClass = require('./lib/appBase').AppBaseClass;
const AppTranslations = require('./lib/appTranslations').AppTranslations;
const WindowManager = require('./lib/windowManager').WindowManager;
const FileManager = require('./lib/fileManager').FileManager;
const AppConfig = require('./lib/appConfig').AppConfig;

let App;

/**
 * A "wrapper" object for nw-skeleton based apps
 *
 * @class
 * @extends {appWrapper.AppBaseClass}
 * @memberOf appWrapper
 *
 * @property {App}              app                 Property that holds reference to App class instance
 * @property {Object}           helpers             Object that contains helper instances by helper names
 * @property {WindowManager}    windowManager       Instance of WindowManager class
 * @property {FileManager}      fileManager         Instance of FileManager class
 * @property {AppConfig}        appConfig           Instance of AppConfig class
 * @property {AppTranslations}  appTranslations     Instance of AppTranslations class
 * @property {window}           debugWindow         Reference to debug window 'window' object (for main app window)
 * @property {window}           mainWindow          Reference to main window 'window' object (for debug app window)
 * @property {Object}           initialAppConfig    Object that stores initial app config that wrapper was initialized with
 * @property {Function}         noop                Reference to empty function (_.noop)
 */
class AppWrapper extends AppBaseClass {

    /**
     * Creates appWrapper instance using initial config object
     *
     * @constructor
     * @param  {Object} initialAppConfig Initial config object
     * @return {AppWrapper}              Instance of AppWrapper class
     */
    constructor (initialAppConfig) {
        super();

        this.needsConfig = false;
        this.app = null;
        this.helpers = {};
        this.windowManager = null;
        this.fileManager = null;
        this.appConfig = null;

        let isDebugWindow = false;
        if (_.isUndefined(initialAppConfig) || !_.isObject(initialAppConfig)){
            initialAppConfig = {};
        } else {
            if (initialAppConfig && initialAppConfig.isDebugWindow){
                isDebugWindow = true;
            }
        }

        initialAppConfig = this.getInitialAppConfig(initialAppConfig);

        if (isDebugWindow){
            initialAppConfig.isDebugWindow = true;
        }

        this.forceDebug = _.get(initialAppConfig, 'debug.forceDebug.AppWrapper') || false;
        this.forceUserMessages = _.get(initialAppConfig, 'userMessages.forceUserMessages.AppWrapper') || false;

        this.boundMethods = {
            cleanup: null,
            onWindowClose: null,
            onDebugWindowClose: null,
            handleMessageResponse: null,
            handleMainMessage: null,
        };

        this.debugWindow = null;
        this.mainWindow = null;

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

    /**
     * Initializes appWrapper and its dependencies, preparing the wrapper
     * to start the application itself
     *
     * @async
     * @return {AppWrapper} Instance of AppWrapper class
     */
    async initialize(){
        let staticFilesHelper;

        await this.initializeAppConfig();
        await super.initialize();

        this.checkDebugWindow();

        await this.initializeFileManager();
        await this.initializeConfig();
        await this.initializeTempDirs();
        await this.initializeLogs();

        this.log('Initializing application wrapper.', 'group', []);

        await this.initializeSystemHelpers();

        staticFilesHelper = this.getHelper('staticFiles');

        await this.loadUserConfig();
        await this.initializeWindowManager();

        if (!await this.setAppInstance()){
            return;
        }

        if (!appState.isDebugWindow) {
            await this.asyncMessage({instruction: 'setConfig', data: {config: appState.config}});
        }

        await this.setDynamicAppStateValues();

        await this.getHelper('theme').initializeThemes();
        await staticFilesHelper.loadJsFiles();

        await this.initializeWrapperHelpers();

        try {
            appState.initializationTime = this.getHelper('format').formatDate(new Date(), {}, true);
            appState.initializationTimeRaw = new Date();
        } catch (ex) {
            console.error(ex);
        }

        await this.loadUserData();

        await staticFilesHelper.loadCssFiles();

        await this.setGlobalKeyHandlers();
        await this.initializeLanguage();
        this.setBaseAppErrorValues();

        await this.processCommandParams();

        await this.setupMenuAndTray();

        this.addWrapperEventListeners();
        await this.initializeApp();

        return this;
    }

    /**
     * Finalizes appWrapper and its dependencies. This method is called once
     * frontend application is created, so code here has all references that
     * are available to the application
     *
     * @async
     * @return {booelan} Result of the wrapper and its dependencies finalization
     */
    async finalize () {
        this.windowManager.showWindow();
        appState.status.appLoaded = true;
        await this.wait(parseInt(parseFloat(this.getHelper('style').getCssVarValue('--long-animation-duration'), 10) * 1000, 10));
        window.feApp.$watch('appState.config', this.appConfig.configChanged.bind(this.appConfig), {deep: true});
        let retValue;
        try {
            retValue = await this.app.finalize();
        } catch (ex) {
            this.log('Error finalizing application - "{1}"', 'error', [ex.stack]);
            this.setAppError('Error finalizing application', '', ex.stack);
        }
        if (retValue){
            appState.status.appInitialized = true;
            appState.status.appReady = true;
        }
        this.log('Initializing application wrapper.', 'groupend', []);
        if (!appState.isDebugWindow){
            this.message({instruction: 'log', data: {type: 'debug', message: 'Application initialized', force: false}});
        }
        return retValue;
    }

    /**
     * Adds event listeners for the AppWrapper instance as well as globalEmitter listeners
     *
     * @return {undefined}
     */
    addWrapperEventListeners() {
        if (!appState.isDebugWindow){
            this.windowManager.win.on('close', this.boundMethods.onWindowClose);
            this.windowManager.win.globalEmitter.on('messageResponse', this.boundMethods.handleMessageResponse);
            this.windowManager.win.globalEmitter.on('asyncMessageResponse', this.boundMethods.handleMessageResponse);
            this.windowManager.win.globalEmitter.on('mainMessage', this.boundMethods.handleMainMessage);
        } else {
            this.windowManager.win.on('close', this.boundMethods.onDebugWindowClose);
        }

    }

    /**
     * Removes event listeners for the AppWrapper instance as well as globalEmitter listeners
     *
     * @return {undefined}
     */
    removeWrapperEventListeners() {
        if (!appState.isDebugWindow){
            this.windowManager.win.removeListener('close', this.boundMethods.onWindowClose);
            this.windowManager.win.globalEmitter.removeListener('messageResponse', this.boundMethods.handleMessageResponse);
            this.windowManager.win.globalEmitter.removeListener('asyncMessageResponse', this.boundMethods.handleMessageResponse);
            this.windowManager.win.globalEmitter.removeListener('mainMessage', this.boundMethods.handleMainMessage);
        } else {
            this.windowManager.win.removeListener('close', this.boundMethods.onDebugWindowClose);
        }

    }

    /**
     * Initializes appConfig object
     *
     * @async
     * @return {undefined}
     */
    async initializeAppConfig () {
        this.appConfig = new AppConfig(this.initialAppConfig);
        await this.appConfig.initialize({silent: true});
    }

    /**
     * Initializes base application config
     *
     * @async
     * @return {undefined}
     */
    async initializeConfig () {
        appState.config = await this.appConfig.initializeConfig();
        await this.initializeLogging();
        await this.appConfig.initializeLogging();
        await this.fileManager.initializeLogging();
    }

    /**
     * Loads user config if present
     *
     * @async
     * @return {undefined}
     */
    async loadUserConfig () {
        appState.config = await this.appConfig.loadUserConfig();
        await this.initializeLogging();
        await this.appConfig.initializeLogging();
        await this.fileManager.initializeLogging();
    }

    /**
     * Initializes fileManager instance
     *
     * @async
     * @return {undefined}
     */
    async initializeFileManager() {
        this.fileManager = new FileManager();
        await this.fileManager.initialize();
    }

    /**
     * Initializes WindowManager instance
     *
     * @async
     * @return {undefined}
     */
    async initializeWindowManager() {
        this.windowManager = new WindowManager();
        await this.windowManager.initialize();
        if (this.getConfig('debug.devTools')){
            this.windowManager.winState.devTools = true;
        } else {
            this.windowManager.winState.devTools = false;
        }
    }

    async setupMenuAndTray(){
        if (!appState.isDebugWindow){
            await this.asyncMessage({instruction: 'initializeTrayIcon', data: {}});
            await this.asyncMessage({instruction: 'initializeAppMenu', data: {}});
            await this.asyncMessage({instruction: 'setupAppMenu', data: {}});
        }
    }


    /**
     * Loads user data to appState if present
     *
     * @async
     * @return {undefined}
     */
    async loadUserData() {
        appState.userData = await this.getHelper('userData').loadUserData();
    }

    setBaseAppErrorValues () {
        if (!appState.appError.title){
            appState.appError.title = this.translate(appState.appError.defaultTitle);
        }
        if (!appState.appError.text){
            appState.appError.text = this.translate(appState.appError.defaultText);
        }
    }

    checkDebugWindow () {
        if (this.initialAppConfig.isDebugWindow){
            appState.isDebugWindow = true;
            delete this.initialAppConfig.isDebugWindow;
            this.mainWindow = window.opener;
        }
    }


    /**
     * Loads language and translation data and initializes language and
     * translation systems used in the app
     *
     * @async
     * @return {Object} Translation data, containing available languages and translations in those langauges
     */
    async initializeLanguage () {
        this.appTranslations = new AppTranslations();
        await this.appTranslations.initialize();
        return await this.appTranslations.initializeLanguage();
    }

    /**
     * Loads and instantiates app instance
     *
     * @async
     * @return {Boolean} Operation result
     */
    async setAppInstance(){
        let result = false;
        let appFilePath;
        appFilePath = path.join(process.cwd(), this.getConfig('appConfig.appFile', this.getConfig('wrapper.appFile')));
        App = await this.fileManager.loadFile(appFilePath, true);
        if (App && App.constructor && _.isFunction(App.constructor)){
            this.app = new App();
            result = true;
        } else {
            throw new Error('Error instantiating app!');
        }
        return result;
    }

    /**
     * Sets global key handler listeners for config global keys
     *
     * @async
     * @return {undefined}
     */
    async setGlobalKeyHandlers() {
        let globalKeyHandlers = this.getConfig('appConfig.globalKeyHandlers');
        if (globalKeyHandlers && globalKeyHandlers.length){
            let keyboardHelper = this.getHelper('keyboard');
            for(let j=0; j<globalKeyHandlers.length; j++){
                keyboardHelper.registerGlobalShortcut(globalKeyHandlers[j]);
            }
        }
    }

    /**
     * Initializes app object
     *
     * @async
     * @return {Boolean} App initialization result
     */
    async initializeApp(){
        let result = true;
        try {
            await this.app.initialize();
            if (!(this.app && this.app.initialized)) {
                result = false;
            }
        } catch (ex) {
            this.log('Error initializing application - "{1}"', 'error', [ex.stack]);
            this.setAppError('Error initializing application', '', ex.stack);
            result = false;
        }
        return result;
    }

    /**
     * Initializes wrapper system helpers
     *
     * @async
     * @return {undefined}
     */
    async initializeSystemHelpers(){
        this.log('Initializing wrapper system helpers', 'group');
        try {
            this.helpers = await this.initializeHelpers(this.getConfig('wrapper.systemHelperDirectories'));
        } catch (ex) {
            this.log('Error initializing wrapper system helpers - "{1}"', 'error', [ex.stack]);
            this.setAppError('Error initializing wrapper system helpers', '', ex.stack);
        }
        this.log('Initializing wrapper system helpers', 'groupend');
    }

    /**
     * Initializes wrapper helpers
     *
     * @async
     * @return {undefined}
     */
    async initializeWrapperHelpers(){
        this.log('Initializing wrapper helpers', 'group');
        try {
            this.helpers = _.merge(this.helpers, await this.initializeHelpers(this.getConfig('wrapper.helperDirectories')));
        } catch (ex) {
            this.log('Error initializing wrapper helpers - "{1}"', 'error', [ex.stack]);
            this.setAppError('Error initializing wrapper helpers', '', ex.stack);
        }
        this.log('Initializing wrapper helpers', 'groupend');
    }

    /**
     * Loads and initializes helpers from directories passed in argument
     *
     * @async
     * @param  {string[]} helperDirs An array of absolute paths where helper files are located
     * @return {Object} An object with all initialized helper instances
     */
    async initializeHelpers(helperDirs){
        let helpers = {};
        let classHelpers = await this.loadHelpers(helperDirs);

        for (let helperIdentifier in classHelpers){
            helpers[helperIdentifier] = new classHelpers[helperIdentifier]();
            if (helpers[helperIdentifier] && !_.isUndefined(helpers[helperIdentifier].initialize) && _.isFunction(helpers[helperIdentifier].initialize)){
                await helpers[helperIdentifier].initialize();
            }
        }

        return helpers;
    }

    /**
     * Loads and helpers from directories passed in argument
     *
     * @async
     * @param  {string[]} helperDirs An array of absolute paths where helper files are located
     * @return {Object} An object with all helper classes
     */
    async loadHelpers (helperDirs) {
        let helpers = {};
        if (!(helperDirs && _.isArray(helperDirs) && helperDirs.length)){
            this.log('No wrapper helper dirs defined', 'warning', []);
            this.log('You should define this in ./config/config.js file under "appConfig.templateDirectories.helperDirectories" variable', 'debug', []);
            helperDirs = [];
        } else {
            this.log('Loading wrapper helpers from {1} directories.', 'group', [helperDirs.length]);
            let currentHelpers;
            for (let i=0; i<helperDirs.length; i++){
                let helperDir = path.resolve(helperDirs[i]);
                currentHelpers = await this.fileManager.loadFilesFromDir(helperDir, /\.js$/, true);
                if (currentHelpers && _.isObject(currentHelpers) && _.keys(currentHelpers).length){
                    helpers = _.merge(helpers, currentHelpers);
                }
            }
            this.log('Loading wrapper helpers from {1} directories.', 'groupend', [helperDirs.length]);
        }

        return helpers;
    }

    /**
     * Generic frontend event listener for calling methods within app scope (but not within current Vue cmponent scope)
     *
     * @async
     * @param  {Event} e  Event that triggered the handler
     * @return {undefined}
     */
    async callViewHandler (e) {
        let target = e.target;
        let eventType = e.type;
        let eventHandlerName = '';
        let dataHandlerAttrName = '';
        let eventTargetAttrName = '';
        let eventTargetInstruction = '';
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

    /**
     * Handler that performs necessary operations when application window gets closed
     *
     * @async
     * @return {undefined}
     */
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
            appState.status.appShuttingDown = true;
            await this.cleanup();
            if (!appState.isDebugWindow){
                this.resetAppError();
                await this.asyncMessage({instruction: 'removeAppMenu', data: {}});
                await this.asyncMessage({instruction: 'removeTrayIcon', data: {}});
                appState.preventClose = false;
                this.windowManager.closeWindowForce();
                await this.finalizeLogs();
            }
        } else {
            return;
        }
    }

    /**
     * Cleanup method - calls cleanup/shutdown methods for all eligible dependencies, cleaning
     * the app state so it can be safely closed
     *
     * @async
     * @return {boolean} Cleanup result
     */
    async cleanup(){
        let utilHelper = this.getHelper('util');
        let returnPromise;
        this.addUserMessage('Performing pre-close cleanup...', 'info', [], false, false);
        let resolveReference;
        returnPromise = new Promise((resolve) => {
            resolveReference = resolve;
        });
        setTimeout(async () => {
            if (this.getConfig('appConfig.disableRightClick') && !this.getConfig('debug.enabled')){
                document.body.removeEventListener('contextmenu', utilHelper.boundMethods.prevent);
            }
            await this.shutdownApp();
            // await this.finalizeLogs();
            this.beforeWindowClose();
            this.windowManager.hideWindow();
            if (window && window.feApp && window.feApp.$destroy && _.isFunction(window.feApp.$destroy)){
                window.feApp.$destroy();
            }
            resolveReference(true);
        }, 200);
        return returnPromise;
    }

    /**
     * Shuts down application, removing menus, tray icons and eventual other functionalities
     * that were initializes upon application start
     *
     * @async
     * @return {boolean} Shutdown result
     */
    async shutdownApp () {
        this.log('Shutting down...', 'group', []);
        if (this.debugWindow && this.debugWindow.getAppWrapper && _.isFunction(this.debugWindow.getAppWrapper)){
            this.debugWindow.getAppWrapper().onDebugWindowClose();
        }
        appState.mainLoaderTitle = this.appTranslations.translate('Please wait while application shuts down...');
        appState.status.appShuttingDown = true;
        this.addUserMessage('Shutting down...', 'info', [], true, false, true, false);
        if (this.app && this.app.shutdown && _.isFunction(this.app.shutdown)){
            await this.app.shutdown();
        }
        this.clearTimeouts();
        this.clearIntervals();
        await this.fileManager.unwatchAllFiles();
        await this.fileManager.unwatchAll();
        this.addUserMessage('Shutdown complete.', 'info', [], true, false, true, true);
        this.log('Shutting down...', 'groupend', []);
        appState.status.appLoaded = false;
        await this.wait(appState.config.longPauseDuration);
        return true;
    }

    /**
     * Handler that performs necessary operations before application window gets closed
     *
     * @return {undefined}
     */
    beforeWindowClose () {
        this.removeWrapperEventListeners();
        this.removeBoundMethods();
    }

    /**
     * Handler for changing current application language
     *
     * @param  {string} selectedLanguageName Name of new app language
     * @param  {Object} selectedLanguage     Object representing new app language
     * @param  {string} selectedLocale       Locale of new app language
     * @param  {boolean} skipOtherWindow     Flag that triggers language change in other app windows (if any)
     * @return {boolean}                     Result of app language change
     */
    changeLanguage (selectedLanguageName, selectedLanguage, selectedLocale, skipOtherWindow) {
        return this.appTranslations.changeLanguage(selectedLanguageName, selectedLanguage, selectedLocale, skipOtherWindow);
    }

    /**
     * Handler that is triggered before application window is reloaded (available only with debug enabled)
     *
     * @async
     * @return {undefined}
     */
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
            appState.status.appShuttingDown = true;
            await this.cleanup();
            if (!appState.isDebugWindow){
                this.resetAppError();
                await this.finalizeLogs();
                this.windowManager.reloadWindow(null, true);
            }
        } else {
            return;
        }
    }

    /**
     * Handler that is triggered before application debug window is reloaded (available only with debug enabled)
     *
     * @async
     * @return {undefined}
     */
    async onDebugWindowUnload (){
        this.windowManager.win.removeListener('close', this.boundMethods.onDebugWindowClose);
    }

    /**
     * Handler that is triggered before application window is closed (available only with debug enabled)
     *
     * @async
     * @return {undefined}
     */
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

    /**
     * Helper function to set app status variables in app state
     *
     * @param {boolean} appBusy  Flag that indicates whether entire app should be considered as 'busy'
     * @param {string} appStatus String that indicates current app status (for display in app header live info component)
     * @return {undefined}
     */
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

    /**
     * Resets app status to not busy/idle state
     *
     * @return {undefined}
     */
    resetAppStatus (){
        this.setAppStatus(false);
    }

    /**
     * Placeholder method that handles modal confirm action
     *
     * @param  {Event} e Optional event passed to method
     * @return {mixed} Return value depends on particular confirm modal handler method
     */
    confirmModalAction (e) {
        this.log('Calling appWrapper confirmModalAction', 'info', []);
        return this._confirmModalAction(e);
    }

    /**
     * Placeholder method that handles modal cancel/close action
     *
     * @param  {Event} e Optional event passed to method
     * @return {mixed} Return value depends on particular cancel/close modal handler method
     */
    cancelModalAction (e) {
        this.log('Calling appWrapper cancelModalAction', 'info', []);
        return this._cancelModalAction(e);
    }

    /**
     * Internal method that is overwritten when particular modal is opened.
     * Overwritten method contains all logic for modal confirmation
     *
     * @param  {Event} e Optional event passed to method
     * @return {mixed} Return value depends on particular confirm modal handler method
     */
    _confirmModalAction (e) {
        this.log('Calling appWrapper _confirmModalAction', 'info', []);
        return this.__confirmModalAction(e);
    }

    /**
     * Internal method that is overwritten when particular modal is opened.
     * Overwritten method contains all logic for modal cancelling or closing
     *
     * @param  {Event} e Optional event passed to method
     * @return {mixed} Return value depends on particular cancel/close modal handler method
     */
    _cancelModalAction (e) {
        this.log('Calling appWrapper _cancelModalAction', 'info', []);
        return this.__cancelModalAction(e);
    }


    /**
     * Default confirm modal action - do not change
     *
     * @param  {Event} e Optional event passed to method
     * @return {undefined}
     */
    __confirmModalAction (e) {
        this.log('Calling appWrapper __confirmModalAction', 'info', []);
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        if (!appState.modalData.currentModal.busy){
            this.getHelper('modal').closeCurrentModal();
        }
    }

    /**
     * Default cancel/close modal action - do not change
     *
     * @param  {Event} e Optional event passed to method
     * @return {undefined}
     */
    __cancelModalAction (e) {
        this.log('Calling appWrapper __cancelModalAction', 'info', []);
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        if (!appState.modalData.currentModal.busy){
            this.getHelper('modal').closeCurrentModal();
        }
    }

    /**
     * Sets dynamic (calculated) appState values (mainly language related)
     *
     * @async
     * @return {undefined}
     */
    async setDynamicAppStateValues () {
        appState.languageData.currentLanguageName = this.getConfig('currentLanguageName');
        appState.languageData.currentLanguage = this.getConfig('currentLanguage');
        appState.languageData.currentLocale = this.getConfig('currentLocale');
        appState.platformData = this.getPlatformData();
        appState.appDir = this.getAppDir();
        appState.manifest = require(path.join(appState.appDir, '../package.json'));
        appState.wrapperManifest = require(path.join(appState.appDir, '../node_modules/nw-skeleton/package.json'));
        appState.appRootDir = path.join(appState.appDir, '../');
    }

    /**
     * Returns instance of helper object based on passed parameter (or false if helper can't be found)
     *
     * @param  {string} helperName Name of the helper
     * @return {Object}            Instance of the helper object (or false if helper can't be found)
     */
    getHelper(helperName){
        let helper = false;
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

    /**
     * Finds and returns method of the object based on passed parameters
     *
     * @async
     * @param  {string} methodString String that represents method path (i.e. 'app.appObject.method')
     * @param  {array}  methodArgs   An array of arguments to be applied to the returned method reference
     * @param  {Object} context      Context that will be applied as 'this' to returned method reference
     * @param  {boolean} silent      Flag to control logging output
     * @return {Function}            Reference to required method with context and arguments applied (or false if no method is found)
     */
    async getObjMethod(methodString, methodArgs, context, silent){
        let methodChunks = methodString.split('.');
        let targetMethod;
        let methodPath = '';
        let objMethod = false;
        if (methodChunks && methodChunks.length && methodChunks.length > 1){
            targetMethod = _.takeRight(methodChunks);
            methodPath = _.slice(methodChunks, 0, methodChunks.length-1).join('.');
        } else {
            targetMethod = methodString;
        }


        let handlerObj = this.app;
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

    /**
     * Finds and calls method of the object based on passed parameters
     *
     * @async
     * @param  {string} methodString String that represents method path (i.e. 'app.appObject.method')
     * @param  {array}  methodArgs   An array of arguments to be applied to the returned method reference
     * @param  {Object} context      Context that will be applied as 'this' to returned method reference
     * @return {mixed}               Method return value or false if no method found
     */
    async callObjMethod(methodString, methodArgs, context){
        let objMethod = await this.getObjMethod(methodString, methodArgs, context);
        if (objMethod && _.isFunction(objMethod)){
            return await objMethod();
        } else {
            return false;
        }
    }

    /**
     * Exits the app, closing app window
     *
     * @param {Boolean} force Force window closing
     * @return {undefined}
     */
    exitApp(force){
        if (force === true){
            this.windowManager.closeWindowForce();
        } else {
            this.windowManager.closeWindow();
        }
    }

    /**
     * Finalizes log files if logging to file is enabled
     *
     * @async
     * @return {boolean} Result of log finalizing
     */
    async finalizeLogs(){
        await this.finalizeUserMessageLog();
        await this.finalizeDebugMessageLog();
        return true;
    }


    /**
     * Initializes user message log file if user message logging to file is enabled
     *
     * @async
     * @return {boolean} Result of log initialization
     */
    async initializeUserMessageLog(){
        if (this.getConfig('userMessages.userMessagesToFile')){
            let userMessageFilePath = this.getUserMessageFilePath();
            if (!await this.fileManager.isFile(userMessageFilePath) || !this.getConfig('userMessages.userMessagesToFileAppend')) {
                this.fileManager.createDirFileRecursive(userMessageFilePath);
            } else if (this.getConfig('userMessages.userMessagesToFileAppend')) {
                let messageLogFile = path.resolve(userMessageFilePath);
                let messageLogContents = await this.fileManager.readFileSync(messageLogFile);
                if (messageLogContents){
                    messageLogContents = messageLogContents.replace(/\n?\[\n/g, '');
                    messageLogContents = messageLogContents.replace(/\n\],?\n/g, ',');
                    messageLogContents = messageLogContents.replace(/,+/g, ',');
                    await this.fileManager.writeFileSync(messageLogFile, messageLogContents, {flag: 'w'});
                }
            }
        }
        return true;
    }

    /**
     * Initializes debug log file if debug logging to file is enabled
     *
     * @async
     * @return {boolean} Result of log finalizing
     */
    async finalizeUserMessageLog(){
        if (this.getConfig('userMessages.userMessagesToFile')){
            let userMessageFilePath = this.getUserMessageFilePath();
            let messageLogFile = path.resolve(userMessageFilePath);
            let messageLogContents = '[\n' + await this.fileManager.readFileSync(messageLogFile) + '\n]\n';
            messageLogContents = messageLogContents.replace(/\n,\n/g, '\n');
            await this.fileManager.writeFileSync(messageLogFile, messageLogContents, {flag: 'w'});
            // this.log('Finalized user message log...', 'info', []);
        }
        return true;
    }

    /**
     * Initializes user and debug messag logs, checking and creating logs files and dirs if necessary
     *
     * @async
     * @return {Boolean} Result of logs initialization
     */
    async initializeLogs () {
        let result = true;
        result = result && await this.initializeDebugMessageLog();
        result = result && await this.initializeUserMessageLog();
        return result;
    }

    /**
     * Initializes debug message log file if debug message logging to file is enabled
     *
     * @async
     * @return {boolean} Result of log initialization
     */
    async initializeDebugMessageLog(){
        if (this.getConfig('debug.debugToFile')){
            let debugMessageFilePath = this.getDebugMessageFilePath();
            if (!await this.fileManager.isFile(debugMessageFilePath) || !this.getConfig('debug.debugToFileAppend')) {
                this.fileManager.createDirFileRecursive(debugMessageFilePath);
            } else if (this.getConfig('debug.debugToFileAppend')) {
                let debugLogFile = path.resolve(debugMessageFilePath);
                let debugLogContents = await this.fileManager.readFileSync(debugLogFile);
                if (debugLogContents){
                    debugLogContents = debugLogContents.replace(/\n?\[\n/g, '');
                    debugLogContents = debugLogContents.replace(/\n\],?\n/g, ',');
                    debugLogContents = debugLogContents.replace(/,+/g, ',');
                    await this.fileManager.writeFileSync(debugLogFile, debugLogContents, {flag: 'w'});
                }
            }
        }
        return true;
    }

    /**
     * Finalizes debug log file if debug logging to file is enabled
     *
     * @async
     * @return {boolean} Result of log finalizing
     */
    async finalizeDebugMessageLog(){
        if (this.getConfig('debug.debugToFile')){
            let debugMessageFilePath = this.getDebugMessageFilePath();
            let debugLogFile = path.resolve(debugMessageFilePath);
            let debugLogContents = '[\n' + await this.fileManager.readFileSync(debugLogFile) + '\n]\n';
            debugLogContents = debugLogContents.replace(/\n,\n/g, '\n');
            await this.fileManager.writeFileSync(debugLogFile, debugLogContents, {flag: 'w'});
        }
        return true;
    }

    /**
     * Returns appState object if exists, initializing it and returning it if it doesn't
     *
     * @return {Object} appState object
     */
    getAppState () {
        let win = nw.Window.get().window;
        let appStateFile;
        let appAppState;
        let initialAppState;
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

    /**
     * Helper method for deep object merging
     *
     * First passed parameter is destination object, all other parameters are source
     * objects that will be merged with destination clone.
     * This method does NOT mutate original object.
     *
     * @return {Object} Result destination object with all source object values merged
     */
    mergeDeep (){
        let destination = arguments[0];
        let sources = Array.prototype.slice.call(arguments, 1);
        let result = _.cloneDeep(destination);

        for (let i=0; i < sources.length; i++){
            let source = sources[i];
            let destinationKeys = _.keys(result);
            let sourceKeys = _.keys(source);
            let newKeys = _.difference(sourceKeys, destinationKeys);
            let oldKeys = _.intersection(sourceKeys, destinationKeys);

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

    /**
     * Helper method that stops execution for time determined by passed parameter
     *
     * @async
     * @param  {Integer} duration Pause duration in milliseconds
     * @return {boolean}      Result of waiting (always true)
     */
    async wait(duration){
        if (this.getConfig('debug.enabled')){
            this.log('Waiting {1} ms', 'debug', [duration]);
            let returnPromise = new Promise((resolve) => {
                setTimeout(() => {
                    resolve(true);
                }, duration);
            });
            return returnPromise;
        } else {
            return true;
        }
    }

    /**
     * Helper methods that waits for process.nexTick to happen before allowing
     * code execution
     *
     * @async
     * @return {boolean} Result of waiting for nextTick (always true)
     */
    async nextTick (){
        let returnPromise = new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, 0);
        });
        return returnPromise;
    }

    /**
     * Helper methods that calls function passed in argument upon process.nextTick
     *
     * @async
     * @param  {function} callable Function that will be called after nextTick
     * @return {mixed}             Value that called function returns
     */
    async onNextTick(callable){
        await this.nextTick();
        return callable();
    }

    /**
     * Determines and returns absolute path to app directory.
     * Takes into consideration OS platform and way that app is
     * being run (whether by calling nwjs or running finished packaged app)
     *
     * @return {string} Absolute path to app directory
     */
    getAppDir(){
        let appDir;
        let processPath = path.dirname(process.execPath);
        let workingDir = path.resolve('./');

        if (this.isWindows()){
            if (process.execPath.match(/nw\.exe/)){
                appDir = path.join(workingDir, 'app');
            } else {
                appDir = processPath;
            }
        } else if (this.isMac()){
            if (process.execPath.match(/nwjs\sHelper$/)){
                appDir = path.join(workingDir, 'app');
            } else {
                appDir = processPath;
            }
        }
        return appDir;
    }

    /**
     * Handles message responses from main script
     *
     * @param  {Object} messageData Message response data
     * @return {undefined}
     */
    handleMessageResponse (messageData) {
        if (messageData){
            this.messageResponseLog(messageData);
            let messageIdentifierChunks = [];
            if (messageData.instruction){
                messageIdentifierChunks.push(messageData.instruction);
            }
            if (messageData.uuid){
                messageIdentifierChunks.push(messageData.uuid);
            }
            let messageType = 'Message ';
            if (messageData._async_){
                messageType = 'Async message ';
            }
            if (messageData._result_){
                this.log(messageType + ' "{1}" succeeded', 'info', [messageIdentifierChunks.join(' - ')]);
            } else {
                this.log(messageType + ' "{1}" failed', 'error', [messageIdentifierChunks.join(' - ')]);
            }
            this.log(messageData, 'debug', []);
            this.log(messageData, 'debug', []);
        } else {
            this.log('Message failed - no message data returned', 'error', []);
        }
    }

    /**
     * Logs eventual user and debug messages and displays eventual notifications from message response
     *
     * @param  {Object} messageData Message response data
     * @return {undefined}
     */
    messageResponseLog (messageData) {
        if (messageData._messages_ && _.isArray(messageData._messages_)){
            messageData._messages_.forEach( (message) => {
                let msgMessage = message.message || '';
                let msgType = message.type || 'info';
                let msgData = message.data || [];
                let msgForce = message.force || false;
                if (msgMessage){
                    this.log(msgMessage, msgType, msgData, msgForce);
                }
            });
        }
        if (messageData._userMessages_ && _.isArray(messageData._userMessages_)){
            messageData._userMessages_.forEach( (message) => {
                let msgMessage = message.message || '';
                let msgType = message.type || 'info';
                let msgData = message.data || [];
                let msgForce = message.force || false;
                if (msgMessage){
                    this.addUserMessage(msgMessage, msgType, msgData, false, true, msgForce);
                }
            });
        }
        if (messageData._notifications_ && _.isArray(messageData._notifications_)){
            messageData._notifications_.forEach( (message) => {
                let msgMessage = message.message || '';
                let msgType = message.type || 'info';
                let msgData = message.data || [];
                if (msgMessage){
                    this.addNotification(msgMessage, msgType, msgData, true);
                }
            });
        }
    }


    /**
     * Handles messages from main script
     *
     * @param  {Object} data Message data
     * @return {undefined}
     */
    handleMainMessage (data){
        if (data && data.instruction){
            if (data.instruction == 'callMethod' && data.data && data.data.method){
                let args = data.data.arguments;
                if (!args){
                    args = [];
                }
                this.callObjMethod(data.data.method, args, this);
            }
        }
    }

    /**
     * Opens app info modal
     *
     * @return {undefined}
     */
    showAppInfo (){
        let modalOptions = {
            title: this.appTranslations.translate('Application info'),
            confirmButtonText: this.appTranslations.translate('Close'),
            showCancelButton: false,
        };
        this.getHelper('modal').openModal('appInfoModal', modalOptions);
    }

    /**
     * Process eventual command line params
     *
     * @async
     * @return {undefined}
     */
    async processCommandParams () {
        let utilHelper = this.getHelper('util');
        await utilHelper.executeCommandParams(this.getConfig('wrapper.commandParamsMap'));
    }

    /**
     * Command param handler for --reset param - resets app config, data or both
     *
     * @async
     * @param  {string} reset String that determines what to reset
     * @return {undefined}
     */
    async dataReset(reset){
        let userDataHelper = this.getHelper('userData');
        if (reset == 'config') {
            await this.appConfig.clearUserConfig(true);
            this.log('Config data reset', 'info', [], true);
            this.message({instruction:'log', data: {message: 'Config data reset', force: true}});
            this.exitApp(true);
        } else if (reset == 'data') {
            await userDataHelper.clearUserData();
            appState.userData = {};
            this.log('User data reset', 'info', [], true);
            this.message({instruction:'log', data: {message: 'User data reset', force: true}});
            this.exitApp(true);
        } else if (reset == 'all') {
            await this.appConfig.clearUserConfig(true);
            await userDataHelper.clearUserData();
            appState.userData = {};
            this.log('All data reset', 'info', [], true);
            this.message({instruction:'log', data: {message: 'User and config data reset', force: true}});
            this.exitApp(true);
        } else {
            this.stdLogLine('App reset parameter "' + reset + '" not recognized, please use either "data", "config" or "all"');
            this.exitApp(true);
        }
    }

    /**
     * Command param --help handler - prints command params info to stdout and exits app
     *
     * @return {undefined}
     */
    showCommandParamsHelp () {
        let colors = this.getConfig('stdoutColors');
        let tabSize = 8;
        let paramData = [];
        let longestParamNameLength = 0;
        let paramsMap = _.concat(appState.config.wrapper.commandParamsMap, appState.config.appConfig.commandParamsMap);
        for (let i=0; i<paramsMap.length; i++){
            let paramMap = paramsMap[i];
            let paramName = paramMap.name;
            let paramNameLength = paramMap.name.length + 6;
            if (paramMap.value){
                paramName += colors.reset + '=' + colors.gray + 'value' + colors.reset;
            } else {
                paramName += '      ';
            }
            if (longestParamNameLength < paramNameLength){
                longestParamNameLength = paramNameLength;
            }
            let paramDescription = paramMap.description || 'No description';
            paramData.push({
                paramDescription: paramDescription,
                paramName: paramName,
                nameLength: paramNameLength
            });
        }
        let mostTabs = parseInt((longestParamNameLength / tabSize), 10) + 1;

        let helpText = '\n\nUsage: ' + colors.gray + 'command ' + colors.reset + ' [' + colors.yellow + 'params' + colors.reset + ']\n';
        helpText += '    Available command params:\n';
        for (let i=0; i<paramData.length; i++){
            let tabCount = mostTabs - (parseInt((paramData[i].nameLength / tabSize), 10) - 1);
            let tabs = new Array(tabCount).join('\t');
            helpText += '\t' + colors.yellow + paramData[i].paramName +  colors.reset + tabs + paramData[i].paramDescription + '\n';
        }
        this.stdLog(helpText);
        this.exitApp(true);
    }

    /**
     * Returns platform data for current platform
     *
     * @return {Object} Platform data
     */
    getPlatformData (){
        let name = os.platform();
        let platform = {
            isLinux: false,
            isMac: false,
            isWindows: false,
            isWindows8: false,
            version: os.release(),
            userInfo: os.userInfo(),
        };

        if(name === 'darwin'){
            platform.name = 'mac';
            platform.isMac = true;
        } else if(name === 'linux'){
            platform.name = 'linux';
            platform.isLinux = true;
        } else {
            platform.name = 'windows';
            platform.isWindows = true;
        }

        platform.is64Bit = os.arch() === 'x64' || process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432');

        return {
            platform: platform,
            versions: process.versions
        };
    }

    /**
     * Checks whether current platform is mac
     *
     * @return {Boolean} True if mac, false otherwise
     */
    isMac (){
        return this.getPlatformData().platform.isMac;
    }

    /**
     * Checks whether current platform is windows
     *
     * @return {Boolean} True if windows, false otherwise
     */
    isWindows (){
        return this.getPlatformData().platform.isWindows;
    }

    /**
     * Checks whether current platform is linux
     *
     * @return {Boolean} True if linux, false otherwise
     */
    isLinux (){
        return this.getPlatformData().platform.isLinux;
    }

    /**
     * Returns base exec path (root dir of the app)
     *
     * @return {string} Root app dir
     */
    getExecPath () {
        let execPath = nw.__dirname;
        if (this.isMac()){
            if (execPath.match(/app\.nw$/)){
                execPath = path.join(execPath, '../../../..');
            }
        }
        return execPath;
    }

    /**
     * Loads config overrides if present, and returns config object for the app
     *
     * @param  {Object} defaultAppConfig Default application config
     * @return {Object}                  Application config object
     */
    getInitialAppConfig(defaultAppConfig){
        let appStateConfig = require('../../config/appWrapperConfig').config;
        let initialAppConfig = defaultAppConfig;
        if (!(initialAppConfig && (_.isObject(initialAppConfig) && Object.keys(initialAppConfig).length))){
            initialAppConfig = appStateConfig;
        }
        let execPath = this.getExecPath();
        let appDir = this.getAppDir();

        let configFilePath = path.resolve(path.join(execPath, 'config', 'config.js'));
        let configFileExists = fs.existsSync(configFilePath);

        if (!configFileExists){
            configFilePath = path.resolve(path.join(execPath, 'config.js'));
            configFileExists = fs.existsSync(configFilePath);
        }

        if (!configFileExists){
            configFilePath = path.join(appDir, '../config/config.js');
            configFileExists = fs.existsSync(configFilePath);
        }

        if (configFileExists){
            let initialConfigData;
            try {
                initialConfigData = require(configFilePath);
                initialAppConfig = this.mergeDeep({}, initialAppConfig, initialConfigData.config);
            } catch (ex) {
                console.error(ex);
            }
        }
        return initialAppConfig;
    }

    /**
     * Initializes temp dirs, creating them if necessary
     *
     * @async
     * @return {undefined}
     */
    async initializeTempDirs () {
        let tmpDataDir = this.getConfig('appConfig.tmpDataDir');
        if (tmpDataDir){
            tmpDataDir = path.resolve(tmpDataDir);
            await this.fileManager.createDirRecursive(tmpDataDir);
        }
    }
}
exports.AppWrapper = AppWrapper;



/**
 * @namespace
 * @name mainScript
 * @description mainScript mainScript namespace
 */

/**
 * @namespace
 * @name appWrapper
 * @description appWrapper appWrapper namespace
 */

/**
 * @namespace
 * @name appWrapper.helpers
 * @description appWrapper.helpers appWrapper.helpers namespace
 */

/**
 * @namespace
 * @name appWrapper.helpers.systemHelpers
 * @description appWrapper.helpers.systemHelpers appWrapper.helpers.systemHelpers namespace
 */

/**
 * @namespace
 * @name components
 * @description components components namespace
 */

/**
 * @namespace
 * @name directives
 * @description directives directives namespace
 */

/**
 * @namespace
 * @name filters
 * @description filters filters namespace
 */

/**
 * @namespace
 * @name mixins
 * @description mixins mixins namespace
 */