var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'app-debug',
    template: '',
    data: function () {
        return {
            debugMessages: appState.debugMessages,
            debugMessageCount: appState.debugMessages.length
        };
    },
    computed: {
        appState: function(){
            return appState;
        }
    }
};