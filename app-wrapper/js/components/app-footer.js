var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

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