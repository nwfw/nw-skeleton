/**
 * @fileOverview Base class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.1.0
 */

const _ = require('lodash');
const path = require('path');
const eventEmitter = require('events');

let _appWrapper;
let appState;

/**
 * Base class for extending when creating other app classes
 *
 * @class
 * @memberOf appWrapper
 * @property {boolean}  forceUserMessages   Flag to force user message output
 * @property {boolean}  forceDebug          Flag to force debug message output
 * @property {Object}   boundMethods        Object to hold bound method references for event listeners
 * @property {Object}   timeouts            Object that holds references to this class instance timeouts
 * @property {Object}   intervals           Object that holds references to this class instance intervals
 * @property {boolean}  needsConfig         Flag to indicate whether class instance needs config, triggering warnings if config is not available for the class
 */
class BaseClass extends eventEmitter {

    /**
     * Creates class instance, setting basic properties, and returning the instance itself
     *
     * @constructor
     * @return {BaseClass} Instance of current class
     */
    constructor () {
        super();

        if (window && window.getAppWrapper && _.isFunction(window.getAppWrapper)){
            _appWrapper = window.getAppWrapper();
            appState = _appWrapper.getAppState();
        }
        this.forceUserMessages = false;
        this.forceDebug = false;
        this.boundMethods = {};
        this.needsConfig = true;
        this.timeouts = {};
        this.intervals = {};

        return this;
    }

    /**
     * Initializes current class instance, setting up logging and
     * bound methods to be used in event listeners
     *
     * @async
     * @param {Object} options Initialization options
     * @return {BaseClass} Instance of current class
     */
    async initialize (options) {
        await this.initializeLogging(options);
        this.addBoundMethods();
        if (!(options && options.silent)){
            let className = this.constructor.name;
            this.log('Initialized object "{1}"', 'debug', [className]);
        }
        return this;
    }

    /**
     * Finalizes current class instance, setting up any additional properties
     * etc. Entire app structure, including frontend app is available here
     *
     * @async
     * @return {boolean} Finalizing result
     */
    async finalize () {
        return true;
    }

    /**
     * Determines whether logging for this class is regulated through
     * configuration, setting the logging by it (or warning if there
     * are no configuration settings for this class)
     *
     * @async
     * @param  {object} options Options for logging initialization (currently only 'silent' property is used, determining whether warnings should be printed if no config found)
     * @return {BaseClass}      Instance of the current class
     */
    async initializeLogging(options) {
        let className = this.constructor.name;
        if (appState && appState.config){
            if (appState.config.debug && appState.config.debug.forceDebug){
                if (_.isUndefined(appState.config.debug.forceDebug[className]) && !(options && options.silent)){
                    console.error('Class "' + className + '" has no forceDebug config set!');
                } else {
                    this.forceDebug = _.get(appState.config.debug.forceDebug, className);
                }
            }

            if (appState.config.userMessages && appState.config.userMessages.forceUserMessages){
                if (_.isUndefined(appState.config.userMessages.forceUserMessages[className]) && !(options && options.silent)){
                    console.error('Class "' + className + '" has no forceUserMessages config set!');
                } else {
                    this.forceUserMessages = _.get(appState.config.userMessages.forceUserMessages, className);
                }
            }
        } else {
            if (this.needsConfig && !(options && options.silent)){
                console.warn('Could not get config object (class "' + className + '").');
            }
        }
        return this;
    }

    /**
     * Helper method to get appWrapper instance
     *
     * @return {AppWrapper} An instance of AppWrapper class
     */
    getAppWrapper () {
        return _appWrapper;
    }

    /**
     * Helper method to get appState object
     *
     * @return {object} Current appState object
     */
    getAppState () {
        return appState;
    }

    /**
     * Method that sets up this.boundMethods property by binding this objects
     * functions to itself to be used as event listener handlers
     *
     * @return {undefined}
     */
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

