var _ = require('lodash');

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

var TranslateMixin  = {
    created: function(){
        _.noop(appState);
    },

    methods: {
        translate: function (label, currentLanguage, data) {
            return _appWrapper.appTranslations.translate(label, currentLanguage, data);
        }
    }
};
exports.mixin = TranslateMixin;