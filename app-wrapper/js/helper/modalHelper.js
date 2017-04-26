var _ = require('lodash');
var BaseClass = require('../base').BaseClass;

var _appWrapper;
var appUtil;
var appState;


class ModalHelper extends BaseClass {
    constructor() {
        super();

        _appWrapper = this.getAppWrapper();
        appUtil = this.getAppUtil();
        appState = this.getAppState();

        this.forceDebug = appUtil.getConfig('forceDebug.modalHelper');
        this.forceUserMessages = appUtil.getConfig('forceUserMessages.modalHelper');

        this.boundMethods = {
            confirmResolve: null
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
        if (!appState.modalData.currentModal.busy || force) {
            _appWrapper._confirmModalAction = _appWrapper.__confirmModalAction;
            _appWrapper._cancelModalAction = _appWrapper.__cancelModalAction;
            if (appState.closeModalResolve && _.isFunction(appState.closeModalResolve)){
                appState.closeModalResolve(false);
            }
            appState.modalData.currentModal.autoCloseTime = null;
            appState.modalData.modalVisible = false;
            this.modalNotBusy();
        } else {
            appUtil.log('Can\'t close modal because it is busy', 'warning', [], false, this.forceDebug);
        }
    }

    openCurrentModal (showContentImmediately) {
        appState.modalData.modalVisible = true;
        clearTimeout(this.timeouts.autoClose);
        clearInterval(this.intervals.autoClose);
        if (!showContentImmediately){
            setTimeout(() => {
                if (appState.modalData.currentModal.bodyComponent != appState.modalData.currentModal.defaultBodyComponent){
                    appState.modalData.currentModal.bodyComponent = appState.modalData.currentModal.defaultBodyComponent;
                }
                this.modalNotBusy();
            }, 300);
        } else {
            if (appState.modalData.currentModal.bodyComponent != appState.modalData.currentModal.defaultBodyComponent){
                appState.modalData.currentModal.bodyComponent = appState.modalData.currentModal.defaultBodyComponent;
            }
            this.modalNotBusy();
        }
        if (appState.modalData.currentModal.autoCloseTime) {
            this.timeouts.autoClose = setTimeout(() => {
                clearInterval(this.intervals.autoClose);
                clearTimeout(this.timeouts.autoClose);
                this.closeCurrentModal();
            }, appState.modalData.currentModal.autoCloseTime);

            var seconds = parseInt(appState.modalData.currentModal.autoCloseTime / 1000, 10);
            var confirmButtonText = appState.modalData.currentModal.confirmButtonText;

            this.intervals.autoClose = setInterval(() => {
                seconds--;
                if (seconds < 0){
                    seconds = 0;
                }
                appState.modalData.currentModal.confirmButtonText = confirmButtonText + ' (' + seconds + ')';
            }, 1000);

        }
    }

    async openSimpleModal(title, text, options) {
        appState.modalData.currentModal = _.cloneDeep(appState.defaultModal);
        if (options && _.isObject(options)){
            appState.modalData.currentModal = _.merge(appState.modalData.currentModal, options);
        }
        appState.modalData.currentModal.title = title;
        appState.modalData.currentModal.body = text;
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

    async confirm (title, text, confirmButtonText, cancelButtonText) {
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
        _appWrapper._confirmModalAction = this.boundMethods.confirmResolve;
        _appWrapper.closeModalPromise = new Promise((resolve, reject) => {
            appState.closeModalResolve = resolve;
            appState.closeModalReject = reject;
        });
        this.openCurrentModal();
        return _appWrapper.closeModalPromise;
    }
}

exports.ModalHelper = ModalHelper;