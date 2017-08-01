/**
 * @fileOverview app-debug-controls component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.2.1
 */

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * App debug controls component
 *
 * @name app-debug-controls
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
    name: 'app-debug-controls',
    template: '',
    props: ['debugMessageCount'],
    data: function () {
        return {
            config: appState.config
        };
    },
    computed: {
        appState: function(){
            return appState;
        },
        stacksState: function() {
            return _appWrapper.getHelper('debug').getDebugMessageStacksState();
        },
        stacksCount: function() {
            return _appWrapper.getHelper('debug').getDebugMessageStacksCount();
        }
    }
};