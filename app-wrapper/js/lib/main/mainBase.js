/**
 * @fileOverview MainBase class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.2.0
 */

const _ = require('lodash');
const util = require('util');
// const path = require('path');
const BaseClass = require('../base').BaseClass;


/**
 * Base class for extending when creating other classes
 *
 * @class
 * @memberOf appWrapper
 * @extends {BaseClass}
 * @property {Object}   colors            Terminal color escape sequences
 */
class MainBaseClass extends BaseClass {

    /**
     * Creates class instance, setting basic properties, and returning the instance itself
     *
     * @constructor
     * @return {MainBaseClass} Instance of current class
     */
    constructor () {
        super();
        this.colors = {
            red: '\x1B[1;31m',
            green: '\x1B[1;32m',
            yellow: '\x1B[1;33m',
            gray: '\x1B[0;37m',
            reset: '\x1B[0m'
        };
        this.boundMethods = {
            printLog: null,
            consoleLog: null
        };
        return this;
    }

    /**
     * Logs message to console or stdout
     *
     * @param  {string} message  Message to be logged
     * @param  {string} type    Type of log message (debug, info, warning, error, group, groupCollaped, groupend)
     * @param  {array} data     An array of data strings that are to be applied to logging message
     * @param  {Boolean} force  Flag to force logging output even if config does not allow it
     * @return {undefined}
     */
    log (message, type, data, force) {

        if (!type){
            type = 'info';
        }
        let debugEnabled = this.getConfig('main.debug.enabled', false);
        if ((type && type.match && !type.match(/(group|delimiter)/)) && (force || debugEnabled)){
            if (_.isUndefined(force)){
                force = this.forceDebug;
            }
            let debugLevel = this.getConfig('main.debug.debugLevel', 3);
            let debugLevels = this.getConfig('logger.messageLevels');
            let typeLevel = debugLevels && debugLevels[type] ? debugLevels[type] : 0;

            let doLog = force || false;
            if (!doLog && debugEnabled){
                if (typeLevel >= debugLevel){
                    doLog = true;
                }
            }

            if (doLog) {
                this._doLog(message, type, data);
            }
        }
    }

    /**
     * Logs data to console
     *
     * @param  {string} message  Message to be logged
     * @param  {string} type    Type of log message (debug, info, warning, error, group, groupCollaped, groupend)
     * @param  {array} data     An array of data strings that are to be applied to logging message
     * @return {undefined}
     */
    _doLog (message, type, data) {
        if (_.isObject(message) || _.isArray(message)){
            message = util.inspect(message, this.inspectOptions);
        }
        if (message && message.match && message.match(/{(\d+)}/) && _.isArray(data) && data.length) {
            message = message.replace(/{(\d+)}/g, (match, number) => {
                var index = number - 1;
                let dataItem;
                if (!_.isUndefined(data[index])){
                    dataItem = data[index];
                    if (_.isObject(dataItem) || _.isArray(dataItem)){
                        dataItem = util.inspect(dataItem, this.inspectOptions);
                    }
                } else {
                    data[index] = match;
                }
                return dataItem;
            });
        }

        let logMethod = this.boundMethods.printLog;
        let clearLastLine = false;
        if (this.manifest['chromium-args'] && this.manifest['chromium-args'].match(/--enable-logging=stderr/)){
            clearLastLine = true;
            logMethod = this.boundMethods.consoleLog;
        }
        logMethod(message, type);
        if (this.getConfig('main.debug.debugToWindow') && this.mainWindow && this.mainWindow.window && this.mainWindow.window.getAppWrapper && _.isFunction(this.mainWindow.window.getAppWrapper) && this.mainWindow.window.getAppWrapper()){
            setTimeout( () => {
                if (clearLastLine){
                    process.stdout.write('\x1B[s');
                }
                let aw = this.mainWindow.window.getAppWrapper();
                aw.log('MAINSCRIPT: ' + message, type, data, true);
                if (clearLastLine){
                    process.stdout.write('\x1B[u');
                    process.stdout.write('\x1B[J');
                }
            }, 0);
        }
    }

    /**
     * Prints message to stdout
     *
     * @param  {string} message Message to print
     * @return {undefined}
     */
    print (message){
        process.stdout.write(message);
    }

    /**
     * Prints message to stdout with newline appended
     *
     * @param  {string} message Message to print
     * @return {undefined}
     */
    printLn (message){
        process.stdout.write(message.replace(/\r?\n?$/, '\n'));
    }

    /**
     * Prints message to stdout with newline appended
     *
     * @param  {string} message Message to print
     * @param  {string} type    Type of message
     * @return {undefined}
     */
    printLog (message, type){
        if (!type){
            type = 'info';
        }
        if (type == 'info'){
            process.stdout.write(this.colors.green);
        } else if (type == 'warning'){
            process.stdout.write(this.colors.yellow);
        } else if (type == 'error'){
            process.stdout.write(this.colors.red);
        } else {
            process.stdout.write(this.colors.gray);
        }
        process.stdout.write(message.replace(/\r?\n?$/, ''));
        process.stdout.write(this.colors.reset + '\n');
    }

    /**
     * Logs message to console
     *
     * @param  {mixed} message Message to log
     * @return {undefined}
     */
    consoleLog(message){
        console.log(message);
    }

    /**
     * Returns configuration var value
     *
     * @param  {string} name            String representing path to requested var (i.e. 'appConfig.appInfo.name')
     * @param  {mixed}  defaultValue    Default value to be returned if configuration var is not found
     * @return {mixed}                  Configuration var value
     */
    getConfig (name, defaultValue){
        let value = defaultValue;
        if (this.config){
            value = _.get(this.config, name, defaultValue);
        }
        return value;
    }
}

exports.MainBaseClass = MainBaseClass;