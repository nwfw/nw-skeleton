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

        this.forceDebug = false;
        this.forceUserMessages = false;

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
            appState.modalData.modalVisible = false;
            this.modalNotBusy();
        } else {
            appUtil.log('Can\'t close modal because it is busy', 'warning', [], false, this.forceDebug);
        }
    }

    openCurrentModal (showContentImmediately) {
        appState.modalData.modalVisible = true;
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
    }
}

exports.ModalHelper = ModalHelper;