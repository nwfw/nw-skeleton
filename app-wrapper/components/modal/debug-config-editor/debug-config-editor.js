var _ = require('lodash');
var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'debug-config-editor',
    template: '',
    data: function () {
        var appConfig = {
            enabled: appState.config.debug.enabled,
            hideDebug: appState.config.debug.hideDebug,
            debugGroupsCollapsed: appState.config.debug.debugGroupsCollapsed,
            alwaysTrace: appState.config.debug.alwaysTrace,
            debugToFile: appState.config.debug.debugToFile,
            debugToFileAppend: appState.config.debug.debugToFileAppend,
            saveStacksToFile: appState.config.debug.saveStacksToFile,
            animateMessages: appState.config.debug.animateMessages,
            liveCss: appState.config.liveCss,
            devTools: appState.config.debug.devTools,
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