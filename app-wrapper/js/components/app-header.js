var _appWrapper = window.getAppWrapper();
var appUtil = _appWrapper.getAppUtil();
var appState = appUtil.getAppState();

exports.component = {
    name: 'app-header',
    template: _appWrapper.appTemplates.getTemplateContents('app-header'),
    data: function () {
        return appState.headerData;
    },
    computed: {
        appState: function(){
            return appState;
        }
    },
    components: {}
};