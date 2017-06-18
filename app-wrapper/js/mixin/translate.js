var _ = require('lodash');

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

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