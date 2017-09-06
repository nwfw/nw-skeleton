/**
 * @fileOverview modal-dialog-messages component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

// const _ = require('lodash');
var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * Modal dialog messages component
 *
 * @name modal-dialog-messages
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
    name: 'modal-dialog-messages',
    template: '',
    messageAdded: false,
    updated: function() {
        if (this.messageAdded){
            this.messageAdded = false;
            this.scrollToModalMessage((appState.modalData.currentModal.messages.length - 1));
        }
    },
    methods: {
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
};

exports.component = component;