    /**
     * Method that cleans up this.boundMethods property
     * set in this.addBoundMethods method
     *
     * @return {undefined}
     */
    removeBoundMethods () {
        var keys = _.keys(this.boundMethods);
        for (let i=0; i<keys.length; i++){
            this.boundMethods[keys[i]] = null;
        }
        this.boundMethods = {};
    }

    /**
     * Destructor method - cleans up references for this instance
     * freeing memory upon object destruction
     *
     * @return {undefined}
     */
    destroy () {
        this.removeBoundMethods();
    }

    /**
     * Logs debug message if conditions are met
     *
     * Message is being interpolated by replacing placeholders
     * such as '{1}', '{2}' etc. by corresponding values from 'data' argument
     *
     * @async
     * @param  {sting} message  Message to be logged
     * @param  {string} type    Type of log message (debug, info, warning, error, group, groupCollaped, groupend)
     * @param  {array} data     An array of data strings that are to be applied to logging message
     * @param  {boolean} force  Flag to force logging output even if config does not allow it
     * @return {undefined}
     */
    async log(message, type, data, force){

        if (!data){
            data = [];
        }
        if (!type){
            type = 'info';
        }
        if (type == 'delimiter'){
            return;
        }

        if (_.isUndefined(force)){
            force = this.forceDebug;
        }
        let debugEnabled = this.getConfig('debug.enabled', false);
        let debugLevel = this.getConfig('debug.debugLevel', 3);
        let debugLevels = this.getConfig('logger.messageLevels');
        let typeLevel = debugLevels && debugLevels[type] ? debugLevels[type] : 0;

        let doLog = force || false;
        if (!doLog && debugEnabled){
            if (typeLevel >= debugLevel){
                doLog = true;
            }
        }

        let debugMessage = await this.getMessageObject(debugLevel, message, type, data, false, true, force);

        if (doLog){
            this._doLog(debugMessage);
            if (this.getConfig('debug.alwaysTrace')){
                console.trace();
            }
        }
        if (debugMessage && debugMessage.message && this.getConfig('debug.debugToFile')){
            let messageLine = await this.getDebugMessageFileLine(_.cloneDeep(debugMessage));
            await _appWrapper.fileManager.writeFileSync(path.resolve(this.getConfig('debug.debugMessagesFilename')), messageLine, {flag: 'a'});
        }

        if (appState && appState.allDebugMessages && _.isArray(appState.allDebugMessages)){
            appState.allDebugMessages.push(debugMessage);
        }
    }

    /**
     * Does actual logging to console (and log file is file logging is enabled)
     *
     * @param  {object} debugMessage Message object to be logged (returned by this.getMessageObject method)
     * @return {undefined}
     */
    _doLog (debugMessage){
        if (debugMessage.type == 'group'){
            if (this.getConfig('debug.debugGroupsCollapsed')){
                console.groupCollapsed(debugMessage.message);
            } else {
                console.group(debugMessage.message);
            }
        } else if (debugMessage.type == 'groupcollapsed'){
            console.groupCollapsed(debugMessage.message);
        } else if (debugMessage.type == 'groupend'){
            console.groupEnd(debugMessage.message);
        } else if (debugMessage.type == 'error'){
            console.error(debugMessage.message);
        } else if (debugMessage.type == 'warning'){
            console.warn(debugMessage.message);
        } else {
            console.log(debugMessage.message);
        }

        var maxDebugMessages = this.getConfig('debug.maxDebugMessages', 30);
        var messageCount = this.getStateVar('debugMessages.length', 0);

        if (messageCount > maxDebugMessages){
            var startIndex = messageCount - (maxDebugMessages + 1);
            if (appState && appState.debugMessages && _.isArray(appState.debugMessages)){
                appState.debugMessages = appState.debugMessages.slice(startIndex);
            }
        }
        if (appState && appState.debugMessages && _.isArray(appState.debugMessages)){
            let lastMessage = _.last(appState.debugMessages);
            if (lastMessage && lastMessage.message == debugMessage.message && lastMessage.type == debugMessage.type){
                lastMessage.count++;
                lastMessage.timestamps.push(debugMessage.timestamp);
            } else {
                appState.debugMessages.push(debugMessage);
            }
        }
    }

