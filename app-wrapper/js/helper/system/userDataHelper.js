/**
 * @fileOverview UserDataHelper class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.0
 */

const _ = require('lodash');
const AppBaseClass = require('../../lib/appBase').AppBaseClass;

var _appWrapper;
var appState;

/**
 * UserDataHelper class - handles and manages user data operations
 *
 * @class
 * @extends {appWrapper.AppBaseClass}
 * @memberof appWrapper.helpers.systemHelpers
 * @property {Object} previousUserData  Object storing previous user data
 */

class UserDataHelper extends AppBaseClass {

    /**
     * Creates UserDataHelper instance
     *
     * @constructor
     * @return {UserDataHelper}              Instance of UserDataHelper class
     */
    constructor() {
        super();

        if (window && window.getAppWrapper && _.isFunction(window.getAppWrapper)){
            _appWrapper = window.getAppWrapper();
            appState = _appWrapper.getAppState();
        }

        this.boundMethods = {
            clearUserData: null
        };

        this.previousUserData = {};

        return this;
    }

    /**
     * Returns user data var name for storage
     *
     * @return {string} User data var name for storage
     */
    getUserDataStorageName(){
        let mindOsUsers = this.getConfig('mindOsUsers');
        let userDataName = this.getConfig('appInfo.name') + '_userData';

        let username = '';
        if (mindOsUsers){
            username = _appWrapper.getPlatformData().platform.userInfo.username;
        }
        if (username){
            userDataName += '_' + username;
        }

        userDataName = userDataName.replace(/[^A-Za-z0-9]+/g, '_');
        return userDataName;
    }

    /**
     * Saves user data to storage (if data was changed)
     *
     * @async
     * @param  {Object}     userData    User data object
     * @return {Boolean}                Saving result
     */
    async saveUserData (userData) {
        let saved = false;
        if (this.userDataChanged(userData)){
            this.previousUserData = _.cloneDeep(appState.userData);
            appState.userData = userData;
            this.log('Saving user data', 'info', []);
            let userDataName = this.getUserDataStorageName();
            saved = await this.getHelper('storage').set(userDataName, userData);
            if (!saved){
                this.addUserMessage('Could not save user data!', 'error', [], false, false);
            } else {
                this.previousUserData = _.cloneDeep(appState.userData);
                this.addUserMessage('Saved {1} user data variables.', 'info', [_.keys(userData).length], false,  false);
            }
        } else {
            this.log('Not saving user data - data unchanged', 'info', []);
        }
        return saved;
    }

    /**
     * Loads user data from storage
     *
     * @async
     * @param  {Boolean} omitSettingAppState    Flag to prevent setting userData in appState
     * @return {(Object|boolean)}               Object containing userData or false on failure
     */
    async loadUserData (omitSettingAppState) {
        this.log('Loading user data', 'group', []);
        let userDataName = this.getUserDataStorageName();
        let userData = await this.getHelper('storage').get(userDataName);
        if (userData){
            this.log('Loaded {1} user data variables.', 'info', [_.keys(userData).length]);
            this.log('User data variables: "{1}".', 'debug', [_.keys(userData).join('", "')]);
        } else {
            if (userData !== null && !_.isUndefined(userData)) {
                this.log('Could not load user data.', 'warning', []);
            } else {
                this.log('No user data found.', 'info', []);
            }
            userData = {};
        }
        if (!omitSettingAppState){
            appState.userData = _.cloneDeep(userData);
        }
        this.log('Loading user data', 'groupend', []);
        this.previousUserData = _.cloneDeep(userData);
        return userData;
    }

    /**
     * Clears user data in storage
     *
     * @async
     * @return {Boolean} Operation result
     */
    async clearUserData () {
        this.log('Clearing user data', 'info', []);
        let userDataName = this.getUserDataStorageName();
        let deleted = await this.getHelper('storage').delete(userDataName);
        if (!deleted){
            this.addUserMessage('Could not delete user data!', 'error', [], false, false);
        } else {
            this.addUserMessage('Deleted user data.', 'info', [], false,  false);
            this.previousUserData = {};
            appState.userData = {};
        }
        return deleted;
    }

    /**
     * Checks whether user data has been changed compared to this.previousUserData
     *
     * @param  {Object} userData Object containing userData
     * @return {Number}          Number of changed variables
     */
    userDataChanged (userData) {
        if (!userData){
            userData = appState.userData;
        }
        let utilHelper = _appWrapper.getHelper('util');
        let userDataMap = utilHelper.propertyValuesMap(userData);
        let previousDataMap = utilHelper.propertyValuesMap(this.previousUserData);
        let valuesDiff = utilHelper.difference(userDataMap, previousDataMap);

        let userMap = utilHelper.propertyMap(userData);
        let previousMap = utilHelper.propertyMap(this.previousUserData);
        let propsDiff = _.difference(userMap, previousMap);
        return Object.keys(valuesDiff).length > 0 || propsDiff.length > 0;
    }

}

exports.UserDataHelper = UserDataHelper;