var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'cancel-and-exit',
    template: '',
    data: function () {
        return appState.modalData;
    }
};