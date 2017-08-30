/**
 * @fileOverview StorageHelper class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.0
 */

const _ = require('lodash');
const AppBaseClass = require('../../lib/appBase').AppBaseClass;

var _appWrapper;
var appState;

/**
 * StorageHelper class - handles localStorage data manipulation operations
 *
 * @class
 * @extends {appWrapper.AppBaseClass}
 * @memberof appWrapper.helpers.systemHelpers
 */
class StorageHelper extends AppBaseClass {

    /**
     * Creates StorageHelper instance
     *
     * @constructor
     * @return {StorageHelper}              Instance of StorageHelper class
     */
    constructor() {
        super();

        _appWrapper = window.getAppWrapper();
        appState = _appWrapper.getAppState();

        _.noop(appState);

        return this;
    }

    /**
     * Sets value in localStorage, using JSON for complex value conversion
     *
     * @async
     * @param {string}  name        Name of the variable in localStorage
     * @param {mixed}   value       Value of the variable
     * @param {Boolean} notSilent   Flag to control message output
     * @return {undefined}
     */
    async set (name, value, notSilent){
        var returnValue = null;
        var savedValue;
        if (localStorage && localStorage.setItem && _.isFunction(localStorage.setItem)){
            if (notSilent){
                this.log('Setting local storage var "{1}".', 'info', [name]);
            }
            savedValue = JSON.stringify(value);
            localStorage.setItem(name, savedValue);
            returnValue = savedValue == localStorage.getItem(name);
        } else {
            if (notSilent){
                this.log('Problem setting local storage var "{1}".', 'error', [name]);
            }
        }
        return returnValue;
    }

    /**
     * Gets value from localStorage, using JSON for complex value conversion
     *
     * @async
     * @param  {string} name        Name of variable to get
     * @param {Boolean} notSilent   Flag to control message output
     * @return {(mixed|Boolean)}    Value from localStorage or false if no variable found
     */
    async get (name, notSilent){
        var returnValue;
        if (localStorage && localStorage.getItem && _.isFunction(localStorage.getItem)){
            if (notSilent){
                this.log('Getting local storage var "{1}".', 'info', [name]);
            }
            var savedValue = localStorage.getItem(name);
            if (savedValue){
                try {
                    returnValue = JSON.parse(savedValue);
                } catch (ex) {
                    this.log('Problem loading "{1}" from storage: "{2}"!', 'error', [name, ex.message]);
                    this.log('Loaded value: "{1}"!', 'debug', [savedValue]);
                    returnValue = false;
                }
            } else {
                returnValue = savedValue;
            }
        }
        return returnValue;
    }

    /**
     * Deletes value from localStorage
     *
     * @async
     * @param  {string} name    Name of variable to delete
     * @return {Boolean}        Result of the operation
     */
    async delete (name){
        if (localStorage && localStorage.removeItem && _.isFunction(localStorage.removeItem)){
            this.log('Clearing local storage var "{1}".', 'info', [name]);
            localStorage.removeItem(name);
        } else {
            this.log('Problem clearing local storage var "{1}".', 'error', [name]);
            return false;
        }
        return true;
    }


}

exports.StorageHelper = StorageHelper;