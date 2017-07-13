var _ = require('lodash');
var BaseClass = require('../base').BaseClass;

var _appWrapper;
var appState;


class AppOperationHelper extends BaseClass {
    constructor() {
        super();

        _appWrapper = window.getAppWrapper();
        appState = _appWrapper.getAppState();

        this.timeouts = {
            appStatusChangingTimeout: null,
            cancellingTimeout: null,
            cancelCountdown: null,
        };

        this.intervals = {
            cancellingCheck: null,
            cancelCountdown: null,
        };

        this.boundMethods = {
            cancelAndClose: null,
            cancelAndReload: null,
            stopCancelAndExit: null,
            cancelProgressDone: null,
            cancelOperationComplete: null,
        };

        this.operationStartTime = null;
        this.lastTimeCalculation = null;
        this.lastTimeValue = 0;
        this.timeCalculationDelay = 0.3;
        this.minPercentComplete = 0.5;

        this.lastCalculationPercent = 0;

        this.progressNotificationId = null;
        this.progressNotificationCreated = false;
        this.progressNotificationProgress = null;

        return this;
    }

    async initialize () {
        await super.initialize();
        return this;
    }

    async finalize () {
        return true;
    }


    operationStart(operationText, cancelable, appBusy, useProgress, progressText, preventAnimation, notify){
        if (appState.appOperation.operationActive){
            this.log('Can\'t start another operation, one is already in progress', 'warning', []);
            return;
        }
        if (!operationText){
            operationText = '';
        }
        if (!cancelable){
            cancelable = false;
        }
        if (preventAnimation){
            appState.progressData.animated = false;
        } else {
            appState.progressData.animated = true;
        }

        if (!notify){
            notify = false;
        }

        let operationActive = true;
        let cancelling = false;
        let cancelled = false;
        let utilHelper = _appWrapper.getHelper('util');
        let operationId = utilHelper.getRandomString(10);
        let operationStartTimestamp = parseInt((+ new Date()) / 1000, 10);

        appState.appOperation = {
            operationText,
            useProgress,
            progressText,
            appBusy,
            cancelable,
            cancelling,
            cancelled,
            operationActive,
            operationStartTimestamp,
            operationId,
            notify
        };

        if (_.isUndefined(appBusy)){
            appBusy = true;
        }

        appState.status.appStatusChanging = true;
        appState.appOperation.operationVisible = true;
        _appWrapper.setAppStatus(appBusy);

        clearTimeout(this.timeouts.appStatusChangingTimeout);
        if (useProgress){
            this.startProgress(100, appState.appOperation.progressText);
        }
        return operationId;
    }

    operationUpdate(completed, total, progressText){
        if (!progressText){
            progressText = appState.appOperation.progressText;
        }
        if (appState.appOperation.useProgress){
            this.updateProgress(completed, total, progressText);
        }
    }

    operationFinish(operationText, timeoutDuration){
        let originalText = appState.appOperation.operationText;
        if (operationText){
            appState.appOperation.operationText = operationText;
        }

        // let appBusy = appState.appOperation.appBusy ? false : appState.status.appBusy;

        if (!timeoutDuration){
            timeoutDuration = 2000;
        }

        appState.progressData.inProgress = false;
        appState.appOperation.operationActive = false;

        // _appWrapper.setAppStatus(appBusy, 'success');
        //
        _appWrapper.emit('appOperation:progressDone');
        if (appState.appOperation.notify && !appState.status.windowFocused){
            let duration = _appWrapper.getHelper('format').formatDurationCustom(parseInt((+ new Date()) / 1000, 10) - appState.appOperation.operationStartTimestamp);
            this.addDesktopNotification('Operation "{1}" completed.', [originalText], false, {
                message: this.translate('Duration: {1} seconds', null, [duration]),
            }, {
                onClicked: () => {
                    // console.log('onclick');
                    // console.log(_appWrapper.windowManager.window);
                    _appWrapper.windowManager.window.focus();
                },
                onClosed: () => {
                    // console.log('onclose');
                    // console.log(_appWrapper.windowManager.window);
                    _appWrapper.windowManager.window.focus();
                }
            });
        }

        clearTimeout(this.timeouts.appStatusChangingTimeout);

        this.timeouts.appStatusChangingTimeout = setTimeout(() => {
            appState.status.appStatusChanging = false;
            if (appState.appOperation.useProgress){
                this.clearProgress();
            }
            this.resetOperationData();
            _appWrapper.emit('appOperation:finish');
            _appWrapper.setAppStatus(false);
        }, timeoutDuration);
        appState.progressData.animated = true;
    }