    /**
     * Gets JSON represenation of message object for saving into log file,
     * removing unneccessary properties and adding necessary ones
     *
     * @async
     * @param  {obj} message Message object to be logged (returned by this.getMessageObject method)
     * @return {string}      JSON encoded representation of message object
     */
    async getMessageFileLine(message){
        let msg = _.cloneDeep(message);
        if (!msg.timestamp){
            msg.timestamp = new Date().toString();
        }
        if (msg.count == 1){
            delete msg.count;
            delete msg.timestamps;
        }
        delete msg.iconClass;
        delete msg.force;
        delete msg.important;
        delete msg.active;
        delete msg.typeLevel;
        delete msg.stack;
        delete msg.stackVisible;
        return JSON.stringify(msg);
    }

    /**
     * Returns string representing log line for appending
     * to user message log file
     *
     * @async
     * @param  {obj} message Message object to be logged (returned by this.getMessageObject method)
     * @return {string}      String representing log line for appending to user message log file
     */
    async getUserMessageFileLine (message){
        var line = '';
        if (appState.userMessagesToFileStarted){
            line += ',\n';
        } else {
            appState.userMessagesToFileStarted = true;
        }

        line += await this.getMessageFileLine(message);
        return line;
    }

    /**
     * Returns string representing log line for appending
     * to debug log file
     *
     * @async
     * @param  {obj} message Message object to be logged (returned by this.getMessageObject method)
     * @return {string}      String representing log line for appending to debug log file
     */
    async getDebugMessageFileLine (message){
        var line = '';

        if (appState.debugToFileStarted){
            line += ',\n';
        } else {
            appState.debugToFileStarted = true;
        }
        let msg = _.cloneDeep(message);
        if (!msg.timestamp){
            msg.timestamp = new Date().toString();
        }
        if (msg.count == 1){
            delete msg.count;
            delete msg.timestamps;
        }
        line += await this.getMessageFileLine(msg);
        return line;
    }

    /**
     * Logs user message if conditions are met
     *
     * Message is being interpolated by replacing placeholders
     * such as '{1}', '{2}' etc. by corresponding values from 'data' argument
     *
     * @async
     * @param {sting}   message         Message to be logged
     * @param {string}  type            Type of log message (debug, info, warning, error)
     * @param {array}   data            An array of data strings that are to be applied to logging message
     * @param {boolean} important       Flag to indicate message importance
     * @param {boolean} dontTranslate   Flag to prevent automatic message translation
     * @param {boolean} force           Flag to force message output even if configuration wouldn't allow it
     * @param {boolean} passToDebug     Flag to force passing same message to debug log
     * @return {undefined}
     */
    async addUserMessage (message, type, data, important, dontTranslate, force, passToDebug){
        if (!type){
            type = 'info';
        }
        if (_.isUndefined(force)){
            force = this.forceUserMessages;
        }

        if (_.isUndefined(passToDebug)){
            passToDebug = this.forceDebug;
        }

        let userMessageLevel = this.getConfig('userMessages.userMessageLevel', 0);
        let debugLevels = this.getConfig('logger.messageLevels');
        let typeLevel = debugLevels && debugLevels[type] ? debugLevels[type] : 0;
        let umHelper = _appWrapper.getHelper('userMessage');

        if (!force){
            force = false;
        }

        let userMessage = await this.getMessageObject(userMessageLevel, message, type, data, important, dontTranslate, force);

        if (message && passToDebug){
            this.log(userMessage.message, type, [], true);
        }

        if (force || typeLevel >= userMessageLevel){
            let maxUserMessages = this.getConfig('userMessages.maxUserMessages', 30);
            let messageCount = this.getStateVar('userMessages.length', 30);

            if (messageCount > maxUserMessages){
                let startIndex = messageCount - (maxUserMessages + 1);
                if (appState && appState.userMessages && _.isArray(appState.userMessages)){
                    appState.userMessages = appState.userMessages.slice(startIndex);
                }
            }

            if (appState && appState.userMessages && _.isArray(appState.userMessages)){
                appState.userMessageQueue.push(userMessage);
            }
        }

        if (userMessage && userMessage.type && userMessage.type != 'delimiter' && userMessage.message && this.getConfig('userMessages.userMessagesToFile')){
            let messageLine = await this.getUserMessageFileLine(_.cloneDeep(userMessage));
            await window.getAppWrapper().fileManager.writeFileSync(path.resolve(this.getConfig('userMessages.userMessagesFilename')), messageLine, {flag: 'a'});

        }

        if (appState && appState.allUserMessages && _.isArray(appState.allUserMessages)){
            appState.allUserMessages.push(userMessage);
        }

        umHelper.processUserMessageQueue();
    }

