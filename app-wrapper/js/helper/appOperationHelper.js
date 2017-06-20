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

        return this;
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
            _appWrapper.getHelper('html').startProgress(100, appState.appOperation.progressText);
        }
    }

    operationUpdate(completed, total, progressText){
        if (!progressText){
            progressText = appState.appOperation.progressText;
        }
        if (appState.appOperation.useProgress){
            _appWrapper.getHelper('html').updateProgress(completed, total, progressText);
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
            _appWrapper.getHelper('html').clearProgress();
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
}

exports.AppOperationHelper = AppOperationHelper;
