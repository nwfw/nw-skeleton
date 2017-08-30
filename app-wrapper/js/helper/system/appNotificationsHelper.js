/**
 * @fileOverview AppNotificationsHelper class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.0
 */

const _ = require('lodash');
const path = require('path');
const AppBaseClass = require('../../lib/appBase').AppBaseClass;

var _appWrapper;
var appState;

/**
 * AppNotificationsHelper class - handles and manages app and desktop notifications
 *
 * @class
 * @extends {appWrapper.AppBaseClass}
 * @memberof appWrapper.helpers.systemHelpers
 */
class AppNotificationsHelper extends AppBaseClass {

    /**
     * Creates AppNotificationsHelper instance
     *
     * @constructor
     * @return {AppNotificationsHelper}              Instance of AppNotificationsHelper class
     */
    constructor() {
        super();

        if (window && window.getAppWrapper && _.isFunction(window.getAppWrapper)){
            _appWrapper = window.getAppWrapper();
            appState = _appWrapper.getAppState();
        }

        this.timeouts = {
            notificationQueue: null
        };

        return this;
    }

    /**
     * Adds app notification
     *
     * @param {Object} notification Notification object
     * @return {undefined}
     */
    async addNotification(notification){
        let nd = appState.appNotificationsData;
        let cn = nd.currentNotification;
        if (cn && cn.message == notification.message && cn.type == notification.type){
            cn.count++;
            cn.timestamps.push(new Date().toString());
        } else {
            if (nd.newNotifications.length){
                if (nd.newNotifications[0].message == notification.message && nd.newNotifications[0].type == notification.type){
                    nd.newNotifications[0].count++;
                    nd.newNotifications[0].timestamps.push(new Date().toString());
                } else {
                    if (notification.immediate){
                        nd.notificationExpired = true;
                        nd.newNotifications.unshift(notification);
                    } else {
                        nd.newNotifications.push(notification);
                    }
                }
            } else {
                if (notification.immediate){
                    nd.notificationExpired = true;
                    nd.newNotifications.unshift(notification);
                } else {
                    nd.newNotifications.push(notification);
                }
            }
        }
    }

    /**
     * Adds chrome desktop notification
     *
     * @async
     * @param {Object}  notification    Notification object
     * @param {Object}  options         Notification options
     * @param {Object}  callbacks       Object with onButtonClicked, onClicked, onClosed notification handlers
     * @return {string}                 Chrome notification id
     */
    async addChromeNotification (notification, options, callbacks){
        if (!options){
            options = {};
        }
        options = _.defaultsDeep(options, {
            title: notification.message,
            type: 'image',
            message: '',
            iconUrl: 'file://' + path.join(appState.appDir, '/images/tray-icon.png'),
            imageUrl: 'file://' + path.join(appState.appDir, '/images/logo.png'),
            requireInteraction: true,
            isClickable: false,
            priority: 0,
            // buttons: [
            //     {
            //         title: 'Ok'
            //     },
            //     {
            //         title: 'Cancel'
            //     }
            // ],
        });
        if (!options.iconUrl){
            delete options.iconUrl;
        }

        if (!options.imageUrl){
            delete options.imageUrl;
        }

        return await this.showChromeNotification(options, callbacks);
    }

