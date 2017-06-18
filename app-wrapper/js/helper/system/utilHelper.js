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

        return this;
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

        return platform;
    }

    isMac (){
        return this.getPlatformData().isMac;
    }

    isWindows (){
        return this.getPlatformData().isWindows;
    }

    isLinux (){
        return this.getPlatformData().isLinux;
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
}

exports.UtilHelper = UtilHelper;