var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'modal-body',
    template: _appWrapper.appTemplates.getTemplateContents('modal-body'),
    data: function () {
        return appState.modalData;
    }
};