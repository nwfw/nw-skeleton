/**
 * @fileOverview AppBase class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.0
 */

const _ = require('lodash');
const path = require('path');
const BaseClass = require('./base').BaseClass;

let _appWrapper;
let appState;

/**
 * App base class for extending when creating other app classes
 *
 * @class
 * @extends {appWrapper.BaseClass}
 * @memberOf appWrapper
 * @property {Boolean}  forceUserMessages   Flag to force user message output
 * @property {Boolean}  forceDebug          Flag to force debug message output
 * @property {Object}   boundMethods        Object to hold bound method references for event listeners
 * @property {Object}   timeouts            Object that holds references to this class instance timeouts
 * @property {Object}   intervals           Object that holds references to this class instance intervals
 * @property {Boolean}  needsConfig         Flag to indicate whether class instance needs config, triggering warnings if config is not available for the class
 */
class AppBaseClass extends BaseClass {

    /**
     * Creates class instance, setting basic properties, and returning the instance itself
     *
     * @constructor
     * @return {appWrapper.AppBaseClass} Instance of current class
     */
    constructor () {
        super();

        if (window && window.getAppWrapper && _.isFunction(window.getAppWrapper)){
            _appWrapper = window.getAppWrapper();
            appState = _appWrapper.getAppState();
            _.noop(appState);
        }
        return this;
    }

    /**
     * Initializes current class instance, setting up logging and
     * bound methods to be used in event listeners
     *
     * @async
     * @param {BaseInitializationOptions} options Initialization options
     * @return {appWrapper.AppBaseClass} Instance of current class
     */
    async initialize (options) {
        return await super.initialize(options);
    }

