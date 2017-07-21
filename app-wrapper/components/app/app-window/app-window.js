/**
 * @fileOverview app-window component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.1.0
 * @memberOf components
 */

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * App window component
 *
 * @name app-window
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
    name: 'app-window',
    template: '',
    props: ['state','isDebug'],
    data: function () {
        return appState.appData;
    },
    methods: {},
    watch: {},
    computed: {
        appState: function(){
            return appState;
        }
    },
    components: {}
};