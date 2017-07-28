/**
 * @fileOverview MainMessageHandlers class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.2.0
 */

const _ = require('lodash');

/**
 * A Utility class for handling main script messages
 *
 * @class
 * @memberOf mainScript
 */
class MainMessageHandlers {

    /**
     * Creates MainMessageHandlers instance
     *
     * @constructor
     * @return {MainMessageHandlers}              Instance of MainMessageHandlers class
     */
    constructor() {
        return this;
    }

    /**
     * Executes received message based on message data
     *
     * @param  {string} instruction Message instruction
     * @param  {Object} data        Data passed with message
     * @return {Boolean}            True if handler is found, false otherwise
     */
    execute (instruction, data){
        let methodName = instruction + 'Handler';
        if (this[methodName] && _.isFunction(this[methodName])){
            this[methodName](data);
            return true;
        } else {
            return false;
        }
    }

    /**
     * Simple ping handler - responds with 'pong' instruction
     *
     * @param  {Object} data        Data passed with message
     * @return {undefined}
     */
    pingHandler (data) {
        let duration = 500;
        if (data.duration && _.isInteger(data.duration)){
            duration = data.duration;
        }
        setTimeout( () =>{
            mainScript.mainWindow.globalEmitter.emit('messageResponse', {
                instruction: 'pong',
                data: data
            });
        }, duration);
    }

    /**
     * Logging handler - logs message data to console
     *
     * @param  {Object} data        Data passed with message
     * @return {undefined}
     */
    logHandler (data) {
        if (data && data.message){
            if (data.force){
                mainScript.doLog(data.message);
            } else {
                mainScript.log(data.message);
            }
        }
    }

    /**
     * Property logging handler - logs mainScript property from message data to console
     *
     * @param  {Object} data        Data passed with message
     * @return {undefined}
     */
    logMainScriptPropertyHandler (data) {
        if (data && data.property && mainScript[data.property]){
            if (data.force){
                mainScript.doLog(mainScript[data.property]);
            } else {
                mainScript.log(mainScript[data.property]);
            }
        }
    }

    /**
     * Configuration setting handler - sets current config to data from message
     *
     * @param  {Object} data        Data passed with message
     * @return {undefined}
     */
    setConfigHandler(data){
        if (data && data.config){
            mainScript.log('Setting new config');
            mainScript.config = data.config;
        }
    }
}

exports.MainMessageHandlers = MainMessageHandlers;