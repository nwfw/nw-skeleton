var _appWrapper = window.getAppWrapper();
var appUtil = _appWrapper.getAppUtil();
var appState = appUtil.getAppState();

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