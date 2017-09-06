/**
 * @fileOverview MainMessageHandlers class file
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
class MainMessageHandlers extends MessageHandlersBase {

    /**
     * Creates MainMessageHandlers instance
     *
     * @constructor
     * @return {MainMessageHandlers}              Instance of MainMessageHandlers class
     */
    constructor() {
        super();
        this.responseMessageIdentifier = 'messageResponse';
        return this;
    }

    /**
     * Returns this handlers instance method names
     *
     * @return {string[]} An array of method names
     */
    getMethodNames () {
        let superNames = super.getMethodNames();
        let methodNames = _.concat(superNames, Object.getOwnPropertyNames(MainMessageHandlers.prototype));
        return _.uniqWith(methodNames, _.isEqual);
    }

    /**
     * Simple ping handler - responds with 'pong' instruction
     *
     * @param  {string}     uuid        UUID of the message
     * @param  {Object}     messageData Data passed with message
     * @param  {Boolean}    simulate    Just simulate and return responseData, don't actually do or change anything
     * @return {undefined}
     */
    pingHandler (uuid, messageData, simulate) {
        let duration = 500;
        if (messageData.data && messageData.data.duration && _.isInteger(messageData.data.duration)){
            duration = messageData.data.duration;
        }
        let responseData = this.getResponseData(messageData);
        responseData.instruction = 'pong';
        responseData._result_ = true;
        setTimeout( () =>{
            return this.respond(responseData, simulate);
        }, duration);
    }

    /**
     * Logging handler - logs message data to console
     *
     * @param  {string}     uuid        UUID of the message
     * @param  {Object}     messageData Data passed with message
     * @param  {Boolean}    simulate    Just simulate and return responseData, don't actually do or change anything
     * @return {undefined}
     */
    logHandler (uuid, messageData, simulate) {
        let responseData = this.getResponseData(messageData);
        if (messageData && messageData.data){
            if (messageData.data.message){
                let type = messageData.data.type || 'info';
                let force = messageData.data.force || false;
                let forceToWindow = messageData.data.forceToWindow || false;
                if (!simulate){
                    this.log(messageData.data.message, type, messageData.data.data, force, forceToWindow);
                }
                responseData._result_ = true;
            } else {
                responseData._messages_.push({
                    message: 'Can not log message - no message supplied',
                    type: 'error',
                    data: []
                });
                responseData._missingParams_.push('data.message');
                responseData._result_ = false;
            }
        } else {
            responseData._messages_.push({
                message: 'Can not log message - no data supplied',
                type: 'error',
                data: []
            });
            responseData._missingParams_.push('data');
            responseData._result_ = false;
        }
        return this.respond(responseData, simulate);
    }

    /**
     * Property logging handler - logs mainScript property from message data to console
     *
     * @param  {string}     uuid        UUID of the message
     * @param  {Object}     messageData Data passed with message
     * @param  {Boolean}    simulate    Just simulate and return responseData, don't actually do or change anything
     * @return {undefined}
     */
    logMainScriptPropertyHandler (uuid, messageData, simulate) {
        let responseData = this.getResponseData(messageData);
        if (messageData.data && messageData.data.property) {
            let prop = _.get(mainScript, messageData.data.property);
            if (prop){
                let type = messageData.data.type || 'info';
                let force = messageData.data.force || false;
                let forceToWindow = messageData.data.forceToWindow || false;
                if (!simulate){
                    this.log(prop, type, messageData.data.data, force, forceToWindow);
                }
                responseData._result_ = true;
            } else {
                responseData._messages_.push({
                    message: 'Can not find mainScript property "{1}"',
                    type: 'error',
                    data: [messageData.data.property]
                });
                responseData._result_ = false;
            }
        } else {
            responseData._messages_.push({
                message: 'Can not find mainScript property - no property supplied',
                type: 'error',
                data: []
            });
            responseData._missingParams_.push('data.property');
            responseData._result_ = false;
        }
        return this.respond(responseData, simulate);
    }
}

exports.MainMessageHandlers = MainMessageHandlers;