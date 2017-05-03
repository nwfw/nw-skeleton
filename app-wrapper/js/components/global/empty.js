var _appWrapper = window.getAppWrapper();
var appUtil = _appWrapper.getAppUtil();
var appState = appUtil.getAppState();

exports.component = {
    name: 'empty',
    template: _appWrapper.appTemplates.getTemplateContents('empty'),
    props: ['control'],
    data: function () {
        return appState;
    },
    components: []
};