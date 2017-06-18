var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'empty',
    template: '',
    props: ['control'],
    data: function () {
        return appState;
    },
    components: []
};