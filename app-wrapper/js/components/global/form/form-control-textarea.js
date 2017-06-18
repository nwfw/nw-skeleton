var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'form-control-textarea',
    template: _appWrapper.appTemplates.getTemplateContents('form-control-textarea'),
    props: ['control'],
    data: function () {
        return appState.appInfo;
    },
    components: []
};