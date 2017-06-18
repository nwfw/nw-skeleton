var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'empty',
    template: _appWrapper.appTemplates.getTemplateContents('empty'),
    props: ['control'],
    data: function () {
        return appState;
    },
    components: []
};