    /**
     * Returns prepared message object based on passed arguments.
     *
     * Message is being interpolated by replacing placeholders
     * such as '{1}', '{2}' etc. by corresponding values from 'data' argument
     *
     * @async
     * @param  {int}    messageLevel    Number representing current message level (0=debug, 1=info, 2=warning, 3=error)
     * @param {sting}   message         Message to be logged
     * @param {string}  type            Type of log message (debug, info, warning, error)
     * @param {array}   data            An array of data strings that are to be applied to logging message
     * @param {boolean} important       Flag to indicate message importance
     * @param {boolean} dontTranslate   Flag to prevent automatic message translation
     * @param {boolean} force           Flag to force message output even if configuration wouldn't allow it
     * @return {object}                 Object that represents log message
     */
    async getMessageObject (messageLevel, message, type, data, important, dontTranslate, force){

        var userMessage = {};
        var debugLevels = this.getConfig('logger.messageLevels');
        var typeLevel = debugLevels && debugLevels[type] ? debugLevels[type] : 0;
        var timestamp = new Date().toString();
        var iconClass = 'fa fa-info-circle';

        if (type == 'warning'){
            iconClass = 'fa fa-exclamation-circle';
        } else if (type == 'error'){
            iconClass = 'fa fa-exclamation-triangle';
        }

        if (message && !dontTranslate && window && window.getAppWrapper() && window.getAppWrapper().appTranslations && window.getAppWrapper().appTranslations.translate){
            message = window.getAppWrapper().appTranslations.translate(message);
        }


        if (message && message.match && message.match(/{(\d+)}/) && _.isArray(data) && data.length) {
            message = message.replace(/{(\d+)}/g, (match, number) => {
                var index = number - 1;
                return !_.isUndefined(data[index]) ? data[index] : match;
            });
        }

        let stack = this._getStack();

        userMessage = {
            count: 1,
            timestamps: [timestamp],
            timestamp: timestamp,
            message: message,
            iconClass: iconClass,
            type: type,
            important: important,
            force: force,
            active: messageLevel >= typeLevel,
            typeLevel: typeLevel,
            stack: stack,
            stackVisible: false
        };

        if (!message){
            userMessage.message = ' ';
            userMessage.type = 'delimiter';
            userMessage.timestamp = '';
            userMessage.iconClass = '';
        }

        return userMessage;
    }

