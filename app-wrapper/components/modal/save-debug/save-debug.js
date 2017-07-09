var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'save-debug',
    template: '',
    data: function () {
        return appState.modalData.currentModal;
    },
    methods: {
        saveFileClick: async function(e){
            return await _appWrapper.getHelper('debug').saveDebugFileClick(e);
        },
        saveFileChange: async function(e){
            return await _appWrapper.getHelper('debug').saveDebugFileChange(e);
        },
    },
    computed: {
        appState: function(){
            return appState;
        }
    },
    mounted: function(){
        let modalHelper = _appWrapper.getHelper('modal');
        modalHelper.modalNotBusy();
        appState.modalData.modalContentVisible = true;
    }
};