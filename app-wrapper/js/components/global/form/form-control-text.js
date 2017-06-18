var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'form-control-text',
    template: _appWrapper.appTemplates.getTemplateContents('form-control-text'),
    props: ['control'],
    data: function () {
        return appState.appInfo;
    },
    components: []
};