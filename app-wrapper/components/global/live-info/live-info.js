/**
 * @fileOverview live-info component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
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
            let status = appState.status.appStatus;
            return {
                'fa-spin fa-refresh': status == 'busy',
                'fa-spin fa-cog': status == 'working',
                'fa-exclamation-triangle': status == 'error' || status == 'warning',
                'fa-check': status == 'success',
                'fa-ban': status == 'offline',
                'fa-check app-status-icon-placeholder': status == 'idle'
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