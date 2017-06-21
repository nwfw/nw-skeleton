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
        if (_.isUndefined(force)){
            force = this.forceDebug;
        }
        var debugLevel = this.getStateVar('debugLevel', 0);
        var debugLevels = this.getStateVar('debugLevels');
        var typeLevel = debugLevels && debugLevels[type] ? debugLevels[type] : 0;

        var doLog = force || false;
        if (!doLog && this.getStateVar('debug')){
            if (typeLevel >= debugLevel){
                doLog = true;
            }
        }

        if (type == 'group' || type == 'groupend'){
            // doLog = true;
        }

        if (message && message.match && message.match(/{(\d+)}/) && _.isArray(data) && data.length) {
            message = message.replace(/{(\d+)}/g, function replaceMessageData(match, number) {
                var index = number - 1;
                return !_.isUndefined(data[index]) ? data[index] : match;
            });
        }

        var timestamp = new Date().toISOString().slice(11, 19);
        var debugMessage = {
            timestamp: timestamp,
            message: message,
            type: type
        };

        if (doLog){
            if (type == 'group'){
                if (this.getConfig('debugGroupsCollapsed')){
                    console.groupCollapsed(message);
                } else {
                    console.group(message);
                }
            } else if (type == 'groupcollapsed'){
                console.groupCollapsed(message);
            } else if (type == 'groupend'){
                console.groupEnd(message);
            } else if (type == 'error'){
                console.error(message);
            } else if (type == 'warning'){
                console.warn(message);
            } else {
                console.log(message);
            }

            if (type == 'error' || this.getConfig('alwaysTrace')){
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
                appState.debugMessages.push(debugMessage);
            }
        }
        if (debugMessage && debugMessage.message && this.getConfig('debugToFile')){
            var messageLine = await this.getDebugMessageFileLine(_.cloneDeep(debugMessage));
            await _appWrapper.fileManager.writeFileSync(path.resolve(this.getConfig('debugMessagesFilename')), messageLine, {flag: 'a'});
        }

        if (appState && appState.allDebugMessages && _.isArray(appState.allDebugMessages)){
            appState.allDebugMessages.push(debugMessage);
        }
    }

    async getMessageFileLine(message){
        if (message.timestamp){
            message.timestamp = new Date().toISOString();
        }
        return JSON.stringify(message);
    }

    async getDebugMessageFileLine (message){
        var line = '';

        if (appState.debugToFileStarted){
            line += ',\n';
        } else {
            appState.debugToFileStarted = true;
        }

        line += await this.getMessageFileLine(message);
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

        var userMessage = {};
        var userMessageLevel = this.getStateVar('userMessageLevel', 0);
        var debugLevels = this.getStateVar('debugLevels');
        var typeLevel = debugLevels && debugLevels[type] ? debugLevels[type] : 0;
        var timestamp = new Date().toISOString().slice(11, 19);
        var iconClass = 'fa fa-info-circle';
        var umHelper = _appWrapper.getHelper('userMessage');

        if (type == 'warning'){
            iconClass = 'fa fa-exclamation-circle';
        } else if (type == 'error'){
            iconClass = 'fa fa-exclamation-triangle';
        }

        if (important){
            type += ' important';
        }

        if (!force){
            force = false;
        }

        if (message && (typeLevel > 2 || passToDebug || force)){
            this.log(message, type, data, true);
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

        userMessage = {
            count: 1,
            timestamps: [timestamp],
            timestamp: timestamp,
            message: message,
            iconClass: iconClass,
            type: type,
            force: force,
            active: userMessageLevel >= typeLevel,
            typeLevel: typeLevel
        };

        if (!message){
            userMessage.message = ' ';
            userMessage.type = 'delimiter';
            userMessage.timestamp = '';
            userMessage.iconClass = '';
        }

        if (force || typeLevel >= userMessageLevel){
            var maxUserMessages = this.getStateVar('maxUserMessages', 30);
            var messageCount = this.getStateVar('userMessages.length', 30);

            if (messageCount > maxUserMessages){
                var startIndex = messageCount - (maxUserMessages + 1);
                if (appState && appState.userMessages && _.isArray(appState.userMessages)){
                    appState.userMessages = appState.userMessages.slice(startIndex);
                }
            }

            if (appState && appState.userMessages && _.isArray(appState.userMessages)){
                appState.userMessageQueue.push(userMessage);
            }
        }

        if (userMessage && userMessage.type && userMessage.type != 'delimiter' && userMessage.message && this.getConfig('userMessagesToFile')){
            var messageLine = await this.getUserMessageFileLine(_.cloneDeep(userMessage));
            await window.getAppWrapper().fileManager.writeFileSync(path.resolve(this.getConfig('userMessagesFilename')), messageLine, {flag: 'a'});

        }

        if (appState && appState.allUserMessages && _.isArray(appState.allUserMessages)){
            appState.allUserMessages.push(userMessage);
        }

        umHelper.processUserMessageQueue();
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
}
exports.BaseClass = BaseClass;