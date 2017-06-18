var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'live-info',
    template: '',
    computed: {
        appStatusClassObject: function () {
            var appState = _appWrapper.getAppState();
            return {
                'fa-spin fa-refresh': appState.appStatus == 'busy',
                'fa-spin fa-cog': appState.appStatus == 'working',
                'fa-exclamation-triangle': appState.appStatus == 'error',
                'fa-check': appState.appStatus == 'success',
                'fa-ban': appState.appStatus == 'offline'
            };
        },
        appStatusWrapperClassObject: function () {
            var appState = _appWrapper.getAppState();
            return {
                '': appState.appStatus == 'idle',
                'busy': appState.appStatus == 'busy',
                'not-busy': appState.appStatus == 'success',
                'working': appState.appStatus == 'working',
                'error': appState.appStatus == 'error',
                'offline': appState.appStatus == 'offline'
            };
        },
        appState: function(){
            return appState;
        }
    },
    data: function () {
        return appState.appInfo;
    }
};