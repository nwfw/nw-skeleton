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
        return await super.initialize();
    }

    modalBusy (message) {
        if (message){
            appState.modalData.currentModal.busyText = message;
        }
        appState.modalData.currentModal.busy = true;
    }

    modalNotBusy () {
        appState.modalData.currentModal.busy = false;
        appState.modalData.currentModal.busyText = appState.defaultModal.busyText;
    }

    closeCurrentModal (force){
        let fadeModal = appState.modalData.fadeModal;
        if (!appState.modalData.currentModal.busy || force) {
            if (appState.modalData.currentModal.onBeforeClose && _.isFunction(appState.modalData.currentModal.onBeforeClose)){
                appState.modalData.currentModal.onBeforeClose();
            }
            this.log('Closing current modal.', 'info', []);
            if (force){
                appState.modalData.fadeModal = 'none';
            }
            clearInterval(this.intervals.autoClose);
            clearTimeout(this.timeouts.autoClose);
            _appWrapper._confirmModalAction = _appWrapper.__confirmModalAction;
            _appWrapper._cancelModalAction = _appWrapper.__cancelModalAction;
            appState.modalData.currentModal.autoCloseTime = null;
            appState.modalData.modalVisible = false;
            appState.modalData.modalElement = null;
            this.modalNotBusy();
            let duration = parseInt(parseFloat(_appWrapper.getHelper('style').getCssVarValue('--long-animation-duration'), 10) * 1000, 10);
            if (appState.modalData.currentModal.onClose && _.isFunction(appState.modalData.currentModal.onClose)){
                setTimeout( () => {
                    appState.modalData.currentModal.onClose();
                    this.resetCurrentCallbacks();
                }, duration);
            } else {
                this.resetCurrentCallbacks();
            }
            appState.modalData.fadeModal = fadeModal;
        } else {
            this.log('Can\'t close modal because it is busy', 'warning', []);
        }
    }

    openCurrentModal (showContentImmediately) {
        this.log('Opening current modal.', 'info', []);
        if (appState.modalData.currentModal.onBeforeOpen && _.isFunction(appState.modalData.currentModal.onBeforeOpen)){
            appState.modalData.currentModal.onBeforeOpen();
        }
        appState.modalData.currentModal.messages = [];
        appState.modalData.currentModal.currentMessageIndex = -1;
        appState.modalData.modalVisible = true;
        appState.modalData.modalElement = document.querySelector('.modal-dialog');
        clearTimeout(this.timeouts.autoClose);
        clearInterval(this.intervals.autoClose);
        let fadeModal = appState.modalData.fadeModal;
        let duration = parseInt(parseFloat(_appWrapper.getHelper('style').getCssVarValue('--long-animation-duration'), 10) * 1000, 10);
        if (!showContentImmediately){
            setTimeout(() => {
                if (appState.modalData.currentModal.bodyComponent != appState.modalData.currentModal.defaultBodyComponent){
                    appState.modalData.currentModal.bodyComponent = appState.modalData.currentModal.defaultBodyComponent;
                }
                this.modalNotBusy();
                if (appState.modalData.currentModal.onOpen && _.isFunction(appState.modalData.currentModal.onOpen)){
                    appState.modalData.currentModal.onOpen();
                }
            }, duration);
        } else {
            appState.modalData.fadeModal = 'none';
            if (appState.modalData.currentModal.bodyComponent != appState.modalData.currentModal.defaultBodyComponent){
                appState.modalData.currentModal.bodyComponent = appState.modalData.currentModal.defaultBodyComponent;
            }
            this.modalNotBusy();
            if (appState.modalData.currentModal.onOpen && _.isFunction(appState.modalData.currentModal.onOpen)){
                setTimeout( () => {
                    appState.modalData.currentModal.onOpen();
                }, duration);
            }
            appState.modalData.fadeModal = fadeModal;
        }
        if (appState.modalData.currentModal.autoCloseTime) {
            this.autoCloseModal();
        }
    }

    async openSimpleModal(title, text, options, confirmAction, cancelAction) {
        this.closeCurrentModal(true);
        this.log('Opening simple modal.', 'info', []);
        appState.modalData.currentModal = _.cloneDeep(appState.defaultModal);
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
        appState.modalData.currentModal = _.cloneDeep(appState.defaultModal);

        if (!text){
            text = '';
        }

        if (!confirmButtonText){
            confirmButtonText = _appWrapper.appTranslations.translate('Confirm');
        }

        if (!cancelButtonText){
            cancelButtonText = _appWrapper.appTranslations.translate('Cancel');
        }

        appState.modalData.currentModal = _.cloneDeep(appState.defaultModal);

        appState.modalData.currentModal.bodyComponent = 'modal-body';
        appState.modalData.currentModal.title = title;
        appState.modalData.currentModal.body = text;
        appState.modalData.currentModal.confirmButtonText = confirmButtonText;
        appState.modalData.currentModal.cancelButtonText = cancelButtonText;
        appState.modalData.currentModal.modalClassName = 'confirm-modal';
        appState.modalData.currentModal.cancelSelected = true;
        appState.modalData.currentModal.confirmSelected = false;

        this.modalBusy(_appWrapper.appTranslations.translate('Please wait...'));
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
        this.modalBusy(_appWrapper.appTranslations.translate('Please wait...'));
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

    getModalObject(modalName, options){
        let modalObj = false;
        if (!_.isUndefined(appState[modalName])){
            modalObj = _.merge(_.cloneDeep(appState.defaultModal), _.cloneDeep(appState[modalName]));
            if (options && _.isObject(options)){
                modalObj = _.merge(modalObj, options);
            }
        }
        return modalObj;
    }

    autoCloseModal () {
        this.log('Setting up modal auto-close.', 'info', []);
        var seconds = parseInt(appState.modalData.currentModal.autoCloseTime / 1000, 10);
        let confirmVisible = appState.modalData.currentModal.showConfirmButton;
        let cancelVisible = appState.modalData.currentModal.showCancelButton;
        var confirmButtonText = appState.modalData.currentModal.confirmButtonText;
        var cancelButtonText = appState.modalData.currentModal.cancelButtonText;
        if (confirmVisible){
            appState.modalData.currentModal.confirmButtonText = confirmButtonText + ' (' + seconds + ')';
        } else if (cancelVisible) {
            appState.modalData.currentModal.cancelButtonText = cancelButtonText + ' (' + seconds + ')';
        }

        clearTimeout(this.timeouts.autoClose);
        this.timeouts.autoClose = setTimeout(() => {
            clearInterval(this.intervals.autoClose);
            clearTimeout(this.timeouts.autoClose);
            this.log('Auto-closing modal.', 'info', []);
            this.closeCurrentModal();

        }, appState.modalData.currentModal.autoCloseTime);

        clearInterval(this.intervals.autoClose);
        this.intervals.autoClose = setInterval(() => {
            seconds--;
            if (seconds < 0){
                seconds = 0;
            }
            if (confirmVisible){
                appState.modalData.currentModal.confirmButtonText = confirmButtonText + ' (' + seconds + ')';
            } else if (cancelVisible) {
                appState.modalData.currentModal.cancelButtonText = cancelButtonText + ' (' + seconds + ')';
            }

        }, 1000);
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
}

exports.ModalHelper = ModalHelper;