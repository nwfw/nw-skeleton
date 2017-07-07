const _ = require('lodash');
var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'app-notifications',
    template: '',
    data: function () {
        return appState.appNotificationsData;
    },
    mounted: function(){
        this.processQueue();
    },
    beforeUnmount: function(){
        this.stopQueue();
    },
    methods: {
        beforeEnter: function (element) {
            element.addClass('transition-wh2');
            element.setElementStyles({width: 0, height: 0, opacity: 0});
        },
        enter: function (element, done) {
            var duration = parseInt(parseFloat(_appWrapper.getHelper('style').getCssVarValue('--long-animation-duration'), 10) * 1000, 10) + 100;
            var dimensions = this.$el.getRealDimensions('.app-notification');
            element.setElementStyles({width: dimensions.width + 'px', height: dimensions.height + 'px', opacity: 1});

            setTimeout( () => {
                done();
            }, duration);
        },
        beforeLeave: function (element) {
            element.addClass('transition-wh2');
            var dimensions = this.$el.getRealDimensions('.app-notification');
            element.setElementStyles({width: dimensions.width + 'px', height: dimensions.height + 'px', opacity: 1});
        },
        leave: function (element, done) {
            var duration = parseInt(parseFloat(_appWrapper.getHelper('style').getCssVarValue('--long-animation-duration'), 10) * 1000, 10);
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
                        this.currentNotification = {};
                        await _appWrapper.wait(animationDuration);
                    }
                    this.currentNotification = newNotification;
                    await _appWrapper.wait(animationDuration);
                    this.notificationExpired = false;
                    this.timeouts.notificationQueue = setTimeout( () => {
                        this.notificationExpired = true;
                        this.processQueue();
                    }, _appWrapper.getConfig('appNotifications.duration'));

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
        }
    },
    watch: {
        newNotifications: function(){
            this.processQueue();
        }
    },
    computed: {
        appState: function(){
            return appState;
        }
    }
};