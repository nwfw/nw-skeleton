
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
        if (appState.appNotificationsData.currentNotification && appState.appNotificationsData.currentNotification.message == notification.message){
            appState.appNotificationsData.currentNotification.count++;
            appState.appNotificationsData.currentNotification.timestamps.push(new Date().toString());
        } else {
            if (appState.appNotificationsData.newNotifications.length){
                if (appState.appNotificationsData.newNotifications[0].message == notification.message){
                    appState.appNotificationsData.newNotifications[0].count++;
                    appState.appNotificationsData.newNotifications[0].timestamps.push(new Date().toString());
                } else {
                    appState.appNotificationsData.newNotifications.push(notification);
                }
            } else {
                appState.appNotificationsData.newNotifications.push(notification);
            }
        }
    }

}

exports.AppNotificationsHelper = AppNotificationsHelper;