var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'form-control-checkbox-styled',
    template: _appWrapper.appTemplates.getTemplateContents('form-control-checkbox-styled'),
    props: ['control'],
    data: function () {
        return appState.appInfo;
    },
    components: []
};