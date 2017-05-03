var _appWrapper = window.getAppWrapper();
var appUtil = _appWrapper.getAppUtil();
var appState = appUtil.getAppState();

exports.component = {
    name: 'form-control-text',
    template: _appWrapper.appTemplates.getTemplateContents('form-control-text'),
    props: ['control'],
    data: function () {
        return appState.appInfo;
    },
    components: []
};