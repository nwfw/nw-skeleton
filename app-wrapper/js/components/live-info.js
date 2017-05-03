var _appWrapper = window.getAppWrapper();
var appUtil = _appWrapper.getAppUtil();
var appState = appUtil.getAppState();

exports.component = {
    name: 'live-info',
    template: _appWrapper.appTemplates.getTemplateContents('live-info'),
    computed: {
        appStatusClassObject: function () {
            var appState = appUtil.getAppState();
            return {
                'fa-spin fa-circle-o-notch': appState.appBusy,
                'fa-spin fa-cog': appState.appStatus == 'working',
                'fa-exclamation-triangle': appState.appStatus == 'error',
                'fa-check': appState.appStatus == 'idle' && !appState.appBusy,
                'fa-ban': appState.appStatus == 'offline'
            };
        },
        appStatusWrapperClassObject: function () {
            var appState = appUtil.getAppState();
            return {
                'busy': appState.appBusy,
                'not-busy': !appState.appBusy && appState.appStatus == 'idle',
                'working': appState.appStatus == 'working',
                'error': appState.appStatus == 'error'
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