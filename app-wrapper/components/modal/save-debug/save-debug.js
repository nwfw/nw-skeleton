var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'save-debug',
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
    }
};