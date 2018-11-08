/**
 * @fileOverview AppOperationHelper class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

const AppBaseClass = require('../lib/appBase').AppBaseClass;

var _appWrapper;
var appState;

/**
 * AppOperationHelper class - handles and manages app operations
 *
 * @class
 * @extends {appWrapper.AppBaseClass}
 * @memberof appWrapper.helpers
 * @property {Number}   operationStartTime              Timestamp of last operation start
 * @property {Number}   lastTimeCalculation             Timestamp of last time calculation
 * @property {Number}   lastTimeValue                   Last time value
 * @property {Number}   timeCalculationDelay            Minimum delay between calculations
 * @property {Number}   minPercentComplete              Minimum percent complete before time calculation
 * @property {Number}   lastCalculationPercent          Last calculated percent value
 * @property {string}   progressNotificationId          Id of progress desktop notification
 * @property {boolean}  progressNotificationCreated     Flag to indicate whether progress notification was created
 * @property {boolean}  progressNotificationProgress    Percent complete of progress desktop notification
 */
class AppOperationHelper extends AppBaseClass {

    /**
     * Creates AppOperationHelper instance
     *
     * @constructor
     * @return {AppOperationHelper}              Instance of AppOperationHelper class
     */
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

    /**
     * Starts the operation
     *
     * @param  {string}     operationText       Operation text
     * @param  {boolean}    cancelable          Flag to indicate whether operation is cancelable
     * @param  {boolean}    appBusy             Flag to indicate whether to set appBusy status
     * @param  {boolean}    useProgress         Flag to indicate whether to use progress bar
     * @param  {string}     progressText        Progress bar tet
     * @param  {boolean}    preventAnimation    Flag to indicate whether to prevent animations
     * @param  {boolean}    notify              Flag to indicate whether to notify user when operation is finished
     * @return {string}                         App operation ID
     */
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

        let hideLiveInfo = appState.appOperation.hideLiveInfo;
        let hideProgressBar = appState.appOperation.hideProgressBar;

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
            notify,
            hideLiveInfo,
            hideProgressBar
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

    /**
     * Updates current operation
     *
     * @param  {Number} completed    Number of sub-operations completed
     * @param  {Number} total        Total number of sub-operations
     * @param  {string} progressText Progress bar text
     * @return {undefined}
     */
    operationUpdate(completed, total, progressText){
        if (!progressText){
            progressText = appState.appOperation.progressText;
        }
        if (appState.appOperation.useProgress){
            this.updateProgress(completed, total, progressText);
        }
    }

    /**
     * Finishes current operation
     *
     * @param  {string} operationText   Operation text to display
     * @param  {Number} timeoutDuration Duration in milliseconds until hiding appOperation text
     * @return {undefined}
     */
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

