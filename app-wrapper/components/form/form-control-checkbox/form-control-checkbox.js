/**
 * @fileOverview form-control-checkbox component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.2.0
 */

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * Form control checkbox component
 *
 * @name form-control-checkbox
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
    name: 'form-control-checkbox',
    template: '',
    props: ['control'],
    data: function () {
        return appState.appInfo;
    },
    components: []
};