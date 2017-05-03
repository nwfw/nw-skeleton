var _appWrapper = window.getAppWrapper();
var appUtil = _appWrapper.getAppUtil();
var appState = appUtil.getAppState();

exports.component = {
    name: 'save-debug',
    template: _appWrapper.appTemplates.getTemplateContents('save-debug'),
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