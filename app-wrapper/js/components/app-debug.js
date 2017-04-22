var _appWrapper = window.getAppWrapper();
var appUtil = _appWrapper.getAppUtil();
var appState = appUtil.getAppState();

exports.component = {
    name: 'app-debug',
    template: window.getAppWrapper().templateContents.componentTemplates['app-debug'],
    data: function () {
        return {debugMessages: appState.debugMessages};
    },
    computed: {
        appState: function(){
            return appState;
        }
    },
    methods: {
        callViewHandler: _appWrapper.callViewHandler.bind(_appWrapper)
    }
};