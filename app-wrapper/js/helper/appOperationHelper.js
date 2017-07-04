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
            cancellingTimeout: null
        };

        this.intervals = {
            cancellingCheck: null
        };

        this.operationStartTime = null;
        this.lastTimeCalculation = null;
        this.lastTimeValue = 0;
        this.timeCalculationDelay = 0.5;
        this.minPercentComplete = 0.3;

        this.lastCalculationPercent = 0;

        return this;
    }

    async initialize () {
        await super.initialize();
        return this;
    }

    async finalize () {
        return true;
    }


    operationStart(operationText, cancelable, appBusy, useProgress, progressText, preventAnimation){
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

        let operationActive = true;
        let cancelling = false;
        let cancelled = false;
        let utilHelper = _appWrapper.getHelper('util');
        let operationId = utilHelper.getRandomString(10);

        appState.appOperation = {
            operationText,
            useProgress,
            progressText,
            appBusy,
            cancelable,
            cancelling,
            cancelled,
            operationActive,
            operationId,
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
                resolveReference(cancelled);
            }
        }, 100);
        this.timeouts.cancellingTimeout = setTimeout( () => {
            clearInterval(this.intervals.cancellingCheck);
            clearTimeout(this.timeouts.cancellingTimeout);
            resolveReference(false);
        }, this.getConfig('cancelOperationTimeout'));
        return returnPromise;
    }


    startProgress (total, operationText) {
        appState.progressData.inProgress = true;
        this.updateProgress(0, total, operationText);
    }

    updateProgress (completed, total, operationText) {
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

    calculateTime(percent){
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

    calculateTimeNew(percent){
        var currentTime = (+ new Date()) / 1000;
        var remainingTime = null;
        var change = percent - this.lastCalculationPercent;
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
            operationId: '',
        }, data);
    }
}

exports.AppOperationHelper = AppOperationHelper;