    /**
     * Determines whether logging for this class is regulated through
     * configuration, setting the logging by it (or warning if there
     * are no configuration settings for this class)
     *
     * @async
     * @param  {Object} options Options for logging initialization (currently only 'silent' property is used, determining whether warnings should be printed if no config found)
     * @return {appWrapper.AppBaseClass}      Instance of the current class
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
     * Logs debug message if conditions are met
     *
     * Message is being interpolated by replacing placeholders
     * such as '{1}', '{2}' etc. by corresponding values from 'data' argument
     *
     * @async
     * @param  {string} message  Message to be logged
     * @param  {string} type    Type of log message (debug, info, warning, error, group, groupCollaped, groupend)
     * @param  {array} data     An array of data strings that are to be applied to logging message
     * @param  {Boolean} force  Flag to force logging output even if config does not allow it
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
            if (this.getConfig('debug.passToMain')){
                this.message({instruction:'log', data: {message: message, type: type, data: data, force: force}});
            }

        }
        if (debugMessage && debugMessage.message && this.getConfig('debug.debugToFile')){
            let messageLine = await this.getDebugMessageFileLine(_.cloneDeep(debugMessage));
            let debugMessageFilePath = this.getDebugMessageFilePath();
            await _appWrapper.fileManager.writeFileSync(path.resolve(debugMessageFilePath), messageLine, {flag: 'a'});
        }

        if (appState && appState.allDebugMessages && _.isArray(appState.allDebugMessages)){
            let maxDebugMessages = this.getConfig('debug.maxDebugMessages', 1000);
            if (appState.allDebugMessages.length > maxDebugMessages){
                appState.allDebugMessages = [];
            }
            appState.allDebugMessages.push(debugMessage);
        }
    }

    /**
     * Does actual logging to console (and log file is file logging is enabled)
     *
     * @param  {Object} debugMessage Message object to be logged (returned by this.getMessageObject method)
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
        } else if (debugMessage.type == 'table'){
            if (debugMessage.originalMessage){
                if (!_.isArray(debugMessage.originalMessage)){
                    console.table([debugMessage.originalMessage]);
                } else {
                    console.table(debugMessage.originalMessage);
                }
            } else {
                console.log(debugMessage.message);
            }
        } else if (debugMessage.type == 'dir'){
            if (debugMessage.originalMessage){
                console.dir(debugMessage.originalMessage);
            } else {
                console.log(debugMessage.message);
            }
        } else {
            console.log(debugMessage.message);
        }

        let maxVisibleDebugMessages = this.getConfig('debug.maxVisibleDebugMessages', 30);
        let messageCount = this.getStateVar('debugMessages.length', 0);

        if (messageCount > maxVisibleDebugMessages){
            let startIndex = messageCount - (maxVisibleDebugMessages + 1);
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
        if (msg.type == 'table'){
            // msg.type = 'debug';
        }
        delete msg.originalMessage;
        delete msg.tableData;
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
        let line = '';
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
        let line = '';

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
     * @param {string}   message         Message to be logged
     * @param {string}  type            Type of log message (debug, info, warning, error)
     * @param {array}   data            An array of data strings that are to be applied to logging message
     * @param {Boolean} important       Flag to indicate message importance
     * @param {Boolean} dontTranslate   Flag to prevent automatic message translation
     * @param {Boolean} force           Flag to force message output even if configuration wouldn't allow it
     * @param {Boolean} passToDebug     Flag to force passing same message to debug log
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
            let maxVisibleUserMessages = this.getConfig('userMessages.maxVisibleUserMessages', 30);
            let messageCount = this.getStateVar('userMessages.length', 30);

            if (messageCount > maxVisibleUserMessages){
                let startIndex = messageCount - (maxVisibleUserMessages + 1);
                if (appState && appState.userMessages && _.isArray(appState.userMessages)){
                    appState.userMessages = appState.userMessages.slice(startIndex);
                }
            }

            if (appState && appState.userMessages && _.isArray(appState.userMessages)){
                appState.userMessageQueue.push(userMessage);
            }

            if (appState.config.userMessages.hideUserMessages && type !== 'delimiter' && appState.status.appInitialized && !appState.status.appShuttingDown && !appState.appError.error){
                let notificationDuration = this.getConfig('appNotifications.userMessageDuration');
                if (type == 'warning' || type == 'error'){
                    notificationDuration *= 2;
                }
                await this.addNotification(message, type, data, dontTranslate, {duration: notificationDuration, pinned: false});
            }
        }

        if (userMessage && userMessage.type && userMessage.type != 'delimiter' && userMessage.message && this.getConfig('userMessages.userMessagesToFile')){
            let messageLine = await this.getUserMessageFileLine(_.cloneDeep(userMessage));
            let userMessageFilePath = this.getUserMessageFilePath();
            await window.getAppWrapper().fileManager.writeFileSync(path.resolve(userMessageFilePath), messageLine, {flag: 'a'});

        }

        if (appState && appState.allUserMessages && _.isArray(appState.allUserMessages)){
            let maxUserMessages = this.getConfig('userMessages.maxUserMessages', 1000);
            if (appState.allUserMessages.length > maxUserMessages){
                appState.allUserMessages = [];
            }
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
     * @param {string}   message         Message to be logged
     * @param {string}  type            Type of log message (debug, info, warning, error)
     * @param {array}   data            An array of data strings that are to be applied to logging message
     * @param {Boolean} important       Flag to indicate message importance
     * @param {Boolean} dontTranslate   Flag to prevent automatic message translation
     * @param {Boolean} force           Flag to force message output even if configuration wouldn't allow it
     * @return {Object}                 Object that represents log message
     */
    async getMessageObject (messageLevel, message, type, data, important, dontTranslate, force){

        let userMessage = {};
        let debugLevels = this.getConfig('logger.messageLevels');
        let typeLevel = debugLevels && debugLevels[type] ? debugLevels[type] : 0;
        let timestamp = new Date().toString();
        let iconClass = 'fa fa-info-circle';
        let originalMessage = _.cloneDeep(message);
        let tableData;

        if (type == 'warning'){
            iconClass = 'fa fa-exclamation-circle';
        } else if (type == 'error'){
            iconClass = 'fa fa-exclamation-triangle';
        }

        if (type == 'table' && (_.isObject(message) || _.isArray(message))) {
            tableData = await this.getTableMessageData(message);
        }

        if (message && !dontTranslate && window && window.getAppWrapper() && window.getAppWrapper().appTranslations && window.getAppWrapper().appTranslations.translate){
            message = window.getAppWrapper().appTranslations.translate(message);
        }

        if (message && message.match && message.match(/{(\d+)}/) && _.isArray(data) && data.length) {
            message = message.replace(/{(\d+)}/g, (match, number) => {
                let index = number - 1;
                return !_.isUndefined(data[index]) ? data[index] : match;
            });
        }

        let stack = this._getStack();

        userMessage = {
            count: 1,
            timestamps: [timestamp],
            timestamp: timestamp,
            message: message,
            originalMessage: originalMessage,
            tableData: tableData,
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
            userMessage.originalMessage = ' ';
            userMessage.type = 'delimiter';
            userMessage.timestamp = '';
            userMessage.iconClass = '';
        }

        return userMessage;
    }

