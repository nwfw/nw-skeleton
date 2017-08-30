/**
 * @fileOverview app-notifications component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.0
 */

const _ = require('lodash');
var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * App notifications component
 *
 * @name app-notifications
 * @memberOf components
 * @property {string}   name        Name of the component
 * @property {string}   template    Component template contents
 * @property {string[]} props       Component properties
 * @property {Function} data        Data function
 * @property {Object}   methods     Component methods
 * @property {Object}   watch       Component watchers
 * @property {Object}   computed    Computed properties
 * @property {Object}   components  Child components
 */
exports.component = {
    name: 'app-notifications',
    template: '',
    data: function () {
        return appState.appNotificationsData;
    },
    mounted: function(){
        this.processQueue();
    },
    updated: function(){
        if (!this.notificationExpired){
            let element = this.$el.querySelector('.app-notification-contents');
            let dimensions = this.$el.getCloneRealDimensions('.app-notification-contents');
            if (element && dimensions && dimensions.width && dimensions.height){
                element.setElementStyles({width: dimensions.width + 'px', height: dimensions.height + 'px', opacity: 1});
            }
        }
    },
    beforeDestroy: function(){
        this.stopQueue();
    },
    methods: {
        beforeEnter: function (element) {
            element.addClass('transition-wh2');
            element.setElementStyles({width: 0, height: 0, opacity: 0});
        },
        enter: function (element, done) {
            let duration = parseInt(parseFloat(_appWrapper.getHelper('style').getCssVarValue('--long-animation-duration'), 10) * 1000, 10) + 100;
            let dimensions = this.$el.getCloneRealDimensions('.app-notification-contents');
            element.setElementStyles({width: dimensions.width + 'px', height: dimensions.height + 'px', opacity: 1});

            setTimeout( () => {
                done();
            }, duration);
        },
        beforeLeave: function (element) {
            element.addClass('transition-wh2');
            let dimensions = this.$el.getCloneRealDimensions('.app-notification-contents');
            element.setElementStyles({width: dimensions.width + 'px', height: dimensions.height + 'px', opacity: 1});
        },
        leave: function (element, done) {
            let duration = parseInt(parseFloat(_appWrapper.getHelper('style').getCssVarValue('--long-animation-duration'), 10) * 1000, 10);
            element.setElementStyles({width: 0, height: 0, opacity: 0});
            setTimeout( () => {
                done();
            }, duration);
        },
        afterCancel: function (element) {
            element.removeClass('transition-wh2');
            element.removeElementStyles(['width', 'height', 'opacity']);
        },
        processQueue: async function () {
            let animationDuration = parseInt(parseFloat(_appWrapper.getHelper('style').getCssVarValue('--long-animation-duration'), 10) * 1000, 10) + 100;
            if (this.notificationExpired){
                if (this.newNotifications.length){
                    let newNotification = _.pullAt(this.newNotifications, 0)[0];
                    if (this.currentNotification){
                        this.oldNotifications.push(this.currentNotification);
                    }
                    this.notificationExpired = false;
                    this.currentNotification = newNotification;
                    await _appWrapper.wait(animationDuration);
                    this.setNotificationTimeout();

                } else {
                    await this.stopQueue();
                }
            }
        },
        stopQueue: async function(){
            let animationDuration = parseInt(parseFloat(_appWrapper.getHelper('style').getCssVarValue('--long-animation-duration'), 10) * 1000, 10) + 100;
            clearTimeout(this.timeouts.notificationQueue);
            if (this.currentNotification){
                this.oldNotifications.push(this.currentNotification);
                this.currentNotification = {};
                await _appWrapper.wait(animationDuration);
            }
            this.currentNotification = null;
            await _appWrapper.wait(animationDuration);
            this.notificationExpired = true;
        },

        setNotificationTimeout: function(){
            clearTimeout(this.timeouts.notificationQueue);
            let duration = _appWrapper.getConfig('appNotifications.duration');
            if (this.currentNotification && this.currentNotification.duration){
                duration = this.currentNotification.duration;
            }
            this.timeouts.notificationQueue = setTimeout( () => {
                if (this.currentNotification && this.currentNotification.pinned){
                    return;
                }
                this.notificationExpired = true;
                this.processQueue();
            }, duration);
        },
        removeNotification: function(){
            clearTimeout(this.timeouts.notificationQueue);
            this.notificationExpired = true;
            this.processQueue();
        },
        pinNotification: function(){
            if (this.currentNotification){
                if (this.currentNotification.pinned){
                    this.currentNotification.pinned = false;
                    this.setNotificationTimeout();
                } else {
                    clearTimeout(this.timeouts.notificationQueue);
                    this.currentNotification.pinned = true;
                }
            }

        }
    },
    watch: {
        newNotifications: function(){
            this.processQueue();
        },
        'currentNotification.count': function(count){
            if (count > 1){
                this.setNotificationTimeout();
            }
        }
    },
    computed: {
        appState: function(){
            return appState;
        },
        notification: function(){
            return appState.appNotificationsData.currentNotification;
        },
        appNotificationClass: function() {
            let classNames = [];
            if (this.notification && this.notification.type){
                classNames.push(this.notification.type);
            }
            if (this.notification && this.notification.pinned){
                classNames.push('app-notification-pinned');
            }
            return classNames;
        }
    }
};