/**
 * @fileOverview Base class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.2.0
 */

const _ = require('lodash');
const path = require('path');
const eventEmitter = require('events');

let _appWrapper;
let appState;

/**
 * Base class for extending when creating other classes
 *
 * @class
 * @memberOf appWrapper
 * @property {Object}   manifest            Object containing manifest (package.json) file data
 * @property {Object}   config              Object containing configuration data
 * @property {Boolean}  forceUserMessages   Flag to force user message output
 * @property {Boolean}  forceDebug          Flag to force debug message output
 * @property {Object}   boundMethods        Object to hold bound method references for event listeners
 * @property {Object}   timeouts            Object that holds references to this class instance timeouts
 * @property {Object}   intervals           Object that holds references to this class instance intervals
 * @property {Boolean}  needsConfig         Flag to indicate whether class instance needs config, triggering warnings if config is not available for the class
 */
class BaseClass extends eventEmitter {

    /**
     * Creates class instance, setting basic properties, and returning the instance itself
     *
     * @constructor
     * @return {BaseClass} Instance of current class
     */
    constructor () {
        super();

        if (window && window.getAppWrapper && _.isFunction(window.getAppWrapper)){
            _appWrapper = window.getAppWrapper();
            appState = _appWrapper.getAppState();
        }
        this.manifest = null;
        this.config = null;
        this.forceUserMessages = false;
        this.forceDebug = false;
        this.boundMethods = {};
        this.needsConfig = true;
        this.timeouts = {};
        this.intervals = {};

        return this;
    }

    /**
     * Initializes current class instance, setting up logging and
     * bound methods to be used in event listeners
     *
     * @async
     * @param {BaseInitializationOptions} options Initialization options
     * @return {BaseClass} Instance of current class
     */
    async initialize (options){
        if (options && options.manifest) {
            this.manifest = options.manifest;
        }
        if (options && options.config) {
            this.config = options.config;
        }

        await this.initializeLogging(options);
        this.addBoundMethods();
        this.addEventListeners();
        if (!(options && options.silent)){
            let className = this.constructor.name;
            this.log('Initialized object "{1}"', 'debug', [className]);
        }
        return this;
    }

    /**
     * Adds event listeners for this object
     *
     * @return {undefined}
     */
    addEventListeners () {
        return;
    }

    /**
     * Removes event listeners for this object
     *
     * @return {undefined}
     */
    removeEventListeners () {
        return;
    }

    /**
     * Finalizes current class instance, setting up any additional properties
     * etc. Entire app structure, including frontend app is available here
     *
     * @async
     * @return {Boolean} Finalizing result
     */
    async finalize () {
        return true;
    }

    /**
     * Determines whether logging for this class is regulated through
     * configuration, setting the logging by it (or warning if there
     * are no configuration settings for this class)
     *
     * @async
     * @return {BaseClass}      Instance of the current class
     */
    async initializeLogging() {
        return this;
    }

    /**
     * Helper method to get appWrapper instance
     *
     * @return {AppWrapper} An instance of AppWrapper class
     */
    getAppWrapper () {
        if (!_appWrapper){
            if (window && window.getAppWrapper && _.isFunction(window.getAppWrapper)){
                _appWrapper = window.getAppWrapper();
            }
        }
        return _appWrapper;
    }

    /**
     * Helper method to get appState object
     *
     * @return {Object} Current appState object
     */
    getAppState () {
        if (!appState){
            let aw = this.getAppWrapper();
            if (aw){
                appState = aw.getAppState();
            }
        }
        return appState;
    }

    /**
     * Method that sets up this.boundMethods property by binding this objects
     * functions to itself to be used as event listener handlers
     *
     * @return {undefined}
     */
    addBoundMethods () {
        if (this.boundMethods){
            var keys = _.keys(this.boundMethods);
            for (let i=0; i<keys.length; i++){
                if (this[keys[i]] && _.isFunction(this[keys[i]]) && this[keys[i]].bind && _.isFunction(this[keys[i]].bind)){
                    this.boundMethods[keys[i]] = this[keys[i]].bind(this);
                }
            }
        }
    }

    /**
     * Method that cleans up this.boundMethods property
     * set in this.addBoundMethods method
     *
     * @return {undefined}
     */
    removeBoundMethods () {
        var keys = _.keys(this.boundMethods);
        for (let i=0; i<keys.length; i++){
            this.boundMethods[keys[i]] = null;
        }
        this.boundMethods = {};
    }

    /**
     * Destructor method - cleans up references for this instance
     * freeing memory upon object destruction
     *
     * @return {undefined}
     */
    destroy () {
        this.removeEventListeners();
        this.removeBoundMethods();
    }

