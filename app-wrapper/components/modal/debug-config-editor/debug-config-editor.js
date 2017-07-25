/**
 * @fileOverview debug-config-editor component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.1.0
 */

const _ = require('lodash');
var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * Debug config editor component
 *
 * @name debug-config-editor
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
    name: 'debug-config-editor',
    template: '',
    data: function () {
        var appConfig = {
            enabled: appState.config.debug.enabled,
            hideDebug: appState.config.debug.hideDebug,
            debugGroupsCollapsed: appState.config.debug.debugGroupsCollapsed,
            alwaysTrace: appState.config.debug.alwaysTrace,
            debugToFile: appState.config.debug.debugToFile,
            debugLevel: appState.config.debug.debugLevel,
            messagesExpanded: appState.config.debug.messagesExpanded,
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