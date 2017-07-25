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
 * @memberOf MainScript
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

    async initialize () {
        return this;
    }

    execute (instruction, uuid, data){
        let methodName = instruction + 'Handler';
        if (this[methodName] && _.isFunction(this[methodName])){
            this[methodName](uuid, data);
            return true;
        } else {
            return false;
        }

    }

    testHandler (uuid, data) {
        let responseData = _.extend({uuid: uuid}, data);
        setTimeout( () => {
            mainScript.mainWindow.globalEmitter.emit('asyncMessageResponse', responseData);
        }, 5000);
    }
}

exports.MainAsyncMessageHandlers = MainAsyncMessageHandlers;