var _ = require('lodash');

var _appWrapper = window.getAppWrapper();
var appUtil = _appWrapper.getAppUtil();
var appState = appUtil.getAppState();

var TranslateMixin  = {
    created: function(){
        _.noop(appState);
    },

    methods: {
        translate: function (label, currentLanguage) {
            return _appWrapper.appTranslations.translate(label, currentLanguage);
        }
    }
};
exports.mixin = TranslateMixin;