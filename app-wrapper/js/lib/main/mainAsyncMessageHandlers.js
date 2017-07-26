/**
 * @fileOverview MainAsyncMessageHandlers class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.1.0
 */

const _ = require('lodash');

/**
 * A Utility class for handling main script messages
 *
 * @class
 * @memberOf mainScript
 */
class MainAsyncMessageHandlers {

    /**
     * Creates MainAsyncMessageHandlers instance
     *
     * @constructor
     * @return {MainAsyncMessageHandlers}              Instance of MainAsyncMessageHandlers class
     */
    constructor() {
        return this;
    }

    /**
     * Executes received async message based on message data
     *
     * @param  {string} instruction Message instruction
     * @param  {string} uuid        UUID of the message
     * @param  {Object} data        Data passed with message
     * @return {Boolean}            True if handler is found, false otherwise
     */
    execute (instruction, uuid, data){
        let methodName = instruction + 'Handler';
        if (this[methodName] && _.isFunction(this[methodName])){
            this[methodName](uuid, data);
            return true;
        } else {
            return false;
        }

    }

    /**
     * Basic handler for 'test' instruction - just returns same passed data after 5 seconds
     *
     * @param  {string} uuid    UUID of the message
     * @param  {Object} data    Data passed with message
     * @return {undefined}
     */
    testHandler (uuid, data) {
        let responseData = _.extend({uuid: uuid}, data);
        setTimeout( () => {
            mainScript.mainWindow.globalEmitter.emit('asyncMessageResponse', responseData);
        }, 5000);
    }
}

exports.MainAsyncMessageHandlers = MainAsyncMessageHandlers;