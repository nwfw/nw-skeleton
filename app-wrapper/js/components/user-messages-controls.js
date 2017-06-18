var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'user-messages-controls',
    template: _appWrapper.appTemplates.getTemplateContents('user-messages-controls'),
    methods: {
        callViewHandler: _appWrapper.callViewHandler.bind(_appWrapper)
    },
    data: function () {
        return appState.userMessagesData;
    },
    computed: {
        appState: function(){
            return appState;
        }
    }
};