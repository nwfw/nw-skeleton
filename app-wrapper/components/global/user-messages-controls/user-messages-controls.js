/**
 * @fileOverview user-messages-controls component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.0
 */

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * User messages controls component
 *
 * @name user-messages-controls
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
    name: 'user-messages-controls',
    template: '',
    data: function () {
        return appState.userMessagesData;
    },
    computed: {
        appState: function(){
            return appState;
        },
        stacksState: function() {
            return _appWrapper.getHelper('userMessage').getUserMessageStacksState();
        },
        stacksCount: function() {
            return _appWrapper.getHelper('userMessage').getUserMessageStacksCount();
        }
    }
};