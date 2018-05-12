/**
 * @fileOverview app-loader component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * App loader component
 *
 * @name app-loader
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
    name: 'app-loader',
    template: '',
    props: ['title'],
    data: function () {
        return appState.appInfo;
    },
    methods: {
        getTitle() {
            if (this.title){
                return this.title;
            } else if (appState.mainLoaderTitle){
                return appState.mainLoaderTitle;
            } else {
                return '';
            }
        }
    },
    computed: {
        appState: function(){
            return appState;
        }
    }
};