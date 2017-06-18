var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'form-control-checkbox',
    template: '',
    props: ['control'],
    data: function () {
        return appState.appInfo;
    },
    components: []
};