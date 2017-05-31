var _appWrapper = window.getAppWrapper();
var appUtil = _appWrapper.getAppUtil();
var appState = appUtil.getAppState();

exports.component = {
    name: 'app-window',
    template: _appWrapper.appTemplates.getTemplateContents('app-window'),
    props: ['state','isDebug'],
    data: function () {
        return appState;
    },
    components: {}
};