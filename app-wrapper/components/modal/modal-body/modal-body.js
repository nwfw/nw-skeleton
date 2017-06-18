var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'modal-body',
    template: '',
    data: function () {
        return appState.modalData;
    }
};