/**
 * @fileOverview StorageHelper class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.0
 */

const _ = require('lodash');
const path = require('path');
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
     * Initializes storageHelper
     *
     * @async
     * @param  {Object} options             Initialization options
     * @return {appWrapper.StorageHelper}   StorageHelper instance
     */
    async initialize(options){
        await super.initialize(options);
        let storageType = this.getConfig('appStorage.type');
        if (!storageType){
            storageType = 'localStorage';
        }

        if (storageType == 'filesystem'){
            await this.getStorageRootDir(); // create it if necessary
        }
        return this;
    }

    async getStorageRootDir () {
        let storageRootName = this.getConfig('appStorage.root');
        let storageRootDir = path.join(_appWrapper.getExecPath(), this.getConfig('appConfig.tmpDataDir'), storageRootName);
        if (!_appWrapper.fileManager.isDir(storageRootDir)){
            await _appWrapper.fileManager.createDirRecursive(storageRootDir);
        }
        return storageRootDir;
    }

    /**
     * Gets value from storage, using JSON for complex value conversion
     *
     * @async
     * @param  {string} name        Name of variable to get
     * @param {Boolean} notSilent   Flag to control message output
     * @return {(mixed|Boolean)}    Value from localStorage or false if no variable found
     */
    async get (name, notSilent){
        let storageType = this.getConfig('appStorage.type');
        if (!storageType){
            storageType = 'localStorage';
        }
        if (storageType == 'localStorage'){
            return await this.localStorageGet(name, notSilent);
        } else if (storageType == 'filesystem'){
            return await this.filesystemGet(name);
        }
    }

    /**
     * Sets value in storage, using JSON for complex value conversion
     *
     * @async
     * @param {string}  name        Name of the variable in localStorage
     * @param {mixed}   value       Value of the variable
     * @param {Boolean} notSilent   Flag to control message output
     * @return {undefined}
     */
    async set (name, value, notSilent){
        let storageType = this.getConfig('appStorage.type');
        if (!storageType){
            storageType = 'localStorage';
        }
        if (storageType == 'localStorage'){
            return await this.localStorageSet(name, value, notSilent);
        } else if (storageType == 'filesystem'){
            return await this.filesystemSet(name, value, notSilent);
        }
    }



    /**
     * Deletes value from storage
     *
     * @async
     * @param  {string} name    Name of variable to delete
     * @return {Boolean}        Result of the operation
     */
    async delete (name){
        let storageType = this.getConfig('appStorage.type');
        if (!storageType){
            storageType = 'localStorage';
        }
        if (storageType == 'localStorage'){
            return await this.localStorageDelete(name);
        } else if (storageType == 'filesystem'){
            return await this.filesystemDelete(name);
        }
    }

    /**
     * Gets value from localStorage, using JSON for complex value conversion
     *
     * @async
     * @param  {string} name        Name of variable to get
     * @param {Boolean} notSilent   Flag to control message output
     * @return {(mixed|Boolean)}    Value from localStorage or false if no variable found
     */
    async localStorageGet (name, notSilent){
        let returnValue;
        if (localStorage && localStorage.getItem && _.isFunction(localStorage.getItem)){
            if (notSilent){
                this.log('Getting local storage value "{1}".', 'info', [name]);
            }
            let savedValue = localStorage.getItem(name);
            if (savedValue){
                try {
                    returnValue = JSON.parse(savedValue);
                } catch (ex) {
                    this.log('Problem loading "{1}" from local storage: "{2}"!', 'error', [name, ex.message]);
                    this.log('Loaded local storage value: "{1}"!', 'debug', [savedValue]);
                    returnValue = false;
                }
            } else {
                returnValue = savedValue;
            }
        }
        return returnValue;
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
    async localStorageSet (name, value, notSilent){
        let returnValue = null;
        let savedValue;
        if (localStorage && localStorage.setItem && _.isFunction(localStorage.setItem)){
            if (notSilent){
                this.log('Setting local storage value "{1}".', 'info', [name]);
            }
            savedValue = JSON.stringify(value);
            localStorage.setItem(name, savedValue);
            returnValue = savedValue == localStorage.getItem(name);
        } else {
            if (notSilent){
                this.log('Problem setting local storage value "{1}".', 'error', [name]);
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
    async localStorageDelete (name){
        if (localStorage && localStorage.removeItem && _.isFunction(localStorage.removeItem)){
            this.log('Clearing local storage value "{1}".', 'info', [name]);
            localStorage.removeItem(name);
        } else {
            this.log('Problem clearing local storage value "{1}".', 'error', [name]);
            return false;
        }
        return true;
    }

    /**
     * Gets value from localStorage, using JSON for complex value conversion
     *
     * @async
     * @param  {string} name        Name of variable to get
     * @param {Boolean} notSilent   Flag to control message output
     * @return {(mixed|Boolean)}    Value from localStorage or false if no variable found
     */
    async filesystemGet (name, notSilent){
        let returnValue;
        if (notSilent){
            this.log('Getting filesystem storage value "{1}".', 'info', [name]);
        }
        let storageRoot = await this.getStorageRootDir();
        let storageFile = path.join(storageRoot, name + '.json');
        let savedValue;
        if (!await _appWrapper.fileManager.isFile(storageFile)){
            return returnValue;
        }
        savedValue = await _appWrapper.fileManager.loadFile(storageFile, false, notSilent);
        if (savedValue){
            try {
                returnValue = JSON.parse(savedValue);
            } catch (ex) {
                this.log('Problem loading "{1}" from filesystem storage: "{2}"!', 'error', [name, ex.message]);
                this.log('Loaded filesystem storage value: "{1}"!', 'debug', [savedValue]);
                returnValue = false;
            }
        } else {
            returnValue = savedValue;
        }
        return returnValue;
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
    async filesystemSet (name, value, notSilent){
        let savedValue;
        if (notSilent){
            this.log('Setting filesystem storage value "{1}".', 'info', [name]);
        }
        savedValue = JSON.stringify(value);
        let storageRoot = await this.getStorageRootDir();
        let storageFile = path.join(storageRoot, name + '.json');
        return await _appWrapper.fileManager.writeFileSync(storageFile, savedValue);
    }

    /**
     * Deletes value from localStorage
     *
     * @async
     * @param  {string} name    Name of variable to delete
     * @return {Boolean}        Result of the operation
     */
    async filesystemDelete (name){
        this.log('Clearing filesystem storage value "{1}".', 'info', [name]);
        let storageRoot = await this.getStorageRootDir();
        let storageFile = path.join(storageRoot, name + '.json');
        return await _appWrapper.fileManager.deleteFile(storageFile);
    }


}

exports.StorageHelper = StorageHelper;