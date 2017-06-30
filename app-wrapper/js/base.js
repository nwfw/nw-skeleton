const _ = require('lodash');
const path = require('path');
const eventEmitter = require('events');

let _appWrapper;
let appState;

class BaseClass extends eventEmitter {

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

        return this;
    }

    async initialize () {
        let className = this.constructor.name;
        if (appState && appState.config){
            if (appState.config.forceDebug){
                if (_.isUndefined(appState.config.forceDebug[className])){
                    console.error('Class "' + className + '" has no forceDebug config set!');
                } else {
                    this.forceDebug = _.get(appState.config.forceDebug, className);
                }
            }

            if (appState.config.forceUserMessages){
                if (_.isUndefined(appState.config.forceUserMessages[className])){
                    console.error('Class "' + className + '" has no forceUserMessages config set!');
                } else {
                    this.forceUserMessages = _.get(appState.config.forceUserMessages, className);
                }
            }
        } else {
            if (this.needsConfig){
                console.warn('Could not get config object (class "' + className + '").');
            }
        }
        this.addBoundMethods();
        return this;
    }

    getAppWrapper () {
        return _appWrapper;
    }

    getAppState () {
        return appState;
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

    destroy () {
        this.removeBoundMethods();
    }


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
        let debugLevel = this.getStateVar('debugLevel', 0);
        let debugLevels = this.getStateVar('debugLevels');
        let typeLevel = debugLevels && debugLevels[type] ? debugLevels[type] : 0;

        let doLog = force || false;
        if (!doLog && this.getStateVar('debug')){
            if (typeLevel >= debugLevel){
                doLog = true;
            }
        }

        let debugMessage = await this.getMessageObject(debugLevel, message, type, data, false, true, force);

        if (doLog){
            this._doLog(debugMessage);
        }
        if (debugMessage && debugMessage.message && this.getConfig('debugToFile')){
            let messageLine = await this.getDebugMessageFileLine(_.cloneDeep(debugMessage));
            await _appWrapper.fileManager.writeFileSync(path.resolve(this.getConfig('debugMessagesFilename')), messageLine, {flag: 'a'});
        }

        if (appState && appState.allDebugMessages && _.isArray(appState.allDebugMessages)){
            appState.allDebugMessages.push(debugMessage);
        }
    }

    _doLog (debugMessage){
        if (debugMessage.type == 'group'){
            if (this.getConfig('debugGroupsCollapsed')){
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

        if (this.getConfig('alwaysTrace')){
            console.trace();
        }

        var maxDebugMessages = this.getStateVar('maxDebugMessages', 30);
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

    async getMessageFileLine(message){
        let msg = _.cloneDeep(message);
        if (!msg.timestamp){
            msg.timestamp = new Date().toISOString();
        }
        if (msg.count == 1){
            delete msg.count;
            delete msg.timestamps;
        }
        delete msg.count;
        delete msg.timestamps;
        delete msg.iconClass;
        delete msg.force;
        delete msg.active;
        delete msg.typeLevel;
        delete msg.stack;
        delete msg.stackVisible;
        return JSON.stringify(msg);
    }

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

    async getDebugMessageFileLine (message){
        var line = '';

        if (appState.debugToFileStarted){
            line += ',\n';
        } else {
            appState.debugToFileStarted = true;
        }
        let msg = _.cloneDeep(message);
        if (!msg.timestamp){
            msg.timestamp = new Date().toISOString();
        }
        if (msg.count == 1){
            delete msg.count;
            delete msg.timestamps;
        }
        line += await this.getMessageFileLine(msg);
        return line;
    }

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

        let userMessageLevel = this.getStateVar('userMessageLevel', 0);
        let debugLevels = this.getStateVar('debugLevels');
        let typeLevel = debugLevels && debugLevels[type] ? debugLevels[type] : 0;
        let umHelper = _appWrapper.getHelper('userMessage');

        if (important){
            type += ' important';
        }

        if (!force){
            force = false;
        }

        let userMessage = await this.getMessageObject(userMessageLevel, message, type, data, important, dontTranslate, force);

        if (message && passToDebug){
            this.log(userMessage.message, type, [], true);
        }

        if (force || typeLevel >= userMessageLevel){
            let maxUserMessages = this.getStateVar('maxUserMessages', 30);
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

        if (userMessage && userMessage.type && userMessage.type != 'delimiter' && userMessage.message && this.getConfig('userMessagesToFile')){
            let messageLine = await this.getUserMessageFileLine(_.cloneDeep(userMessage));
            await window.getAppWrapper().fileManager.writeFileSync(path.resolve(this.getConfig('userMessagesFilename')), messageLine, {flag: 'a'});

        }

        if (appState && appState.allUserMessages && _.isArray(appState.allUserMessages)){
            appState.allUserMessages.push(userMessage);
        }

        umHelper.processUserMessageQueue();
    }

    async getMessageObject (messageLevel, message, type, data, important, dontTranslate, force){

        var userMessage = {};
        var debugLevels = this.getStateVar('debugLevels');
        var typeLevel = debugLevels && debugLevels[type] ? debugLevels[type] : 0;
        var timestamp = new Date().toISOString().slice(11, 19);
        var iconClass = 'fa fa-info-circle';

        if (type == 'warning'){
            iconClass = 'fa fa-exclamation-circle';
        } else if (type == 'error'){
            iconClass = 'fa fa-exclamation-triangle';
        }

        if (important){
            type += ' important';
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

        if (important){
            type += ' important';
        }

        if (!force){
            force = false;
        }

        let userMessage = await this.getMessageObject(messageLevel, message, type, data, important, dontTranslate, force);

        _appWrapper.getHelper('modal').addModalMessage(userMessage);
    }


    getStateVar (varPath, defaultValue){
        var varValue;
        if (appState){
            varValue = _.get(appState, varPath, defaultValue);
        }
        return varValue;
    }

    getHelper(name){
        return _appWrapper.getHelper(name);
    }

    getConfig (name){
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
        return value;
    }

    _getStack () {
        let stackArray;
        try {
            throw new Error();
        } catch (e) {
            let stackMessages = _.filter(e.stack.split('\n'), (msg) => {
                return msg.match(/^\s+at\s/);
            });
            // stackMessages = _.drop(_.dropRight(stackMessages));
            stackMessages = _.drop(stackMessages);

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
}
exports.BaseClass = BaseClass;