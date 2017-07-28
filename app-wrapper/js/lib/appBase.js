/**
 * @fileOverview AppBase class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.2.0
 */

const _ = require('lodash');
// const path = require('path');
const BaseClass = require('./base').BaseClass;

let _appWrapper;
let appState;

/**
 * App base class for extending when creating other app classes
 *
 * @class
 * @extends {BaseClass}
 * @memberOf appWrapper
 * @property {Boolean}  forceUserMessages   Flag to force user message output
 * @property {Boolean}  forceDebug          Flag to force debug message output
 * @property {Object}   boundMethods        Object to hold bound method references for event listeners
 * @property {Object}   timeouts            Object that holds references to this class instance timeouts
 * @property {Object}   intervals           Object that holds references to this class instance intervals
 * @property {Boolean}  needsConfig         Flag to indicate whether class instance needs config, triggering warnings if config is not available for the class
 */
class AppBaseClass extends BaseClass {

    /**
     * Creates class instance, setting basic properties, and returning the instance itself
     *
     * @constructor
     * @return {AppBaseClass} Instance of current class
     */
    constructor () {
        super();

        if (window && window.getAppWrapper && _.isFunction(window.getAppWrapper)){
            _appWrapper = window.getAppWrapper();
            appState = _appWrapper.getAppState();
            _.noop(appState);
        }
        return this;
    }
}
exports.AppBaseClass = AppBaseClass;