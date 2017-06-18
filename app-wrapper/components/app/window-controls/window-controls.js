var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'window-controls',
    template: '',
    methods: {
        callViewHandler: _appWrapper.callViewHandler.bind(_appWrapper),
    },
    data: function () {
        return appState.windowData;
    },
    computed: {
        appState: function(){
            return appState;
        }
    }
};