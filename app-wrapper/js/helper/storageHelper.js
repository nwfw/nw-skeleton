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
        var returnValue;
        if (localStorage && localStorage.getItem && _.isFunction(localStorage.getItem)){
            var savedValue = localStorage.getItem(name);
            if (savedValue){
                try {
                    returnValue = JSON.parse(savedValue);
                } catch (ex) {
                    console.error(ex);
                }
            } else {
                returnValue = savedValue;
            }
        }
        return returnValue;
    }


}

exports.StorageHelper = StorageHelper;