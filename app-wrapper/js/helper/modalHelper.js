/**
 * @fileOverview ModalHelper class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.2.1
 */

const _ = require('lodash');
const AppBaseClass = require('../lib/appBase').AppBaseClass;

var _appWrapper;
var appState;

/**
 * ModalHelper class - handles and manages modal dialogs
 *
 * @class
 * @extends {appWrapper.AppBaseClass}
 * @memberof appWrapper.helpers
 */
class ModalHelper extends AppBaseClass {

    /**
     * Creates ModalHelper instance
     *
     * @constructor
     * @return {ModalHelper}              Instance of ModalHelper class
     */
    constructor() {
        super();

        _appWrapper = this.getAppWrapper();
        appState = this.getAppState();

        this.boundMethods = {
            confirmResolve: null,
            queryResolve: null,
            queryReject: null,
        };

        this.timeouts = {
            autoClose: null
        };

        this.intervals = {
            autoClose: null
        };

        return this;
    }

    /**
     * Initializes ModalHelper object instance
     *
     * @async
     * @return {ModalHelper}    Instance of ModalHelper class
     */
    async initialize () {
        await super.initialize();
        appState.modalData.currentModal = this.getModalObject('defaultModal', {});
        return this;
    }

    /**
     * Sets modal dialog status to busy using message from argument (or default one if no message is passed)
     *
     * @param  {string} message Optional message to display in modal
     * @return {undefined}
     */
    modalBusy (message) {
        let cm = appState.modalData.currentModal;
        if (!cm.busy){
            if (!message){
                message = this.translate('Please wait...');
            }
            appState.modalData.currentModal.busyText = message;
            appState.modalData.currentModal.busy = true;
        }
    }

    /**
     * Sets modal dialog status to not busy
     *
     * @return {undefined}
     */
    modalNotBusy () {
        appState.modalData.currentModal.busy = false;
    }

    /**
     * Sets modal dialog ready status to true
     *
     * @return {undefined}
     */
    modalReady () {
        appState.modalData.currentModal.ready = true;
    }

    /**
     * Resets modal dialog ready status to false
     *
     * @return {undefined}
     */
    modalNotReady () {
        appState.modalData.currentModal.ready = false;
    }

    /**
     * Closes currently visible modal dialog
     *
     * @param  {Boolean} force Flag to force modal closing even if modal is busy
     * @return {undefined}
     */
    closeCurrentModal (force){
        let md = appState.modalData;
        let cm = md.currentModal;

        if (!cm.busy || force === true) {
            this.log('Closing current modal.', 'info', []);
            this.setModalVars({
                opening: false,
                closing: true
            });
            if (force === true){
                md.fadeModal = 'none';
            }
            this.stopAutoCloseModal();
            this.resetModalActions();
            if (cm.animateSize){
                this.modalBusy();
                this.modalNotReady();
            } else {
                md.modalVisible = false;
            }

            cm.autoCloseTime = null;
            md.modalElement = null;

            appState.status.noHandlingKeys = false;
        } else {
            this.log('Can not close modal because it is busy', 'warning', []);
        }
    }

    /**
     * Closes current modal dialog with delay, setting busy status and message grom argument
     *
     * @param  {Integer} delay      Delay in milliseconds
     * @param  {string} busyText    Busy message to show
     * @param  {Boolean} force      Flag to force modal closing even if modal is busy
     * @return {undefined}
     */
    closeCurrentModalDelayed (delay, busyText, force){
        if (!delay){
            delay = 1000;
        }
        if (!appState.modalData.currentModal.busy || force) {
            this.modalNotReady();
            this.modalBusy(busyText);
            this.setModalVars({
                opening: false,
                closing: true
            });

            setTimeout( () => {
                this.emptyModal();
                this.modalNotBusy();
                this.closeCurrentModal();
            }, delay);
        } else {
            this.log('Can not delayed close modal because it is already busy', 'warning', []);
        }
    }

