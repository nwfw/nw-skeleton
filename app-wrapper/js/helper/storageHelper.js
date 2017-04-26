var _ = require('lodash');
var BaseClass = require('../base').BaseClass;

var _appWrapper;
var appUtil;
var appState;


class StorageHelper extends BaseClass {
    constructor() {
        super();

        _appWrapper = this.getAppWrapper();
        appUtil = this.getAppUtil();
        appState = this.getAppState();

        _.noop(_appWrapper);
        _.noop(appState);
        _.noop(appUtil);

        this.forceDebug = appUtil.getConfig('forceDebug.storageHelper');
        this.forceUserMessages = appUtil.getConfig('forceUserMessages.storageHelper');

        return this;
    }

    async set (name, value){
        var returnValue = null;
        var savedValue;
        if (localStorage && localStorage.setItem && _.isFunction(localStorage.setItem)){
            savedValue = JSON.stringify(value);
            localStorage.setItem(name, savedValue);
            returnValue = savedValue == localStorage.getItem(name);
        }
        return returnValue;
    }

    async get (name){
        var returnValue = null;
        if (localStorage && localStorage.getItem && _.isFunction(localStorage.getItem)){
            var savedValue = localStorage.getItem(name);
            try {
                returnValue = JSON.parse(savedValue);
            } catch (ex) {
                console.error(ex);
            }
        }
        return returnValue;
    }


}

exports.StorageHelper = StorageHelper;