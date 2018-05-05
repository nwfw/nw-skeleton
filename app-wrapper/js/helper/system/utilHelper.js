/**
 * @fileOverview UtilHelper class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

const _ = require('lodash');
const nodeCrypto = require('crypto');
// const os = require('os');
const randomWords = require('random-words');
const AppBaseClass = require('../../lib/appBase').AppBaseClass;

var _appWrapper;
var appState;

/**
 * UtilHelper class - contains various utility methods
 *
 * @class
 * @extends {appWrapper.AppBaseClass}
 * @memberof appWrapper.helpers.systemHelpers
 */
class UtilHelper extends AppBaseClass {

    /**
     * Creates UtilHelper instance
     *
     * @constructor
     * @return {UtilHelper}              Instance of UtilHelper class
     */
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

    /**
     * Returns random number between min and max
     *
     * @param  {Number} min Minimum value for random number
     * @param  {Number} max Maximum value for random number
     * @return {Number}     Random number
     */
    getRandom (min, max){
        let random = Math.floor(Math.random() * (max - min + 1)) + min;
        return random;
    }

    /**
     * Returns random string
     *
     * @param  {Number} size Size of the string (default is 4)
     * @return {string}      Random string
     */
    getRandomString (size) {
        if (!size){
            size = 4;
        }
        let randomString = '';
        do {
            randomString += Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        } while (randomString.length < size);

        return randomString.substr(0, size);
    }

    /**
     * Returns random sentence
     *
     * @param  {Number} minWords   Minimum number of words in the sentence
     * @param  {Number} maxWords   Maximum number of words in the sentence
     * @return {string}            Random sentence
     */
    getRandomSentence (minWords = 1, maxWords = 6) {
        if (minWords < 1){
            minWords = 1;
        }
        if (maxWords < minWords){
            maxWords = minWords;
        }
        let randomSentence = randomWords({min: minWords, max: maxWords}).join(' ');
        randomSentence = randomSentence.substr(0, 1).toUpperCase() + randomSentence.substr(1);
        return randomSentence;
    }