    /**
     * Opens current modal dialog
     *
     * @return {undefined}
     */
    openCurrentModal () {
        let fadeModal = appState.modalData.fadeModal;
        let duration = parseInt(parseFloat(_appWrapper.getHelper('style').getCssVarValue('--long-animation-duration'), 10) * 1000, 10);
        let md = appState.modalData;
        let cm = md.currentModal;

        this.setModalVars({
            opening: true,
            closing: false
        });

        this.log('Opening current modal.', 'info', []);

        if (cm.autoCloseTime) {
            cm.autoCloseTimeText = parseInt(cm.autoCloseTime / 1000, 10);
        }

        cm.messages = [];
        cm.currentMessageIndex = -1;
        md.modalVisible = true;
        md.modalElement = document.querySelector('.modal-dialog');

        this.stopAutoCloseModal();

        if (cm.autoCloseTime) {
            cm.autoCloseTimeText = _appWrapper.getHelper('format').formatDurationCustom(cm.autoCloseTime / 1000);
        }

        if (cm.noHandlingKeys) {
            appState.status.noHandlingKeys = true;
        }

        if (!cm.showContentImmediately){
            setTimeout(() => {
                if (cm.bodyComponent != cm.defaultBodyComponent){
                    cm.bodyComponent = cm.defaultBodyComponent;
                }
                this.modalNotBusy();
                this.modalReady();
            }, duration);
        } else {
            md.fadeModal = 'none';
            if (cm.bodyComponent != cm.defaultBodyComponent){
                cm.bodyComponent = cm.defaultBodyComponent;
            }
            this.modalNotBusy();
            this.modalReady();
            // setTimeout( () => {
            //     if (cm.onOpen && _.isFunction(cm.onOpen)){
            //         this.log('Calling current modal onOpen...', 'info', []);
            //         cm.onOpen();
            //     }
            //     cm.opening = false;
            //     md.fadeModal = fadeModal;
            // }, duration);
            md.fadeModal = fadeModal;
        }
        if (cm.autoCloseTime) {
            this.autoCloseModal();
        }
    }

    /**
     * Opens simple modal dialog using basic parameters from method arguments
     *
     * @async
     * @param  {string}     title         Modal title
     * @param  {string}     text          Modal text
     * @param  {Object}     options       Modal option overrides
     * @param  {Function}   confirmAction Confirm modal callback
     * @param  {Function}   cancelAction  Cancel / close modal callback
     * @return {undefined}
     */
    async openSimpleModal(title, text, options, confirmAction, cancelAction) {
        this.closeCurrentModal(true);
        this.log('Opening simple modal.', 'info', []);
        appState.modalData.currentModal = _.cloneDeep(appState.appModals.defaultModal);
        if (options && _.isObject(options)){
            appState.modalData.currentModal = _.merge(appState.modalData.currentModal, options);
        }
        appState.modalData.currentModal.title = title;
        appState.modalData.currentModal.body = text;
        if (confirmAction){
            _appWrapper._confirmModalAction = confirmAction;
        }
        if (cancelAction){
            _appWrapper._cancelModalAction = cancelAction;
        }
        this.openCurrentModal();
    }

    /**
     * Resolve method for confirm modal promise
     *
     * @async
     * @param  {Event} e Event that triggered the method
     * @return {undefined}
     */
    async confirmResolve (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        this.closeCurrentModal();
    }

    /**
     * Opens confirm modal dialog using basic parameters from method arguments
     *
     * @async
     * @param  {string}     title               Modal title
     * @param  {string}     text                Modal text
     * @param  {string}     confirmButtonText   Confirm button text
     * @param  {string}     cancelButtonText    Cancel button text
     * @param  {Function}   confirmAction       Modal confirm callback
     * @return {undefined}
     */
    async confirm (title, text, confirmButtonText, cancelButtonText, confirmAction) {
        this.log('Opening confirm modal.', 'info', []);
        appState.modalData.currentModal = _.cloneDeep(appState.appModals.defaultModal);

        if (!text){
            text = '';
        }

        if (!confirmButtonText){
            confirmButtonText = this.translate('Confirm');
        }

        if (!cancelButtonText){
            cancelButtonText = this.translate('Cancel');
        }

        appState.modalData.currentModal = _.cloneDeep(appState.appModals.defaultModal);

        appState.modalData.currentModal.bodyComponent = 'modal-body';
        appState.modalData.currentModal.title = title;
        appState.modalData.currentModal.body = text;
        appState.modalData.currentModal.confirmButtonText = confirmButtonText;
        appState.modalData.currentModal.cancelButtonText = cancelButtonText;
        appState.modalData.currentModal.modalClassName = 'confirm-modal';
        appState.modalData.currentModal.cancelSelected = true;
        appState.modalData.currentModal.confirmSelected = false;

        this.modalBusy();
        if (confirmAction){
            _appWrapper._confirmModalAction = confirmAction;
        } else {
            _appWrapper._confirmModalAction = this.boundMethods.confirmResolve;
        }
        this.openCurrentModal();
    }

    /**
     * Resolve method for query modal
     *
     * @async
     * @param  {Event} e Event that triggered the method
     * @return {undefined}
     */
    async queryResolve (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        this.closeCurrentModal();
    }