    /**
     * Prepares table data for tabular message logging
     *
     * @async
     * @param  {Object} message Tabular data
     * @return {Object}         Table data with tableColumns and tableRows properties
     */
    async getTableMessageData(message){
        let localMessage = _.cloneDeep(message);
        if (!_.isArray(localMessage)){
            localMessage = [localMessage];
        }


        let messageRows = [];
        for (let name in localMessage){
            messageRows.push(await this.getMessageObjectRow(name, localMessage[name]));
        }

        let tableData = {
            tableRows: messageRows
        };
        // console.log(JSON.stringify(tableData, ' ', 4));

        return tableData;
    }

    /**
     * Gets single row for tabular message logging
     *
     * @async
     * @param  {mixed} index            Key or array index
     * @param  {Object} messageRowData  Message row data for logging
     * @return {Object}                 Object with row data
     */
    async getMessageObjectRow(index, messageRowData) {
        let rowContents = {
            __columns: [],
            __type: 'table',
            __data: {}
        };
        if (_.isObject(messageRowData) || _.isArray(messageRowData)){
            for (let name in messageRowData){
                let namedRowData = messageRowData[name];
                if (_.isObject(namedRowData)){
                    let newRows = await this.getMessageObjectRow(name, namedRowData);
                    rowContents.__type = 'table';
                    rowContents.__columns.push(name);
                    rowContents.__data[name] = newRows;
                } else if (_.isArray(namedRowData)){
                    let newRows = [];
                    for (let i=0; i<namedRowData.length; i++){
                        let newRow = await this.getMessageObjectRow(i, namedRowData[i]);
                        newRows.push(newRow);
                    }
                    rowContents.__type = 'row';
                    rowContents.__columns.push(name);
                    rowContents.__data[name] = newRows;

                } else {
                    let newData = {
                        __type: 'cell',
                    };
                    newData.__data = namedRowData;
                    rowContents.__columns.push(name);
                    rowContents.__data[name] = newData;
                }
            }
        } else {
            rowContents.__type = 'cell';
            rowContents.__data[index] = messageRowData[index];
            rowContents.__columns.push(index);
        }
        return rowContents;
    }

    /**
     * Returns path to user message log file
     *
     * @return {string} Path to user message log file
     */
    getUserMessageFilePath () {
        let userMessageFilePath = path.join(_appWrapper.getExecPath(), this.getConfig('appConfig.logDir'), this.getConfig('userMessages.userMessagesFilename'));
        let rotateLogs = this.getConfig('userMessages.rotateLogs');
        if (rotateLogs){
            userMessageFilePath += '-' + window.appStartTime.toISOString().replace(/T.*$/, '');
        }
        userMessageFilePath += '.json';

        return userMessageFilePath;
    }

    /**
     * Returns path to debug message log file
     *
     * @return {string} Path to debug message log file
     */
    getDebugMessageFilePath () {
        let debugMessageFilePath = path.join(_appWrapper.getExecPath(), this.getConfig('appConfig.logDir'), this.getConfig('debug.debugMessagesFilename'));
        let rotateLogs = this.getConfig('debug.rotateLogs');
        if (rotateLogs){
            debugMessageFilePath += '-' + window.appStartTime.toISOString().replace(/T.*$/, '');
        }
        debugMessageFilePath += '.json';

        return debugMessageFilePath;
    }

