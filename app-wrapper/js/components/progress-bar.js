var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'progress-bar',
    template: _appWrapper.appTemplates.getTemplateContents('progress'),
    data: function () {
        return appState.progressData;
    },
    computed: {
        progressData: function(){
            return appState.progressData;
        }
    }
};