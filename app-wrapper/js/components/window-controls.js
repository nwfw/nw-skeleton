var _appWrapper = window.getAppWrapper();
var appUtil = _appWrapper.getAppUtil();
var appState = appUtil.getAppState();

exports.component = {
    name: 'window-controls',
    template: _appWrapper.appTemplates.getTemplateContents('window-controls'),
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