    /**
     * Reject method for query modal
     *
     * @async
     * @param  {Event} e Event that triggered the method
     * @return {undefined}
     */
    async queryReject (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        this.closeCurrentModal();
    }

    /**
     * Opens query modal dialog
     *
     * @async
     * @param  {Function} confirmAction Modal confirm callback
     * @param  {Function} cancelAction  Modal cancel/close callback
     * @return {undefined}
     */
    async queryModal (confirmAction, cancelAction) {
        this.log('Opening query modal.', 'info', []);
        this.modalBusy();
        if (confirmAction){
            _appWrapper._confirmModalAction = confirmAction;
        } else {
            _appWrapper._confirmModalAction = this.boundMethods.queryResolve;
        }
        if (cancelAction){
            _appWrapper._cancelModalAction = cancelAction;
        } else {
            _appWrapper._cancelModalAction = this.boundMethods.queryReject;
        }
        this.openCurrentModal();
    }

    /**
     * Adds modal message to currently visible modal
     *
     * @param {Object} messageObject Message object
     * @return {undefined}
     */
    addModalMessage (messageObject) {
        if (appState.modalData.currentModal && appState.modalData.modalVisible){
            if (appState.modalData.currentModal.messages){
                if (_.isArray(appState.modalData.currentModal.messages)){
                    // window.getFeApp().$refs.modalDialog.addModalMessage(messageObject);
                    window.getFeApp().$refs.modalDialog.$refs.modalDialogContents.$refs.modalDialogMessages.addModalMessage(messageObject);
                }
            }
        }
    }

    /**
     * Clears modal messages from currently visible modal
     *
     * @return {undefined}
     */
    clearModalMessages () {
        if (appState.modalData.currentModal && _.isObject(appState.modalData.currentModal)){
            this.setModalVar('messages', []);
        }
    }

    /**
     * Gets modal data object by its name, applying optional option overrides
     *
     * @param  {string} modalName Name of modal object
     * @param  {Object} options   Modal option overrides
     * @return {(Object|Boolean)} Modal object or false if no modal found
     */
    getModalObject(modalName, options){
        let modalObj = false;
        if (!_.isUndefined(appState.appModals[modalName])){
            modalObj = _.cloneDeep(appState.appModals.defaultModal);
            _.merge(modalObj, _.cloneDeep(appState.appModals[modalName]));
            if (options && _.isObject(options)){
                modalObj = _.merge(modalObj, options);
            }
        }
        if (!modalObj){
            this.log('Can not find modal object with name "{1}"!', 'error', [modalName]);
        }
        return modalObj;
    }

    /**
     * Opens modal dialog by its name, applying optional option overrides
     *
     * @param  {string} modalName Name of modal object
     * @param  {Object} options   Modal option overrides
     * @return {undefined}
     */
    openModal(modalName, options){
        let modalObj = this.getModalObject(modalName, options);
        if (modalObj){
            appState.modalData.currentModal = modalObj;
            this.openCurrentModal();
        }
    }

    /**
     * Automatically closes modal after timeout from modal options
     *
     * @return {undefined}
     */
    autoCloseModal () {
        this.log('Setting up modal auto-close.', 'info', []);
        let cm = appState.modalData.currentModal;
        let seconds = parseInt(cm.autoCloseTime / 1000, 10);

        this.stopAutoCloseModal();
        this.setModalVar('autoClosing', true);

        this.timeouts.autoClose = setTimeout(() => {
            this.log('Auto-closing modal.', 'info', []);
            this.stopAutoCloseModal();
            if (!cm.animateSize){
                if (cm.cancelOnClose && cm.onCancel && _.isFunction(cm.onCancel)){
                    this.log('Calling current modal onCancel...', 'info', []);
                    cm.onCancel();
                }
                if (cm.onBeforeClose && _.isFunction(cm.onBeforeClose)){
                    this.log('Calling current modal onBeforeClose...', 'info', []);
                    cm.onBeforeClose();
                }
                if (cm.onClose && _.isFunction(cm.onClose)){
                    this.log('Calling current modal onClose...', 'info', []);
                    cm.onClose();
                }
            }
            this.closeCurrentModal();
        }, +cm.autoCloseTime);

        this.intervals.autoClose = setInterval(() => {
            seconds--;
            if (seconds < 0){
                seconds = 0;
            }
            this.updateAutoCloseTimer(seconds);
        }, +cm.autoCloseTimeIntervalDuration);
    }

