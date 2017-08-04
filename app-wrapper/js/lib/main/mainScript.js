/**
 * @fileOverview MainScript class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.2.1
 */

const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');
const MainBaseClass = require('./mainBase').MainBaseClass;

const MenuHelper = require('./menuHelper').MenuHelper;
const MainMessageHandlers = require('./mainMessageHandlers').MainMessageHandlers;
const MainAsyncMessageHandlers = require('./mainAsyncMessageHandlers').MainAsyncMessageHandlers;

/**
 * A Utility class for handling main script (nwjs bg-script) tasks
 *
 * @class
 * @memberOf mainScript
 * @extends {appWrapper.MainBaseClass}
 * @property {Object}                   config                  App configuration
 * @property {Object}                   inspectOptions          Util.inspect default options
 * @property {Window}                   mainWindow              Reference to main nw.Window
 * @property {Object}                   manifest                Manifest file data
 * @property {MainMessageHandlers}      messageHandlers         Object that handles messages
 * @property {MainAsyncMessageHandlers} asyncMessageHandlers    Object that handles async messages
 * @property {Object}                   boundMethods            Wrapper object for bound method references
 */
class MainScript extends MainBaseClass {

    /**
     * Creates MainScript instance
     *
     * @constructor
     * @return {MainScript}              Instance of MainScript class
     */
    constructor() {
        super();

        this.config = null;

        this.inspectOptions = {
            showHidden: true,
            showProxy: true,
            colors: true
        };
        this.mainWindow = null;
        this.manifest = null;
        this.messageHandlers = null;
        this.asyncMessageHandlers = null;
        this.menuHelper = null;
        this.debugToFileStarted = false;

        let boundMethods = _.cloneDeep(this.boundMethods);

        this.boundMethods = _.extend({
            windowClose: null,
            windowClosed: null,
            windowLoaded: null,
            onMessage: null,
            uncaughtException: null,
            sigInt: null,
            sigTerm: null,
        }, boundMethods);

        this.mainState = {
            menuInitialized: false,
            trayInitialized: false
        };

        return this;

    }

    /**
     * Initializes MainScript using manifest and app config data
     *
     * @async
     * @param  {Object}     options  Object with 'manifest' property containing manifest file data and 'config' property containing config data
     * @return {MainScript}          Instance of MainScript class
     */
    async initialize (options){
        await super.initialize(options);

        if (this.getConfig('main.debug.debugToFile')){
            if (!await this.isFile(this.getConfig('main.debug.debugLogFilename')) || !this.getConfig('main.debug.debugToFileAppend')) {
                this.createDirFileRecursive(this.getConfig('main.debug.debugLogFilename'));
            } else if (this.getConfig('main.debug.debugToFileAppend')) {
                await this.initializeDebugMessageLog();
            }
        }

        this.messageHandlers = new MainMessageHandlers();
        await this.messageHandlers.initialize(options);
        this.asyncMessageHandlers = new MainAsyncMessageHandlers();
        await this.asyncMessageHandlers.initialize(options);
        this.menuHelper = new MenuHelper();
        await this.menuHelper.initialize();
        return this;
    }

    /**
     * Destroys current MainScript class instance
     *
     * @async
     * @return {undefined}
     */
    async destroy () {
        this.removeMainWindowEventListeners();
        this.removeGlobalEmitterEventListeners();
        await super.destroy();
    }

    /**
     * Starts the application
     *
     * @async
     * @return {undefined}
     */
    async start () {
        var returnPromise;
        var resolveReference;
        returnPromise = new Promise((resolve) => {
            resolveReference = resolve;
        });
        nw.Window.open(this.manifest.mainTemplate, this.manifest.window, (win)=>{
            this.mainWindow = win;
            this.addMainWindowEventListeners();
            this.initializeGlobalEmitter();
            resolveReference(true);
        });
        return returnPromise;
    }

    /**
     * Initializes globalEmitter object for communication with the app
     *
     * @async
     * @return {undefined}
     */
    async initializeGlobalEmitter () {
        this.mainWindow.globalEmitter = new EventEmitter();
        this.addGlobalEmitterEventListeners();
    }

