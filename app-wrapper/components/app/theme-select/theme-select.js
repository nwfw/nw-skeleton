/**
 * @fileOverview theme-select component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.1.0
 * @memberOf components
 */

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * Theme select component
 *
 * @name theme-select
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
    name: 'theme-select',
    template: '',
    props: [],
    computed: {
        appState: function(){
            return appState;
        }
    },
    methods: {},
    watch: {},
    data: function () {
        return appState.appData;
    }
};