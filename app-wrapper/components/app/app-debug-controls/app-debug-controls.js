var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'app-debug-controls',
    template: '',
    props: ['debugMessageCount'],
    data: function () {
        return {
            config: appState.config
        };
    },
    computed: {
        appState: function(){
            return appState;
        },
        stacksState: function() {
            return _appWrapper.getHelper('debug').getDebugMessageStacksState();
        },
        stacksCount: function() {
            return _appWrapper.getHelper('debug').getDebugMessageStacksCount();
        }
    }
};