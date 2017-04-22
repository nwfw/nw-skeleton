var _appWrapper = window.getAppWrapper();
var appUtil = _appWrapper.getAppUtil();
var appState = appUtil.getAppState();

exports.component = {
    name: 'progress-bar',
    template: _appWrapper.templateContents.componentTemplates.progress,
    data: function () {
        return appState.progressData;
    },
    computed: {
        progressData: function(){
            return appState.progressData;
        }
    }
};