    /**
     * Adds event listeners
     *
     * @return {undefined}
     */
    addEventListeners() {
        process.once('uncaughtException', this.boundMethods.uncaughtException);
        process.on('SIGINT', this.boundMethods.sigInt);
        process.on('SIGTERM', this.boundMethods.sigTerm);
    }

    /**
     * Removes event listeners
     *
     * @return {undefined}
     */
    removeEventListeners() {
        process.removeListener('SIGINT', this.boundMethods.sigInt);
        process.removeListener('SIGTERM', this.boundMethods.sigTerm);
    }

    /**
     * Adds main window event listeners
     *
     * @return {undefined}
     */
    addMainWindowEventListeners() {
        this.mainWindow.on('close', this.boundMethods.windowClose);
        this.mainWindow.on('closed', this.boundMethods.windowClosed);
        this.mainWindow.on('loaded', this.boundMethods.windowLoaded);
    }

    /**
     * Removes main window event listeners
     *
     * @return {undefined}
     */
    removeMainWindowEventListeners() {
        this.mainWindow.removeListener('close', this.boundMethods.windowClose);
        this.mainWindow.removeListener('closed', this.boundMethods.windowClosed);
        this.mainWindow.removeListener('loaded', this.boundMethods.windowLoaded);
    }

    /**
     * Adds global emitter event listeners
     *
     * @return {undefined}
     */
    addGlobalEmitterEventListeners() {
        this.mainWindow.globalEmitter.on('message', this.boundMethods.onMessage);
        this.mainWindow.globalEmitter.on('asyncMessage', this.boundMethods.onMessage);
    }

    /**
     * Removes global emitter window event listeners
     *
     * @return {undefined}
     */
    removeGlobalEmitterEventListeners() {
        this.mainWindow.globalEmitter.removeListener('message', this.boundMethods.onMessage);
        this.mainWindow.globalEmitter.removeListener('asyncMessage', this.boundMethods.onMessage);
    }

    /**
     * Handles messages received from the app
     *
     * @param  {Object} data    Data passed with message
     * @return {mixed}          Result of message execution
     */
    onMessage (data) {
        if (data){
            let responseMessage = 'messageResponse';
            let messageType = 'Message';
            if (data._async_){
                responseMessage = 'asyncMessageResponse';
                messageType = 'Async message';
            }
            if (data.instruction && data.uuid){
                let instruction = data.instruction;
                let uuid = data.uuid;
                let result;
                if (data._async_){
                    result = this.asyncMessageHandlers.execute(instruction, uuid, data);
                } else {
                    result = this.messageHandlers.execute(instruction, data);
                }
                if (!result){
                    this.log('{1} "{2}" handler for instruction "{3}" not found!', 'error', [messageType, uuid, instruction]);
                    this.mainWindow.globalEmitter.emit(responseMessage, _.extend(data, {_result_: false}));
                } else {
                    this.log('{1} "{2}" with instruction "{3}" received', 'debug', [messageType, uuid, instruction]);
                    this.log('{1} "{2}" with instruction "{3}" data: {4}', 'debug', [messageType, uuid, instruction, data]);
                }
                return result;
            } else {
                if (!data.instruction){
                    this.log('{1} "{2}" received without instruction!', 'error', [messageType, data.uuid]);
                } else if (!data.uuid) {
                    this.log('{1} with instruction "{2}" received without uuid!', 'error', [messageType, data.instruction]);
                }
                let responseData = {
                    _result_: false
                };
                if (data && _.isObject(data)){
                    responseData = _.extend(data, responseData);
                }
                this.mainWindow.globalEmitter.emit(responseMessage, responseData);
                return false;
            }
        } else {
            this.log('Message received without data!', 'error');
        }
    }

    /**
     * Handler for mainWindow 'closed' event
     *
     * @param  {Event} e        Event that triggered the method
     * @param  {Boolean} noExit Flag to prevent exiting main process
     * @return {undefined}
     */
    async windowClosed (e, noExit) {
        _.noop(e);
        await this.finalizeDebugMessageLog();
        this.log('Main window closed, exiting', 'info');
        if (!noExit){
            process.exit(0);
        }
    }

