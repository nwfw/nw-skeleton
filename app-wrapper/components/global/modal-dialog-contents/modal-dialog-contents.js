/**
 * @fileOverview modal-dialog-contents component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

const _ = require('lodash');
var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * Modal dialog contents component
 *
 * @name modal-dialog-contents
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
var component;
component = {
    name: 'modal-dialog-contents',
    template: '',
    props: ['bodyComponent'],
    methods: {
        confirmModalAction: async function(){
            let cm = appState.modalData.currentModal;
            let doConfirm = true;
            if (cm.onConfirm && _.isFunction(cm.onConfirm)){
                _appWrapper.getHelper('modal').log('Calling current modal onConfirm...', 'info', []);
                doConfirm = doConfirm && await cm.onConfirm();
            }
            if (doConfirm){
                cm.cancelOnClose = false;
                await _appWrapper.confirmModalAction(true);
            }
        },

        cancelModalAction: async function(){
            let cm = appState.modalData.currentModal;
            let doCancel = true;
            if (cm.onCancel && _.isFunction(cm.onCancel)){
                _appWrapper.getHelper('modal').log('Calling current modal onCancel...', 'info', []);
                doCancel = doCancel && await cm.onCancel();
            }
            if (doCancel){
                cm.cancelOnClose = false;
                await _appWrapper.cancelModalAction();
            }
        },
        getTitle: function(){
            let title = '';
            if (appState.modalData.currentModal.title){
                if (_.isFunction(appState.modalData.currentModal.title)){
                    title = appState.modalData.currentModal.title();
                } else {
                    title = appState.modalData.currentModal.title;
                }
            }
            return title;
        },
        beforeEnter: function (element) {
            let md = appState.modalData;
            let cm = md.currentModal;
            // console.log('modal transition beforeEnter', element, cm.ready);
            // console.log('event modal transition beforeEnter');
            if (element.hasClass('modal-dialog-content-wrapper') && cm.opening && cm.onBeforeOpen && _.isFunction(cm.onBeforeOpen)){
                _appWrapper.getHelper('modal').log('Calling current modal onBeforeOpen...', 'info', []);
                cm.onBeforeOpen();
            }
            if (cm.animateSize && !cm.showContentImmediately){
                element.addClass('transition-wh');
                element.setElementStyles({width: 0, height: 0, opacity: 0});
            }
        },
        enter: function (element, done) {
            let cm = appState.modalData.currentModal;
            // console.log('modal transition enter', element, cm.ready);
            // console.log('event modal transition enter');
            if (cm.animateSize && !cm.showContentImmediately){
                let modalDialogWrapper = document.querySelector('.modal-dialog-wrapper');
                let dimensions = modalDialogWrapper.getCloneRealDimensions('.' + element.className.split(' ')[0]);
                element.setElementStyles({width: dimensions.width + 'px', height: dimensions.height + 'px', opacity: '1'});

                let duration = element.getTransitionDuration();
                setTimeout(done, duration);
            } else {
                done();
            }
        },
        afterEnter: function(element){
            let cm = appState.modalData.currentModal;
            // console.log('modal transition afterEnter', element, cm.ready);
            // console.log('event modal transition afterEnter');
            this.clearTransitionAttributes(element);
            if (cm.opening && element.hasClass('modal-dialog-content-wrapper') && cm.onOpen && _.isFunction(cm.onOpen)){
                setTimeout(() => {
                    this.setFocus();
                    _appWrapper.getHelper('modal').log('Calling current modal onOpen...', 'info', []);
                    cm.onOpen();
                    cm.opening = false;
                }, 50);
            } else {
                setTimeout(() => {
                    this.setFocus();
                }, 50);
            }
        },
        beforeLeave: function (element) {
            let cm = appState.modalData.currentModal;
            // console.log('modal transition beforeLeave', element, cm.ready);
            // console.log('event modal transition beforeLeave');
            if (element.hasClass('modal-dialog-content-wrapper') && !cm.ready){
                if (cm.cancelOnClose && cm.onCancel && _.isFunction(cm.onCancel)){
                    _appWrapper.getHelper('modal').log('Calling current modal onCancel...', 'info', []);
                    cm.onCancel();
                }
                if (cm.closing && cm.onBeforeClose && _.isFunction(cm.onBeforeClose)){
                    _appWrapper.getHelper('modal').log('Calling current modal onBeforeClose...', 'info', []);
                    cm.onBeforeClose();
                }
            }

            if (cm.animateSize && !cm.showContentImmediately){
                let modalDialogWrapper = document.querySelector('.modal-dialog-wrapper');
                let dimensions = modalDialogWrapper.getCloneRealDimensions('.' + element.className.split(' ')[0]);
                element.addClass('transition-wh');
                element.setElementStyles({width: dimensions.width + 'px', height: dimensions.height + 'px', opacity: '1'});
            }
        },
        leave: function (element, done) {
            let cm = appState.modalData.currentModal;
            // console.log('modal transition leave', element, cm.ready);
            // console.log('event modal transition leave');
            if (cm.animateSize && !cm.showContentImmediately){
                let duration = element.getTransitionDuration();
                element.setElementStyles({width: 0, height: 0, opacity: 0});
                setTimeout(done, duration);
            } else {
                done();
            }
        },
        afterLeave: function(element){
            let md = appState.modalData;
            let cm = md.currentModal;
            // console.log('modal transition afterLeave', element, cm.ready);
            // console.log('event modal transition afterLeave');
            this.clearTransitionAttributes(element);
            if (!cm.ready && element.hasClass('modal-dialog-content-wrapper')){
                if (cm.onClose && _.isFunction(cm.onClose)){
                    _appWrapper.getHelper('modal').log('Calling current modal onClose...', 'info', []);
                    cm.onClose();
                    cm.closing = false;
                }
                _appWrapper.emit('modal:closed', cm);
            }
            if (!cm.ready && cm.animateSize){
                cm.busy = false;
                md.modalVisible = false;
                appState.status.noHandlingKeys = false;
            }
        },
        enterCancelled: function (element) {
            let cm = appState.modalData.currentModal;
            // console.log('modal transition enterCancelled', element, cm.ready);
            // console.log('event modal transition enterCancelled');
            if (cm.animateSize){
                this.clearTransitionAttributes(element);
            }
        },
        leaveCancelled: function (element) {
            let cm = appState.modalData.currentModal;
            // console.log('modal transition leaveCancelled', element, cm.ready);
            // console.log('event modal transition leaveCancelled');
            if (cm.animateSize){
                this.clearTransitionAttributes(element);
            }
        },




        inlineConfirmBeforeEnter: function (element) {
            let cm = appState.modalData.currentModal;
            if (cm.animateSize && !cm.showContentImmediately){
                element.addClass('transition-wh');
                element.setElementStyles({width: 0, height: 0, opacity: 0});
            }
        },
        inlineConfirmEnter: function (element, done) {
            let cm = appState.modalData.currentModal;

            if (cm.animateSize && !cm.showContentImmediately){
                let modalDialogWrapper = document.querySelector('.modal-dialog-wrapper');
                let dimensions = modalDialogWrapper.getCloneRealDimensions('.' + element.className.split(' ')[0]);
                element.setElementStyles({width: dimensions.width + 'px', height: dimensions.height + 'px', opacity: '1'});

                let duration = element.getTransitionDuration();
                setTimeout(done, duration);
            } else {
                done();
            }
        },
        inlineConfirmAfterEnter: function(element){
            this.clearTransitionAttributes(element);
            if (element.hasClass('modal-dialog-inline-confirm')){
                let button = element.querySelector('.inner-confirm-button-cancel');
                if (!button){
                    button = element.querySelector('.inner-confirm-button-confirm');
                }
                if (button){
                    button.focus();
                }
            } else {
                this.setFocus();
            }
        },
        inlineConfirmBeforeLeave: function (element) {
            let cm = appState.modalData.currentModal;
            if (cm.animateSize && !cm.showContentImmediately){
                let modalDialogWrapper = document.querySelector('.modal-dialog-wrapper');
                let dimensions = modalDialogWrapper.getCloneRealDimensions('.' + element.className.split(' ')[0]);
                element.addClass('transition-wh');
                element.setElementStyles({width: dimensions.width + 'px', height: dimensions.height + 'px', opacity: '1'});
            }
        },
        inlineConfirmLeave: function (element, done) {
            let cm = appState.modalData.currentModal;
            if (cm.animateSize && !cm.showContentImmediately){
                let duration = element.getTransitionDuration();
                element.setElementStyles({width: 0, height: 0, opacity: 0});
                setTimeout(done, duration);
            } else {
                done();
            }
        },
        inlineConfirmAfterLeave: function(element){
            this.clearTransitionAttributes(element);
        },
        inlineConfirmEnterCancelled: function (element) {
            let cm = appState.modalData.currentModal;
            if (cm.animateSize){
                this.clearTransitionAttributes(element);
            }
        },
        inlineConfirmLeaveCancelled: function (element) {
            let cm = appState.modalData.currentModal;
            if (cm.animateSize){
                this.clearTransitionAttributes(element);
            }
        },






        setFocus: function(){
            if (appState && appState.modalData.currentModal && appState.modalData.modalVisible){
                let focusElement;
                let el = this.$el;
                if (el && el.querySelector && _.isFunction(el.querySelector)){
                    let firstInput = el.querySelector('input,select,textarea');
                    if (firstInput && firstInput.getAttribute('type') != 'button'){
                        focusElement = firstInput;
                    } else {
                        if (appState.modalData.currentModal.cancelSelected){
                            focusElement = el.querySelector('.modal-button-cancel');
                        } else if (appState.modalData.currentModal.confirmSelected){
                            focusElement = el.querySelector('.modal-button-confirm');
                        }
                        if (!(focusElement && !focusElement.getAttribute('disabled'))){
                            focusElement = el.querySelector('.modal-button');
                        }
                        if (!(focusElement && !focusElement.getAttribute('disabled'))){
                            focusElement = el.querySelector('input, button');
                        }
                        if (!(focusElement && !focusElement.getAttribute('disabled'))){
                            focusElement = el.querySelector('.modal-dialog-body');
                        }
                        if (!(focusElement && !focusElement.getAttribute('disabled'))){
                            focusElement = el;
                        }
                    }
                }
                if (focusElement && focusElement.focus && _.isFunction(focusElement.focus)){
                    focusElement.focus();
                }
            }
        },
        clearTransitionAttributes: function(element){
            element.removeClass('transition-wh');
            element.removeElementStyles(['height', 'width']);
        },
        inlineConfirmConfirm: function(){
            this.currentModal.inlineConfirm = false;
            this.currentModal.inlineConfirmData.confirmAction(true);
        },
        inlineConfirmCancel: function(){
            this.currentModal.inlineConfirm = false;
            this.currentModal.inlineConfirmData.confirmAction(false);
        },
    },
    data: function () {
        return appState.modalData;
    },

    computed: {
        appState: function(){
            return appState;
        }
    },

    watch: {
        'currentModal.inlineConfirm': function() {
            this.$nextTick(() => {
                this.setFocus();
            });
        }
    }
};

exports.component = component;