    async operationCancel (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        if (!appState.appOperation.cancelable){
            return;
        }
        appState.appOperation.cancelling = true;
        appState.appOperation.operationText = _appWrapper.appTranslations.translate('Cancelling...');
        var returnPromise;
        var resolveReference;
        returnPromise = new Promise((resolve) => {
            resolveReference = resolve;
        });
        this.intervals.cancellingCheck = setInterval( () => {
            let cancelled = this.isOperationCancelled();
            if (cancelled){
                clearInterval(this.intervals.cancellingCheck);
                appState.appOperation.cancelling = false;
                appState.appOperation.cancelled = true;
                _appWrapper.emit('appOperation:cancelled');
                resolveReference(cancelled);
            }
        }, 100);
        this.timeouts.cancellingTimeout = setTimeout( () => {
            clearInterval(this.intervals.cancellingCheck);
            clearTimeout(this.timeouts.cancellingTimeout);
            _appWrapper.emit('appOperation:cancelTimedOut');
            resolveReference(false);
        }, this.getConfig('cancelOperationTimeout'));
        return returnPromise;
    }


    startProgress (total, operationText) {
        appState.progressData.inProgress = true;
        this.updateProgress(0, total, operationText);
    }

    async updateProgress (completed, total, operationText) {
        if (!appState.progressData.inProgress){
            this.log('Trying to update progress while appState.progressData.inProgress is false', 'info', []);
            return;
        }
        if (!this.operationStartTime){
            this.operationStartTime = (+ new Date()) / 1000;
        }
        if (completed > total){
            completed = total;
        }
        if (completed < 0){
            completed = 0;
        }
        var percentComplete = Math.ceil((completed / total) * 100);

        //TODO fix notification

        // let appNotificationsHelper = _appWrapper.getHelper('appNotifications');
        // if (appState.appOperation.notify && !appState.status.windowFocused){
        //     let notifOptions = {
        //         imageUrl: '',
        //         type: 'progress',
        //         progress: percentComplete,
        //         requireInteraction: true,
        //         message: ' '
        //     };
        //     if (!this.progressNotificationId && !this.progressNotificationCreated){
        //         this.progressNotificationCreated = true;
        //         this.progressNotificationProgress = percentComplete;
        //         notifOptions.progress = percentComplete;
        //         this.progressNotificationId = await this.addDesktopNotification(appState.appOperation.operationText, [], true, notifOptions);
        //     } else if (this.progressNotificationCreated && this.progressNotificationId){
        //         if (this.progressNotificationProgress != percentComplete){
        //             this.progressNotificationProgress = percentComplete;
        //             notifOptions.progress = percentComplete;
        //             appNotificationsHelper.updateDesktopNotification(this.progressNotificationId, notifOptions);
        //         }
        //     }
        // }
        var remainingTime = this.calculateTime(percentComplete);
        percentComplete = parseInt(percentComplete);
        if (operationText){
            appState.progressData.operationText = operationText;
        }
        appState.progressData.detailText = completed + ' / ' + total;
        var formattedDuration = _appWrapper.appTranslations.translate('calculating');
        if (percentComplete >= this.minPercentComplete){
            formattedDuration = _appWrapper.getHelper('format').formatDuration(remainingTime);
        }
        appState.progressData.percentComplete = percentComplete + '% (ETA: ' + formattedDuration + ')';
        appState.progressData.percentNumber = percentComplete;
        appState.progressData.styleObject = {
            width: percentComplete + '%'
        };
    }

    clearProgress () {
        appState.progressData = {
            animated: true,
            inProgress: false,
            percentComplete: 0,
            percentNumber: 0,
            operationText: '',
            detailText: '',
            progressBarClass: '',
            styleObject: {
                width: '0%'
            }
        };
        this.operationStartTime = null;
        this.lastTimeCalculation = null;
        this.lastTimeValue = 0;
        this.lastCalculationPercent = 0;
    }

    calculateTimeOld(percent){
        var currentTime = (+ new Date()) / 1000;
        var remainingTime = null;
        if (percent && percent > this.minPercentComplete && (!this.lastTimeValue || (currentTime - this.lastTimeCalculation > this.timeCalculationDelay))){
            var remaining = 100 - percent;
            this.lastTimeCalculation = currentTime;
            var elapsedTime = currentTime - this.operationStartTime;
            var timePerPercent = elapsedTime / percent;
            remainingTime = remaining * timePerPercent;
            this.lastTimeValue = remainingTime;
        } else {
            remainingTime = this.lastTimeValue;
        }
        return remainingTime;
    }

    calculateTime(percent){
        var currentTime = (+ new Date()) / 1000;
        var remainingTime = null;
        var change = percent - this.lastCalculationPercent;
        if (this.lastTimeCalculation){
            if (change > 0 && percent && percent > this.minPercentComplete && (!this.lastTimeValue || (currentTime - this.lastTimeCalculation > this.timeCalculationDelay))){
                let remaining = 100 - percent;
                var elapsedSinceLastCalculation = currentTime - this.lastTimeCalculation;
                let timePerPercent = elapsedSinceLastCalculation / change;
                remainingTime = remaining * timePerPercent;
                this.lastTimeCalculation = currentTime;
                this.lastTimeValue = remainingTime;
            } else {
                remainingTime = this.lastTimeValue;
            }
        } else {
            this.lastTimeCalculation = currentTime;
        }
        this.lastCalculationPercent = percent;
        return remainingTime;
    }

