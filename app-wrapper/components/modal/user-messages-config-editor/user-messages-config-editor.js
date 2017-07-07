var _ = require('lodash');
var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'user-messages-config-editor',
    template: '',
    data: function () {
        var appConfig = {
            userMessagesToFile: appState.config.userMessages.userMessagesToFile,
            userMessagesToFileAppend: appState.config.userMessages.userMessagesToFileAppend,
            saveStacksToFile: appState.config.userMessages.saveStacksToFile,
            animateMessages: appState.config.userMessages.animateMessages,
            displayTimestamps: appState.config.userMessages.displayTimestamps,
            userMessageLevel: appState.config.userMessages.userMessageLevel,
        };
        var config = _.map(appConfig, function(value, name){
            return _appWrapper.getHelper('util').getControlObject(value, name, 'config.userMessages');
        });
        var forceUserMessages = _.map(appState.config.userMessages.forceUserMessages, function(value, name){
            return _appWrapper.getHelper('util').getControlObject(value, name, 'config.userMessages.forceUserMessages');
        });

        var data = {
            userMessagesConfig: config,
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