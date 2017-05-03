var _ = require('lodash');

var _appWrapper = window.getAppWrapper();
// var appUtil = _appWrapper.getAppUtil();
// var appState = appUtil.getAppState();

var Filter = function (value, minified) {
    return _appWrapper.app.getHelper('util').toJson(value, minified);
};
exports.filter = Filter;