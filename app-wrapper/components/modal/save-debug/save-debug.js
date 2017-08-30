/**
 * @fileOverview save-debug component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.0
 */

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * Save debug component
 *
 * @name save-debug
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
    name: 'save-debug',
    template: '',
    data: function () {
        return appState.modalData.currentModal;
    },
    methods: {
        saveFileClick: async function(e){
            return await _appWrapper.getHelper('debug').saveDebugFileClick(e);
        },
        saveFileChange: async function(e){
            return await _appWrapper.getHelper('debug').saveDebugFileChange(e);
        },
    },
    computed: {
        appState: function(){
            return appState;
        }
    },
    mounted: function(){
        let modalHelper = _appWrapper.getHelper('modal');
        modalHelper.modalNotBusy();
        appState.modalData.modalContentVisible = true;
    }
};