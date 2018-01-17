/**
 * @fileOverview MainAsyncMessageHandlers class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

const _ = require('lodash');
const MessageHandlersBase = require('./messageHandlersBase').MessageHandlersBase;

/**
 * A Utility class for handling main script messages
 *
 * @class
 * @extends {MessageHandlersBase}
 * @memberOf mainScript
 */
class MainAsyncMessageHandlers extends MessageHandlersBase {

    /**
     * Creates MainAsyncMessageHandlers instance
     *
     * @constructor
     * @return {MainAsyncMessageHandlers}              Instance of MainAsyncMessageHandlers class
     */
    constructor() {
        super();
        this.responseMessageIdentifier = 'asyncMessageResponse';
        return this;
    }

    /**
     * Returns this handlers instance method names
     *
     * @return {string[]} An array of method names
    */
    getMethodNames () {
        let superNames = super.getMethodNames();
        let methodNames = _.concat(superNames, Object.getOwnPropertyNames(MainAsyncMessageHandlers.prototype));
        return _.uniqWith(methodNames, _.isEqual);
    }

    /**
     * Basic handler for 'test' instruction - just returns same passed data after 5 seconds
     *
     * @param  {string}     uuid        UUID of the message
     * @param  {Object}     messageData Data passed with message
     * @param  {Boolean}    simulate    Just simulate and return responseData, don't actually do or change anything
     * @return {undefined}
     */
    testHandler (uuid, messageData, simulate) {
        let duration = 5000;
        if (messageData.data && messageData.data.duration && _.isInteger(messageData.data.duration)){
            duration = messageData.data.duration;
        }
        let responseData = this.getResponseData(messageData);
        responseData._result_ = true;
        if (!simulate){
            setTimeout( () => {
                return this.respond(responseData, simulate);
            }, duration);
        } else {
            return this.respond(responseData, simulate);
        }
    }

    /**
     * Configuration setting handler - sets current config to data from message
     *
     * @async
     * @param  {string}     uuid        UUID of the message
     * @param  {Object}     messageData Data passed with message
     * @param  {Boolean}    simulate    Just simulate and return responseData, don't actually do or change anything
     * @return {undefined}
     */
    async setConfigHandler (uuid, messageData, simulate){
        let responseData = this.getResponseData(messageData);
        if (messageData && messageData.data && messageData.data.config){
            if (!simulate){
                mainScript.setNewConfig(messageData.data.config);
            }
            responseData._result_ = true;
        } else {
            let message = {
                message: 'setConfigHandler called "{1}" with no data.config',
                type: 'warning',
                data: [messageData.uuid]
            };
            responseData._missingParams_.push('data.config');
            responseData._result_ = false;
            responseData._messages_ = [message];
        }
        return this.respond(responseData, simulate);
    }

    /**
     * Handler for tray icon initialization
     *
     * @async
     * @param  {string}     uuid        UUID of the message
     * @param  {Object}     messageData Data passed with message
     * @param  {Boolean}    simulate    Just simulate and return responseData, don't actually do or change anything
     * @return {undefined}
     */
    async initializeTrayIconHandler (uuid, messageData, simulate) {
        if (!simulate) {
            await mainScript.menuHelper.initializeTrayIcon();
        }
        let responseData = this.getResponseData(messageData);
        responseData._result_ = true;
        return this.respond(responseData, simulate);
    }

    /**
     * Handler for app menu setup
     *
     * @async
     * @param  {string}     uuid        UUID of the message
     * @param  {Object}     messageData Data passed with message
     * @param  {Boolean}    simulate    Just simulate and return responseData, don't actually do or change anything
     * @return {undefined}
     */
    async setupAppMenuHandler (uuid, messageData, simulate) {
        if (!simulate) {
            await mainScript.menuHelper.setupAppMenu();
        }
        let responseData = this.getResponseData(messageData);
        responseData._result_ = true;
        return this.respond(responseData, simulate);
    }

    /**
     * Handler for app menu removal
     *
     * @async
     * @param  {string}     uuid        UUID of the message
     * @param  {Object}     messageData Data passed with message
     * @param  {Boolean}    simulate    Just simulate and return responseData, don't actually do or change anything
     * @return {undefined}
     */
    async removeAppMenuHandler (uuid, messageData, simulate) {
        if (!simulate) {
            await mainScript.menuHelper.removeAppMenu();
        }
        let responseData = this.getResponseData(messageData);
        responseData._result_ = true;
        return this.respond(responseData, simulate);
    }

    /**
     * Handler for tray icon removal
     *
     * @async
     * @param  {string}     uuid        UUID of the message
     * @param  {Object}     messageData Data passed with message
     * @param  {Boolean}    simulate    Just simulate and return responseData, don't actually do or change anything
     * @return {undefined}
     */
    async removeTrayIconHandler (uuid, messageData, simulate) {
        if (!simulate) {
            await mainScript.menuHelper.removeTrayIcon();
        }
        let responseData = this.getResponseData(messageData);
        responseData._result_ = true;
        return this.respond(responseData, simulate);
    }

