var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'app-loader',
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