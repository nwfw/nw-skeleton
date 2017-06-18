var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'theme-select',
    template: _appWrapper.appTemplates.getTemplateContents('theme-select'),
    computed: {
        appState: function(){
            return appState;
        }
    },
    data: function () {
        return appState;
    }
};