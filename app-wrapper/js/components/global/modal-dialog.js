var _ = require('lodash');
var _appWrapper = window.getAppWrapper();
var appUtil = _appWrapper.getAppUtil();
var appState = appUtil.getAppState();

var component;
component = {
    name: 'modal-dialog',
    template: _appWrapper.appTemplates.getTemplateContents('modal-dialog'),
    methods: {
        _confirmModalAction: _appWrapper.confirmModalAction.bind(_appWrapper),
        _cancelModalAction: _appWrapper.cancelModalAction.bind(_appWrapper),

        callViewHandler: _appWrapper.callViewHandler.bind(_appWrapper),

        setFocus: function(){
            if (appState && appState.modalData.currentModal && appState.modalData.modalVisible){
                var focusElement;
                var el = this.$el;
                if (el && el.querySelector && _.isFunction(el.querySelector)){
                    if (appState.modalData.currentModal.cancelSelected){
                        focusElement = el.querySelector('.modal-button-cancel');
                    } else if (appState.modalData.currentModal.confirmSelected){
                        focusElement = el.querySelector('.modal-button-confirm');
                    }
                    if (!(focusElement && !focusElement.getAttribute("disabled"))){
                        focusElement = el.querySelector('.modal-button');
                    }
                    if (!(focusElement && !focusElement.getAttribute("disabled"))){
                        focusElement = el.querySelector('input, button');
                    }
                    if (!(focusElement && !focusElement.getAttribute("disabled"))){
                        focusElement = el;
                    }
                }
                if (focusElement && focusElement.focus && _.isFunction(focusElement.focus)){
                    focusElement.focus();
                }
            }
        },

        beforeEnter: function (element) {
            if (appState.modalData.currentModal.animateSize){
                _appWrapper.htmlHelper.addClass(element, 'transition-wh');
                _appWrapper.htmlHelper.setElementStyles(element, {width: 0, height: 0, opacity: 0});
            }
        },
        enter: function (element, done) {
            if (appState.modalData.currentModal.animateSize){
                var modalDialogWrapper = document.querySelector('.modal-dialog-wrapper');

                var duration = parseInt(parseFloat(_appWrapper.htmlHelper.getCssVarValue('--long-animation-duration'), 10) * 1000, 10);
                var dimensions = _appWrapper.htmlHelper.getRealDimensions(modalDialogWrapper, '.' + element.className.split(' ')[0]);

                _appWrapper.htmlHelper.setElementStyles(element, {width: dimensions.width + 'px', height: dimensions.height + 'px', opacity: '1'});

                setTimeout(done, duration + 100);
            } else {
                done();
            }
        },
        beforeLeave: function (element) {
            if (appState.modalData.currentModal.animateSize){
                var modalDialogWrapper = document.querySelector('.modal-dialog-wrapper');

                _appWrapper.htmlHelper.addClass(element, 'transition-wh');
                var dimensions = _appWrapper.htmlHelper.getRealDimensions(modalDialogWrapper, '.' + element.className.split(' ')[0]);
                _appWrapper.htmlHelper.setElementStyles(element, {width: dimensions.width + 'px', height: dimensions.height + 'px', opacity: '1'});
            }
        },
        leave: function (element, done) {
            if (appState.modalData.currentModal.animateSize){
                var duration = parseInt(parseFloat(_appWrapper.htmlHelper.getCssVarValue('--long-animation-duration'), 10) * 1000, 10);
                _appWrapper.htmlHelper.setElementStyles(element, {width: 0, height: 0, opacity: 0});

                setTimeout(done, duration + 100);
            } else {
                done();
            }
        },
        afterCancel: function (element) {
            if (appState.modalData.currentModal.animateSize){
                _appWrapper.htmlHelper.removeClass(element, 'transition-wh');
                _appWrapper.htmlHelper.removeElementStyles(element, ['height', 'width']);
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
        this.setFocus();
    }
}

exports.component = component;