    /**
     * Shows chrome notification
     *
     * @async
     * @param  {Object} options     Chrome notification options
     * @param {Object}  callbacks   Object with onButtonClicked, onClicked, onClosed notification handlers
     * @return {string}             Chrome notification id
     */
    async showChromeNotification (options, callbacks) {
        this.log('Showing desktop notification "{1}"', 'info', [options.title]);

        let listeners = chrome.notifications.onClicked.getListeners();
        _.each(listeners, function(listener){
            chrome.notifications.onClicked.removeListener(listener.callback);
        });
        listeners = chrome.notifications.onClosed.getListeners();
        _.each(listeners, function(listener){
            chrome.notifications.onClosed.removeListener(listener.callback);
        });

        listeners = chrome.notifications.onButtonClicked.getListeners();
        _.each(listeners, function(listener){
            chrome.notifications.onButtonClicked.removeListener(listener.callback);
        });

        var returnPromise;
        var resolveReference;
        returnPromise = new Promise((resolve) => {
            resolveReference = resolve;
        });

        if (callbacks && _.isObject(callbacks)){
            chrome.notifications.onClicked.addListener((notificationId) => {
                // console.log('notif clickedd', notificationId);
                chrome.notifications.clear(notificationId);
                if (callbacks.onClicked && _.isFunction(callbacks.onClicked)){
                    callbacks.onClicked(notificationId);
                }
            });
            chrome.notifications.onClosed.addListener((notificationId, byUser) => {
                // console.log('notif closedd', notificationId, byUser);
                chrome.notifications.clear(notificationId);
                if (callbacks.onClosed && _.isFunction(callbacks.onClosed)){
                    callbacks.onClosed(notificationId, byUser);
                }
            });
            chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
                // console.log('notif button click', notificationId, buttonIndex);
                if (callbacks.onButtonClicked && _.isFunction(callbacks.onButtonClicked)){
                    callbacks.onButtonClicked(notificationId, buttonIndex);
                }
            });
        }

        chrome.notifications.create(_appWrapper.getHelper('util').uuid(), options, (notificationId) => { resolveReference(notificationId);});
        return returnPromise;
    }

    /**
     * Update chrome desktop notification
     *
     * @async
     * @param  {string} notificationId Chrome notification id
     * @param  {Object} options        Chrome notification options
     * @return {undefined}
     */
    async updateDesktopNotification (notificationId, options) {
        chrome.notifications.update(notificationId, options);
    }

    /**
     * Adds desktop notification
     *
     * @async
     * @param {Object} notification     Notification object
     * @param {Objcet} options          Notification options
     * @param {object} callbacks        Object with onshow, onClicked, onClosed and onerror notification handlers
     * @return {Notification}           Desktop notification instance
     */
    async addDesktopNotification (notification, options, callbacks){
        if (!options){
            options = {};
        }
        options = _.defaultsDeep(options, {
            body: '',
            icon: 'file://' + path.join(appState.appDir, '/images/tray-icon.png'),
            badge: 'file://' + path.join(appState.appDir, '/images/logo.png'),
            image: 'file://' + path.join(appState.appDir, '/images/logo.png'),
            vibrate: [200, 100, 200],
            requireInteraction: true,
            tag: _appWrapper.getHelper('util').uuid(),
            renotify: false,
        });

        if (options.message){
            options.body = options.message;
            delete options.message;
        }

        if (Notification.permission === 'granted') {
            return this.showDesktopNotification(notification, options, callbacks);
        } else if (Notification.permission !== 'denied') {
            var returnPromise;
            var resolveReference;
            returnPromise = new Promise((resolve) => {
                resolveReference = resolve;
            });
            Notification.requestPermission( (permission) => {
                if (permission === 'granted') {
                    let desktopNotification = this.showDesktopNotification(notification, options, callbacks);
                    resolveReference(desktopNotification);
                }
            });
            return returnPromise;
        }
    }

    /**
     * Shows desktop notification
     *
     * @param {Object} notification     Notification object
     * @param {Objcet} options          Notification options
     * @param {object} callbacks        Object with onshow, onClicked, onClosed and onerror notification handlers
     * @return {Notification}           Desktop notification instance
     */
    showDesktopNotification (notification, options, callbacks) {
        this.log('Showing desktop notification "{1}"', 'info', [notification.message]);
        let desktopNotification = new Notification(notification.message, options);
        if (callbacks && _.isObject(callbacks)){
            if (callbacks.onshow && _.isFunction(callbacks.onshow)){
                desktopNotification.onshow = callbacks.onshow;
            }
            if (callbacks.onClicked && _.isFunction(callbacks.onClicked)){
                desktopNotification.onclick = callbacks.onClicked;
            }
            if (callbacks.onClosed && _.isFunction(callbacks.onClosed)){
                desktopNotification.onclose = callbacks.onClosed;
            }
            if (callbacks.onerror && _.isFunction(callbacks.onerror)){
                desktopNotification.onerror = (e) => {
                    this.log('Desktop notification error "{1}"', 'error', [e]);
                    callbacks.onerror(e);
                };
            } else {
                desktopNotification.onerror = (e) => {
                    this.log('Desktop notification error "{1}"', 'error', [e]);
                };
            }
        }
        return desktopNotification;
    }
}

exports.AppNotificationsHelper = AppNotificationsHelper;