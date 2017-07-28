/**
 * @fileOverview save-user-messages component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.2.0
 */

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * Save user messages component
 *
 * @name save-user-messages
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
    name: 'save-user-messages',
    template: '',
    data: function () {
        return appState.modalData.currentModal;
    },
    methods: {
        saveFileClick: async function(e){
            return await _appWrapper.getHelper('userMessage').saveUserMessagesFileClick(e);
        },
        saveFileChange: async function(e){
            return await _appWrapper.getHelper('userMessage').saveUserMessagesFileChange(e);
        },
    },
    computed: {
        appState: function(){
            return appState;
        }
    },
    mounted: function(){
        appState.modalData.currentModal.busy = false;
        appState.modalData.modalContentVisible = true;
    }
};