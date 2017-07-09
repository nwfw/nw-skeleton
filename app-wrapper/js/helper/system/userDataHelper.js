
const _ = require('lodash');
const BaseClass = require('../../base').BaseClass;

var _appWrapper;
var appState;


class UserDataHelper extends BaseClass {
    constructor() {
        super();

        if (window && window.getAppWrapper && _.isFunction(window.getAppWrapper)){
            _appWrapper = window.getAppWrapper();
            appState = _appWrapper.getAppState();
        }

        this.previousUserData = {};

        return this;
    }

    async initialize () {
        return await super.initialize();
    }

    getUserDataStorageName(){
        let userDataName = this.getConfig('appInfo.name') + '_userData';
        userDataName = userDataName.replace(/[^A-Za-z0-9]+/g, '_');
        return userDataName;
    }

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

    async loadUserData (omitSettingAppState) {
        this.log('Loading user data', 'group', []);
        let userDataName = this.getUserDataStorageName();
        let userData = await this.getHelper('storage').get(userDataName);
        if (userData){
            this.log('Loaded {1} user data variables.', 'info', [_.keys(userData).length]);
            this.log('User data variables: "{1}".', 'debug', [_.keys(userData).join('", "')]);
        } else {
            if (userData !== null) {
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

    async clearUserData () {
        this.log('Clearing user data', 'info', []);
        let userDataName = this.getUserDataStorageName();
        let deleted = await this.getHelper('storage').delete(userDataName);
        if (!deleted){
            this.addUserMessage('Could not delete user data!', 'error', [], false, false);
        } else {
            this.addUserMessage('Deleted user data.', 'info', [], false,  false);
        }
        return deleted;
    }

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