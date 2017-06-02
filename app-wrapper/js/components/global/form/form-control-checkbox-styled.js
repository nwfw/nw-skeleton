var _appWrapper = window.getAppWrapper();
var appUtil = _appWrapper.getAppUtil();
var appState = appUtil.getAppState();

exports.component = {
    name: 'form-control-checkbox-styled',
    template: _appWrapper.appTemplates.getTemplateContents('form-control-checkbox-styled'),
    props: ['control'],
    data: function () {
        return appState.appInfo;
    },
    components: []
};