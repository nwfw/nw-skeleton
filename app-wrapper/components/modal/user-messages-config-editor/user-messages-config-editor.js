/**
 * @fileOverview user-messages-config-editor component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * User messages config editor component
 *
 * @name user-messages-config-editor
 * @memberOf components
 * @property {string}   name        Name of the component
 * @property {string}   template    Component template contents
 * @property {string[]} props       Component properties
 * @property {Function} data        Data function
 * @property {Object}   methods     Component methods
 * @property {Object}   watch       Component watchers
 * @property {Object}   computed    Computed properties
 * @property {Object}   components  Child components
 */
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