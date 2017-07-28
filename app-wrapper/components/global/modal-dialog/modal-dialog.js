/**
 * @fileOverview modal-dialog component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.2.0
 */

const _ = require('lodash');
var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * Modal dialog component
 *
 * @name modal-dialog
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
    name: 'modal-dialog',
    template: '',
    messageAdded: false,
    methods: {
        _confirmModalAction: function(){
            _appWrapper.confirmModalAction.call(_appWrapper);
        },

        _cancelModalAction: function(){
            _appWrapper.cancelModalAction.call(_appWrapper);
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

        setFocus: function(){
            if (appState && appState.modalData.currentModal && appState.modalData.modalVisible){
                var focusElement;
                var el = this.$el;
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
                            focusElement = el;
                        }
                    }
                }
                if (focusElement && focusElement.focus && _.isFunction(focusElement.focus)){
                    focusElement.focus();
                }
            }
        },

        beforeEnter: function (element) {
            // console.log('beforeEnter', element);
            if (appState.modalData.currentModal.animateSize){
                element.addClass('transition-wh');
                element.setElementStyles({width: 0, height: 0, opacity: 0});
            }
        },
        enter: function (element, done) {
            // console.log('enter', element);
            if (appState.modalData.currentModal.animateSize){
                var modalDialogWrapper = document.querySelector('.modal-dialog-wrapper');

                var duration = parseInt(parseFloat(_appWrapper.getHelper('style').getCssVarValue('--long-animation-duration'), 10) * 1000, 10);
                var dimensions = modalDialogWrapper.getCloneRealDimensions('.' + element.className.split(' ')[0]);

                element.setElementStyles({width: dimensions.width + 'px', height: dimensions.height + 'px', opacity: '1'});

                setTimeout(done, duration + 100);
            } else {
                done();
            }
        },
        afterEnter: function(element){
            // console.log('afterEnter', element);
        },
        beforeLeave: function (element) {
            // console.log('beforeLeave', element);
            if (appState.modalData.currentModal.animateSize){
                var modalDialogWrapper = document.querySelector('.modal-dialog-wrapper');

                element.addClass('transition-wh');
                var dimensions = modalDialogWrapper.getCloneRealDimensions('.' + element.className.split(' ')[0]);
                element.setElementStyles({width: dimensions.width + 'px', height: dimensions.height + 'px', opacity: '1'});
            }
        },
        leave: function (element, done) {
            // console.log('leave', element);
            if (appState.modalData.currentModal.animateSize){
                var duration = parseInt(parseFloat(_appWrapper.getHelper('style').getCssVarValue('--long-animation-duration'), 10) * 1000, 10);
                element.setElementStyles({width: 0, height: 0, opacity: 0});

                setTimeout(done, duration + 100);
            } else {
                done();
            }
        },
        afterLeave: function(element){
            // console.log('afterLeave', element);
        },
        afterCancel: function (element) {
            // console.log('afterCancel', element);
            if (appState.modalData.currentModal.animateSize){
                element.removeClass('transition-wh');
                element.removeElementStyles(['height', 'width']);
            }
        },
        addModalMessage: function(messageObject){
            this.messageAdded = true;
            appState.modalData.currentModal.messages.push(messageObject);
            appState.modalData.currentModal.currentMessageIndex = appState.modalData.currentModal.messages.length - 1;
        },
        scrollModalMessageDown: function() {
            let newIndex = appState.modalData.currentModal.currentMessageIndex + 1;
            this.scrollToModalMessage(newIndex);
        },
        scrollModalMessageUp: function() {
            let newIndex = appState.modalData.currentModal.currentMessageIndex - 1;
            this.scrollToModalMessage(newIndex);
        },
        scrollToModalMessage: function(index){
            let listElement = this.$el.querySelector('.modal-dialog-message-list');
            let messageElements = listElement.querySelectorAll('.modal-dialog-message');
            let messageCount = appState.modalData.currentModal.messages.length;
            if (index >= messageCount){
                index = messageCount - 1;
            }
            if (index < 0){
                index = 0;
            }
            appState.modalData.currentModal.currentMessageIndex = index;
            if (messageElements && messageElements.length && messageElements.length > index){
                let messageElement = messageElements[index];
                if (messageElement && messageElement.scrollIntoView){
                    messageElement.scrollParentToElement(100);
                }
            }


        }
    },
    data: function () {
        return appState.modalData;
    },

    computed: {
        appState: function(){
            return appState;
        }
    },

    updated: function(){
        var activeElement = document.activeElement;
        if (!(activeElement && activeElement.tagName && activeElement.parentQuerySelector('.modal-dialog-wrapper') && _.includes(['input','textarea','select'], activeElement.tagName.toLowerCase()))){
            this.setFocus();
        }
        if (this.messageAdded){
            this.messageAdded = false;
            this.scrollToModalMessage((appState.modalData.currentModal.messages.length - 1));
        }
    }
};

exports.component = component;