    /**
     * Adds modal message to currently open modal dialog
     *
     * Message is being interpolated by replacing placeholders
     * such as '{1}', '{2}' etc. by corresponding values from 'data' argument
     *
     * @async
     * @param {string}   message         Message to be logged
     * @param {string}  type            Type of log message (debug, info, warning, error)
     * @param {array}   data            An array of data strings that are to be applied to logging message
     * @param {Boolean} important       Flag to indicate message importance
     * @param {Boolean} dontTranslate   Flag to prevent automatic message translation
     * @param {Boolean} force           Flag to force message output even if configuration wouldn't allow it
     * @param {Boolean} passToDebug     Flag to force passing same message to debug log
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
     * @param {string}   message         Notification message
     * @param {string}   type           Notification message type
     * @param {array}   data            An array of data strings that are to be applied to notification
     * @param {Boolean} dontTranslate   Flag to prevent automatic notification translation
     * @param {Object} options          Additional notification options
     * @return {undefined}
     */
    async addNotification (message, type, data, dontTranslate, options){
        let notification = await this.getMessageObject(0, message, type, data, false, dontTranslate);
        let duration = _appWrapper.getConfig('appNotifications.duration');
        if (options && !_.isUndefined(options.duration)){
            duration = options.duration;
        }
        notification.duration = duration;
        notification.pinned = false;
        if (options && options.pinned){
            notification.pinned = true;
        } else {
            notification.pinned = false;
        }

        if (options && options.immediate){
            notification.immediate = true;
        } else {
            notification.immediate = false;
        }

        if (!duration){
            notification.pinned = true;
            notification.duration = _appWrapper.getConfig('appNotifications.duration');
        }

        await _appWrapper.getHelper('appNotifications').addNotification(notification);
        await _appWrapper.wait(this.getConfig('minPauseDuration'));

    }

    /**
     * Displays desktop notification
     *
     * Notification message is being interpolated by replacing placeholders
     * such as '{1}', '{2}' etc. by corresponding values from 'data' argument
     *
     * @async
     * @param {string}   message         Notification message
     * @param {array}   data            An array of data strings that are to be applied to notification
     * @param {Boolean} dontTranslate   Flag to prevent automatic notification translation
     * @param {Object} options          Desktop notification options (passed to HTML5 Notification object constructor)
     * @param {Object} callbacks        Object with onshow, onClicked, onClosed and onerror notification handlers
     * @return {undefined}
     */
    async addDesktopNotification (message, data, dontTranslate, options, callbacks){
        let notification = await this.getMessageObject(0, message, 'info', data, false, dontTranslate);
        return await _appWrapper.getHelper('appNotifications').addDesktopNotification(notification, options, callbacks);
    }

    /**
     * Returns configuration var value
     *
     * @param  {string} name         String representing path to requested var (i.e. 'appConfig.appInfo.name')
     * @param  {mixed} defaultValue  Default value to be returned if configuration var is not found
     * @return {mixed}               configuration var value
     */
    getConfig (name, defaultValue){
        let path = name;
        let value;
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
        if (!value && !_.isUndefined(defaultValue)){
            value = defaultValue;
        }
        return value;
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
        let translation = text;
        if (appState.status.languageInitialized && _appWrapper && _appWrapper.appTranslations && _appWrapper.appTranslations.translate && _.isFunction(_appWrapper.appTranslations.translate)){
            translation = _appWrapper.appTranslations.translate(text, currentLanguage, data);
        }
        return translation;
    }

    /**
     * Emits event to globalEmitter (listened by both main script and app code)
     *
     * @param  {String} eventName Name of the event
     * @param  {Object} data      Event data object
     * @return {undefined}
     */
    globalEmit (eventName, data){
        _appWrapper.windowManager.win.globalEmitter.emit(eventName, data);
    }

