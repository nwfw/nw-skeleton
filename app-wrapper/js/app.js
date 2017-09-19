/**
 * @fileOverview App class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.1.0
 */

const _ = require('lodash');
const path = require('path');

/**
 * AppBaseClass object
 *
 */
const AppBaseClass = require('./lib/appBase').AppBaseClass;

var _appWrapper;
var appState;

/**
 * App class - parent class for nw-skeleton based app instances
 *
 * This class has three methods that are important for application life cycle:
 * <ul>
 * <li>initialize</li>
 * <li>finalize</li>
 * <li>shutdown</li>
 * </ul>
 * All three methods are async, and called from nw-skeleton appWrapper automatically.
 * <p>[Initialize]{@link app.App#initialize} is called first and it loads application helpers, sets application basic data, and finally loads eventual subFiles from configuration, instantiate their classes and (await) call initialize methods on all classes that contain that method.</p>
 * </p>[Finalize]{@link app.App#finalize} is called once both backend and frontend app have been initialized, and it has complete app structure and appState at its disposal. It will also automatically (await) call 'finalize' method on all sub classes that have it.</p>
 * </p>[Shutdown]{@link app.App#shutdown} is called before application window is closed or unloaded and should perform all necessary cleanup operations, remove any event listeners and free any remaining references left over from application usage. This method will also (await) call 'shutdown' method on any sub classes that have that method.</p>
 *
 * @class
 * @extends {appWrapper.AppBaseClass}
 * @memberOf appWrapper
 * @property {Boolean}  initialized     Flag to indicate whether app instance is initialized
 * @property {Boolean}  finalized       Flag to indicate whether app instance is finalized
 * @property {String}   appTemplate     Html contents of main app template
 */
class App extends AppBaseClass {

    /**
     * Creates App instance
     *
     * @constructor
     * @return {App} App of App class
     */
    constructor () {
        super();

        _appWrapper = window.getAppWrapper();
        appState = _appWrapper.getAppState();

        this.forceDebug = false;
        this.forceUserMessages = false;

        this.initialized = false;
        this.finalized = false;
        this.appTemplate = '';

        return this;
    }

    /**
     * Initializes app and its dependencies
     *
     * @async
     * @return {App} App class instance
     */
    async initialize () {
        if (!this.initialized){
            await super.initialize();
            this.addUserMessage('Initializing application', 'info');
            if (!appState.isDebugWindow){
                setTimeout(() => {
                    _appWrapper.resetAppStatus();
                }, 400);
            }

            appState.mainLoaderTitle = _appWrapper.appTranslations.translate('Please wait, initializing application...');

            this.helpers = await _appWrapper.initializeHelpers(this.getConfig('appConfig.helperDirectories'));
            await _appWrapper.wait(appState.config.shortPauseDuration);

            await this.loadSubFiles();
            await this.initializeSubFiles();
            this.initialized = true;
            await this.initializeFeApp();
        }
        return this;
    }

    /**
     * Finalizes app and its subfiles. This method is called once
     * frontend application is created, so code here has all references that
     * are available to the application
     *
     * @async
     * @return {boolean} Finalization result
     */
    async finalize() {
        await _appWrapper.nextTick();
        let returnValue = true;
        this.addUserMessage('Finalizing application', 'debug', []);
        if (!this.finalized){
            if (!appState.isDebugWindow){
                await this.finalizeSubFiles();
            } else {
                returnValue = true;
            }
            this.finalized = true;
            if (returnValue){
                await _appWrapper.wait(appState.config.shortPauseDuration);
            }
        }
        this.addUserMessage('Application finalized.', 'debug', []);
        return returnValue;
    }

    /**
     * Shuts down application and all its dependencies, freeing memory,
     * removing references and preparing for app exit
     *
     * @async
     * @return {boolean} Shutdown result
     */
    async shutdown () {
        let returnValue = true;
        this.addUserMessage('Shutting application down', 'debug', []);
        await this.shutdownSubFiles();
        this.initialized = false;
        this.finalized = false;
        await _appWrapper.wait(appState.config.mediumPauseDuration);
        this.addUserMessage('Application shutdown complete.', 'info', []);
        return returnValue;
    }


