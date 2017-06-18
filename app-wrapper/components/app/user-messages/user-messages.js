var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'user-messages',
    template: '',
    methods: {
        callViewHandler: _appWrapper.callViewHandler.bind(_appWrapper)
    },
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