    /**
     * Updates auto close timer in modal dialog (for auto-closing modals)
     *
     * @param  {Integer} seconds Remaining time in seconds
     * @return {undefined}
     */
    updateAutoCloseTimer (seconds) {
        let md = appState.modalData;
        let cm = md.currentModal;

        let remainingTime = _appWrapper.getHelper('format').formatDurationCustom(seconds);

        if (!cm.originalConfirmButtonText){
            cm.originalConfirmButtonText = cm.confirmButtonText;
        }
        if (!cm.originalCancelButtonText){
            cm.originalCancelButtonText = cm.cancelButtonText;
        }

        if (cm.showCloseLink){
            if (!cm.busy){
                let closeLink = md.modalElement.querySelector('.modal-dialog-close-contents');
                if (closeLink){
                    let highlightClass;
                    if (+seconds <= parseInt(cm.autoCloseTimeExpireNotify / 1000, 10)){
                        highlightClass = 'modal-dialog-close-contents-highlighted-expiring';
                    } else if (+seconds <= parseInt(cm.autoCloseTimeNotify / 1000, 10)){
                        highlightClass = 'modal-dialog-close-contents-highlighted';
                    }
                    if (highlightClass){
                        closeLink.addClass(highlightClass);
                    }
                    cm.autoCloseTimeText = remainingTime;
                    setTimeout( () => {
                        if (highlightClass){
                            closeLink.removeClass(highlightClass);
                        }
                    }, 100);
                }
            } else {
                cm.autoCloseTimeText = '';
            }
        } else if (cm.showConfirmButton){
            if (!cm.busy){
                cm.confirmButtonText = cm.originalConfirmButtonText + ' (' + remainingTime + ')';
            } else {
                cm.confirmButtonText = cm.originalConfirmButtonText;
            }
        } else if (cm.showCancelButton) {
            if (!cm.busy){
                cm.cancelButtonText = cm.originalCancelButtonText + ' (' + remainingTime + ')';
            } else {
                cm.cancelButtonText = cm.originalCancelButtonText;
            }
        }
    }

    /**
     * Stops auto closing modal countdown
     *
     * @return {undefined}
     */
    stopAutoCloseModal () {
        let cm = appState.modalData.currentModal;
        if (cm.autoClosing){
            this.log('Stopping modal auto-close.', 'info', []);
            cm.autoClosing = false;
        }
        clearInterval(this.intervals.autoClose);
        clearTimeout(this.timeouts.autoClose);
    }

    /**
     * Resets callbacks for current modal object
     *
     *
     * @return {undefined}
     */
    resetCurrentCallbacks () {
        appState.modalData.currentModal.onBeforeOpen = null;
        appState.modalData.currentModal.onOpen = null;
        appState.modalData.currentModal.onBeforeClose = null;
        appState.modalData.currentModal.onClose = null;
    }

    /**
     * Empties current modal, reverting it to default values
     *
     * @return {undefined}
     */
    emptyModal () {
        appState.modalData.currentModal.title = '';
        appState.modalData.currentModal.body = '';
        appState.modalData.currentModal.showConfirmButton = false;
        appState.modalData.currentModal.showCancelButton = false;
        appState.modalData.currentModal.bodyComponent = 'modal-body';
    }

    /**
     * Resets modal action listeners to their defaults
     *
     * @return {undefined}
     */
    resetModalActions () {
        _appWrapper._confirmModalAction = _appWrapper.__confirmModalAction;
        _appWrapper._cancelModalAction = _appWrapper.__cancelModalAction;
    }

    /**
     * Sets modal variable for current modal
     *
     * @param {string} name  Name of the variable
     * @param {Object} value Value of the variable
     * @return {undefined}
     */
    setModalVar(name, value){
        appState.modalData.currentModal[name] = value;
    }

    /**
     * Sets modal variables using data argument
     *
     * @param {Object} data Data with properties and values for variables tos et
     * @return {undefined}
     */
    setModalVars(data){
        appState.modalData.currentModal = _.merge(appState.modalData.currentModal, data);
    }

    /**
     * Gets current modal variable value by name
     *
     * @param  {string} name  Name of the variable
     * @return {Object} value Value of the variable
     */
    getModalVar(name){
        return _.get(appState.modalData.currentModal, name);
    }

    /**
     * Sets modal data using argument
     *
     * @param {Object}  data      Modal data to set
     * @param {Boolean} overwrite Flag to indicate data overwriting instead of merging with existing data
     * @return {undefined}
     */
    setModalData(data, overwrite){
        if (!overwrite){
            _.merge(appState.modalData.currentModal, data);
        } else {
            appState.modalData.currentModal = data;
        }
    }
}

exports.ModalHelper = ModalHelper;