    /**
     * Loads application sub files
     *
     * Checks config.appConfig.subFiles array and loads any sub files that are present there.
     * This config property is primarily to be used by app submodules - component modules etc. to allow them to perform necessary operations on application initialization, finalization or shutdown.
     *
     * @async
     * @return {undefined}
     */
    async loadSubFiles (){
        this.appSubFiles = _.uniqWith(this.getConfig('appConfig.appSubFiles'), _.isEqual);
        if (this.appSubFiles && this.appSubFiles.length){
            let subFileCount = this.appSubFiles.length;
            this.log('Loading {1} app sub files', 'group', [subFileCount]);
            for(let i=0; i<this.appSubFiles.length;i++){
                let subFileData = this.appSubFiles[i];
                if (subFileData && _.isObject(subFileData) && subFileData.name && subFileData.className && subFileData.file){
                    try {
                        this.log('Loading app sub file "{1}"', 'debug', [subFileData.file]);
                        global[subFileData.className] = require(path.resolve(subFileData.file))[subFileData.className];
                        this[subFileData.name] = new global[subFileData.className]();
                        this.log('App sub file "{1}" loaded', 'debug', [subFileData.file]);
                    } catch (ex) {
                        this.addUserMessage('Error loading app sub file "{1}" - "{2}"', 'error', [subFileData.file, ex.message]);
                        this.setAppError('Error loading sub class', 'Error loading app sub class file "{1}" - "{2}"', ex.stack, [subFileData.file, ex.message]);
                    }
                }
            }
            this.log('Loading {1} app sub files', 'groupend', [subFileCount]);
        }
    }

    /**
     * Initializes loaded sub files
     *
     * @async
     * @return {undefined}
     */
    async initializeSubFiles(){
        if (this.appSubFiles && this.appSubFiles.length){
            let subFileCount = this.appSubFiles.length;
            this.log('Initializing {1} app sub classes', 'group', [subFileCount]);
            for(let i=0; i<subFileCount;i++){
                let subFileData = this.appSubFiles[i];
                if (this[subFileData.name] && this[subFileData.name].initialize && _.isFunction(this[subFileData.name].initialize)){
                    try {
                        this.addUserMessage('Initializing app sub class "{1}"', 'debug', [subFileData.className], false, false);
                        await this[subFileData.name].initialize();
                        this.addUserMessage('App sub class "{1}" initialized.', 'debug', [subFileData.className], false, false);
                    } catch (ex) {
                        this.addUserMessage('Error initializing app sub class "{1}" - "{2}"', 'error', [subFileData.className, ex.message]);
                        this.setAppError('Error initializing sub class', 'Error initializing app sub class "{1}" - "{2}"', ex.stack, [subFileData.className, ex.message]);
                    }
                }
            }
            this.log('Initializing {1} app sub classes', 'groupend', [subFileCount]);
        }
    }

    /**
     * Finalizes loaded sub files
     *
     * @async
     * @return {undefined}
     */
    async finalizeSubFiles(){
        if (this.appSubFiles && this.appSubFiles.length){
            let subFileCount = this.appSubFiles.length;
            this.log('Finalizing app {1} sub classes', 'group', [subFileCount]);
            for(let i=0; i<subFileCount;i++){
                let subFileData = this.appSubFiles[i];
                if (this[subFileData.name] && this[subFileData.name].finalize && _.isFunction(this[subFileData.name].finalize)){
                    try {
                        this.addUserMessage('Finalizing app sub class "{1}"...', 'debug', [subFileData.className], false, false);
                        await this[subFileData.name].finalize();
                        this.addUserMessage('App sub class "{1}" finalized.', 'debug', [subFileData.className], false, false);
                    } catch (ex) {
                        this.addUserMessage('Error finalizing app sub class "{1}" - "{2}"', 'error', [subFileData.className, ex.message]);
                        this.setAppError('Error finalizing sub class', 'Error finalizing app sub class "{1}" - "{2}"', ex.stack, [subFileData.className, ex.message]);
                    }
                }
            }
            this.log('Finalizing app {1} sub classes', 'groupend', [subFileCount]);
        }
    }

