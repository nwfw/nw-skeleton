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
            if (force){
                appState.modalData.fadeModal = 'none';
            }
            clearInterval(this.intervals.autoClose);
            clearTimeout(this.timeouts.autoClose);
            _appWrapper._confirmModalAction = _appWrapper.__confirmModalAction;
            _appWrapper._cancelModalAction = _appWrapper.__cancelModalAction;
            if (appState.closeModalResolve && _.isFunction(appState.closeModalResolve)){
                appState.closeModalResolve(false);
            }
            appState.modalData.currentModal.autoCloseTime = null;
            appState.modalData.modalVisible = false;
            appState.modalData.modalElement = null;
            this.modalNotBusy();
            appState.modalData.fadeModal = fadeModal;
        } else {
            this.log('Can\'t close modal because it is busy', 'warning', []);
        }
    }

    openCurrentModal (showContentImmediately) {
        appState.modalData.currentModal.messages = [];
        appState.modalData.currentModal.currentMessageIndex = -1;
        appState.modalData.modalVisible = true;
        appState.modalData.modalElement = document.querySelector('.modal-dialog');
        clearTimeout(this.timeouts.autoClose);
        clearInterval(this.intervals.autoClose);
        let fadeModal = appState.modalData.fadeModal;
        if (!showContentImmediately){
            setTimeout(() => {
                if (appState.modalData.currentModal.bodyComponent != appState.modalData.currentModal.defaultBodyComponent){
                    appState.modalData.currentModal.bodyComponent = appState.modalData.currentModal.defaultBodyComponent;
                }
                this.modalNotBusy();
            }, 300);
        } else {
            appState.modalData.fadeModal = 'none';
            if (appState.modalData.currentModal.bodyComponent != appState.modalData.currentModal.defaultBodyComponent){
                appState.modalData.currentModal.bodyComponent = appState.modalData.currentModal.defaultBodyComponent;
            }
            this.modalNotBusy();
            appState.modalData.fadeModal = fadeModal;
        }
        if (appState.modalData.currentModal.autoCloseTime) {
            this.autoCloseModal();
        }
    }

    async openSimpleModal(title, text, options, confirmAction, cancelAction) {
        this.closeCurrentModal(true);
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
        appState.currentModalClosePromise = new Promise((resolve) => {
            appState.closeModalResolve = resolve;
        });
        this.openCurrentModal();
        return appState.currentModalClosePromise;
    }

    async confirmResolve (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        if (appState.closeModalResolve && _.isFunction(appState.closeModalResolve)){
            appState.closeModalResolve(true);
        }
        this.closeCurrentModal();
    }

    async confirm (title, text, confirmButtonText, cancelButtonText, confirmAction) {
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
        _appWrapper.closeModalPromise = new Promise((resolve, reject) => {
            appState.closeModalResolve = resolve;
            appState.closeModalReject = reject;
        });
        this.openCurrentModal();
        return _appWrapper.closeModalPromise;
    }

    async queryResolve (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        if (appState.closeModalResolve && _.isFunction(appState.closeModalResolve)){
            appState.closeModalResolve(true);
        }
        this.closeCurrentModal();
    }

    async queryReject (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        // if (appState.closeModalResolve && _.isFunction(appState.closeModalResolve)){
        //     appState.closeModalResolve(true);
        // }
        this.closeCurrentModal();
    }

    async query (confirmAction, cancelAction) {
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
        _appWrapper.closeModalPromise = new Promise((resolve, reject) => {
            appState.closeModalResolve = resolve;
            appState.closeModalReject = reject;
        });
        this.openCurrentModal();
        return _appWrapper.closeModalPromise;
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

    getModalObject(modalName){
        let modalObj = false;
        if (!_.isUndefined(appState[modalName])){
            modalObj = _.extend({}, _.cloneDeep(appState.defaultModal), _.cloneDeep(appState[modalName]));
        }
        return modalObj;
    }

    autoCloseModal () {
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
}

exports.ModalHelper = ModalHelper;