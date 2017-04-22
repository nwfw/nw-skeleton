var _appWrapper = window.getAppWrapper();
var appUtil = _appWrapper.getAppUtil();
var appState = appUtil.getAppState();

exports.component = {
    name: 'language-select',
    template: _appWrapper.templateContents.componentTemplates['language-select'],
    methods: {
        callViewHandler: _appWrapper.callViewHandler.bind(_appWrapper)
    },
    computed: {
        appState: function(){
            return appState;
        }
    },
    data: function () {
        return appState.languageData;
    }
};