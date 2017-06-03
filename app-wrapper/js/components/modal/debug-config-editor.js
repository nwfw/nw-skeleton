var _ = require('lodash');
var _appWrapper = window.getAppWrapper();
var appUtil = _appWrapper.getAppUtil();
var appState = appUtil.getAppState();

exports.component = {
    name: 'debug-config-editor',
    template: _appWrapper.appTemplates.getTemplateContents('debug-config-editor'),
    data: function () {
        var appConfig = {
            liveCss: appState.config.liveCss,
            hideDebug: appState.config.hideDebug,
            debug: appState.config.debug,
            devTools: appState.config.devTools,
            debugGroupsCollapsed: appState.config.debugGroupsCollapsed
        };
        var config = _.map(appConfig, function(value, name){
            return _appWrapper.getHelper('util').getControlObject(value, name, 'config');
        });
        var forceDebug = _.map(appState.config.forceDebug, function(value, name){
            return _appWrapper.getHelper('util').getControlObject(value, name, 'config.forceDebug');
        });
        var forceUserMessages = _.map(appState.config.forceUserMessages, function(value, name){
            return _appWrapper.getHelper('util').getControlObject(value, name, 'config.forceUserMessages');
        });

        var data = {
            debugConfig: config,
            forceDebug: forceDebug,
            forceUserMessages: forceUserMessages
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