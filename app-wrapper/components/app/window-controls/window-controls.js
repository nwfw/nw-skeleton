var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'window-controls',
    template: '',
    data: function () {
        return appState.windowData;
    },
    computed: {
        appState: function(){
            return appState;
        }
    }
};