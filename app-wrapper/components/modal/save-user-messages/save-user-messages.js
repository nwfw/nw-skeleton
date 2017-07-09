var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'save-user-messages',
    template: '',
    data: function () {
        return appState.modalData.currentModal;
    },
    methods: {
        saveFileClick: async function(e){
            return await _appWrapper.getHelper('userMessage').saveUserMessagesFileClick(e);
        },
        saveFileChange: async function(e){
            return await _appWrapper.getHelper('userMessage').saveUserMessagesFileChange(e);
        },
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