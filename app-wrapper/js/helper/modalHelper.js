var _ = require('lodash');
var BaseClass = require('../base').BaseClass;

var _appWrapper;
var appState;


class ModalHelper extends BaseClass {
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

    async initialize () {
        await super.initialize();
        appState.modalData.currentModal = this.getModalObject('defaultModal', {});
        return this;
    }

    modalBusy (message) {
        if (!message){
            message = this.translate('Please wait...');
        }
        appState.modalData.currentModal.busyText = message;
        appState.modalData.currentModal.busy = true;
    }

    modalNotBusy () {
        appState.modalData.currentModal.busy = false;
    }

    closeCurrentModal (force){
        let fadeModal = appState.modalData.fadeModal;
        let duration = parseInt(parseFloat(_appWrapper.getHelper('style').getCssVarValue('--long-animation-duration'), 10) * 1000, 10);
        let md = appState.modalData;
        let cm = md.currentModal;

        if (!cm.busy || force) {
            this.log('Closing current modal.', 'info', []);
            cm.opening = false;
            cm.closing = true;
            if (cm.onBeforeClose && _.isFunction(cm.onBeforeClose)){
                this.log('Calling current modal onBeforeClose...', 'info', []);
                cm.onBeforeClose();
            }
            if (force){
                md.fadeModal = 'none';
            }
            this.stopAutoCloseModal();

            this.modalNotBusy();
            this.resetModalActions();

            cm.autoCloseTime = null;
            md.modalVisible = false;
            md.modalElement = null;

            if (cm.onClose && _.isFunction(cm.onClose)){
                setTimeout( () => {
                    this.log('Calling current modal onClose...', 'info', []);
                    cm.onClose();
                    this.resetCurrentCallbacks();
                    cm = this.getModalObject('defaultModal');
                    md.fadeModal = fadeModal;
                }, duration);
            } else {
                this.resetCurrentCallbacks();
                cm = this.getModalObject('defaultModal');
                md.fadeModal = fadeModal;
            }
        } else {
            this.log('Can\'t close modal because it is busy', 'warning', []);
        }
    }

    closeCurrentModalDelayed (delay, busyText, force){
        if (!delay){
            delay = 1000;
        }
        if (!appState.modalData.currentModal.busy || force) {
            this.modalBusy(busyText);
            this.setModalVar('opening', false);
            this.setModalVar('closing', true);

            setTimeout( () => {
                this.emptyModal();
                this.modalNotBusy();
                this.closeCurrentModal();
            }, delay);
        } else {
            this.log('Can\'t delayed close modal because it is already busy', 'warning', []);
        }
    }

    openCurrentModal () {
        let fadeModal = appState.modalData.fadeModal;
        let duration = parseInt(parseFloat(_appWrapper.getHelper('style').getCssVarValue('--long-animation-duration'), 10) * 1000, 10);
        let md = appState.modalData;
        let cm = md.currentModal;

        cm.closing = false;
        cm.opening = true;

        this.log('Opening current modal.', 'info', []);

        if (cm.onBeforeOpen && _.isFunction(cm.onBeforeOpen)){
            this.log('Calling current modal onBeforeOpen...', 'info', []);
            cm.onBeforeOpen();
        }

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

        if (!cm.showContentImmediately){
            setTimeout(() => {
                if (cm.bodyComponent != cm.defaultBodyComponent){
                    cm.bodyComponent = cm.defaultBodyComponent;
                }
                this.modalNotBusy();

                setTimeout(() => {
                    if (cm.onOpen && _.isFunction(cm.onOpen)){
                        this.log('Calling current modal onOpen...', 'info', []);
                        cm.onOpen();
                    }
                    cm.opening = false;
                }, duration);
            }, duration);
        } else {
            md.fadeModal = 'none';
            if (cm.bodyComponent != cm.defaultBodyComponent){
                cm.bodyComponent = cm.defaultBodyComponent;
            }
            this.modalNotBusy();
            setTimeout( () => {
                if (cm.onOpen && _.isFunction(cm.onOpen)){
                    this.log('Calling current modal onOpen...', 'info', []);
                    cm.onOpen();
                }
                cm.opening = false;
                md.fadeModal = fadeModal;
            }, duration);
        }
        if (cm.autoCloseTime) {
            this.autoCloseModal();
        }
    }

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

    async confirmResolve (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        this.closeCurrentModal();
    }

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

    async queryResolve (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        this.closeCurrentModal();
    }

    async queryReject (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        this.closeCurrentModal();
    }

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

    addModalMessage (messageObject) {
        if (appState.modalData.currentModal && appState.modalData.modalVisible){
            if (appState.modalData.currentModal.messages){
                if (_.isArray(appState.modalData.currentModal.messages)){
                    window.getFeApp().$refs.modalDialog.addModalMessage(messageObject);
                }
            }
        }
    }

    clearModalMessages () {
        if (appState.modalData.currentModal && _.isObject(appState.modalData.currentModal)){
            this.setModalVar('messages', []);
        }
    }

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

    openModal(modalName, options){
        let modalObj = this.getModalObject(modalName, options);
        if (modalObj){
            appState.modalData.currentModal = modalObj;
            this.openCurrentModal();
        }
    }

    autoCloseModal () {
        this.log('Setting up modal auto-close.', 'info', []);
        let cm = appState.modalData.currentModal;
        let seconds = parseInt(cm.autoCloseTime / 1000, 10);

        this.stopAutoCloseModal();
        this.setModalVar('autoClosing', true);

        this.timeouts.autoClose = setTimeout(() => {
            this.log('Auto-closing modal.', 'info', []);
            this.stopAutoCloseModal();
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

    stopAutoCloseModal () {
        let cm = appState.modalData.currentModal;
        if (cm.autoClosing){
            this.log('Stopping modal auto-close.', 'info', []);
            cm.autoClosing = false;
        }
        clearInterval(this.intervals.autoClose);
        clearTimeout(this.timeouts.autoClose);
    }

    resetCurrentCallbacks () {
        appState.modalData.currentModal.onBeforeOpen = null;
        appState.modalData.currentModal.onOpen = null;
        appState.modalData.currentModal.onBeforeClose = null;
        appState.modalData.currentModal.onClose = null;
    }

    emptyModal () {
        appState.modalData.currentModal.title = '';
        appState.modalData.currentModal.body = '';
        appState.modalData.currentModal.showConfirmButton = false;
        appState.modalData.currentModal.showCancelButton = false;
        appState.modalData.currentModal.bodyComponent = 'modal-body';
    }

    resetModalActions () {
        _appWrapper._confirmModalAction = _appWrapper.__confirmModalAction;
        _appWrapper._cancelModalAction = _appWrapper.__cancelModalAction;
    }

    setModalVar(name, value){
        appState.modalData.currentModal[name] = value;
    }

    setModalVars(data){
        appState.modalData.currentModal = _.merge(appState.modalData.currentModal, data);
    }

    getModalVar(name){
        return _.get(appState.modalData.currentModal, name);
    }

    setModalData(data, overwrite){
        if (!overwrite){
            _.merge(appState.modalData.currentModal, data);
        } else {
            appState.modalData.currentModal = data;
        }
    }
}

exports.ModalHelper = ModalHelper;