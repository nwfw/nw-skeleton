var _ = require('lodash');
var path = require('path');
var fs = require('fs');
var os = require('os');


var appUtil = {

    forceDebug: false,
    forceUserMessage: false,

    log: async function(message, type, data, dontTranslate, force){
        var appState = this.getAppState();
        if (!data){
            data = [];
        }
        if (!type){
            type = 'info';
        }
        var debugLevel = this.getStateVar('debugLevel') || 0;
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

        // if (!dontTranslate && this.varExists('appTranslations.translationsLoaded', window.getAppWrapper()) && window.getAppWrapper().appTranslations.translationsLoaded){
        //  message = window.getAppWrapper().appTranslations.translate(message);
        // }

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

            var maxDebugMessages = this.getStateVar('maxDebugMessages') || 30;
            var messageCount = this.getStateVar('debugMessages.length') || 0;

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
            await window.getAppWrapper().fileManager.writeFileSync(path.resolve(this.getConfig('debugMessagesFilename')), messageLine, {flag: 'a'});
        }

        if (appState && appState.allDebugMessages && _.isArray(appState.allDebugMessages)){
            appState.allDebugMessages.push(debugMessage);
        }
    },

    getMessageFileLine: async function(message){
        if (message.timestamp){
            message.timestamp = new Date().toISOString();
        }
        return JSON.stringify(message);
    },

    getDebugMessageFileLine: async function(message){
        var appState = this.getAppState();
        var line = '';

        if (appState.debugToFileStarted){
            line += ',\n';
        } else {
            appState.debugToFileStarted = true;
        }

        line += await this.getMessageFileLine(message);
        return line;

    },

    getAppState: function(){
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
    },
    getStateVar: function(varPath){
        var appState = this.getAppState();
        var varValue;
        if (appState && this.varExists(varPath, appState)){
            varValue = this.getVar(varPath, appState);
        }
        return varValue;
    },
    getAbsolutePosition: function(element){
        var offsetLeft = element.offsetLeft;
        var offsetTop = element.offsetTop;
        var parent = element.parentNode;

        if (parent.tagName.toLowerCase() !== 'body'){
            var parentOffset = this.getAbsolutePosition(parent);
            offsetLeft += parentOffset.offsetLeft;
            offsetTop += parentOffset.offsetTop;
        }

        return {
            offsetLeft: offsetLeft,
            offsetTop: offsetTop
        };
    },
    addUserMessage: async function(message, type, data, important, dontTranslate, force, passToDebug){
        var appState = this.getAppState();
        if (!type){
            type = 'info';
        }
        var userMessage = {};
        var userMessageLevel = this.getStateVar('userMessageLevel') || 0;
        var debugLevels = this.getStateVar('debugLevels');
        var typeLevel = debugLevels && debugLevels[type] ? debugLevels[type] : 0;
        var timestamp = new Date().toISOString().slice(11, 19);
        var iconClass = 'fa fa-info-circle';

        if (message && (typeLevel > 2 || passToDebug)){
            this.log(message, type, data, dontTranslate);
        }

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

        if (message && !dontTranslate && window && window.getAppWrapper() && window.getAppWrapper().appTranslations && window.getAppWrapper().appTranslations.translate){
            message = window.getAppWrapper().appTranslations.translate(message);
        }


        if (message && message.match && message.match(/{(\d+)}/) && _.isArray(data) && data.length) {
            message = message.replace(/{(\d+)}/g, function replaceMessageData(match, number) {
                var index = number - 1;
                return !_.isUndefined(data[index]) ? data[index] : match;
            });
        }

        userMessage = {
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
            var maxUserMessages = this.getStateVar('maxUserMessages') || 30;
            var messageCount = this.getStateVar('userMessages.length') || 30;

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
        this.processUserMessageQueue();
    },

    getUserMessageFileLine: async function(message){
        var appState = this.getAppState();
        var line = '';

        if (appState.userMessagesToFileStarted){
            line += ',\n';
        } else {
            appState.userMessagesToFileStarted = true;
        }

        line += await this.getMessageFileLine(message);
        return line;

    },

    processUserMessageQueue: function(){
        var appState = this.getAppState();
        var messageCount = appState.userMessageQueue.length;
        clearInterval(appState.intervals.userMessageQueue);
        if (messageCount && !appState.userMessagesData.selectFocused){
            appState.intervals.userMessageQueue = setInterval(this.unQueueUserMessage.bind(this), 1);
        }
    },

    unQueueUserMessage: function(){
        if (window){
            var appState = this.getAppState();
            var _appWrapper = window.getAppWrapper();
            if (_appWrapper){
                if (appState.userMessageQueue && appState.userMessageQueue.length){
                    var userMessage = appState.userMessageQueue.shift();
                    if (userMessage){
                        appState.userMessages.push(userMessage);
                    }
                } else {
                    clearInterval(appState.intervals.userMessageQueue);
                }
            } else {
                clearInterval(appState.intervals.userMessageQueue);
            }
        } else {
            clearInterval(appState.intervals.userMessageQueue);
        }
    },

    loadFilesFromDir: async function(directory, extensionMatch, requireFiles) {
        var self = this;
        var filesData = {};
        var extRegex;

        if (!extensionMatch){
            extRegex = /.*/;
        } else if (_.isString(extensionMatch)){
            extensionMatch = extensionMatch.replace(/^\//, '').replace(/\/$/, '').replace(/[^\\]$/, '').replace(/[^\\]\./, '');
            extRegex = new RegExp(extensionMatch);
        } else {
            extRegex = extensionMatch;
            extensionMatch = (extensionMatch + '').replace(/^\//, '').replace(/\/$/, '');
        }

        // directory = path.resolve(directory);

        if (fs.existsSync(directory)){
            var stats = fs.statSync(directory);
            if (stats.isDirectory()){
                appUtil.log('Loading files from \'{1}\'...', 'debug', [directory], false, self.forceDebug);
                var files = fs.readdirSync(directory);

                var eligibleFiles = _.filter(files, function checkFileExtension(file){
                    var fileStats = fs.statSync(path.join(directory, file));
                    if (fileStats.isFile()){
                        return true;
                    } else {
                        appUtil.log('Omitting file \'{1}\' - file is a directory.', 'debug', [file], false, self.forceDebug);
                    }
                });

                eligibleFiles = _.filter(eligibleFiles, function checkFileExtension(file){
                    if (file.match(extRegex)){
                        return true;
                    } else {
                        appUtil.log('Omitting file \'{1}\', extension invalid.', 'debug', [file], false, self.forceDebug);
                    }
                });

                eligibleFiles = _.map(eligibleFiles, function getFullFilePath(file){
                    return path.join(directory, file);
                });


                var filesToLoad = _.filter(eligibleFiles, function checkFileStat(file){
                    var fileStat = fs.statSync(file);
                    if (fileStat.isFile()){
                        return true;
                    } else {
                        appUtil.log('Omitting file \'{1}\', not a file.', 'warning', [path.basename(file)], false, self.forceDebug);
                    }
                });

                if (filesToLoad && filesToLoad.length){
                    appUtil.log('Found {1} eligible files of {2} total files in \'{3}\'...', 'debug', [filesToLoad.length, files.length, directory], false, self.forceDebug);

                    for (var i =0 ; i < filesToLoad.length; i++){
                        var fullPath = filesToLoad[i];
                        var fileName = path.basename(fullPath);
                        var fileIdentifier = fileName;
                        if (extensionMatch){
                            fileIdentifier = fileIdentifier.replace(new RegExp(extensionMatch), '');
                        }
                        filesData[fileIdentifier] = await this.loadFile(fullPath, requireFiles);
                    }
                } else {
                    appUtil.log('No eligible files found in \'{1}\'...', 'debug', [directory], false, self.forceDebug);
                }
            } else {
                appUtil.log('Directory \'{1}\' is not a directory!', 'error', [directory], false, this.forceDebug);
                filesData = false;
            }
        } else {
            appUtil.log('Directory \'{1}\' does not exist!', 'error', [directory], false, this.forceDebug);
            filesData = false;
        }
        return filesData;
    },

    loadFile: async function(filePath, requireFile){
        var fileData = null;
        var fileName = path.basename(filePath);
        var directory = path.dirname(filePath);

        appUtil.log('* Loading file \'{1}\' from \'{2}\'...', 'debug', [fileName, directory], false, self.forceDebug);
        if (!requireFile){
            fileData = fs.readFileSync(filePath, {encoding: 'utf8'}).toString();
        } else {
            fileData = require(path.resolve(filePath));
            if (fileData.exported){
                fileData = require(filePath).exported;
            } else {
                var fileKeys = _.keys(fileData);
                if (fileKeys && fileKeys.length && fileKeys[0] && fileData[fileKeys[0]]){
                    appUtil.log('* While requiring file \'{1}\' from \'{2}\', \'exported\' key was not found, using \'{3}\' instead.', 'debug', [fileName, directory, fileKeys[0]], false, self.forceDebug);
                    fileData = fileData[fileKeys[0]];
                } else {
                    fileData = null;
                    appUtil.log('* Problem Loading file \'{1}\' from \'{2}\', in order to require file, it has to export value \'exported\'!', 'error', [fileName, directory], false, self.forceDebug);
                }
            }
        }
        if (fileData){
            appUtil.log('* Successfully loaded file \'{1}\' from \'{2}\'...', 'debug', [fileName, directory], false, self.forceDebug);
        } else {
            appUtil.log('* Failed loading file \'{1}\' from \'{2}\'...', 'error', [fileName, directory], false, self.forceDebug);
        }
        return fileData;
    },

    varExists: function(varPath, context){
        if (!context){
            context = window;
        }
        var varChunks = varPath.split('.');
        var currentVar = false;
        if (varChunks && varChunks.length){
            currentVar = context[varChunks[0]];
        }
        if (!_.isUndefined(currentVar) && currentVar){
            for (var i=1; i<varChunks.length;i++){
                if (!_.isUndefined(currentVar[varChunks[i]])){
                    currentVar = currentVar[varChunks[i]];
                } else {
                    return false;
                }
            }
        }
        return currentVar;
    },

    getVar: function(varPath, context){
        if (!context){
            context = window;
        }
        var value = _.get(context, varPath);
        return value;
    },

    nextTick: async function(){
        var returnPromise = new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, 0);
        });
        return returnPromise;
    },
    onNextTick: async function(callable){
        await this.nextTick();
        callable();
    },
    wait: async function(duration){
        appUtil.log('Waiting {1} ms', 'debug', [duration], false, this.forceDebug);
        var returnPromise = new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, duration);
        });
        return returnPromise;
    },

    difference: function(original, modified) {
        var ret = {};
        var diff;
        for (var name in modified) {
            if (name in original) {
                if (_.isObject(modified[name]) && !_.isArray(modified[name])) {
                    diff = appUtil.difference(original[name], modified[name]);
                    if (!_.isEmpty(diff)) {
                        ret[name] = diff;
                    }
                } else if (_.isArray(modified[name])) {
                    diff = appUtil.difference(original[name], modified[name]);
                    if (!_.isEmpty(diff)) {
                        ret[name] = diff;
                    }
                } else if (!_.isEqualWith(original[name], modified[name], function(originalValue, modifiedValue){ return originalValue == modifiedValue; })) {
                    ret[name] = modified[name];
                }
            } else {
                ret[name] = modified[name];
            }
        }
        return ret;
    },

    mergeDeep: function(){
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
    },

    finalizeLogs: async function(){
        if (this.getConfig('debugToFile')){
            var debugLogContents = '[\n' + fs.readFileSync(path.resolve(this.getConfig('debugMessagesFilename'))) + '\n]';
            await window.getAppWrapper().fileManager.writeFileSync(path.resolve(this.getConfig('debugMessagesFilename')), debugLogContents, {flag: 'w'});
        }

        if (this.getConfig('userMessagesToFile')){
            var messageLogContents = '[\n' + fs.readFileSync(path.resolve(this.getConfig('userMessagesFilename'))) + '\n]';
            await window.getAppWrapper().fileManager.writeFileSync(path.resolve(this.getConfig('userMessagesFilename')), messageLogContents, {flag: 'w'});
        }

        return true;
    },

    getConfig: function(name){
        var path = name;
        var value;
        if (!path.match(/^config\./)){
            path = 'config.' + name;
        }
        value = this.getVar(path, appState);
        if (_.isUndefined(value)){
            path = name;
            if (!path.match(/^appWrapperConfig\./)){
                path = 'appWrapperConfig.' + name;
            }
            value = this.getVar(path, appState.u);
        }
        if (_.isUndefined(value)){
            path = name;
            if (!path.match(/^userConfig\./)){
                path = 'userConfig.' + name;
            }
            value = this.getVar(path, appState.u);
        }
        return value;
    },

    getBaseClass: function(){
        return require('./base').BaseClass;
    },
    randomString: function(size) {
        if (!size){
            size = 4;
        }
        var randomString = '';
        do {
            randomString += Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        } while (randomString.length < size);

        return randomString.substr(0, size);
    },

    getPlatformData: function(){
        var name = os.platform();
        var platform = {
            isLinux: false,
            isMac: false,
            isWindows: false,
            isWindows8: false,
            version: os.release()
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

        return platform;
    },

    isMac: function(){
        return this.getPlatformData().isMac;
    },

    isWindows: function(){
        return this.getPlatformData().isWindows;
    },

    isLinux: function(){
        return this.getPlatformData().isLinux;
    }
};

exports.appUtil = appUtil;