    /**
     * Adds modal message to currently open modal dialog
     *
     * Message is being interpolated by replacing placeholders
     * such as '{1}', '{2}' etc. by corresponding values from 'data' argument
     *
     * @async
     * @param {sting}   message         Message to be logged
     * @param {string}  type            Type of log message (debug, info, warning, error)
     * @param {array}   data            An array of data strings that are to be applied to logging message
     * @param {boolean} important       Flag to indicate message importance
     * @param {boolean} dontTranslate   Flag to prevent automatic message translation
     * @param {boolean} force           Flag to force message output even if configuration wouldn't allow it
     * @param {boolean} passToDebug     Flag to force passing same message to debug log
     * @return {undefined}
     */
    async addModalMessage (message, type, data, important, dontTranslate, force, passToDebug){
        if (!type){
            type = 'info';
        }
        if (_.isUndefined(force)){
            force = this.forceUserMessages;
        }

        if (_.isUndefined(passToDebug)){
            passToDebug = this.forceDebug;
        }

        let messageLevel = 0;

        if (!force){
            force = false;
        }

        let userMessage = await this.getMessageObject(messageLevel, message, type, data, important, dontTranslate, force);

        _appWrapper.getHelper('modal').addModalMessage(userMessage);
    }

    /**
     * Displays app notification
     *
     * Notification message is being interpolated by replacing placeholders
     * such as '{1}', '{2}' etc. by corresponding values from 'data' argument
     *
     * @async
     * @param {sting}   message         Notification message
     * @param {array}   data            An array of data strings that are to be applied to notification
     * @param {boolean} dontTranslate   Flag to prevent automatic notification translation
     * @return {undefined}
     */
    async addNotification (message, data, dontTranslate){
        let notification = await this.getMessageObject(0, message, 'info', data, false, dontTranslate);
        _appWrapper.getHelper('appNotifications').addNotification(notification);
    }

    /**
     * Displays desktop notification
     *
     * Notification message is being interpolated by replacing placeholders
     * such as '{1}', '{2}' etc. by corresponding values from 'data' argument
     *
     * @async
     * @param {sting}   message         Notification message
     * @param {array}   data            An array of data strings that are to be applied to notification
     * @param {boolean} dontTranslate   Flag to prevent automatic notification translation
     * @param {object} options          Desktop notification options (passed to HTML5 Notification object constructor)
     * @param {object} callbacks        Object with onshow, onClicked, onClosed and onerror notification handlers
     * @return {undefined}
     */
    async addDesktopNotification (message, data, dontTranslate, options, callbacks){
        let notification = await this.getMessageObject(0, message, 'info', data, false, dontTranslate);
        return await _appWrapper.getHelper('appNotifications').addDesktopNotification(notification, options, callbacks);
    }

    /**
     * Returns appState var value
     *
     * @param  {string} varPath      String representing path to requested var (i.e. 'appData.appMainData.cancelable')
     * @param  {mixed} defaultValue  Default value to be returned if appState var is not found
     * @return {mixed}               appState var value
     */
    getStateVar (varPath, defaultValue){
        var varValue;
        if (appState){
            varValue = _.get(appState, varPath, defaultValue);
        }
        if (_.isUndefined(varValue) && !_.isUndefined(defaultValue)){
            varValue = defaultValue;
        }
        return varValue;
    }

    /**
     * Returns instance of helper object based on passed parameter (or false if helper can't be found)
     *
     * @param  {string} name       Name of the helper
     * @return {object}            Instance of the helper object (or false if helper can't be found)
     */
    getHelper(name){
        return _appWrapper.getHelper(name);
    }

    /**
     * Returns configuration var value
     *
     * @param  {string} name         String representing path to requested var (i.e. 'appConfig.appInfo.name')
     * @param  {mixed} defaultValue  Default value to be returned if configuration var is not found
     * @return {mixed}               configuration var value
     */
    getConfig (name, defaultValue){
        var path = name;
        var value;
        if (!path.match(/^config\./)){
            path = 'config.' + name;
        }
        value = _.get(appState, path);
        if (_.isUndefined(value)){
            path = name;
            if (!path.match(/^appWrapperConfig\./)){
                path = 'appWrapperConfig.' + name;
            }
            value = _.get(appState.u, path);
        }
        if (_.isUndefined(value)){
            path = name;
            if (!path.match(/^userConfig\./)){
                path = 'userConfig.' + name;
            }
            value = _.get(appState.u, path);
        }
        if (_.isUndefined(value) && !_.isUndefined(defaultValue)){
            value = defaultValue;
        }
        return value;
    }

