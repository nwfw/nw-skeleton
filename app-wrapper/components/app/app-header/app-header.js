/**
 * @fileOverview app-header component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.2.1
 */

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * App header component
 *
 * @name app-header
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
    name: 'app-header',
    template: '',
    props: [],
    data: function () {
        return appState.headerData;
    },
    methods: {},
    watch: {},
    computed: {
        appState: function(){
            return appState;
        },
        appStatusWrapperClassObject: function () {
            var appState = _appWrapper.getAppState();
            return {
                'idle': appState.status.appStatus == 'idle',
                'busy': appState.status.appStatus == 'busy',
                'success': appState.status.appStatus == 'success',
                'working': appState.status.appStatus == 'working',
                'error': appState.status.appStatus == 'error',
                'offline': appState.status.appStatus == 'offline'
            };
        },
    },
    components: {}
};