    /**
     * Cancels current operation
     *
     * @async
     * @param  {Event} e    Event that triggered the method
     * @return {boolean}    Cancelling result
     */
    async operationCancel (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        if (!appState.appOperation.cancelable){
            return;
        }
        appState.appOperation.cancelling = true;
        appState.appOperation.operationText = this.translate('Cancelling...');
        let returnPromise;
        let resolveReference;
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

    /**
     * Start operation progress
     *
     * @param  {Number} total           Total number of sub-operations
     * @param  {string} progressText    Progress text
     * @return {undefined}
     */
    startProgress (total, progressText) {
        appState.progressData.inProgress = true;
        this.updateProgress(0, total, progressText);
    }

    /**
     * Update operation progress
     *
     * @async
     * @param  {Number} completed       Number of sub-operations completed
     * @param  {Number} total           Total number of sub-operations
     * @param  {string} progressText    Progress bar text
     * @return {undefined}
     */
    async updateProgress (completed, total, progressText) {
        let pd = appState.progressData;
        if (!pd.inProgress){
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

        let percentComplete = Math.ceil((completed / total) * 100);

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

        let remainingTime = this.calculateTime(percentComplete);
        percentComplete = parseInt(percentComplete);
        if (progressText){
            pd.operationText = progressText;
        }
        let formattedDuration = this.translate('calculating');
        if (percentComplete >= this.minPercentComplete){
            formattedDuration = _appWrapper.getHelper('format').formatDuration(remainingTime);
        }
        pd.percentComplete = percentComplete + '%';
        if (percentComplete < 100){
            pd.percentComplete += ' (ETA: ' + formattedDuration + ')';
        }
        pd.percentNumber = percentComplete;
        pd.currentStep = completed;
        pd.totalSteps = total;
        pd.styleObject = {
            width: percentComplete + '%'
        };
    }

    /**
     * Clears operation progress
     *
     * @return {undefined}
     */
    clearProgress () {
        appState.progressData = {
            animated: true,
            inProgress: false,
            percentComplete: 0,
            percentNumber: 0,
            currentStep: 0,
            totalSteps: 0,
            operationText: '',
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

    /**
     * Old method to calculate remaining time
     *
     * @param  {Number} percent Current percent
     * @return {Number}         Remaining seconds
     */
    calculateTimeOld(percent){
        let currentTime = (+ new Date()) / 1000;
        let remainingTime = null;
        if (percent && percent > this.minPercentComplete && (!this.lastTimeValue || (currentTime - this.lastTimeCalculation > this.timeCalculationDelay))){
            let remaining = 100 - percent;
            this.lastTimeCalculation = currentTime;
            let elapsedTime = currentTime - this.operationStartTime;
            let timePerPercent = elapsedTime / percent;
            remainingTime = remaining * timePerPercent;
            this.lastTimeValue = remainingTime;
        } else {
            remainingTime = this.lastTimeValue;
        }
        return remainingTime;
    }

    /**
     * Method to calculate remaining time
     *
     * @param  {Number} percent Current percent
     * @return {Number}         Remaining seconds
     */
    calculateTime(percent){
        let currentTime = (+ new Date()) / 1000;
        let remainingTime = null;
        let change = percent - this.lastCalculationPercent;
        if (this.lastTimeCalculation){
            if (change > 0 && percent && percent > this.minPercentComplete && (!this.lastTimeValue || (currentTime - this.lastTimeCalculation > this.timeCalculationDelay))){
                let remaining = 100 - percent;
                let elapsedSinceLastCalculation = currentTime - this.lastTimeCalculation;
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

    /**
     * Checks whether operation can continue
     *
     * @return {boolean} True if operation can continue, false otherwise
     */
    canOperationContinue () {
        return appState.appOperation.operationActive && !appState.appOperation.cancelled && !appState.appOperation.cancelling;
    }

    /**
     * Checks whether operation is active by its ID
     *
     * @param {string}  operationId     Operation ID to check for
     * @return {boolean}                True if operation is active, false otherwise
     */
    isOperationActive (operationId) {
        let active = appState.appOperation.operationActive || appState.appOperation.cancelling;
        if (operationId){
            active = active && operationId == appState.appOperation.operationId;
        }
        return active;
    }

    /**
     * Checks whether operation is active by its text
     *
     * @param {string}  operationText   Operation text to check for
     * @return {boolean}                True if operation is active, false otherwise
     */
    isOperationTextActive (operationText) {
        let active = appState.appOperation.operationActive || appState.appOperation.cancelling;
        if (operationText){
            active = active && operationText == appState.appOperation.operationText;
        }
        return active;
    }

    /**
     * Checks whether operation is cancelled
     *
     * @return {boolean} True if operation is cancelled, false otherwise
     */
    isOperationCancelled () {
        return !appState.appOperation.operationActive || appState.appOperation.cancelled;
    }

    /**
     * Resets all operation data
     *
     * @param  {Object} data Operation data to set
     * @return {undefined}
     */
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
            hideLiveInfo: false,
            hideProgressBar: false,
        }, data);
    }

    /**
     * Shows cancel operation modal for reload or close events
     *
     * @async
     * @param  {boolean} reloading Flag to indicate whether window is reloading or closing
     * @return {undefined}
     */
    async showCancelModal (reloading) {
        let modalHelper = _appWrapper.getHelper('modal');
        let modalOptions = {};
        modalOptions.reloading = reloading ? true : false;
        modalOptions.closing = reloading ? false : true;
        if (modalOptions.closing){
            appState.preventClose = true;
        }
        modalOptions.cancelable = appState.appOperation.cancelable;

        appState.modalData.currentModal = modalHelper.getModalObject('cancelAndExitModal', modalOptions);
        let cm = appState.modalData.currentModal;
        cm.onCancel = this.boundMethods.stopCancelAndExit;
        _appWrapper.once('appOperation:finish', this.boundMethods.cancelOperationComplete);
        _appWrapper.once('appOperation:progressDone', this.boundMethods.cancelProgressDone);
        if (appState.appOperation.cancelable){
            cm.title = this.translate('Are you sure?');
            if (cm.reloading){
                await modalHelper.queryModal(this.boundMethods.cancelAndReload, this.boundMethods.stopCancelAndExit);
            } else {
                await modalHelper.queryModal(this.boundMethods.cancelAndClose, this.boundMethods.stopCancelAndExit);
            }
            return;
        } else {
            cm.title = this.translate('Operation in progress');
            cm.showCancelButton = false;
            cm.confirmButtonText = this.translate('Ok');
            cm.autoCloseTime = 10000;
            await modalHelper.queryModal(this.boundMethods.stopCancelAndExit, this.boundMethods.stopCancelAndExit);
            this.stopCancelAndExit();
        }
    }

    /**
     * Triggered when progress is done while cancel modal is opened
     *
     * @async
     * @return {undefined}
     */
    async cancelProgressDone () {
        let cm = appState.modalData.currentModal;
        cm.showCancelButton = false;
        cm.showConfirmButton = false;
        cm.hideProgress = true;
        cm.success = true;
        cm.title = this.translate('Operation finished');
    }

    /**
     * Triggered when operation is finished while cancel modal is opened
     *
     * @async
     * @return {undefined}
     */
    async cancelOperationComplete () {
        let cm = _.cloneDeep(appState.modalData.currentModal);
        _appWrapper.getHelper('modal').closeCurrentModal();
        if (cm.reloading){
            _appWrapper.beforeUnload();
        } else {
            _appWrapper.onWindowClose();
        }
    }

    /**
     * Cancels current action and closes window
     *
     * @async
     * @param  {boolean} result Operation result
     * @return {undefined}
     */
    async cancelAndClose (result) {
        await this.cancelAndExit(result, () => {_appWrapper.windowManager.closeWindowForce();});
    }

    /**
     * Cancels current action and reloads window
     *
     * @async
     * @param  {boolean} result Operation result
     * @return {undefined}
     */
    async cancelAndReload (result) {
        await this.cancelAndExit(result, () => {_appWrapper.windowManager.reloadWindow(null, true);});
    }

    /**
     * Shows modal for cancelling and exits if operation finishes while modal is opened
     *
     * @async
     * @param  {boolean} result Operation result
     * @param  {Function} callback Eventual callback to call
     * @return {undefined}
     */
    async cancelAndExit (result, callback) {
        _appWrapper.removeAllListeners('appOperation:finish');
        let modalHelper = _appWrapper.getHelper('modal');
        let success = result;
        let cm = appState.modalData.currentModal;
        if (success){
            cm.title = this.translate('Please wait while operation is cancelled.');
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
                appState.preventClose = false;
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
            cm.title = this.translate('Problem cancelling operation');
            cm.fail = true;
            cm.success = false;
            cm.showCancelButton = false;
            cm.showConfirmButton = true;
            cm.confirmButtonText = this.translate('Ok');
            cm.hideProgress = true;
            cm.autoCloseTime = 10000;
            modalHelper.autoCloseModal();
        }
    }

    /**
     * Clears timeouts and intervals used by cancelAndExit method
     *
     * @async
     * @return {undefined}
     */
    async stopCancelAndExit(){
        let modalHelper = _appWrapper.getHelper('modal');
        _appWrapper.removeAllListeners('appOperation:finish');
        _appWrapper.removeAllListeners('appOperation:progressDone');
        modalHelper.resetModalActions();
        if (!appState.modalData.currentModal.busy){
            modalHelper.closeCurrentModal();
        }
    }
}

exports.AppOperationHelper = AppOperationHelper;
