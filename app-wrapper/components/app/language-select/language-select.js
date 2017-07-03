var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'language-select',
    template: '',
    computed: {
        appState: function(){
            return appState;
        }
    },
    data: function () {
        return appState.languageData;
    }
};