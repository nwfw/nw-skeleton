var _appWrapper = window.getAppWrapper();

var Filter = function (value, minified) {
    return _appWrapper.getHelper('util').toJson(value, minified);
};
exports.filter = Filter;