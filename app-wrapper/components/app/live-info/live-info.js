var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'live-info',
    template: '',
    computed: {
        appStatusClassObject: function () {
            var appState = _appWrapper.getAppState();
            return {
                'fa-spin fa-refresh': appState.status.appStatus == 'busy',
                'fa-spin fa-cog': appState.status.appStatus == 'working',
                'fa-exclamation-triangle': appState.status.appStatus == 'error',
                'fa-check': appState.status.appStatus == 'success',
                'fa-ban': appState.status.appStatus == 'offline'
            };
        },
        appStatusWrapperClassObject: function () {
            var appState = _appWrapper.getAppState();
            return {
                '': appState.status.appStatus == 'idle',
                'busy': appState.status.appStatus == 'busy',
                'not-busy': appState.status.appStatus == 'success',
                'working': appState.status.appStatus == 'working',
                'error': appState.status.appStatus == 'error',
                'offline': appState.status.appStatus == 'offline'
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