    /**
     * Converts object to JSON and returns it
     *
     * @param  {mixed} value        Value to convert
     * @param  {boolean} minified   Flag to minify JSON output
     * @return {string}             JSON representation of value from the argument
     */
    toJson (value, minified){
        if (!value){
            return '';
        }

        let cache = [];
        let replacer = function(key, val) {
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

    /**
     * Preloads image on page and calls callback when finished
     *
     * @param  {string}   imgSrc   Image URL
     * @param  {Function} callback Callback function
     * @return {undefined}
     */
    preloadImageCallback (imgSrc, callback){
        let imgEl = document.createElement('img');
        if (callback && _.isFunction(callback)){
            imgEl.onload = () => {
                imgEl.onload = null;
                imgEl = null;
                callback();
            };
        }
        imgEl.src = imgSrc;
    }

    /**
     * Finds duplicates in array and returns them
     *
     * @param  {array} arr Array to search
     * @return {array}     Array of duplicate values
     */
    getArrayDuplicates (arr){
        let sorted_arr = arr.slice().sort();
        let results = [];
        for (let i = 0; i < arr.length - 1; i++) {
            if (sorted_arr[i + 1] == sorted_arr[i]) {
                results.push(sorted_arr[i]);
            }
        }
        return results;
    }

    /**
     * Returns control object to be used in form-control component
     *
     * @param  {mixed}  configValue     Value of variable
     * @param  {string}  configName     Name of variable
     * @param  {string}  path           Path to variable in configuration
     * @param  {Object}  options        Object with additional control options
     * @param  {Boolean} isInner        Flag to indicate whether method called itself for complex vars
     * @return {Object}                 Form control object for the var
     */
    getControlObject (configValue, configName, path, options, isInner){
        if (!options){
            options = {};
        }

        options = _.defaults(options, {
            disabled: false,
            required: false,
            readonly: false,
            rowErrorText: ''
        });

        if (!path){
            path = configName;
        } else {
            path += '.' + configName;
        }
        if (!isInner){
            isInner = false;
        }
        let objValue;
        let configVar = {
            wrapperClasses: [],
            fullPath: 'appState.' + path,
            path: path,
            readonly: options.readonly,
            disabled: options.disabled,
            required: options.required,
            rowErrorText: options.rowErrorText,
            error: false,
            name: configName,
            value: _.cloneDeep(configValue),
            controlData: null
        };
        let innerPath = path.replace(/^config\./, '');
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
                let values = _.cloneDeep(configValue);
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
                let keys = _.keys(configValue);
                for(let i=0; i<keys.length;i++){
                    let name = keys[i];
                    let value;
                    try {
                        value = configValue[keys[i]];
                    } catch (ex){
                        value = configValue[keys[i]];
                    }
                    let newObjValue = this.getControlObject(value, name, path, {}, true);
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

    /**
     * Calculates deep difference between objects or arrays
     *
     * @param  {(Object|array)} original Original array or object
     * @param  {(Object|array)} modified Modified array or object
     * @return {(Object|array)}          Differences in arrays or objects
     */
    difference (original, modified) {
        let ret = {};
        let diff;
        for (let name in modified) {
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

    /**
     * Returns var value using path and context from arguments
     *
     * @param  {string}     varPath     Path to the var (i.e. 'appConfig.theme')
     * @param  {Object}     context     Object that is base context for search (default: global)
     * @return {mixed}                  Found var value or undefined if no var found
     */
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

    /**
     * Returns var value using path and context from arguments
     *
     * @param  {string}     varPath     Path to the var (i.e. 'appConfig.theme')
     * @param  {Object}     context     Object that is base context for search (default: global)
     * @return {mixed}                  Found var value or undefined if no var found
     */
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

    /**
     * Sets var value based on path and context
     *
     * @param  {string}     varPath     Path to the var (i.e. 'appConfig.theme')
     * @param  {mixed}      value       New var value
     * @param  {Object}     context     Object that is base context for search (default: global)
     * @return {undefined}
     */
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

    /**
     * Prevents default for passed event
     *
     * @param  {Event} e Event that should be prevented
     * @return {undefined}
     */
    prevent (e){
        e.preventDefault();
    }

    /**
     * Quotes string so it can be used in regex safely
     *
     * @param  {string} string String to quote
     * @return {string}        Save regex-quoted string
     */
    quoteRegex (string) {
        return string.replace(/[/.?*+^$[\]\\(){}|-]/g, '\\$&').replace(/\s/g, '\\s');
    }

    /**
     * Handler for opening log file for log-viewer component picking dialog
     *
     * @async
     * @param  {Event} e Event that triggered the method
     * @return {undefined}
     */
    async pickLogFile (e) {
        let fileEl = e.target.parentNode.querySelector('.log-file-picker-input');
        fileEl.click();
    }

    /**
     * Handler for loading log file for log-viewer component
     *
     * @async
     * @param  {Event} e Event that triggered the method
     * @return {undefined}
     */
    async pickLogViewerFile (e) {
        let fileName = e.target.value;
        e.target.value = '';
        return await this.loadLogViewerFile(fileName);
    }

    /**
     * Loads log viewer file and displays it in modal log-viewer component
     *
     * @async
     * @param  {string} fileName Absolute path to log file
     * @return {undefined}
     */
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
                confirmButtonText: this.translate('Close'),
                busy: true,
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

    /**
     * Log viewer modal action confirm
     *
     * @return {undefined}
     */
    confirmLogViewerModalAction () {
        _appWrapper.cancelModalAction();
    }

    /**
     * Gets stack counts for messages
     *
     * @param {Object} messages Message objects to count
     * @return {Number} Number of messages with stack data
     */
    getMessageStacksCount (messages) {
        let stackCount = 0;
        for(let i=0; i<messages.length; i++){
            if (messages[i].stack && messages[i].stack.length){
                stackCount++;
            }
        }
        return stackCount;
    }

    /**
     * Gets current stack state for messages
     *
     * @param {Object[]} messages Messages to get state for
     * @return {Number} Number of unopened stack messages
     */
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

    /**
     * Returns deep property map for object
     *
     * @param  {Object} obj     Object for mapping
     * @param  {string} prepend String to prepend for property map items
     * @return {string[]}       An array of property paths (i.e. ['a','a.b','a.c'])
     */
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

    /**
     * Gets deep property map with values
     *
     * @param  {Object} obj     Object for mapping
     * @param  {string} prepend String to prepend for property map items
     * @return {Object}         Property map with values (i.e {'a.b': 'c','d':'e'})
     */
    propertyValuesMap (obj, prepend){
        let keyMap = [];
        if (obj && _.isObject(obj)){
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
        }
        return keyMap;
    }

    /**
     * Empty method placeholder
     *
     * @return {string} Empty string
     */
    noop () {
        return '';
    }

    /**
     * Sets object values using form data from passed form element
     *
     * @async
     * @param {HTMLElement} form            Form element
     * @param {Object}      source          Source object to use for final data
     * @param {boolean}     keepFirstChunk  Flag to indicate whether to keep first chunk from form elements data-path attributes
     * @return {Object}                     Object with populated data from form
     */
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

    /**
     * Handler that saves user message or debug logs
     *
     * @async
     * @param  {Event} e Event that triggered the method
     * @return {undefined}
     */
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

    /**
     * Returns UUID string
     *
     * @return {string} UUID string
     */
    uuid () {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
    }

    /**
     * Opens external url in system default browser
     *
     * @param  {string} url Url to open
     * @return {undefined}
     */
    openExternalUrl (url){
        nw.Shell.openExternal(url);
    }

    /**
     * Sorts object properties by key and returns sorted copy
     *
     * @param  {Object}  object Object to sort
     * @param  {Boolean} deep   Perform deep sorting
     * @return {Object}         Sorted object copy
     */
    sortObject(object, deep) {
        let sorted = {};
        let key;
        let array = [];

        for (key in object) {
            if (object.hasOwnProperty(key)) {
                array.push(key);
            }
        }

        array.sort();

        for (key = 0; key < array.length; key++) {
            sorted[array[key]] = object[array[key]];
            if (deep && _.isObject(sorted[array[key]])){
                sorted[array[key]] = this.sortObject(sorted[array[key]], deep);
            }
        }
        return sorted;
    }

    /**
     * Extracts and returns command line params object
     *
     * @return {Object} Command line params object
     */
    getCommandParams () {
        let args = {};
        if (nw.App.argv && nw.App.argv.length){
            for (let i=0; i<nw.App.argv.length; i++){
                let arg = nw.App.argv[i];
                let argChunks = arg.split('=');
                let argName = argChunks[0];
                let argValue = true;
                if (argChunks.length > 1){
                    argValue = argChunks.slice(1).join('=');
                    if (argValue === 'true' || argValue === '1'){
                        argValue = true;
                    } else if (argValue === 'false' || argValue === '0'){
                        argValue = false;
                    }
                }
                args[argName] = argValue;
            }
        }
        return args;
    }

    /**
     * Checks for command params and executes all their handlers
     *
     * @async
     * @param  {Object} paramsMap Command params map from configuration
     * @return {undefined}
     */
    async executeCommandParams (paramsMap){
        let args = this.getCommandParams();
        let argNames = Object.keys(args);
        if (args && argNames.length){
            for (let i=0; i<paramsMap.length; i++){
                let paramData = paramsMap[i];
                let paramName = paramData.name;
                if (_.includes(argNames, paramName)) {
                    let methodName = paramData.method;
                    let paramValue = args[paramName];
                    if (paramName && methodName){
                        let methodParams = [];
                        if (paramData.value){
                            methodParams.push(paramValue);
                        }
                        await _appWrapper.callObjMethod(methodName, methodParams);
                    }
                }
            }
        }
    }

    /**
     * Returns unix timestamp for date parameter or current timestamp if parameter is not an instance of Date
     *
     * @param  {Date|String}    date            String or Date object for which timestamp should be returned (defaults to current datetime)
     * @param  {Boolean}        milliseconds    Flag to indicate whether to return milliseconds value
     * @return {Number}         Integer of float representing unix timestamp
     */
    getUnixTimestamp (date, milliseconds = false) {
        let timestamp;
        if (date === false || date === true){
            milliseconds = date;
            date = new Date();
        }
        if (!date){
            date = new Date();
        } else if (!_.isDate(date)){
            date = new Date(date);
        }

        timestamp = date.getTime() / 1000;
        if (!milliseconds){
            timestamp = parseInt(timestamp, 10);
        }
        return timestamp;
    }

    /**
     * Helper method for serializing functions in objects
     *
     * @param {String}      key   Function name
     * @param {Function}    value Function
     * @return {String}     Serialized function
     */
    functionSerializer(key, value) {
        if (typeof(value) === 'function') {
            return value.toString();
        }
        return value;
    }

    /**
     * Helper method for unserializing functions in objects
     *
     * @param {String}      key   Function name
     * @param {String}      value Serialized function
     * @return {Function}   Unserialized function
     */
    functionUnserializer (key, value) {
        if (key === ''){
            return value;
        }
        if (typeof value === 'string') {
            // let rfunc = /function[^\(]*\(([^\)]*)\)[^\{]*{([^\}]*)\}/;
            let rfunc = /function[^(]*\(([^)]*)\)[^{]*{([^}]*)\}/;
            let match = value.match(rfunc);

            if (match && match.length > 2) {
                let args = match[1].split(',').map(function(arg) {
                    return arg.replace(/\s+/, '');
                });
                return new Function(args, match[2]);
            }
        }
        return value;
    }

    /**
     * Helper method to serialize objects with functions
     *
     * @param  {Object}         obj         Object for serialization
     * @param  {Boolean|Number} prettyPrint Pretty JSON format flag (true/false) or number of spaces (default: 4)
     * @return {String}                     Serialized object
     */
    serializeObject (obj, prettyPrint = false) {
        if (!prettyPrint){
            return JSON.stringify(obj, this.functionSerializer);
        } else {
            let spaces = 4;
            if (_.isInteger(prettyPrint) && prettyPrint) {
                spaces = prettyPrint;
            }
            return JSON.stringify(obj, this.functionSerializer, spaces);
        }
    }

    /**
     * Helper method to unserialize objects with functions
     *
     * @param  {String} objString Serialized object
     * @return {Object}           Unserialized object
     */
    unserializeObject (objString) {
        return JSON.parse(objString, this.functionUnserializer);
    }

    /**
     * Encrypts text and returns encrypted value
     *
     * @param  {String} text      Text to encrypt
     * @param  {String} password  Encryption password
     * @param  {String} algorithm Algorhitm (default 'aes-256-ctr')
     * @return {String}           Encrypted text
     */
    encryptText(text, password, algorithm = 'aes-256-ctr') {
        let cipher = nodeCrypto.createCipher(algorithm, password);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

    /**
     * Decrypts text and returns decrypted value
     *
     * @param  {String} text      Text to decrypt
     * @param  {String} password  Decryption password
     * @param  {String} algorithm Algorhitm (default 'aes-256-ctr')
     * @return {String}           decrypted text
     */
    decryptText(text, password, algorithm = 'aes-256-ctr') {
        let decipher = nodeCrypto.createDecipher(algorithm, password);
        let decrypted = decipher.update(text, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}

exports.UtilHelper = UtilHelper;