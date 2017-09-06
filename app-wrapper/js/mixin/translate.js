/**
 * @fileOverview translate mixin file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

const _ = require('lodash');
var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

/**
 * Translate mixin
 *
 * @name translate
 * @memberOf mixins
 */
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