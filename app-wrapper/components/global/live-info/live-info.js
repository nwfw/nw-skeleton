/**
 * @fileOverview live-info component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.2.1
 */

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * Live info component
 *
 * @name live-info
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
    name: 'live-info',
    template: '',
    props: ['dontDisplay', 'appStatusWrapperClassObject'],
    computed: {
        appStatusClassObject: function () {
            var appState = _appWrapper.getAppState();
            return {
                'fa-spin fa-refresh': appState.status.appStatus == 'busy',
                'fa-spin fa-cog': appState.status.appStatus == 'working',
                'fa-exclamation-triangle': appState.status.appStatus == 'error',
                'fa-check': appState.status.appStatus == 'success',
                'fa-ban': appState.status.appStatus == 'offline',
                'fa-check app-status-icon-placeholder': appState.status.appStatus == 'idle'

            };
        },
        appState: function(){
            return appState;
        }
    },
    data: function () {
        return appState.appInfo;
    }
};