    /**
     * Helper method for getting call stack array for debug or user message objects
     *
     * @return {array} An array of objects with properties 'function', 'file', 'line' and 'column', representing stack calls.
     */
    _getStack () {
        let stackArray;
        try {
            throw new Error();
        } catch (e) {
            let stackMessages = _.filter(e.stack.split('\n'), (msg) => {
                return msg.match(/^\s+at\s/);
            });
            // stackMessages = _.drop(_.dropRight(stackMessages));
            stackMessages = _.drop(stackMessages, 3);

            stackArray = _.map(stackMessages, (msg) => {
                let stackData = _.drop(_.trim(msg).split(' '));
                let returnValue = {
                    function: null,
                    file: null,
                    line: null,
                    column: null
                };
                if (stackData && _.isArray(stackData)){
                    if (stackData[0]){
                        returnValue.function = stackData[0];
                    }
                    if (stackData[1]){
                        stackData[1] = stackData[1].replace(/^\(/, '').replace(/\)$/, '');
                        if (stackData[1].match(/chrome-extension:\/\//)){
                            stackData[1] = stackData[1].replace(/^[^:]+:\/\/[^/]+\//, appState.appRootDir);
                        }
                        let callerData = stackData[1].split(':');
                        if (callerData && _.isArray(callerData) && callerData.length){

                            let fileName = callerData[0];
                            if (appState && appState.appRootDir){
                                fileName = path.relative(appState.appRootDir, fileName);
                            }
                            returnValue.file = fileName;

                            if (callerData[1]){
                                returnValue.line = parseInt(callerData[1], 10);
                            }
                            if (callerData[2]){
                                returnValue.column = parseInt(callerData[2], 10);
                            }
                        }
                    }
                }
                return returnValue;
            });
        }
        stackArray = _.filter(stackArray, (item) => {
            return item.function ? true : false;
        });
        return stackArray;
    }

    /**
     * Returns translated value for passed arguments
     *
     * Translation is being interpolated by replacing placeholders
     * such as '{1}', '{2}' etc. by corresponding values from 'data' argument
     *
     * @param  {string} text            Text to be translated
     * @param  {string} currentLanguage Curent language code
     * @param  {array} data             An array of data strings that are to be applied to translated message
     * @return {string}                 Translated message with interpolated data
     */
    translate (text, currentLanguage, data) {
        return _appWrapper.appTranslations.translate(text, currentLanguage, data);
    }

    /**
     * Clears all timeouts bound to this AppWrapper instance
     *
     * @return {undefined}
     */
    clearTimeouts (){
        for (let name in this.timeouts){
            clearTimeout(this.timeouts[name]);
        }
    }

    /**
     * Clears all intervals bound to this AppWrapper instance
     *
     * @return {undefined}
     */
    clearIntervals (){
        for (let name in this.intervals){
            clearInterval(this.intervals[name]);
        }
    }

    globalEmit (eventName, data){
        _appWrapper.windowManager.win.globalEmitter.emit(eventName, data);
    }

    message (data){
        _appWrapper.windowManager.win.globalEmitter.emit('message', data);
    }

    async asyncMessage (data){
        var returnPromise;
        var resolveReference;
        returnPromise = new Promise((resolve) => {
            resolveReference = resolve;
        });
        if (!data.uuid){
            data.uuid = this.getHelper('util').uuid();
        }
        let listener;
        listener = (returnData) => {
            if (data.uuid == returnData.uuid){
                _appWrapper.windowManager.win.globalEmitter.removeListener('asyncMessageResponse', listener);
                resolveReference(returnData);
            }
        };
        _appWrapper.windowManager.win.globalEmitter.on('asyncMessageResponse', listener);
        _appWrapper.windowManager.win.globalEmitter.emit('asyncMessage', data);
        return returnPromise;
    }
}
exports.BaseClass = BaseClass;