/**
 * @fileOverview MainScript class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.2.0
 */

const _ = require('lodash');
const util = require('util');
const EventEmitter = require('events');

const MainMessageHandlers = require('./mainMessageHandlers').MainMessageHandlers;
const MainAsyncMessageHandlers = require('./mainAsyncMessageHandlers').MainAsyncMessageHandlers;

/**
 * A Utility class for handling main script (nwjs bg-script) tasks
 *
 * @class
 * @memberOf mainScript
 *
 * @property {Object}                   config                  App configuration
 * @property {Object}                   inspectOptions          Util.inspect default options
 * @property {Window}                   mainWindow              Reference to main nw.Window
 * @property {Object}                   manifest                Manifest file data
 * @property {MainMessageHandlers}      messageHandlers         Object that handles messages
 * @property {MainAsyncMessageHandlers} asyncMessageHandlers    Object that handles async messages
 * @property {Object}                   boundMethods            Wrapper object for bound method references
 */
class MainScript {

    /**
     * Creates MainScript instance
     *
     * @constructor
     * @return {MainScript}              Instance of MainScript class
     */
    constructor() {

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

        this.boundMethods = {
            windowClosed: null,
            windowLoaded: null,
            messageReceived: null,
            asyncMessageReceived: null,
            uncaughtException: null,
            printLog: null,
            sigInt: null,
        };

        return this;

    }

    /**
     * Initializes MainScript using manifest and app config data
     *
     * @async
     * @param  {Object}     manifest Manifest file data
     * @param  {Object}     config   App config data
     * @return {MainScript}          Instance of MainScript class
     */
    async initialize (manifest, config){
        this.manifest = manifest;
        this.config = config;

        this.messageHandlers = new MainMessageHandlers();
        this.asyncMessageHandlers = new MainAsyncMessageHandlers();

        this.addBoundMethods();
        this.addEventListeners();
        return this;
    }

