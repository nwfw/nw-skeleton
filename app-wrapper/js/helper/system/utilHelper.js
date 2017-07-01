const _ = require('lodash');
const os = require('os');

const BaseClass = require('../../base').BaseClass;

var _appWrapper;
var appState;

class UtilHelper extends BaseClass {
    constructor() {
        super();

        _appWrapper = window.getAppWrapper();
        appState = _appWrapper.getAppState();

        _.noop(_appWrapper);
        _.noop(appState);

        this.boundMethods = {
            prevent: null
        };

        return this;
    }

    async initialize () {
        return await super.initialize();
    }

    getRandom (min, max){
        var random = Math.floor(Math.random() * (max - min + 1)) + min;
        return random;
    }

    getRandomString (size) {
        if (!size){
            size = 4;
        }
        var randomString = '';
        do {
            randomString += Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        } while (randomString.length < size);

        return randomString.substr(0, size);
    }

    toJson (value, minified){
        if (!value){
            return '';
        }

        var cache = [];
        var replacer = function(key, val) {
            if (_.isObject(val) && val !== null) {
                if (cache.indexOf(val) !== -1) {
                    return '__circular__';
                }
                cache.push(val);
            }
            return val;
        };
        value = JSON.stringify(value, replacer);
        if (!minified){
            value = JSON.parse(value);
            value = JSON.stringify(value, ' ', 4);
        }
        cache = null;
        return value;
    }

    preloadImageCallback (imgSrc, callback){
        var imgEl = document.createElement('img');
        if (callback && _.isFunction(callback)){
            imgEl.onload = () => {
                imgEl.onload = null;
                imgEl = null;
                callback();
            };
        }
        imgEl.src = imgSrc;
    }

    getArrayDuplicates (arr){
        var sorted_arr = arr.slice().sort();
        var results = [];
        for (var i = 0; i < arr.length - 1; i++) {
            if (sorted_arr[i + 1] == sorted_arr[i]) {
                results.push(sorted_arr[i]);
            }
        }
        return results;
    }

    copyToClipboard (text) {
        var clipboard = nw.Clipboard.get();
        clipboard.set(text, 'text');
    }

    pasteFromClipboard () {
        var clipboard = nw.Clipboard.get();
        return clipboard.get();
    }

    getControlObject (configValue, configName, path, isInner){
        if (!path){
            path = configName;
        } else {
            path += '.' + configName;
        }
        if (!isInner){
            isInner = false;
        }
        var objValue;
        var configVar = {
            path: path,
            name: configName,
            value: _.cloneDeep(configValue),
            controlData: null
        };
        var innerPath = path.replace(/^config\./, '');
        if (appState.config.configData.vars[innerPath] && appState.config.configData.vars[innerPath]['control']){
            configVar.formControl = 'form-control-' + appState.config.configData.vars[innerPath]['control'];
            configVar.type = appState.config.configData.vars[innerPath]['type'];
            if (appState.config.configData.vars[innerPath]['controlData']){
                configVar.controlData = appState.config.configData.vars[innerPath]['controlData'];
            }
        } else {
            if (_.isBoolean(configValue)){
                configVar.formControl = 'form-control-checkbox';
                configVar.type = 'boolean';
            } else if (_.isString(configValue)){
                configVar.formControl = 'form-control-text';
                configVar.type = 'string';
            } else if (_.isArray(configValue)){
                configVar.formControl = 'form-control-array';
                configVar.type = 'array';
                objValue = [];
                var values = _.cloneDeep(configValue);
                _.each(values, (value, name) => {
                    objValue.push(this.getControlObject(value, name, path));
                });
                configVar.value = _.cloneDeep(objValue);
            } else if (_.isObject(configValue) && configValue instanceof RegExp){
                configVar.formControl = 'form-control-text';
                configVar.type = 'string';
            } else if (_.isObject(configValue)){
                configVar.formControl = 'form-control-object';
                configVar.type = 'object';
                objValue = [];
                var keys = _.keys(configValue);
                for(var i=0; i<keys.length;i++){
                    var name = keys[i];
                    var value;
                    try {
                        value = configValue[keys[i]];
                    } catch (ex){
                        value = configValue[keys[i]];
                    }
                    var newObjValue = this.getControlObject(value, name, path, true);
                    objValue.push(newObjValue);
                }
                configVar.value = _.cloneDeep(objValue);
            } else {
                configVar.formControl = 'form-control-text';
                configVar.type = 'unknown';
            }
        }
        return configVar;
    }

    getPlatformData (){
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

        return {
            platform: platform,
            versions: process.versions
        };
    }

    isMac (){
        return this.getPlatformData().platform.isMac;
    }

    isWindows (){
        return this.getPlatformData().platform.isWindows;
    }

    isLinux (){
        return this.getPlatformData().platform.isLinux;
    }

