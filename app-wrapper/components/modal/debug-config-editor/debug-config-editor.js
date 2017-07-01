var _ = require('lodash');
var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'debug-config-editor',
    template: '',
    data: function () {
        var appConfig = {
            liveCss: appState.config.liveCss,
            hideDebug: appState.config.debug.hideDebug,
            enabled: appState.config.debug.enabled,
            alwaysTrace: appState.config.debug.alwaysTrace,
            devTools: appState.config.debug.devTools,
            debugGroupsCollapsed: appState.config.debug.debugGroupsCollapsed
        };
        var config = _.map(appConfig, function(value, name){
            if (name == 'liveCss'){
                return _appWrapper.getHelper('util').getControlObject(value, name, 'config');
            } else {
                return _appWrapper.getHelper('util').getControlObject(value, name, 'config.debug');
            }
        });
        var forceDebug = _.map(appState.config.debug.forceDebug, function(value, name){
            return _appWrapper.getHelper('util').getControlObject(value, name, 'config.debug.forceDebug');
        });
        var forceUserMessages = _.map(appState.config.userMessages.forceUserMessages, function(value, name){
            return _appWrapper.getHelper('util').getControlObject(value, name, 'config.userMessages.forceUserMessages');
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