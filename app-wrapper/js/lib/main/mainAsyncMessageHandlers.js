/**
 * @fileOverview MainAsyncMessageHandlers class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.2.1
 */

const _ = require('lodash');
const MainBaseClass = require('./mainBase').MainBaseClass;

/**
 * A Utility class for handling main script messages
 *
 * @class
 * @extends {MainBaseClass}
 * @memberOf mainScript
 */
class MainAsyncMessageHandlers extends MainBaseClass {

    /**
     * Creates MainAsyncMessageHandlers instance
     *
     * @constructor
     * @return {MainAsyncMessageHandlers}              Instance of MainAsyncMessageHandlers class
     */
    constructor() {
        super();
        return this;
    }

    /**
     * Executes received async message based on message data
     *
     * @param  {string} instruction Message instruction
     * @param  {string} uuid        UUID of the message
     * @param  {Object} messageData        Data passed with message
     * @return {Boolean}            True if handler is found, false otherwise
     */
    execute (instruction, uuid, messageData){
        let methodName = instruction + 'Handler';
        if (this[methodName] && _.isFunction(this[methodName])){
            this[methodName](uuid, messageData);
            return true;
        } else {
            return false;
        }

    }

    /**
     * Basic handler for 'test' instruction - just returns same passed data after 5 seconds
     *
     * @param  {string} uuid    UUID of the message
     * @param  {Object} messageData    Data passed with message
     * @return {undefined}
     */
    testHandler (uuid, messageData) {
        let duration = 5000;
        if (messageData.data && messageData.data.duration && _.isInteger(messageData.data.duration)){
            duration = messageData.data.duration;
        }
        let responseData = _.extend({_result_: true}, messageData);
        setTimeout( () => {
            mainScript.mainWindow.globalEmitter.emit('asyncMessageResponse', responseData);
        }, duration);
    }

    /**
     * Configuration setting handler - sets current config to data from message
     *
     * @async
     * @param  {string} uuid            UUID of the message
     * @param  {Object} messageData     Data passed with message
     * @return {undefined}
     */
    async setConfigHandler(uuid, messageData){
        let responseData;
        if (messageData && messageData.data && messageData.data.config){
            mainScript.setNewConfig(messageData.data.config);
            responseData = _.extend({_result_: true}, messageData);
        } else {
            this.log('setConfigHandler called "{1}" with no data.config', 'warning', [messageData.uuid]);
            responseData = _.extend({_result_: false}, messageData);
        }
        mainScript.mainWindow.globalEmitter.emit('asyncMessageResponse', responseData);
    }

    /**
     * Handler for tray icon initialization
     *
     * @async
     * @param  {string} uuid            UUID of the message
     * @param  {Object} messageData     Data passed with message
     * @return {undefined}
     */
    async initializeTrayIconHandler (uuid, messageData) {
        await mainScript.menuHelper.initializeTrayIcon();
        let responseData = _.extend({_result_: true}, messageData);
        mainScript.mainWindow.globalEmitter.emit('asyncMessageResponse', responseData);
    }

    /**
     * Handler for app menu setup
     *
     * @async
     * @param  {string} uuid            UUID of the message
     * @param  {Object} messageData     Data passed with message
     * @return {undefined}
     */
    async setupAppMenuHandler (uuid, messageData) {
        await mainScript.menuHelper.setupAppMenu();
        let responseData = _.extend({_result_: true}, messageData);
        mainScript.mainWindow.globalEmitter.emit('asyncMessageResponse', responseData);
    }

    /**
     * Handler for app menu removal
     *
     * @async
     * @param  {string} uuid            UUID of the message
     * @param  {Object} messageData     Data passed with message
     * @return {undefined}
     */
    async removeAppMenuHandler (uuid, messageData) {
        await mainScript.menuHelper.removeAppMenu();
        let responseData = _.extend({_result_: true}, messageData);
        mainScript.mainWindow.globalEmitter.emit('asyncMessageResponse', responseData);
    }

    /**
     * Handler for tray icon removal
     *
     * @async
     * @param  {string} uuid            UUID of the message
     * @param  {Object} messageData     Data passed with message
     * @return {undefined}
     */
    async removeTrayIconHandler (uuid, messageData) {
        await mainScript.menuHelper.removeTrayIcon();
        let responseData = _.extend({_result_: true}, messageData);
        mainScript.mainWindow.globalEmitter.emit('asyncMessageResponse', responseData);
    }

    /**
     * Handler for app menu initialization
     *
     * @async
     * @param  {string} uuid            UUID of the message
     * @param  {Object} messageData     Data passed with message
     * @return {undefined}
     */
    async initializeAppMenuHandler (uuid, messageData) {
        await mainScript.menuHelper.initializeAppMenu();
        let responseData = _.extend({_result_: true}, messageData);
        mainScript.mainWindow.globalEmitter.emit('asyncMessageResponse', responseData);
    }

    /**
     * Handler for app menu reinitialization
     *
     * @async
     * @param  {string} uuid            UUID of the message
     * @param  {Object} messageData     Data passed with message
     * @return {undefined}
     */
    async reinitializeAppMenuHandler (uuid, messageData) {
        await mainScript.menuHelper.reinitializeAppMenu();
        let responseData = _.extend({_result_: true}, messageData);
        mainScript.mainWindow.globalEmitter.emit('asyncMessageResponse', responseData);
    }

    /**
     * Handler for app tray icon reinitialization
     *
     * @async
     * @param  {string} uuid            UUID of the message
     * @param  {Object} messageData     Data passed with message
     * @return {undefined}
     */
    async reinitializeTrayIconHandler (uuid, messageData) {
        await mainScript.menuHelper.reinitializeTrayIcon();
        let responseData = _.extend({_result_: true}, messageData);
        mainScript.mainWindow.globalEmitter.emit('asyncMessageResponse', responseData);
    }
}

exports.MainAsyncMessageHandlers = MainAsyncMessageHandlers;