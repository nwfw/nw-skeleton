var _ = require('lodash');
var BaseClass = require('../base').BaseClass;

var _appWrapper;
var appUtil;
var appState;

class UtilHelper extends BaseClass {
    constructor() {
        super();

        _appWrapper = this.getAppWrapper();
        appUtil = this.getAppUtil();
        appState = this.getAppState();

        _.noop(_appWrapper);
        _.noop(appState);
        _.noop(appUtil);

        this.forceDebug = appUtil.getConfig('forceDebug.utilHelper');
        this.forceUserMessages = appUtil.getConfig('forceUserMessages.utilHelper');

        return this;
    }

    getRandom (min, max){
        var random = Math.floor(Math.random() * (max - min + 1)) + min;
        return random;
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


}

exports.UtilHelper = UtilHelper;