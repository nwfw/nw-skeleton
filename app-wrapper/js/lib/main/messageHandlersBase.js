/**
 * @fileOverview MessageHandlersBase class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.0
 */

const _ = require('lodash');
const MainBaseClass = require('./mainBase').MainBaseClass;

/**
 * Base class for message handling utility classes
 *
 * @class
 * @extends {mainScript.MainBaseClass}
 * @memberOf mainScript
 */
class MessageHandlersBase extends MainBaseClass {

    /**
     * Creates MessageHandlersBase instance
     *
     * @constructor
     * @return {MessageHandlersBase}              Instance of MessageHandlersBase class
     */
    constructor() {
        super();
        return this;
    }

    /**
     * Executes received (async or sync) message based on message data
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
     * Gets prepared response data object
     *
     * @param  {Object} messageData Optional data passed with message
     * @return {Object}             Response data object for sending back to message listener
     */
    getResponseData(messageData){
        let responseData = {};
        if (messageData){
            _.extend(responseData, messageData);
        }
        responseData._messages_ = [];
        responseData._userMessages_ = [];
        responseData._notifications_ = [];
        responseData._result_ = false;
        responseData._missingParams_ = [];
        return responseData;
    }

    /**
     * Sends message response along with passed data
     *
     * @param  {Object}     data        Data to send with response
     * @param  {Boolean}    simulate    Just simulate and return responseData, don't log anything.
     * @return {undefined}
     */
    respond(data, simulate){
        if (!simulate && data._messages_ && _.isArray(data._messages_)){
            data._messages_.forEach( (message) => {
                let msgMessage = message.message || '';
                let msgType = message.type || 'info';
                let msgData = message.data || [];
                let msgForce = message.force || false;
                if (msgMessage){
                    this.log(msgMessage, msgType, msgData, msgForce);
                }
            });
        }
        if (!simulate && data._userMessages_ && _.isArray(data._userMessages_)){
            data._userMessages_.forEach( (message) => {
                let msgMessage = message.message || '';
                let msgType = message.type || 'info';
                let msgData = message.data || [];
                let msgForce = message.force || false;
                if (msgMessage){
                    this.log(msgMessage, msgType, msgData, msgForce);
                }
            });
        }
        if (!simulate && data._notifications_ && _.isArray(data._notifications_)){
            data._notifications_.forEach( (message) => {
                let msgMessage = message.message || '';
                let msgType = message.type || 'info';
                let msgData = message.data || [];
                let msgForce = message.force || false;
                if (msgMessage){
                    this.log(msgMessage, msgType, msgData, msgForce);
                }
            });
        }
        let mw = this.getMainWindow();
        if (mw && mw.globalEmitter && mw.globalEmitter.emit && _.isFunction(mw.globalEmitter.emit)){
            if (!simulate){
                mw.globalEmitter.emit(this.responseMessageIdentifier, data);
            } else {
                return data;
            }
        } else {
            this.log('Can not send message response!', 'error', []);
            return false;
        }
    }

    /**
     * Stub function for getting handlers instance method names
     *
     * @return {string[]} An array of method names
     */
    getMethodNames () {
        return Object.getOwnPropertyNames(MessageHandlersBase.prototype);
    }

    /**
     * Simple info handler - responds with array of handler method names
     *
     * @async
     * @param  {string}     uuid        UUID of the message
     * @param  {Object}     messageData Data passed with message
     * @param  {Boolean}    simulate    Just simulate and return responseData, don't actually do or change anything
     * @return {undefined}
     */
    async infoHandler (uuid, messageData, simulate) {
        let methodNames = this.getMethodNames();
        let handlerMethods = {};
        let isAsyncHandler = this.constructor.name == 'MainAsyncMessageHandlers';
        if (messageData && messageData.data && messageData.data.messages){
            let customMethodNames = [];
            for (let i=0; i<messageData.data.messages.length; i++){
                let methodName = messageData.data.messages[i] + 'Handler';
                if (this[methodName] && _.isFunction(this[methodName])){
                    customMethodNames.push(methodName);
                }
            }
            if (customMethodNames && customMethodNames.length){
                methodNames = customMethodNames;
            }
        }
        if (messageData && messageData.data && messageData.data.message){
            let methodName = messageData.data.message + 'Handler';
            if (this[methodName] && _.isFunction(this[methodName])){
                methodNames = [methodName];
            }
        }
        methodNames.forEach(async (name) => {
            if (name.match(/Handler$/)){
                let instruction = name.replace(/Handler$/, '');
                let requiredParams = [];
                if (!simulate){
                    let resData;
                    if (isAsyncHandler){
                        resData = await this[name](uuid, {instruction: instruction, data: {}}, true);
                    } else {
                        resData = this[name](uuid, {instruction: instruction, data: {}}, true);
                    }
                    if (resData && resData._missingParams_){
                        requiredParams = resData._missingParams_;
                    }
                }
                handlerMethods[instruction] = requiredParams;
            }
        });
        let responseData = this.getResponseData(messageData);
        if (!responseData.data){
            responseData.data = {};
        }
        responseData.data.handlerMethods = handlerMethods;
        responseData._result_ = true;
        return this.respond(responseData, simulate);
    }
}

exports.MessageHandlersBase = MessageHandlersBase;