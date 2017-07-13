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
            if (!_.isUndefined(currentVar) && currentVar){
                if (varChunks.length > 1){
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
                } else {
                    currentVar = value;
                    return true;
                }
            }
        }
        return false;
    }

    prevent (e){
        e.preventDefault();
    }

    quoteRegex (string) {
        return string.replace(/[.?*+^$[\]\\(){}|-]/g, '\\$&').replace(/\s/g, '\\s');
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
        let fileValid = true;
        let messages;
        if (!fileName){
            this.addUserMessage(this.translate('Please pick file'), 'error', []);
            fileValid = false;
        } else {
            if (!await _appWrapper.fileManager.isFile(fileName)){
                this.addUserMessage(this.translate('File is not valid'), 'error', []);
                fileValid = false;
            } else {
                let fileContents = await _appWrapper.fileManager.loadFile(fileName);
                if (!fileContents){
                    this.addUserMessage(this.translate('Problem reading file'), 'error', []);
                    fileValid = false;
                } else {
                    try {
                        messages = JSON.parse(fileContents);
                    } catch (ex) {
                        this.addUserMessage(this.translate('Problem parsing file: "{1}"'), 'error', [ex.message]);
                        fileValid = false;
                    }
                }
            }
        }
        if (fileValid && messages && messages.length){
            let modalHelper = _appWrapper.getHelper('modal');
            let types = _.uniq(_.map(messages, (msg) => {
                return msg.type;
            }));
            let displayTypes = {};
            for (let i=0; i< types.length; i++){
                displayTypes[types[i]] = true;
            }

            let modalOptions = {
                title: this.translate('Log viewer'),
                confirmButtonText: this.translate('Load'),
                cancelButtonText: this.translate('Cancel'),
                confirmDisabled: true,
                busy: true,
                busyText: this.translate('Please wait...'),
                file: fileName,
                fileMessages: _.map(messages, (msg) => {
                    if (msg.type == 'group' || msg.type == 'groupend' || msg.type == 'groupcollapsed'){
                        msg.type = 'info';
                    }
                    return msg;
                }),
                displayTypes: displayTypes,
                dataLoaded: true,
            };
            _appWrapper._confirmModalAction = this.confirmLogViewerModalAction;

            modalHelper.openModal('logViewerModal', modalOptions);
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
                keyMap = _.union(keyMap, this.propertyMap(obj[objKeys[i]], prepend + objKeys[i]));
            } else {
                keyMap.push(prepend + objKeys[i]);
            }
        }
        return keyMap;
    }

    propertyValuesMap (obj, prepend){
        let keyMap = [];
        let objKeys = Object.keys(obj);
        if (!prepend){
            prepend = '';
        } else {
            prepend += '.';
        }
        for (let i=0; i<objKeys.length;i++){
            if (_.isArray(obj[objKeys[i]]) || _.isObject(obj[objKeys[i]])){
                keyMap = _.merge(keyMap, this.propertyValuesMap(obj[objKeys[i]], objKeys[i]));
            } else {
                keyMap[prepend + objKeys[i]] = obj[objKeys[i]];
            }
        }
        return keyMap;
    }

    noop () {
        return '';
    }

    async setObjectValuesFromForm (form, source, keepFirstChunk) {
        if (!source){
            source = {};
        }
        let newObject = _.cloneDeep(source);
        let finalObject = {};
        _.each(form, (input) => {
            if (!input.hasClass('modal-dialog-button') && input.hasAttribute('data-path')){
                let path = input.getAttribute('data-path');
                var currentObject = newObject;
                var dataPath = path;
                if (dataPath && dataPath.split){
                    var pathChunks;
                    if (keepFirstChunk){
                        pathChunks = dataPath.split('.');
                    } else {
                        pathChunks = _.drop(dataPath.split('.'), 1);
                    }
                    var chunkCount = pathChunks.length - 1;
                    _.each(pathChunks, (pathChunk, i) => {
                        if (i == chunkCount){
                            if (input.getAttribute('type') == 'checkbox'){
                                currentObject[pathChunk] = input.checked;
                            } else {
                                currentObject[pathChunk] = input.value;
                            }
                        } else {
                            if (_.isUndefined(currentObject[pathChunk])){
                                currentObject[pathChunk] = {};
                            }
                        }
                        currentObject = currentObject[pathChunk];
                    });
                }
            }
        });
        var oldObject = _.cloneDeep(source);
        var difference = this.difference(oldObject, newObject);

        if (difference && _.isObject(difference) && _.keys(difference).length){
            finalObject = _appWrapper.mergeDeep({}, source, difference);
        } else {
            finalObject = _.cloneDeep(source);
        }
        return finalObject;
    }

    async confirmSaveLogAction (e){
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        let modalHelper = _appWrapper.getHelper('modal');
        modalHelper.setModalVar('saveFileError', false);
        modalHelper.clearModalMessages();

        var filePath = modalHelper.getModalVar('file');
        var saveAll = modalHelper.getModalVar('saveAll');
        let overwriteAction = modalHelper.getModalVar('overwriteAction');
        let append = overwriteAction == 'append';

        if (filePath){
            modalHelper.modalBusy();
            await _appWrapper.wait(this.getConfig('shortPauseDuration'));
            var saved = true;
            var writeMode = 'w';

            let previousMessages = [];
            let canAppend = true;
            if (append){
                let fileContents = await _appWrapper.fileManager.readFileSync(filePath, {encoding:'utf8'});
                if (fileContents){
                    try {
                        previousMessages = JSON.parse(fileContents);
                    } catch (ex) {
                        canAppend = false;
                        this.addModalMessage('Can not parse file contents for appending!', 'error', []);
                        this.log('Can not parse file contents for appending!', 'error', []);
                    }
                }
            }

            if (append && !canAppend){
                modalHelper.modalNotBusy();
                return;
            }

            let modalName = modalHelper.getModalVar('name');
            let messages;
            let saveStacks;
            if (modalName == 'save-user-messages'){
                messages = _.cloneDeep(appState.userMessages);
                if (saveAll){
                    messages = _.cloneDeep(appState.allUserMessages);
                }
                saveStacks = this.getConfig('userMessages.saveStacksToFile', false);
            } else {
                messages = _.cloneDeep(appState.debugMessages);
                if (saveAll){
                    messages = _.cloneDeep(appState.allDebugMessages);
                }
                saveStacks = this.getConfig('debug.saveStacksToFile', false);
            }



            let processedMessages = _.map(messages, (message) => {
                if (message.stackVisible){
                    message.stackVisible = false;
                }
                delete message.force;
                delete message.active;
                if (!saveStacks){
                    delete message.stackVisible;
                    delete message.stack;
                }
                return message;
            });

            processedMessages = _.union(previousMessages, processedMessages);

            var data = JSON.stringify(processedMessages, ' ', 4);

            try {
                await _appWrapper.fileManager.writeFileSync(filePath, data, {
                    encoding: 'utf8',
                    mode: 0o775,
                    flag: writeMode
                });
            } catch (e) {
                saved = false;
                this.log('Problem saving log file "{1}" - {2}', 'error', [filePath, e]);
            }

            if (saved){
                if (appState.isDebugWindow){
                    this.log('Log file saved successfully', 'info', [], true);
                } else {
                    this.addUserMessage('Log file saved successfully', 'info', [], true,  false, true);
                }
                _appWrapper._confirmModalAction = () => {
                    modalHelper.closeCurrentModal();
                };
                modalHelper.setModalVars({
                    title: this.translate('Operation successful'),
                    body: this.translate('Log file saved successfully'),
                    bodyComponent: 'modal-body',
                    confirmButtonText: this.translate('Close'),
                    autoCloseTime: 5000,
                });
                modalHelper.autoCloseModal();
            } else {
                if (appState.isDebugWindow){
                    this.log('Log saving failed', 'error', [], true);
                } else {
                    this.addUserMessage('Log saving failed', 'error', [], false,  false);
                }
                this.addModalMessage('Log saving failed', 'error', [], false,  false);
            }
            modalHelper.modalNotBusy();
        }
    }

    uuid () {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
    }
}

exports.UtilHelper = UtilHelper;