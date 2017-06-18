var _ = require('lodash');
var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'debug-config-editor',
    template: '',
    data: function () {
        var appConfig = {
            liveCss: appState.config.liveCss,
            hideDebug: appState.config.hideDebug,
            debug: appState.config.debug,
            alwaysTrace: appState.config.alwaysTrace,
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