    /**
     * Handler for app menu initialization
     *
     * @async
     * @param  {string}     uuid        UUID of the message
     * @param  {Object}     messageData Data passed with message
     * @param  {Boolean}    simulate    Just simulate and return responseData, don't actually do or change anything
     * @return {undefined}
     */
    async initializeAppMenuHandler (uuid, messageData, simulate) {
        if (!simulate) {
            await mainScript.menuHelper.initializeAppMenu();
        }
        let responseData = this.getResponseData(messageData);
        responseData._result_ = true;
        return this.respond(responseData, simulate);
    }

    /**
     * Handler for app menu reinitialization
     *
     * @async
     * @param  {string}     uuid        UUID of the message
     * @param  {Object}     messageData Data passed with message
     * @param  {Boolean}    simulate    Just simulate and return responseData, don't actually do or change anything
     * @return {undefined}
     */
    async reinitializeAppMenuHandler (uuid, messageData, simulate) {
        if (!simulate) {
            await mainScript.menuHelper.reinitializeAppMenu();
        }
        let responseData = this.getResponseData(messageData);
        responseData._result_ = true;
        return this.respond(responseData, simulate);
    }

    /**
     * Handler for app tray icon reinitialization
     *
     * @async
     * @param  {string}     uuid        UUID of the message
     * @param  {Object}     messageData Data passed with message
     * @param  {Boolean}    simulate    Just simulate and return responseData, don't actually do or change anything
     * @return {undefined}
     */
    async reinitializeTrayIconHandler (uuid, messageData, simulate) {
        if (!simulate) {
            await mainScript.menuHelper.reinitializeTrayIcon();
        }
        let responseData = this.getResponseData(messageData);
        responseData._result_ = true;
        return this.respond(responseData, simulate);
    }

    /**
     * Handler for app tray icon update
     *
     * @async
     * @param  {string}     uuid        UUID of the message
     * @param  {Object}     messageData Data passed with message
     * @param  {Boolean}    simulate    Just simulate and return responseData, don't actually do or change anything
     * @return {undefined}
     */
    async updateTrayIconIconHandler (uuid, messageData, simulate) {
        if (!simulate) {
            let icon = null;
            let alticon = null;
            if (messageData && messageData.data) {
                if (messageData.data.icon){
                    icon =  messageData.data.icon;
                }
                if (messageData.data.alticon){
                    alticon = messageData.data.alticon;
                }
                await mainScript.menuHelper.updateTrayIconIcon(icon, alticon);
            }
        }
        let responseData = this.getResponseData(messageData);
        responseData._result_ = true;
        return this.respond(responseData, simulate);
    }

    /**
     * Handler for updating menu items
     *
     * @param  {string}     uuid        UUID of the message
     * @param  {Object}     messageData Data passed with message
     * @param  {Boolean}    simulate    Just simulate and return responseData, don't actually do or change anything
     * @return {undefined}
     */
    updateMenuItemHandler (uuid, messageData, simulate) {
        let responseData = this.getResponseData(messageData);
        responseData._result_ = false;
        if (messageData.data){
            let data = messageData.data;
            if (data.type && _.includes(['app', 'tray'], data.type) && data.menuItemIndex && data.menuItemUpdates){
                let ms = this.getMainScript();
                if (!simulate && ms && ms.menuHelper){
                    if (data.type == 'tray'){
                        ms.menuHelper.updateTrayMenuItem(data.menuItemIndex, data.menuItemUpdates);
                    } else if (data.type == 'app'){
                        ms.menuHelper.updateAppMenuItem(data.menuItemIndex, data.menuItemUpdates);
                    }
                }
                responseData._messages_.push({
                    message: 'Menu item updated',
                    type: 'debug',
                    data: [],
                    force: false
                });
                responseData._result_ = true;
            } else {
                if (!data.type){
                    responseData._messages_.push({
                        message: 'Missing "data.type" value for updateMenuItem message handler',
                        type: 'error',
                        data: []
                    });
                    responseData._missingParams_.push('data.type');
                } else if (!_.includes(['app', 'tray'], data.type)){
                    responseData._messages_.push({
                        message: 'Type "{1}" passed for updateMenuItem message is not supported. Supported types are "app" and "tray"',
                        type: 'error',
                        data: []
                    });
                    responseData._missingParams_.push('data.type');
                }
                if (!data.menuItemIndex){
                    responseData._messages_.push({
                        message: 'Missing "data.menuItemIndex" value for updateMenuItem message handler',
                        type: 'error',
                        data: []
                    });
                    responseData._missingParams_.push('data.menuItemIndex');
                }
                if (!data.menuItemUpdates){
                    responseData._messages_.push({
                        message: 'Missing "data.menuItemUpdates" value for updateMenuItem message handler',
                        type: 'error',
                        data: []
                    });
                    responseData._missingParams_.push('data.menuItemUpdates');
                }
            }
        } else {
            responseData._messages_.push({
                message: 'No message data passed for updateMenuItem message handler',
                type: 'error',
                data: []
            });
            responseData._missingParams_.push('data');
            responseData._missingParams_.push('data.type');
            responseData._missingParams_.push('data.menuItemIndex');
            responseData._missingParams_.push('data.menuItemUpdates');
        }
        return this.respond(responseData, simulate);
    }
}

exports.MainAsyncMessageHandlers = MainAsyncMessageHandlers;