    canOperationContinue () {
        return appState.appOperation.operationActive && !appState.appOperation.cancelled && !appState.appOperation.cancelling;
    }

    isOperationCancelled () {
        return !appState.appOperation.operationActive || appState.appOperation.cancelled;
    }

    resetOperationData (data) {
        if (!data){
            data = {};
        }
        appState.appOperation = _.extend({
            operationText: '',
            useProgress: false,
            progressText: '',
            appBusy: false,
            cancelable: false,
            cancelling: false,
            cancelled: false,
            operationActive: false,
            operationVisible: false,
            operationStartTimestamp: false,
            operationId: '',
            notify: false,
        }, data);
    }

    async showCancelModal (reloading) {
        let modalHelper = _appWrapper.getHelper('modal');
        let modalOptions = {};
        modalOptions.reloading = reloading ? true : false;
        modalOptions.closing = reloading ? false : true;
        modalOptions.cancelable = appState.appOperation.cancelable;

        appState.modalData.currentModal = modalHelper.getModalObject('cancelAndExitModal', modalOptions);
        let cm = appState.modalData.currentModal;
        _appWrapper.once('appOperation:finish', this.boundMethods.cancelOperationComplete);
        _appWrapper.once('appOperation:progressDone', this.boundMethods.cancelProgressDone);
        appState.headerData.hideLiveInfo = true;
        appState.headerData.hideProgressBar = true;
        if (appState.appOperation.cancelable){
            cm.title = _appWrapper.appTranslations.translate('Are you sure?');
            if (cm.reloading){
                await modalHelper.queryModal(this.boundMethods.cancelAndReload, this.boundMethods.stopCancelAndExit);
            } else {
                await modalHelper.queryModal(this.boundMethods.cancelAndClose, this.boundMethods.stopCancelAndExit);
            }
            return;
        } else {
            cm.title = _appWrapper.appTranslations.translate('Operation in progress');
            cm.showCancelButton = false;
            cm.autoCloseTime = 10000;
            await modalHelper.queryModal(this.boundMethods.stopCancelAndExit, this.boundMethods.stopCancelAndExit);
            this.stopCancelAndExit();
        }
    }

    async cancelProgressDone () {
        let cm = appState.modalData.currentModal;
        cm.showCancelButton = false;
        cm.showConfirmButton = false;
        cm.hideProgress = true;
        cm.success = true;
        cm.title = _appWrapper.appTranslations.translate('Operation finished');
    }

    async cancelOperationComplete () {
        let cm = _.cloneDeep(appState.modalData.currentModal);
        _appWrapper.getHelper('modal').closeCurrentModal();
        if (cm.reloading){
            _appWrapper.beforeUnload();
        } else {
            _appWrapper.onWindowClose();
        }
    }

    async cancelAndClose (result) {
        await this.cancelAndExit(result, () => {_appWrapper.windowManager.closeWindowForce();});
    }

    async cancelAndReload (result) {
        await this.cancelAndExit(result, () => {_appWrapper.windowManager.reloadWindow(null, true);});
    }

    async cancelAndExit (result, callback) {
        _appWrapper.removeAllListeners('appOperation:finish');
        let modalHelper = _appWrapper.getHelper('modal');
        let success = result;
        let cm = appState.modalData.currentModal;
        if (success){
            cm.title = _appWrapper.appTranslations.translate('Please wait while operation is cancelled.');
            cm.body = '';
            cm.showCancelButton = false;
            cm.showConfirmButton = false;
            cm.remainingTime = appState.config.cancelOperationTimeout;
            clearInterval(this.intervals.cancelCountdown);
            this.intervals.cancelCountdown = setInterval( () => {
                if (cm.remainingTime >= 1000){
                    cm.remainingTime = cm.remainingTime - 1000;
                } else {
                    cm.remainingTime = 0;
                }
            }, 1000);
            success = await this.operationCancel();
            cm.remainingTime = 0;
            clearInterval(this.intervals.cancelCountdown);
            if (success){
                modalHelper.closeCurrentModal(true);
                await _appWrapper.cleanup();
                if (!appState.isDebugWindow){
                    appState.appError.error = false;
                    callback();
                    return;
                }
            }
        }
        if (!success){
            cm.title = _appWrapper.appTranslations.translate('Problem cancelling operation');
            cm.fail = true;
            cm.success = false;
            cm.showConfirmButton = true;
            cm.confirmButtonText = 'Ok';
            cm.hideProgress = true;
            cm.autoCloseTime = 10000;
            modalHelper.autoCloseModal();
        }
    }

    async stopCancelAndExit(){
        appState.headerData.hideLiveInfo = false;
        appState.headerData.hideProgressBar = false;
        _appWrapper.removeAllListeners('appOperation:finish');
        _appWrapper.removeAllListeners('appOperation:progressDone');
        _appWrapper._confirmModalAction = _appWrapper.__confirmModalAction;
        _appWrapper._cancelModalAction = _appWrapper.__cancelModalAction;
        _appWrapper.getHelper('modal').closeCurrentModal();
    }
}

exports.AppOperationHelper = AppOperationHelper;
