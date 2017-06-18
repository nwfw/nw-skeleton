var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'form-control-object',
    template: _appWrapper.appTemplates.getTemplateContents('form-control-object'),
    props: ['control'],
    data: function () {
        return appState.appInfo;
    },
    components: []
};