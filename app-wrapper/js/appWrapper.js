/**
 * @fileOverview AppWrapper class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.1.0
 */

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

const _ = require('lodash');
const path = require('path');

var App;
let BaseClass = require('./base').BaseClass;

var AppTranslations = require('./lib/appTranslations').AppTranslations;
var WindowManager = require('./lib/windowManager').WindowManager;
var FileManager = require('./lib/fileManager').FileManager;

var AppConfig = require('./lib/appConfig').AppConfig;

/**
 * A "wrapper" object for nw-skeleton based apps
 *
 * @class
 * @extends BaseClass
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
class AppWrapper extends BaseClass {

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
            handleMessageResponse: null,
            handleMainMessage: null,
        };

        this.timeouts = {
            cleanupTimeout: null,
            windowCloseTimeout: null,
            modalContentVisibleTimeout: null,
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
        this.appTemplate = '';
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

        var tmpDataDir = this.getConfig('appConfig.tmpDataDir');
        if (tmpDataDir){
            tmpDataDir = path.resolve(tmpDataDir);
            await this.fileManager.createDirRecursive(tmpDataDir);
        }

        this.log('Initializing application.', 'group', []);

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

        App = require(path.join(process.cwd(), this.getConfig('wrapper.appFile'))).App;

        this.app = new App();

        this.helpers = await this.initializeHelpers(this.getConfig('wrapper.systemHelperDirectories'));

        appState.platformData = this.getHelper('util').getPlatformData();

        appState.appDir = await this.getAppDir();
        appState.manifest = require(path.join(appState.appDir, '../package.json'));
        appState.wrapperManifest = require(path.join(appState.appDir, '../node_modules/nw-skeleton/package.json'));
        appState.appRootDir = path.join(appState.appDir, '../');

        this.getHelper('menu').initializeAppMenu();

        await this.helpers.themeHelper.initializeThemes();
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
        if (!appState.appError.title){
            appState.appError.title = this.appTranslations.translate(appState.appError.defaultTitle);
        }
        if (!appState.appError.text){
            appState.appError.text = this.appTranslations.translate(appState.appError.defaultText);
        }

        this.getHelper('menu').initializeTrayIcon();
        if (this.getConfig('debug.devTools')){
            this.windowManager.winState.devTools = true;
        }

        this.addEventListeners();

        if (nw.App.argv && nw.App.argv.length){
            if (_.includes(nw.App.argv, 'resetAll')){
                await this.appConfig.clearUserConfig(true);
                await this.getHelper('userData').clearUserData();
                appState.userData = {};
                this.log('All data reset', 'info', [], true);
                this.exitApp();
                return;
            } else if (_.includes(nw.App.argv, 'resetData')){
                await this.getHelper('userData').clearUserData();
                appState.userData = {};
                this.log('User data reset', 'info', [], true);
                this.exitApp();
                return;
            } else if (_.includes(nw.App.argv, 'resetConfig')){
                await this.appConfig.clearUserConfig(true);
                this.log('Config data reset', 'info', [], true);
                this.exitApp();
                return;
            }
        }

        await this.app.initialize();

        await this.initializeFeApp();

        this.getHelper('menu').setupAppMenu();

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

    /**
     * Finalizes appWrapper and its dependencies. This method is called once
     * frontend application is created, so code here has all references that
     * are available to the application
     *
     * @async
     * @return {booelan} Result of the wrapper and its dependencies finalization
     */
    async finalize () {
        appState.status.appLoaded = true;

        await this.wait(parseInt(parseFloat(this.getHelper('style').getCssVarValue('--long-animation-duration'), 10) * 1000, 10));
        var retValue = await this.app.finalize();
        if (retValue){
            appState.status.appInitialized = true;
            appState.status.appReady = true;
        }
        window.feApp.$watch('appState.config', this.appConfig.configChanged.bind(this.appConfig), {deep: true});
        this.log('Initializing application.', 'groupend', []);
        this.message({instruction: 'log', data: {message: 'Application initialized', force: false}});
        return retValue;
    }

    /**
     * Adds event listeners for the AppWrapper instance
     *
     * @return {undefined}
     */
    addEventListeners() {
        if (!appState.isDebugWindow){
            this.windowManager.win.on('close', this.boundMethods.onWindowClose);
        } else {
            this.windowManager.win.on('close', this.boundMethods.onDebugWindowClose);
        }
        this.windowManager.win.globalEmitter.on('messageResponse', this.boundMethods.handleMessageResponse);
        this.windowManager.win.globalEmitter.on('mainMessage', this.boundMethods.handleMainMessage);
    }

    /**
     * Removes event listeners for the AppWrapper instance
     *
     * @return {undefined}
     */
    removeEventListeners() {
        if (!appState.isDebugWindow){
            this.windowManager.win.removeListener('close', this.boundMethods.onWindowClose);
        } else {
            this.windowManager.win.removeListener('close', this.boundMethods.onDebugWindowClose);
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
     * Loads and initializes helpers from directories passed in argument
     *
     * @async
     * @param  {string[]} helperDirs An array of absolute paths where helper files are located
     * @return {Object} An object with all initialized helper instances
     */
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

    /**
     * Loads and helpers from directories passed in argument
     *
     * @async
     * @param  {string[]} helperDirs An array of absolute paths where helper files are located
     * @return {Object} An object with all helper classes
     */
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

    /**
     * Initializes frontend part of the app, creating Vue instance
     *
     * @async
     * @param {Boolean} noFinalize Flag to prevent finalization (used when reinitializing)
     * @return {Vue} An object representing Vue app instance
     */
    async initializeFeApp(noFinalize){
        this.log('Initializing Vue app...', 'debug', []);
        let utilHelper = this.getHelper('util');
        if (!this.appTemplate){
            this.appTemplate = document.querySelector('.nw-app-wrapper').innerHTML;
        } else {
            document.querySelector('.nw-app-wrapper').innerHTML = this.appTemplate;
        }

        var returnPromise;
        var resolveReference;
        returnPromise = new Promise((resolve) => {
            resolveReference = resolve;
        });

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
                if (!noFinalize){
                    await this.finalize();
                }
                if (appState.isDebugWindow){
                    this.addUserMessage('Debug window application initialized', 'info', [], false,  false);
                } else {
                    if (appState.activeConfigFile && appState.activeConfigFile != '../../config/config.js'){
                        this.addUserMessage('Active config file: "{1}"', 'info', [appState.activeConfigFile], false, false);
                    }
                    this.addUserMessage('Application initialized', 'info', [], false, false);
                }
                resolveReference(window.feApp);
            },
            beforeDestroy: async () => {
                if (this.getConfig('appConfig.disableRightClick') && !this.getConfig('debug.enabled')){
                    document.body.removeEventListener('contextmenu', utilHelper.boundMethods.prevent, false);
                }
            },
            destroyed: async () => {
                this.emit('feApp:destroyed');
            }
        });

        return returnPromise;
    }

    /**
     * Reinitializes frontend app by destroying it and initializing it again
     *
     * @async
     * @return {Vue} An object representing Vue app instance
     */
    async reinitializeFeApp(){
        this.once('feApp:destroyed', async () => {
            window.feApp = null;
            await this.wait(appState.config.shortPauseDuration);
            await this.getHelper('component').initializeComponents();
            await this.initializeFeApp();
            this.getHelper('staticFiles').reloadCss();
        });
        // appState.status.appLoaded = false;
        appState.status.appInitialized = false;
        // appState.status.appReady = false;
        window.getFeApp().$destroy();
    }

    /**
     * Generic frontend event listener for calling methods within app scope (but not within current Vue cmponent scope)
     *
     * @async
     * @param  {Event} e  Event that triggered the handler
     * @return {undefined}
     */
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
            await this.cleanup();
            if (!appState.isDebugWindow){
                appState.appError.error = false;
                this.windowManager.closeWindowForce();
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

    /**
     * Shuts down application, removing menus, tray icons and eventual other functionalities
     * that were initializes upon application start
     *
     * @async
     * @return {boolean} Shutdown result
     */
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
        this.removeEventListeners();
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
            await this.cleanup();
            if (!appState.isDebugWindow){
                appState.appError.error = false;
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
        this.getHelper('modal').closeCurrentModal();
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
        this.getHelper('modal').closeCurrentModal();
    }

    /**
     * Sets dynamic (calculated) appState values (mainly language related)
     *
     * @return {undefined}
     */
    setDynamicAppStateValues () {
        appState.languageData.currentLanguageName = this.getConfig('currentLanguageName');
        appState.languageData.currentLanguage = this.getConfig('currentLanguage');
        appState.languageData.currentLocale = this.getConfig('currentLocale');
    }

    /**
     * Returns instance of helper object based on passed parameter (or false if helper can't be found)
     *
     * @param  {string} helperName Name of the helper
     * @return {Object}            Instance of the helper object (or false if helper can't be found)
     */
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
        var objMethod = await this.getObjMethod(methodString, methodArgs, context);
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
        if (force){
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
     * Finalizes user message log file if user message logging to file is enabled
     *
     * @async
     * @return {boolean} Result of log finalizing
     */
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

    /**
     * Finalizes debug log file if debug logging to file is enabled
     *
     * @async
     * @return {boolean} Result of log finalizing
     */
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

    /**
     * Returns appState object if exists, initializing it and returning it if it doesn't
     *
     * @return {Object} appState object
     */
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
            var returnPromise = new Promise((resolve) => {
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
        var returnPromise = new Promise((resolve) => {
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
     * @async
     * @return {string} Absolute path to app directory
     */
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

    /**
     * Handles message responses from main script
     *
     * @param  {Object} data Message response data
     * @return {undefined}
     */
    handleMessageResponse (data) {
        console.log(data);
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
}
exports.AppWrapper = AppWrapper;