    /**
     * Handler for mainWindow 'close' event
     *
     * @param  {Event} e        Event that triggered the method
     * @return {undefined}
     */
    async windowClose (e) {
        _.noop(e);
        this.log('Main window closing', 'info');
    }


    /**
     * Handler for main window 'loaded' event
     *
     * @return {undefined}
     */
    windowLoaded () {
        this.log('Main window loaded', 'debug');
    }

    /**
     * Handler for uncaught exceptions
     *
     * @param  {Error} err  Uncaught exception
     * @return {undefined}
     */
    uncaughtException (err) {
        let message = 'EXCEPTION: {1}';
        let data = [];
        if (err.message){
            data[0] = err.message;
        }
        if (err.stack){
            data[0] = err.stack;
        }
        if (!data[0]){
            data[0] = err;
        }
        this.log(message, 'error', data);
        this.mainWindow.window.appState.appError.error = true;
        if (err && err.message){
            this.mainWindow.globalEmitter.emit('mainMessage', {instruction: 'callMethod', data: {method: 'addUserMessage', arguments: [err.message, 'error', [], false, true]}});
        } else {
            this.mainWindow.globalEmitter.emit('mainMessage', {instruction: 'callMethod', data: {method: 'addUserMessage', arguments: ['Main script error occured', 'error', [], false, true]}});
        }

        this.mainWindow.window.appWrapper.exitApp();

        let timeoutDuration = 30000;
        if (this.config && this.config.cancelOperationTimeout){
            timeoutDuration = this.config.cancelOperationTimeout;
        }
        setTimeout(() => {
            this.mainWindow.window.appWrapper.exitApp(true);
        }, timeoutDuration);
    }

    /**
     * Handler for SIGINT signal
     *
     * @param  {Integer} code Optional exit code for the app
     * @return {undefined}
     */
    sigInt (code) {
        if (_.isUndefined(code)){
            code = 4;
        }
        this.log('Caught SIGINT, code: {1}, shutting down.', 'warning', [code], true);
    }

    /**
     * Handler for SIGTERM signal
     *
     * @param  {Integer} code Optional exit code for the app
     * @return {undefined}
     */
    sigTerm (code) {
        if (_.isUndefined(code)){
            code = 0;
        }
        this.log('Caught SIGTERM, code: {1}, shutting down.', 'warning', [code], true);
        if (this.mainWindow && this.mainWindow.window && this.mainWindow.window.appWrapper){
            this.mainWindow.window.appWrapper.exitApp();
        } else {
            process.exit(code);
        }
    }

    /**
     * Sets new config to data from argument
     *
     * @async
     * @param {Object} configData Object with config data
     * @return {undefined}
     */
    async setNewConfig (configData){
        this.log('Setting new config', 'debug');
        this.config = configData;
    }

    /**
     * Initializes debug message log file if debug message logging to file is enabled
     *
     * @async
     * @return {boolean} Result of log initialization
     */
    async initializeDebugMessageLog(){
        if (this.getConfig('main.debug.debugToFile')){
            let debugLogFile = path.resolve(this.getConfig('main.debug.debugLogFilename'));
            let debugLogContents = fs.readFileSync(debugLogFile) + '';
            if (debugLogContents){
                debugLogContents = debugLogContents.replace(/\n?\[\n/g, '');
                debugLogContents = debugLogContents.replace(/\n\],?\n/g, ',\n');
                debugLogContents = debugLogContents.replace(/,+/g, ',');
                fs.writeFileSync(debugLogFile, debugLogContents, {flag: 'w'});
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
        if (this.getConfig('main.debug.debugToFile')){
            let debugLogFile = path.resolve(this.getConfig('main.debug.debugLogFilename'));
            let debugLogContents = '[\n' + fs.readFileSync(debugLogFile) + '\n]\n';
            debugLogContents = debugLogContents.replace(/\n,\n/g, '\n');
            fs.writeFileSync(debugLogFile, debugLogContents, {flag: 'w'});
        }
        return true;
    }
}

exports.MainScript = MainScript;