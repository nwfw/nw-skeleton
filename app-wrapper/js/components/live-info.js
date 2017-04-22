var _appWrapper = window.getAppWrapper();
var appUtil = _appWrapper.getAppUtil();
var appState = appUtil.getAppState();

exports.component = {
    name: 'live-info',
    template: _appWrapper.templateContents.componentTemplates['live-info'],
    computed: {
        appStatusClassObject: function () {
            var appState = appUtil.getAppState();
            return {
                'fa-spin fa-circle-o-notch': appState.appBusy,
                'fa-check': !appState.appBusy
            };
        },
        appStatusWrapperClassObject: function () {
            var appState = appUtil.getAppState();
            return {
                'busy': appState.appBusy,
                'not-busy': !appState.appBusy
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