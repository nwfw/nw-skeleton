var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'app-error',
    template: _appWrapper.appTemplates.getTemplateContents('app-error'),
    data: function () {
        return appState.appInfo;
    },
    computed: {
        appState: function(){
            return appState;
        }
    }
};