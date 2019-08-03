/**
 * @fileOverview MainBase class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

const _ = require('lodash');
const util = require('util');
const path = require('path');
const fs = require('fs');
const BaseClass = require('../base').BaseClass;


/**
 * Base class for extending when creating other classes
 *
 * @class
 * @memberOf mainScript
 * @extends {appWrapper.BaseClass}
 */
class MainBaseClass extends BaseClass {

    /**
     * Creates class instance, setting basic properties, and returning the instance itself
     *
     * @constructor
     * @return {mainScript.MainBaseClass} Instance of current class
     */
    constructor () {
        super();
        this.boundMethods = {
            printLog: null,
            consoleLog: null
        };
        return this;
    }

    /**
     * Logs message to console or stdout
     *
     * @param  {string} message         Message to be logged
     * @param  {string} type            Type of log message (debug, info, warning, error, group, groupCollaped, groupend)
     * @param  {array} data             An array of data strings that are to be applied to logging message
     * @param  {Boolean} force          Flag to force logging output even if config does not allow it
     * @param  {Boolean} forceToWindow  Flag to force logging to main window console
     * @return {undefined}
     */
    log (message, type, data, force, forceToWindow) {

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
                this._doLog(message, type, data, forceToWindow);
            }
        }
    }

    /**
     * Logs data to console
     *
     * @param  {string}     message         Message to be logged
     * @param  {string}     type            Type of log message (debug, info, warning, error, group, groupCollaped, groupend)
     * @param  {array}      data            An array of data strings that are to be applied to logging message
     * @param  {Boolean}    forceToWindow   Flag to force logging to main window console
     * @return {undefined}
     */
    _doLog (message, type, data, forceToWindow) {
        let sourceMessage = message;
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

        let originalMessage = message;

        if (this.getConfig('main.debug.displayTimestamps')){
            message = this.formatTimeNormalize(new Date(), {}, true, false) + ' ' + message;
        }

        let logMethod = this.boundMethods.printLog;
        let clearLastLine = false;
        if (mainScript.manifest['chromium-args'] && mainScript.manifest['chromium-args'].match(/--enable-logging=stderr/)){
            clearLastLine = true;
            logMethod = this.boundMethods.consoleLog;
        }
        logMethod(message, type);
        let mainWindow = this.getMainWindow();
        if ((forceToWindow || this.getConfig('main.debug.debugToWindow'))){
            if (mainWindow && mainWindow.window && mainWindow.window.getAppWrapper && _.isFunction(mainWindow.window.getAppWrapper) && mainWindow.window.getAppWrapper()) {
                setTimeout( () => {
                    if (clearLastLine){
                        process.stdout.write('\x1B[s');
                    }
                    let aw = mainWindow.window.getAppWrapper();
                    if (_.isObject(sourceMessage) || _.isArray(sourceMessage)){
                        mainWindow.window.console.log('MAINSCRIPT: ', sourceMessage);
                    } else {
                        aw.log('MAINSCRIPT: ' + message, type, data, true);
                    }
                    if (clearLastLine){
                        process.stdout.write('\x1B[u');
                        process.stdout.write('\x1B[J');
                    }
                }, 0);
            }
        }
        if (this.getConfig('main.debug.debugToFile')){
            let messageObj = {};
            if (this.getConfig('main.debug.displayTimestamps')){
                messageObj.timestamp = this.formatTimeNormalize(new Date(), {}, true, false);
            }
            messageObj.className = this.constructor.name;
            messageObj.type = type;
            messageObj.message = originalMessage;
            if (this.getConfig('main.debug.saveStacksToFile')) {
                messageObj.stack = this._getStack();
            }
            let line = '';
            if (mainScript.debugToFileStarted){
                line += ',\n';
            } else {
                mainScript.debugToFileStarted = true;
            }
            line += JSON.stringify(messageObj);
            let debugMessageFilePath = this.getDebugMessageFilePath();
            if (debugMessageFilePath){
                fs.writeFileSync(path.resolve(debugMessageFilePath), line, {flag: 'a'});
            }
        }
    }

    /**
     * Returns path to debug message log file
     *
     * @return {string} Path to debug message log file
     */
    getDebugMessageFilePath () {
        let debugMessageFilePath = false;
        try {
            debugMessageFilePath = path.join(mainScript.getExecPath(), this.getConfig('appConfig.logDir'), this.getConfig('main.debug.debugLogFilename'));
            let rotateLogs = this.getConfig('main.debug.rotateLogs');
            if (rotateLogs){
                debugMessageFilePath += '-' + mainScript.startTime.toISOString().replace(/T.*$/, '');
            }
            debugMessageFilePath += '.json';
        } catch (ex) {
            console.log(ex);
        }
        return debugMessageFilePath;
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
        let colors = this.getConfig('stdoutColors');
        if (!type){
            type = 'info';
        }
        if (type == 'info'){
            process.stdout.write(colors.green);
        } else if (type == 'warning'){
            process.stdout.write(colors.yellow);
        } else if (type == 'error'){
            process.stdout.write(colors.red);
        } else {
            process.stdout.write(colors.gray);
        }
        process.stdout.write(message.replace(/\r?\n?$/, ''));
        process.stdout.write(colors.reset + '\n');
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
     * Logs to window console
     *
     * @return {undefined}
     */
    windowLog(){
        let mw = this.getMainWindow();
        if (mw && mw.window && mw.window.console){
            mw.window.console.log.apply(mw.window.console, arguments);
        } else {
            this.log('Can not log to window console!', 'error', []);
        }
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
        if (mainScript.config){
            value = _.get(mainScript.config, name, defaultValue);
        }
        return value;
    }

    /**
     * Format time normalized (Y-m-d H:i:s format)
     *
     * @param  {Date}       date            Date value to format
     * @param  {Object}     options         Date format options
     * @param  {Boolean}    includeDate     Flag to indicate whether to include date
     * @param  {Boolean}    omitSeconds     Flag to indicate whether to omit seconds
     * @return {string}                     Formatted time string
     */
    formatTimeNormalize (date, options, includeDate, omitSeconds){

        if (_.isString(date)){
            date = new Date(date);
        }

        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();

        var hours = date.getHours();
        var minutes = date.getMinutes();
        var seconds = date.getSeconds();


        if (month < 10){
            month = '0' + month;
        }

        if (day < 10){
            day = '0' + day;
        }

        if (hours < 10){
            hours = '0' + hours;
        }

        if (minutes < 10){
            minutes = '0' + minutes;
        }
        if (seconds < 10){
            seconds = '0' + seconds;
        }

        var formattedTime = '';
        if (includeDate){
            formattedTime += year + '-' + month + '-' + day;
        }

        formattedTime += ' ';
        formattedTime += hours;
        formattedTime += ':' + minutes;
        if (!omitSeconds) {
            formattedTime += ':' + seconds;
        }

        return formattedTime;

    }

    /**
     * Creates directory recursively
     *
     * @async
     * @param  {string} directory Absolute directory path
     * @param  {Number} mode      Octal mode definition (i.e. 0o775)
     * @return {Boolean}          Result of directory creation
     */
    async createDirRecursive(directory, mode){
        var dirName = path.resolve(directory);
        var dirChunks = dirName.split(path.sep);
        var dirPath = '';
        if (fs.existsSync(dirName)){
            if (await this.isFile(dirName)){
                this.log('Can\'t create directory "{1}", already exists and it is a file.', 'error', [dirName]);
                return false;
            }
        } else {
            dirPath = dirChunks[0];
            for(let i=1; i< dirChunks.length;i++){
                dirPath = path.join(dirPath, path.sep + dirChunks[i]);
                if (!fs.existsSync(dirPath)){
                    fs.mkdirSync(dirPath, mode);
                } else if (await this.isFile(dirPath)){
                    this.log('Can\'t create directory "{1}", already exists and it is a file.', 'error', [dirPath]);
                    return false;
                }
            }
        }
        return fs.existsSync(dirName);
    }

    /**
     * Creates directory (recursive) and writes file to it
     *
     * @async
     * @param  {string} fileName Absolute path to file
     * @param  {Number} mode     Octal mode definition (i.e. 0o775)
     * @param  {Object} options  Options object for fs.writeFileSync
     * @param  {string} data     Data to write to file
     * @return {Boolean}         True if operation succeeded, false otherwise
     */
    async createDirFileRecursive(fileName, mode, options, data){
        if (!options){
            options = {flag: 'w'};
        }
        if (!data){
            data = '';
        }
        if (!mode){
            mode = 0o755;
        }

        var filePath = path.resolve(fileName);
        var dirName = path.dirname(filePath);
        var dirCreated = await this.createDirRecursive(dirName, mode);
        if (!dirCreated){
            return false;
        } else {
            try {
                fs.writeFileSync(filePath, data, options);
                return await this.isFile(filePath);
            } catch (ex) {
                this.log('Can\'t create file "{1}" - "{2}".', 'error', [filePath, ex && ex.message ? ex.message : ex]);
                return false;
            }
        }
    }

    /**
     * Checks whether given path is a file
     *
     * @async
     * @param  {string} file Absolute file path
     * @return {Boolean}     True if file is file, false otherwise
     */
    async isFile(file){
        if (!file){
            return false;
        }
        var filePath = path.resolve(file);
        var isFile = true;
        var exists = fs.existsSync(filePath);
        if (exists){
            var fileStat = fs.statSync(filePath);
            if (!fileStat.isFile()){
                isFile = false;
            }
        } else {
            isFile = false;
        }
        return isFile;
    }

    /**
     * Gets reference to main window if available
     *
     * @return {(Window|Boolean)} nw.Window or false if not available
     */
    getMainWindow () {
        let ms = this.getMainScript();
        let mw;
        if (ms && ms.mainWindow){
            mw = ms.mainWindow;
        }
        if (!mw){
            // this.log('Can not find mainWindow!', 'error', []);
        }
        return mw;
    }

    /**
     * Gets appState if available
     *
     * @return {appWrapper.AppState} appState object
     */
    getAppState () {
        let appState;
        let mainWindow = this.getMainWindow();
        if (mainWindow && mainWindow.window && mainWindow.window.appState){
            appState = mainWindow.window.appState;
        }
        if (!appState){
            this.log('Can not find appState!', 'error', []);
        }
        return appState;
    }

    /**
     * Gets appWrapper if available
     *
     * @return {AppWrapper} Instance of AppWrapper class
     */
    getAppWrapper () {
        let _appWrapper;
        let mainWindow = this.getMainWindow();
        if (mainWindow && mainWindow.window && mainWindow.window.getAppWrapper && _.isFunction(mainWindow.window.getAppWrapper)){
            _appWrapper = mainWindow.window.getAppWrapper();
        }
        if (!_appWrapper){
            this.log('Can not find appWrapper!', 'error', []);
        }
        return _appWrapper;
    }

    /**
     * Returns main script object
     *
     * @return {mainScript.MainScript} mainScript class instance
     */
    getMainScript () {
        if (mainScript){
            return mainScript;
        } else {
            this.log('Can not find mainScript!', 'error', []);
            return false;
        }
    }
}

exports.MainBaseClass = MainBaseClass;