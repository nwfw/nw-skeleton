/**
 * @fileOverview cancel-and-exit component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.0
 */

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * Cancel and exit component
 *
 * @name cancel-and-exit
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
    name: 'cancel-and-exit',
    template: '',
    data: function () {
        return appState.modalData;
    }
};