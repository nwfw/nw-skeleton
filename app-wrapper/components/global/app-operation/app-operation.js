/**
 * @fileOverview app-operation component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.0
 */

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * App operation component
 *
 * @name app-operation
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
    name: 'app-operation',
    template: '',
    props: [],
    data: function () {
        return appState.appOperation;
    },
    methods: {},
    watch: {},
    computed: {
        appState: function(){
            return appState;
        },
        appStatusWrapperClassObject: function () {
            let status = appState.status.appStatus;
            return {
                'app-operation-idle': status == 'idle',
                'app-operation-busy': status == 'busy',
                'app-operation-success': status == 'success',
                'app-operation-working': status == 'working',
                'app-operation-warning': status == 'warning',
                'app-operation-error': status == 'error',
                'app-operation-offline': status == 'offline'
            };
        },
    },
    components: {}
};