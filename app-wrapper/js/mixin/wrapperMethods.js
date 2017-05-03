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
        callViewHandler: _appWrapper.callViewHandler.bind(_appWrapper)
    }
};
exports.mixin = MixinWrapperMethods;