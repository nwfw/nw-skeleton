var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'user-messages',
    template: '',
    props: ['listOnly', 'hideStacks'],
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