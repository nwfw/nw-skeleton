
const _ = require('lodash');
const BaseClass = require('../../base').BaseClass;

var _appWrapper;
var appState;


class AppNotificationsHelper extends BaseClass {
    constructor() {
        super();

        if (window && window.getAppWrapper && _.isFunction(window.getAppWrapper)){
            _appWrapper = window.getAppWrapper();
            appState = _appWrapper.getAppState();
        }

        this.timeouts = {
            notificationQueue: null
        };

        this.notificationExpired = true;

        return this;
    }

    async initialize () {
        return await super.initialize();
    }

    addNotification(notification){
        appState.appNotificationsData.newNotifications.push(notification);
    }

}

exports.AppNotificationsHelper = AppNotificationsHelper;