    /**
     * Returns appState var value
     *
     * @param  {string} varPath      String representing path to requested var (i.e. 'appData.appMainData.cancelable')
     * @param  {mixed} defaultValue  Default value to be returned if appState var is not found
     * @return {mixed}               appState var value
     */
    getStateVar (varPath, defaultValue){
        var varValue;
        if (appState){
            varValue = _.get(appState, varPath, defaultValue);
        }
        if (_.isUndefined(varValue) && !_.isUndefined(defaultValue)){
            varValue = defaultValue;
        }
        return varValue;
    }

    /**
     * Returns instance of helper object based on passed parameter (or false if helper can't be found)
     *
     * @param  {string} name       Name of the helper
     * @return {Object}            Instance of the helper object (or false if helper can't be found)
     */
    getHelper(name){
        return _appWrapper.getHelper(name);
    }

    /**
     * Returns configuration var value
     *
     * @param  {string} name         String representing path to requested var (i.e. 'appConfig.appInfo.name')
     * @param  {mixed} defaultValue  Default value to be returned if configuration var is not found
     * @return {mixed}               Configuration var value
     */
    getConfig (name, defaultValue){
        var path = name;
        var value;
        if (!path.match(/^config\./)){
            path = 'config.' + name;
        }
        value = _.get(appState, path);
        if (_.isUndefined(value)){
            path = name;
            if (!path.match(/^appWrapperConfig\./)){
                path = 'appWrapperConfig.' + name;
            }
            value = _.get(appState.u, path);
        }
        if (_.isUndefined(value)){
            path = name;
            if (!path.match(/^userConfig\./)){
                path = 'userConfig.' + name;
            }
            value = _.get(appState.u, path);
        }
        if (_.isUndefined(value) && !_.isUndefined(defaultValue)){
            value = defaultValue;
        }
        return value;
    }

    /**
     * Helper method for getting call stack array for debug or user message objects
     *
     * @return {array} An array of objects with properties 'function', 'file', 'line' and 'column', representing stack calls.
     */
    _getStack () {
        let stackArray;
        try {
            throw new Error();
        } catch (e) {
            let stackMessages = _.filter(e.stack.split('\n'), (msg) => {
                return msg.match(/^\s+at\s/);
            });
            // stackMessages = _.drop(_.dropRight(stackMessages));
            stackMessages = _.drop(stackMessages, 3);

            stackArray = _.map(stackMessages, (msg) => {
                let stackData = _.drop(_.trim(msg).split(' '));
                let returnValue = {
                    function: null,
                    file: null,
                    line: null,
                    column: null
                };
                if (stackData && _.isArray(stackData)){
                    if (stackData[0]){
                        returnValue.function = stackData[0];
                    }
                    if (stackData[1]){
                        stackData[1] = stackData[1].replace(/^\(/, '').replace(/\)$/, '');
                        if (stackData[1].match(/chrome-extension:\/\//)){
                            stackData[1] = stackData[1].replace(/^[^:]+:\/\/[^/]+\//, appState.appRootDir);
                        }
                        let callerData = stackData[1].split(':');
                        if (callerData && _.isArray(callerData) && callerData.length){

                            let fileName = callerData[0];
                            if (appState && appState.appRootDir){
                                fileName = path.relative(appState.appRootDir, fileName);
                            }
                            returnValue.file = fileName;

                            if (callerData[1]){
                                returnValue.line = parseInt(callerData[1], 10);
                            }
                            if (callerData[2]){
                                returnValue.column = parseInt(callerData[2], 10);
                            }
                        }
                    }
                }
                return returnValue;
            });
        }
        stackArray = _.filter(stackArray, (item) => {
            return item.function ? true : false;
        });
        return stackArray;
    }

    /**
     * Clears all timeouts bound to this AppWrapper instance
     *
     * @return {undefined}
     */
    clearTimeouts (){
        for (let name in this.timeouts){
            clearTimeout(this.timeouts[name]);
        }
    }

    /**
     * Clears all intervals bound to this AppWrapper instance
     *
     * @return {undefined}
     */
    clearIntervals (){
        for (let name in this.intervals){
            clearInterval(this.intervals[name]);
        }
    }
}
exports.BaseClass = BaseClass;

/**
 * BaseInitializationOptions Object that contains initialization options for BaseClass
 * @typedef  {Object}   BaseInitializationOptions
 *
 * @property {boolean}  silent          Flag to prevent initialization log messages
 * @property {Object}   manifest        Object with manifest file (package.json) data
 * @property {Object}   config          Object with configuration data
 */