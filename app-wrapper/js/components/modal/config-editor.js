var _ = require('lodash');
var _appWrapper = window.getAppWrapper();
var appUtil = _appWrapper.getAppUtil();
var appState = appUtil.getAppState();

exports.component = {
    name: 'config-editor',
    template: _appWrapper.appTemplates.getTemplateContents('config-editor'),
    data: function () {
        var appConfig = _.cloneDeep(appState.configEditorData);
        var config = _.map(appConfig, function(value, name){
            return _appWrapper.getHelper('util').getControlObject(value, name, 'config');
        });

        var data = {
            config: config
        };

        return data;
    },
    computed: {
        appState: function(){
            return appState;
        },
        configEditorData: function(){
            return appState.configEditorData;
        }
    },
    components: []
};