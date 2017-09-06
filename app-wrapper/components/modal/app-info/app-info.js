/**
 * @fileOverview app-info component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * App info component
 *
 * @name app-info
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
    name: 'app-info',
    template: '',
    data: function () {
        return appState.modalData;
    },
    methods: {
        openHomePage: function(){
            _appWrapper.getHelper('util').openExternalUrl(appState.manifest.homepage);
        },
        openWrapperHomePage: function(){
            _appWrapper.getHelper('util').openExternalUrl(appState.wrapperManifest.homepage);
        },
        openEmail: function(){
            let email = 'mailto:' + appState.manifest.author.replace(/^[^<]+</, '').replace(/>/, '');
            _appWrapper.getHelper('util').openExternalUrl(email);
        }
    }
};