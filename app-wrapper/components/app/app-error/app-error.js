var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'app-error',
    template: '',
    data: function () {
        return appState.appInfo;
    },
    computed: {
        appState: function(){
            return appState;
        }
    }
};