    /**
     * Emits 'message' global event, listened by main script
     *
     * @async
     * @param  {Object} data      Event data object
     * @return {undefined}
     */
    async message (data){
        let returnPromise;
        let resolveReference;
        returnPromise = new Promise((resolve) => {
            resolveReference = resolve;
        });
        if (data){
            if (!data.uuid){
                data.uuid = this.getHelper('util').uuid();
            }
        } else {
            data = {
                uuid: this.getHelper('util').uuid()
            };
        }
        data._async_ = false;
        if (!_appWrapper.windowManager.win.globalEmitter){
            this.log('Can not send message - globalEmitter not available', 'error', []);
            return false;
        } else {
            let listener = (messageData) => {
                if (messageData && messageData.uuid && messageData.uuid == data.uuid){
                    _appWrapper.windowManager.win.globalEmitter.removeListener('messageResponse', listener);
                    resolveReference(messageData);
                }
            };

            _appWrapper.windowManager.win.globalEmitter.on('messageResponse', listener);
            _appWrapper.windowManager.win.globalEmitter.emit('message', data);
            return returnPromise;
        }
    }

    /**
     * Emits 'asyncMessage' global event, listened by main script
     *
     * @async
     * @param  {Object} data      Message data object
     * @return {mixed}            Returns data returned by main script async message handler for given message instruction
     */
    async asyncMessage (data){
        let returnPromise;
        let resolveReference;
        returnPromise = new Promise((resolve) => {
            resolveReference = resolve;
        });
        if (data){
            if (!data.uuid){
                data.uuid = this.getHelper('util').uuid();
            }
        } else {
            data = {
                uuid: this.getHelper('util').uuid()
            };
        }
        data._async_ = true;
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

    /**
     * Returns info on messages that can be passed to mainScript
     *
     * @async
     * @param  {Object}  data            Message data.data object
     * @param  {Boolean} verboseOutput   Toggles verbose output
     * @return {Object}                  Object with handlerMethods property containing all handler method names
     */
    async messageInfo (data, verboseOutput) {
        let returnPromise;
        let resolveReference;
        returnPromise = new Promise((resolve) => {
            resolveReference = resolve;
        });

        let uuid = this.getHelper('util').uuid();

        let listener = (messageData) => {
            if (messageData && messageData.uuid && messageData.uuid == uuid){
                _appWrapper.windowManager.win.globalEmitter.removeListener('messageResponse', listener);
                this.messageInfoOutput(messageData, verboseOutput);
                resolveReference(messageData);
            }
        };

        _appWrapper.windowManager.win.globalEmitter.on('messageResponse', listener);
        this.message({instruction: 'info', uuid: uuid, data: data});

        return returnPromise;
    }

    /**
     * Returns info on async messages that can be passed to mainScript
     *
     * @async
     * @param  {Object}  data            Message data.data object
     * @param  {Boolean} verboseOutput   Toggles verbose output
     * @return {Object}                  Object with handlerMethods property containing all handler method names
     */
    async asyncMessageInfo (data, verboseOutput) {
        let responseData = await this.asyncMessage({instruction: 'info', data: data});
        this.messageInfoOutput(responseData, verboseOutput);
        return responseData;
    }

    /**
     * Logs messages info to console
     * @param  {Object} messageData   Message response data
     * @param {Boolean} verboseOutput   Toggles verbose output
     * @return {undefined}               [description]
     */
    messageInfoOutput (messageData, verboseOutput) {
        if (messageData && messageData.data && messageData.data.handlerMethods){
            let handlerMethodNames = Object.keys(messageData.data.handlerMethods);
            let handlerMethodsData = [];
            this.log('Handler methods: "{1}"', 'info', [handlerMethodNames.join('", "')], true);
            if (verboseOutput){
                for (let name in messageData.data.handlerMethods){
                    let requiredParams = messageData.data.handlerMethods[name].join('\n');
                    let exampleCallData = [];
                    let exampleCallProps = [];
                    let exampleCall = [];
                    let exampleCallString = '\nappWrapper.message({';
                    if (messageData._async_){
                        exampleCallString = '\nappWrapper.asyncMessage({';
                    }
                    exampleCallProps.push('instruction: \'' + name + '\'');
                    if (requiredParams){
                        messageData.data.handlerMethods[name].forEach((paramName) => {
                            if (paramName.match(/^data\./)){
                                exampleCallData.push(paramName.replace(/^data\./, '') + ': \'_value_\'');
                            } else {
                                exampleCallProps.push(paramName + ': \'_value_\'');
                            }
                        });
                    }
                    if (exampleCallProps && exampleCallProps.length){
                        exampleCall.push('\n    ' + exampleCallProps.join(',\n    '));
                    }
                    if (exampleCallData && exampleCallData.length){
                        exampleCall.push('\n    data: {');
                        exampleCall.push('\n        ' + exampleCallData.join(',\n        '));
                        exampleCall.push('\n    }');
                    }

                    exampleCallString += exampleCall.join('');
                    exampleCallString += '\n});';

                    handlerMethodsData.push({
                        'Message instruction': name,
                        'Example call': exampleCallString,
                        'Required parameters': requiredParams
                    });
                }
                if (handlerMethodsData.length == 1){
                    this.log(handlerMethodsData[0], 'table', [], true);
                } else {
                    this.log(handlerMethodsData, 'table', [], true);
                }
            }
        }
    }

    /**
     * Sets (turns on) application error, triggering rendering of app-error component
     *
     * @param   {String}            title            App error title
     * @param   {String}            text             App error text
     * @param   {String}            debugText        App error debug text (shown only if debug is enabled)
     * @param   {String[]}          data             An array with replacement data for error title, text and debugText
     * @param   {Boolean}           doNotTranslate   Flag to prevent automatic traslation of title and text
     * @param   {(String|null)}     messageType      Type of messages to show in app-error ('user', 'debug' or null)
     * @param   {Boolean}           omitIcon         Flag to control app-error icon rendering
     * @return  {undefined}
     */
    setAppError (title, text, debugText, data, doNotTranslate, messageType, omitIcon) {
        if (!title){
            title = appState.appError.defaultTitle;
        }
        if (_.isUndefined(text)){
            text = appState.appError.defaultText;
        }
        if (_.isUndefined(debugText)){
            debugText = '';
        }

        if (!doNotTranslate){
            if (title){
                title = this.translate(title);
            }
            if (text){
                text = this.translate(text);
            }
        }

        if (title && title.match && title.match(/{(\d+)}/) && _.isArray(data) && data.length) {
            title = title.replace(/{(\d+)}/g, (match, number) => {
                let index = number - 1;
                return !_.isUndefined(data[index]) ? data[index] : match;
            });
        }
        if (text && text.match && text.match(/{(\d+)}/) && _.isArray(data) && data.length) {
            text = text.replace(/{(\d+)}/g, (match, number) => {
                let index = number - 1;
                return !_.isUndefined(data[index]) ? data[index] : match;
            });
        }
        if (debugText && debugText.match && debugText.match(/{(\d+)}/) && _.isArray(data) && data.length) {
            debugText = debugText.replace(/{(\d+)}/g, (match, number) => {
                let index = number - 1;
                return !_.isUndefined(data[index]) ? data[index] : match;
            });
        }
        appState.appError.title = title;
        appState.appError.text = text;
        appState.appError.debugText = debugText;
        if (!_.isUndefined(messageType)) {
            appState.appError.messages = messageType;
        }
        if (omitIcon){
            appState.appError.icon = false;
        }
        appState.appError.error = true;
    }

    /**
     * Resets (turns off) application error, removing app-error component
     *
     * @return {undefined}
     */
    resetAppError () {
        appState.appError.error = false;
        appState.appError.title = '';
        appState.appError.text = '';
        appState.appError.debugText = '';
        appState.appError.icon = true;
        appState.appError.messages = 'user';
    }

    /**
     * Checks whether debug mode is on
     *
     * @return {Boolean} True if debug is enabled, false otherwise
     */
    isDebugEnabled () {
        return this.getConfig('debug.enabled', false);
    }

}
exports.AppBaseClass = AppBaseClass;