    /**
     * Destroys current MainScript class instance
     *
     * @async
     * @return {undefined}
     */
    async destroy () {
        this.removeEventListeners();
        this.removeMainWindowEventListeners();
        this.removeGlobalEmitterEventListeners();
        this.removeBoundMethods();
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
     * Method that sets up this.boundMethods property by binding this objects
     * functions to itself to be used as event listener handlers
     *
     * @return {undefined}
     */
    addBoundMethods () {
        if (this.boundMethods){
            var keys = Object.keys(this.boundMethods);
            for (let i=0; i<keys.length; i++){
                if (this[keys[i]] && _.isFunction(this[keys[i]]) && this[keys[i]].bind && _.isFunction(this[keys[i]].bind)){
                    this.boundMethods[keys[i]] = this[keys[i]].bind(this);
                }
            }
        }
    }

    /**
     * Method that cleans up this.boundMethods property
     * set in this.addBoundMethods method
     *
     * @return {undefined}
     */
    removeBoundMethods () {
        var keys = Object.keys(this.boundMethods);
        for (let i=0; i<keys.length; i++){
            this.boundMethods[keys[i]] = null;
        }
        this.boundMethods = {};
    }

    /**
     * Adds event listeners
     *
     *
     *
     *
     *
     * @return {undefined}
     */
    addEventListeners() {
        process.once('uncaughtException', this.boundMethods.uncaughtException);
        process.on('SIGINT', this.boundMethods.sigInt);
    }

    /**
     * Removes event listeners
     *
     * @return {undefined}
     */
    removeEventListeners() {
        process.removeListener('SIGINT', this.boundMethods.sigInt);
    }

    /**
     * Adds main window event listeners
     *
     * @return {undefined}
     */
    addMainWindowEventListeners() {
        this.mainWindow.on('closed', this.boundMethods.windowClosed);
        this.mainWindow.on('loaded', this.boundMethods.windowLoaded);
    }

    /**
     * Removes main window event listeners
     *
     * @return {undefined}
     */
    removeMainWindowEventListeners() {
        this.mainWindow.removeListener('closed', this.boundMethods.windowClosed);
        this.mainWindow.removeListener('loaded', this.boundMethods.windowLoaded);
    }

    /**
     * Adds global emitter event listeners
     *
     * @return {undefined}
     */
    addGlobalEmitterEventListeners() {
        this.mainWindow.globalEmitter.on('message', this.boundMethods.messageReceived);
        this.mainWindow.globalEmitter.on('asyncMessage', this.boundMethods.asyncMessageReceived);
    }

    /**
     * Removes global emitter window event listeners
     *
     * @return {undefined}
     */
    removeGlobalEmitterEventListeners() {
        this.mainWindow.globalEmitter.removeListener('message', this.boundMethods.messageReceived);
        this.mainWindow.globalEmitter.removeListener('asyncMessage', this.boundMethods.asyncMessageReceived);
    }

    /**
     * Handles messages received from the app
     *
     * @param  {Object} data    Data passed with message
     * @return {mixed}          Result of message execution
     */
    messageReceived (data){
        if (data && data.instruction){
            // this.log('Message received');
            let instruction = data.instruction;
            let messageData = {};
            if (data.data){
                messageData = data.data;
            } else {
                messageData = data;
            }
            return this.messageHandlers.execute(instruction, messageData);
        } else {
            this.doLog('ERROR: Message with no data received');
        }
    }

    /**
     * Handles async messages received from the app
     *
     * @param  {Object} data    Data passed with message
     * @return {mixed}          Result of message execution
     */
    asyncMessageReceived (data){
        if (data && data.instruction && data.uuid){
            // this.log('Async message received, uuid: ' + data.uuid);
            let instruction = data.instruction;
            let uuid = data.uuid;
            let messageData = {};
            if (data.data){
                messageData = data.data;
            } else {
                // messageData = _.omit(data, 'instruction', 'uuid');
                messageData = data;
            }
            return this.asyncMessageHandlers.execute(instruction, uuid, messageData);
        } else {
            this.doLog('ERROR: Async message received without data!');
            return false;
        }
    }

    /**
     * Logs data to console if debug is enabled
     *
     * @return {undefined}
     */
    log () {
        if (this.config && this.config.main && this.config.main.debug){
            this.doLog(arguments);
        }
    }

    /**
     * Logs data to console
     *
     * @return {undefined}
     */
    doLog () {
        let params = [];
        for (let i=0; i<arguments.length; i++){
            let param = [];
            if (_.isObject(arguments[i])){
                for (let name in arguments[i]){
                    param.push(arguments[i][name]);
                }
            } else {
                param = arguments[i];
            }
            params.push(param);
        }
        params = _.flatten(params);

        let formattedParams = _.cloneDeep(params);
        if (formattedParams.length == 1){
            if (_.isString(formattedParams[0])){
                formattedParams = formattedParams[0];
            } else {
                formattedParams = util.inspect(formattedParams[0], this.inspectOptions);
            }
        } else {
            formattedParams = util.inspect(formattedParams, this.inspectOptions);
        }

        let logMethod = this.printLn;
        let clearLastLine = false;
        if (this.manifest['chromium-args'] && this.manifest['chromium-args'].match(/--enable-logging=stderr/)){
            clearLastLine = true;
            logMethod = this.boundMethods.printLog;
        }
        logMethod(formattedParams);
        if (this.config && this.config.main && this.config.main.debugToWindow && this.mainWindow && this.mainWindow.window && this.mainWindow.window.console){
            setTimeout( () => {
                if (clearLastLine){
                    process.stdout.write('\x1B[s');
                }
                this.mainWindow.window.console.log.apply(this.mainWindow.window.console, _.union(['MAINSCRIPT'], params));
                if (clearLastLine){
                    process.stdout.write('\x1B[u');
                    process.stdout.write('\x1B[J');
                }
            }, 0);
        }
    }

    /**
     * Prints message to stdout
     *
     * @param  {string} message Message to print
     * @return {undefined}
     */
    print (message){
        process.stdout.write(message);
    }

    /**
     * Prints message to stdout with newline appended
     *
     * @param  {string} message Message to print
     * @return {undefined}
     */
    printLn (message){
        process.stdout.write(message.replace(/\r?\n?$/, '\n'));
    }

    /**
     * Logs message to console
     *
     * @param  {mixed} message Message to log
     * @return {undefined}
     */
    printLog(message){
        console.log(message);
    }

    /**
     * Handler for mainWindow 'closed' event
     *
     * @param  {Event} e        Event that triggered the method
     * @param  {Boolean} noExit Flag to prevent exiting main process
     * @return {undefined}
     */
    windowClosed (e, noExit) {
        _.noop(e);
        if (!noExit){
            process.exit(0);
        }
    }

    /**
     * Handler for main window 'loaded' event
     *
     * @return {undefined}
     */
    windowLoaded () {
        this.log('Main window loaded');
    }

    /**
     * Handler for uncaught exceptions
     *
     * @param  {Error} err  Uncaught exception
     * @return {undefined}
     */
    uncaughtException (err) {
        this.doLog('EXCEPTION');
        if (err.message){
            this.doLog(err.message);
        }
        if (err.stack){
            this.doLog(err.stack);
        }
        if (!(err.stack || err.message)){
            this.doLog(err);
        }
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
        this.log('Caught SIGINT, code:' + code);
    }
}

exports.MainScript = MainScript;