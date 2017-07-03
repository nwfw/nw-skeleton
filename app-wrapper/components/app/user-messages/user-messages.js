var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'user-messages',
    template: '',
    data: function () {
        return appState.userMessagesData;
    },
    components: {},
    computed: {
        appState: function(){
            return appState;
        }
    }
};