    /**
     * Shuts down loaded sub files
     *
     * @async
     * @return {undefined}
     */
    async shutdownSubFiles(){
        if (this.appSubFiles && this.appSubFiles.length){
            let subFileCount = this.appSubFiles.length;
            this.log('Shutting down {1} app sub classes', 'group', [subFileCount]);
            for(let i=0; i<subFileCount;i++){
                let subFileData = this.appSubFiles[i];
                if (this[subFileData.name] && this[subFileData.name].shutdown && _.isFunction(this[subFileData.name].shutdown)){
                    try {
                        this.log('Shutting down app sub class "{1}"', 'debug', [subFileData.className]);
                        await this[subFileData.name].shutdown();
                        this.log('App sub class "{1}" shutdown complete', 'debug', [subFileData.className]);
                    } catch (ex) {
                        this.log('Error shutting down app sub class "{1}" - "{2}"', 'error', [subFileData.className, ex.message]);
                    }

                }
            }
            this.log('Shutting down {1} app sub classes', 'groupend', [subFileCount]);
        }
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
        let componentHelper = this.getHelper('component');
        if (!this.appTemplate){
            this.appTemplate = document.querySelector('.nw-app-wrapper').innerHTML;
        } else {
            document.querySelector('.nw-app-wrapper').innerHTML = this.appTemplate;
        }

        let returnPromise;
        let resolveReference;
        returnPromise = new Promise((resolve) => {
            resolveReference = resolve;
        });

        window.feApp = new Vue({
            el: '.nw-app-wrapper',
            template: window.indexTemplate,
            data: appState,
            mixins: componentHelper.vueMixins,
            filters: componentHelper.vueFilters,
            components: componentHelper.vueComponents,
            translations: appState.translations,
            mounted: async () => {
                if (this.getConfig('appConfig.disableRightClick') && !this.getConfig('debug.enabled')){
                    document.body.addEventListener('contextmenu', utilHelper.boundMethods.prevent, false);
                }
                this.addUserMessage('Application initialized.', 'info', []);
                if (!noFinalize){
                    await _appWrapper.finalize();
                }
                if (appState.isDebugWindow){
                    this.addUserMessage('Debug window application initialized', 'info', [], false,  false);
                } else {
                    if (appState.activeConfigFile && appState.activeConfigFile != '../../config/config.js'){
                        this.log('Active config file: "{1}"', 'info', [appState.activeConfigFile], true);
                    }
                }

                resolveReference(window.feApp);
            },
            beforeDestroy: async () => {
                if (this.getConfig('appConfig.disableRightClick') && !this.getConfig('debug.enabled')){
                    document.body.removeEventListener('contextmenu', utilHelper.boundMethods.prevent, false);
                }
            },
            destroyed: async () => {
                _appWrapper.emit('feApp:destroyed');
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
        _appWrapper.once('feApp:destroyed', async () => {
            window.feApp = null;
            appState.debugMessages = [];
            appState.allDebugMessages = [];
            appState.userMessages = [];
            appState.allUserMessages = [];
            await _appWrapper.wait(appState.config.shortPauseDuration);
            await _appWrapper.getHelper('component').initializeComponents();
            await this.initializeFeApp();
            this.getHelper('staticFiles').reloadCss();
        });
        appState.status.appInitialized = false;
        window.getFeApp().$destroy();
    }

    /**
     * Local require for loading app modules from appWrapper
     *
     * @param  {string} moduleName Name of module to require
     * @return {Object}            Required module
     */
    localRequire (moduleName){
        return require(moduleName);
    }
}
exports.App = App;