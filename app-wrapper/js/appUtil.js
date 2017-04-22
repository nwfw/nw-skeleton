var _ = require('lodash');
var path = require('path');
var fs = require('fs');

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
        if (debugMessage && debugMessage.message && appState.config.debugToFile){
            var messageLine = await this.getDebugMessageFileLine(_.cloneDeep(debugMessage));
            fs.writeFileSync(path.resolve(appState.config.debugMessagesFilename), messageLine, {flag: 'a'});
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
        if (win && win.appState){
            return win.appState;
        } else {
            var appWrapperState = require('./appState').appState;
            if (win){
                win.appState = appWrapperState;
            }
            return appWrapperState;
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

        if (message && (typeLevel > 1 || passToDebug)){
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

        if (userMessage && userMessage.type && userMessage.type != 'delimiter' && userMessage.message && appState.config.userMessagesToFile){
            var messageLine = await this.getUserMessageFileLine(_.cloneDeep(userMessage));
            fs.writeFileSync(path.resolve(appState.config.userMessagesFilename), messageLine, {flag: 'a'});

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
                    // var transitionDuration = parseFloat(_appWrapper.helpers.htmlHelper.getCssVarValue('--short-animation-duration'), 10) * 1000;
                    var userMessage = appState.userMessageQueue.shift();
                    if (userMessage){
                        appState.userMessages.push(userMessage);
                        var ul = document.querySelector('ul.user-message-list');
                        clearTimeout(appState.timeouts.scrollTo);
                        if (ul){
                            appState.timeouts.scrollTo = setTimeout( () => {
                                // _appWrapper.helpers.htmlHelper.scrollElementTo(ul, ul.scrollHeight, transitionDuration);
                                _appWrapper.helpers.htmlHelper.scrollElementTo(ul, ul.scrollHeight, 0);
                            }, 100);
                        }
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

    formatDuration: function (time) {
        var _appWrapper = window.getAppWrapper();
        if (isNaN(time)){
            time = 0;
        }

        var sec_num = parseInt(time, 10);

        var days   = Math.floor(sec_num / 86400);

        var hours   = Math.floor((sec_num - (days * 86400)) / 3600);

        var minutes = Math.floor((sec_num - (hours * 3600) - (days * 86400)) / 60);

        var seconds = sec_num - (days * 86400) - (hours * 3600) - (minutes * 60);

        if (!time){
            var num = parseInt(Math.random() * 100 / 33, 10);
            var val = '';
            for (var i = 0; i<num; i++){
                val += '.';
            }
            return val;
        }

        var hasDays = false;
        if (days){
            hasDays = true;
        }

        var hasHours = false;
        if (hours){
            hasHours = true;
        }

        if (hours   < 10) {
            hours   = '0' + hours;
        }

        if (minutes < 10) {
            minutes = '0' + minutes;
        }

        if (seconds < 10) {
            seconds = '0' + seconds;
        }

        var formattedTime;
        if (hasDays){
            formattedTime = days + ' ' + _appWrapper.appTranslations.translate('days') + ' ' + hours + ':' + minutes + ':' + seconds;
        } else if (hasHours){
            formattedTime = hours + ':' + minutes + ':' + seconds;
        } else {
            formattedTime = minutes + ':' + seconds;
        }

        return formattedTime;
    },

    formatDate: function (date, options, includeTime) {
        var appState = this.getAppState();

        var defaultOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        };

        if (includeTime) {
            defaultOptions.hour = '2-digit';
            defaultOptions.minute = '2-digit';
            defaultOptions.second = '2-digit';
        }

        var dateOptions = defaultOptions;

        if (options){
            dateOptions = _.defaults(defaultOptions, options);
        }

        var formattedDate = date.toLocaleString(appState.config.currentLocale, dateOptions);
        return formattedDate;
    },

    formatDateNormalize: function(date, options, includeTime, omitSeconds){

        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();

        var hours = date.getHours();
        var minutes = date.getMinutes();
        var seconds = date.getSeconds();

        if (month < 10){
            month = '0' + month;
        }


        if (day < 10){
            day = '0' + day;
        }

        if (hours < 10){
            hours = '0' + hours;
        }

        if (minutes < 10){
            minutes = '0' + minutes;
        }
        if (seconds < 10){
            seconds = '0' + seconds;
        }

        var formattedDate = year + '-' + month + '-' + day;

        if (includeTime) {
            formattedDate += ' ';
            formattedDate += hours;
            formattedDate += ':' + minutes;
            if (!omitSeconds) {
                formattedDate += ':' + seconds;
            }
        }

        return formattedDate;

    },

    _processUserMessageScroll: function(){
        var _appWrapper = window.getAppWrapper();
        var ul = document.querySelector('ul.user-message-list');
        _appWrapper.helpers.htmlHelper.scrollElementTo(ul, ul.scrollHeight + 100, 300);

        // clearTimeout(appState.timeouts.userMessageScroll);
        // appState.timeouts.userMessageScroll = setTimeout(() => {
        //  var ul = el.querySelector('ul');
        //  ul.scrollTop = ul.scrollHeight + 100;
        // }, 0);
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
                    appUtil.log('No eligible files found in \'{1}\'...', 'warning', [directory], false, self.forceDebug);
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
        return _.get(context, varPath);
    },

    nextTick: async function(){
        var returnPromise = new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, 0);
        });
        return returnPromise;
    },
    wait: async function(duration){
        appUtil.log('Waiting {1} ms', 'info', [duration], false, true);
        var returnPromise = new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, duration);
        });
        return returnPromise;
    },

    difference: function(template, override) {
        var ret = {};
        var diff;
        for (var name in template) {
            if (name in override) {
                if (_.isObject(override[name]) && !_.isArray(override[name])) {
                    diff = appUtil.difference(template[name], override[name]);
                    if (!_.isEmpty(diff)) {
                        ret[name] = diff;
                    }
                } else if (_.isArray(override[name])) {
                    diff = appUtil.difference(template[name], override[name]);
                    if (!_.isEmpty(diff)) {
                        ret[name] = diff;
                    }
                } else if (!_.isEqualWith(template[name], override[name], function(one, two){ return one == two; })) {
                    ret[name] = override[name];
                }
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
        var appState = this.getAppState();
        if (appState.config.debugToFile){
            var debugLogContents = '[\n' + fs.readFileSync(path.resolve(appState.config.debugMessagesFilename)) + '\n]';
            fs.writeFileSync(path.resolve(appState.config.debugMessagesFilename), debugLogContents, {flag: 'w'});
        }

        if (appState.config.userMessagesToFile){
            var messageLogContents = '[\n' + fs.readFileSync(path.resolve(appState.config.userMessagesFilename)) + '\n]';
            fs.writeFileSync(path.resolve(appState.config.userMessagesFilename), messageLogContents, {flag: 'w'});
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
        if (!value){
            path = name;
            if (!path.match(/^appWrapperConfig\./)){
                path = 'appWrapperConfig.' + name;
            }
            value = this.getVar(path, appState.u);
        }
        if (!value){
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
    }
};

exports.appUtil = appUtil;