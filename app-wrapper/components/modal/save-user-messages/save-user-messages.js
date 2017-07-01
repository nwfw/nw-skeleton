var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'save-user-messages',
    template: '',
    data: function () {
        return appState.modalData;
    },
    computed: {
        appState: function(){
            return appState;
        }
    },
    mounted: function(){
        appState.modalData.currentModal.busy = false;
        appState.modalData.modalContentVisible = true;
    },
    methods: {
        callViewHandler: _appWrapper.callViewHandler.bind(_appWrapper)
    }
};