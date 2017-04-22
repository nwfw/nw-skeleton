var _appWrapper = window.getAppWrapper();
var appUtil = _appWrapper.getAppUtil();
var appState = appUtil.getAppState();

exports.component = {
    name: 'form-control-textarea',
    template: _appWrapper.templateContents.componentTemplates['form-control-textarea'],
    props: ['control'],
    data: function () {
        return appState.appInfo;
    },
    components: []
};