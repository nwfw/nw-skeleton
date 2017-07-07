var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'user-messages-controls',
    template: '',
    data: function () {
        return appState.userMessagesData;
    },
    computed: {
        appState: function(){
            return appState;
        },
        stacksState: function() {
            return _appWrapper.getHelper('userMessage').getUserMessageStacksState();
        },
        stacksCount: function() {
            return _appWrapper.getHelper('userMessage').getUserMessageStacksCount();
        }
    }
};