    difference (original, modified) {
        var ret = {};
        var diff;
        for (var name in modified) {
            if (name in original) {
                if (_.isObject(modified[name]) && !_.isArray(modified[name])) {
                    diff = this.difference(original[name], modified[name]);
                    if (!_.isEmpty(diff)) {
                        ret[name] = diff;
                    }
                } else if (_.isArray(modified[name])) {
                    diff = this.difference(original[name], modified[name]);
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
    }

    getVarParent(varPath, context){
        if (!context){
            context = global;
        }
        let varChunks = varPath.split('.');
        let currentVar = false;
        if (varChunks && varChunks.length){
            currentVar = context[varChunks[0]];
        }
        if (!_.isUndefined(currentVar) && currentVar){
            for (let i=1; i<varChunks.length-1;i++){
                if (!_.isUndefined(currentVar[varChunks[i]])){
                    currentVar = currentVar[varChunks[i]];
                } else {
                    currentVar = false;
                }
            }
        }
        return currentVar;
    }

    getVar(varPath, context){
        if (!context){
            context = global;
        }
        let varChunks = varPath.split('.');
        let currentVar = false;
        if (varChunks && varChunks.length){
            currentVar = context[varChunks[0]];
        }
        if (!_.isUndefined(currentVar) && currentVar){
            for (let i=1; i<varChunks.length;i++){
                if (!_.isUndefined(currentVar[varChunks[i]])){
                    currentVar = currentVar[varChunks[i]];
                } else {
                    currentVar = false;
                }
            }
        }
        return currentVar;
    }

    setVar(varPath, value, context){
        if (!context){
            context = global;
        }
        let varChunks = varPath.split('.');
        let currentVar;
        let found = false;
        if (varChunks && varChunks.length){
            currentVar = context[varChunks[0]];
        }
        if (!_.isUndefined(currentVar) && currentVar){
            for (let i=1; i<varChunks.length-1;i++){
                if (!_.isUndefined(currentVar[varChunks[i]])){
                    found = true;
                    currentVar = currentVar[varChunks[i]];
                }
            }
            if (found){
                currentVar[varChunks[varChunks.length-1]] = value;
                return true;
            }
        }
        return false;
    }

    prevent (e){
        e.preventDefault();
    }

    quoteRegex (string) {
        return string.replace(/[.?*+^$[\]\\(){}|-]/g, '\\$&');
    }

    async pickLogFile (e) {
        let fileEl = e.target.parentNode.querySelector('.log-file-picker-input');
        fileEl.click();
    }

    async pickLogViewerFile (e) {
        let fileName = e.target.value;
        e.target.value = '';
        return await this.loadLogViewerFile(fileName);
    }

    async loadLogViewerFile (fileName) {
        let modalHelper = _appWrapper.getHelper('modal');
        modalHelper.modalBusy(_appWrapper.appTranslations.translate('Please wait...'));
        let fileValid = true;
        let messages;
        if (!fileName){
            this.addUserMessage(_appWrapper.appTranslations.translate('Please pick file'), 'error', []);
            fileValid = false;
        } else {
            if (!await _appWrapper.fileManager.isFile(fileName)){
                this.addUserMessage(_appWrapper.appTranslations.translate('File is not valid'), 'error', []);
                fileValid = false;
            } else {
                let fileContents = await _appWrapper.fileManager.loadFile(fileName);
                if (!fileContents){
                    this.addUserMessage(_appWrapper.appTranslations.translate('Problem reading file'), 'error', []);
                    fileValid = false;
                } else {
                    try {
                        messages = JSON.parse(fileContents);
                    } catch (ex) {
                        this.addUserMessage(_appWrapper.appTranslations.translate('Problem parsing file: "{1}"'), 'error', [ex.message]);
                        fileValid = false;
                    }
                }
            }
        }
        if (fileValid && messages && messages.length){
            let modalHelper = _appWrapper.getHelper('modal');
            appState.modalData.currentModal = _.cloneDeep(appState.logViewerModal);
            appState.modalData.currentModal.title = _appWrapper.appTranslations.translate('Log viewer');
            appState.modalData.currentModal.confirmButtonText = _appWrapper.appTranslations.translate('Load');
            appState.modalData.currentModal.cancelButtonText = _appWrapper.appTranslations.translate('Cancel');
            appState.modalData.currentModal.confirmDisabled = true;
            modalHelper.modalBusy(_appWrapper.appTranslations.translate('Please wait...'));
            _appWrapper._confirmModalAction = this.confirmLogViewerModalAction;
            _appWrapper.closeModalPromise = new Promise((resolve) => {
                appState.closeModalResolve = resolve;
            });

            appState.modalData.currentModal.fileMessages = _.map(messages, (msg) => {
                if (msg.type == 'group' || msg.type == 'groupend' || msg.type == 'groupcollapsed'){
                    msg.type = 'info';
                }
                return msg;
            });
            appState.modalData.currentModal.file = fileName;
            let types = _.uniq(_.map(messages, (msg) => {
                return msg.type;
            }));
            appState.modalData.currentModal.displayTypes = {};
            for (let i=0; i< types.length; i++){
                appState.modalData.currentModal.displayTypes[types[i]] = true;
            }
            modalHelper.openCurrentModal();
            appState.modalData.currentModal.dataLoaded = true;
            return _appWrapper.closeModalPromise;
        }
    }

    confirmLogViewerModalAction () {
        console.log('confirmLogViewerModalAction');
    }

    getMessageStacksCount (messages) {
        let stackCount = 0;
        for(let i=0; i<messages.length; i++){
            if (messages[i].stack && messages[i].stack.length){
                stackCount++;
            }
        }
        return stackCount;
    }

    getMessageStacksState (messages) {
        let stacksCount = this.getMessageStacksCount(messages);
        let stacksOpen = 0;
        for(let i=0; i<messages.length; i++){
            if (messages[i].stack && messages[i].stack.length){
                if (messages[i].stackVisible){
                    stacksOpen++;
                }
            }
        }
        return stacksOpen >= stacksCount;
    }

    propertyMap (obj, prepend){
        let keyMap = [];
        let objKeys = Object.keys(obj);
        if (!prepend){
            prepend = '';
        } else {
            prepend += '.';
        }
        for (let i=0; i<objKeys.length;i++){
            if (_.isArray(obj[objKeys[i]]) || _.isObject(obj[objKeys[i]])){
                keyMap = _.union(keyMap, this.propertyMap(obj[objKeys[i]], objKeys[i]));
            } else {
                keyMap.push(prepend + objKeys[i]);
            }
        }
        return keyMap;
    }

    noop () {
        return '';
    }
}

exports.UtilHelper = UtilHelper;