var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'app-window',
    template: '',
    props: ['state','isDebug'],
    data: function () {
        return appState.appData;
    },
    computed: {
        appState: function(){
            return appState;
        }
    },
    components: {}
};