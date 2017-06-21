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
            appStatusChangingTimeout: null
        };

        this.operationStartTime = null;
        this.lastTimeCalculation = null;
        this.lastTimeValue = 0;
        this.timeCalculationDelay = 1;
        this.minPercentComplete = 0.3;

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

        appState.appOperation = {
            operationText,
            useProgress,
            progressText,
            appBusy,
            cancelable
        };

        if (_.isUndefined(appBusy)){
            appBusy = true;
        }

        appState.appStatusChanging = true;
        _appWrapper.setAppStatus(appBusy);

        clearTimeout(this.timeouts.appStatusChangingTimeout);
        if (useProgress){
            this.startProgress(100, appState.appOperation.progressText);
        }
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

        let appBusy = appState.appOperation.appBusy ? false : appState.appBusy;

        if (!timeoutDuration){
            timeoutDuration = 2000;
        }

        _appWrapper.setAppStatus(appBusy, 'success');

        if (appState.appOperation.useProgress){
            this.clearProgress();
        }

        clearTimeout(this.timeouts.appStatusChangingTimeout);

        this.timeouts.appStatusChangingTimeout = setTimeout(() => {
            appState.appStatusChanging = false;
            appState.appOperation = {
                cancelable: null,
                cancelling: null,
                operationText: null,
                useProgress: null,
                progressText: null,
                appBusy: null
            };
            _appWrapper.setAppStatus(false);
        }, timeoutDuration);
        appState.progressData.animated = true;
    }

    operationCancel (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        appState.appOperation.cancelling = true;
        appState.appOperation.operationText = 'Cancelling...';
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
        var percentComplete = (completed / total) * 100;
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
        appState.progressData.styleObject = {
            width: percentComplete + '%'
        };
    }

    clearProgress () {
        appState.progressData.inProgress = false;
        this.operationStartTime = null;
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
}

exports.AppOperationHelper = AppOperationHelper;
