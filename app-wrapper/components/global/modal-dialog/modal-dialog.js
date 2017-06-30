var _ = require('lodash');
var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

var component;
component = {
    name: 'modal-dialog',
    template: '',
    messageAdded: false,
    methods: {
        _confirmModalAction: _appWrapper.confirmModalAction.bind(_appWrapper),
        _cancelModalAction: _appWrapper.cancelModalAction.bind(_appWrapper),

        callViewHandler: _appWrapper.callViewHandler.bind(_appWrapper),

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
            if (appState.modalData.currentModal.animateSize){
                _appWrapper.helpers.htmlHelper.addClass(element, 'transition-wh');
                _appWrapper.helpers.htmlHelper.setElementStyles(element, {width: 0, height: 0, opacity: 0});
            }
        },
        enter: function (element, done) {
            if (appState.modalData.currentModal.animateSize){
                var modalDialogWrapper = document.querySelector('.modal-dialog-wrapper');

                var duration = parseInt(parseFloat(_appWrapper.helpers.htmlHelper.getCssVarValue('--long-animation-duration'), 10) * 1000, 10);
                var dimensions = _appWrapper.helpers.htmlHelper.getRealDimensions(modalDialogWrapper, '.' + element.className.split(' ')[0]);

                _appWrapper.helpers.htmlHelper.setElementStyles(element, {width: dimensions.width + 'px', height: dimensions.height + 'px', opacity: '1'});

                setTimeout(done, duration + 100);
            } else {
                done();
            }
        },
        beforeLeave: function (element) {
            if (appState.modalData.currentModal.animateSize){
                var modalDialogWrapper = document.querySelector('.modal-dialog-wrapper');

                _appWrapper.helpers.htmlHelper.addClass(element, 'transition-wh');
                var dimensions = _appWrapper.helpers.htmlHelper.getRealDimensions(modalDialogWrapper, '.' + element.className.split(' ')[0]);
                _appWrapper.helpers.htmlHelper.setElementStyles(element, {width: dimensions.width + 'px', height: dimensions.height + 'px', opacity: '1'});
            }
        },
        leave: function (element, done) {
            if (appState.modalData.currentModal.animateSize){
                var duration = parseInt(parseFloat(_appWrapper.helpers.htmlHelper.getCssVarValue('--long-animation-duration'), 10) * 1000, 10);
                _appWrapper.helpers.htmlHelper.setElementStyles(element, {width: 0, height: 0, opacity: 0});

                setTimeout(done, duration + 100);
            } else {
                done();
            }
        },
        afterCancel: function (element) {
            if (appState.modalData.currentModal.animateSize){
                _appWrapper.helpers.htmlHelper.removeClass(element, 'transition-wh');
                _appWrapper.helpers.htmlHelper.removeElementStyles(element, ['height', 'width']);
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
                    _appWrapper.getHelper('html').scrollParentToElement(messageElement, 100);
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
        if (!(activeElement && activeElement.tagName && _.includes(['input','textarea','select'], activeElement.tagName.toLowerCase()))){
            this.setFocus();
        }
        if (this.messageAdded){
            this.messageAdded = false;
            this.scrollToModalMessage((appState.modalData.currentModal.messages.length - 1));
        }
    }
};

exports.component = component;