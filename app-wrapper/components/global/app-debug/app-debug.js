/**
 * @fileOverview app-debug component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * App debug component
 *
 * @name app-debug
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
    name: 'app-debug',
    template: '',
    data: function () {
        return {
            debugMessages: appState.debugMessages,
            debugMessageCount: appState.debugMessages.length
        };
    },
    methods: {

    },
    computed: {
        appState: function(){
            return appState;
        }
    }
};