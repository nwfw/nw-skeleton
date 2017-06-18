var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'app-loader-spinner',
    template: _appWrapper.appTemplates.getTemplateContents('app-loader-spinner'),
    data: function () {
        return appState.appInfo;
    },
    computed: {
        appState: function(){
            return appState;
        }
    }
};