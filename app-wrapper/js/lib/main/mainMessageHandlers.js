/**
 * @fileOverview MainMessageHandlers class file
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

    async initialize () {
        return this;
    }

    execute (instruction, data){
        let methodName = instruction + 'Handler';
        if (this[methodName] && _.isFunction(this[methodName])){
            return this[methodName](data);
        } else {
            return false;
        }
    }

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

    logHandler (data) {
        if (data && data.message){
            if (data.force){
                mainScript.doLog(data.message);
            } else {
                mainScript.log(data.message);
            }
        }
    }

    logMainScriptPropertyHandler (data) {
        if (data && data.property && mainScript[data.property]){
            if (data.force){
                mainScript.doLog(mainScript[data.property]);
            } else {
                mainScript.log(mainScript[data.property]);
            }
        }
    }

    setConfigHandler(data){
        if (data && data.config){
            mainScript.config = data.config;
        }
    }
}

exports.MainMessageHandlers = MainMessageHandlers;