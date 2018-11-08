/**
 * @fileOverview modal-dialog component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * Modal dialog component
 *
 * @name modal-dialog
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
var component;
component = {
    name: 'modal-dialog',
    template: '',
    messageAdded: false,
    methods: {
        closeModalAction: async function(){
            let modalHelper = _appWrapper.getHelper('modal');
            let cm = appState.modalData.currentModal;
            let doClose = true;
            if (cm.cancelOnClose && cm.onCancel && _.isFunction(cm.onCancel)){
                _appWrapper.getHelper('modal').log('Calling current modal onCancel...', 'info', []);
                doClose = doClose && await cm.onCancel();
            }
            if (!cm.animateSize){
                if (cm.onBeforeClose && _.isFunction(cm.onBeforeClose)){
                    _appWrapper.getHelper('modal').log('Calling current modal onBeforeClose...', 'info', []);
                    doClose = doClose && await cm.onBeforeClose();
                }
                if (cm.onClose && _.isFunction(cm.onClose)){
                    _appWrapper.getHelper('modal').log('Calling current modal onClose...', 'info', []);
                    doClose = doClose && await cm.onClose();
                }
            }
            if (doClose){
                modalHelper.closeCurrentModal();
            }
        },


    },
    data: function () {
        return appState.modalData;
    },

    computed: {
        appState: function(){
            return appState;
        }
    }
};

exports.component = component;