var _appWrapper = window.getAppWrapper();
var appUtil = _appWrapper.getAppUtil();
var appState = appUtil.getAppState();

exports.component = {
    name: 'modal-body',
    template: _appWrapper.appTemplates.getTemplateContents('modal-body'),
    data: function () {
        return appState.modalData;
    }
};