var _appWrapper = window.getAppWrapper();
var appUtil = _appWrapper.getAppUtil();
var appState = appUtil.getAppState();

exports.component = {
    name: 'app-footer',
    template: _appWrapper.appTemplates.getTemplateContents('app-footer'),
    data: function () {
        return appState.footerData;
    },
    computed: {
        appState: function(){
            return appState;
        }
    },
    components: {}
};