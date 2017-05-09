var _ = require('lodash');

var _appWrapper = window.getAppWrapper();
// var appUtil = _appWrapper.getAppUtil();
// var appState = appUtil.getAppState();

var MixinWrapperMethods  = {
    methods: {
        log: function(value){
            console.log(value);
        },
        toJson: function(value, minified){
            return _appWrapper.getHelper('util').toJson(value, minified);
        },
        def: function(){
            var value;
            if (arguments && arguments.length){
                value = arguments[0];
            }
            var defaultTexts = Array.prototype.slice.call(arguments, 1, arguments.length);
            if (_.isUndefined(value)){
                for(let i=0; i<defaultTexts.length;i++){
                    value = defaultTexts[i];
                    if (!_.isUndefined(value)){
                        break;
                    }
                }
            }
            if (_.isUndefined(value)){
                value = '';
            }
            return value;
        },
        callViewHandler: _appWrapper.callViewHandler.bind(_appWrapper)
    }
};
exports.mixin = MixinWrapperMethods;