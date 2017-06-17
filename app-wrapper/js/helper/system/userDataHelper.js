
const _ = require('lodash');
const BaseClass = require('../../base').BaseClass;

var _appWrapper;
var appUtil;
var appState;


class UserDataHelper extends BaseClass {
    constructor() {
        super();

        if (window && window.getAppWrapper && _.isFunction(window.getAppWrapper)){
            _appWrapper = window.getAppWrapper();
            appUtil = _appWrapper.getAppUtil();
            appState = appUtil.getAppState();
        }

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
        if (!userData){
            userData = appState.userData;
        }
        this.log('Saving user data', 'info', [], false);
        let userDataName = this.getUserDataStorageName();
        let saved = await this.getHelper('storage').set(userDataName, userData);
        if (!saved){
            this.addUserMessage('Could not save user data!', 'error', [], false, false);
        } else {
            this.addUserMessage('Saved {1} user data variables.', 'info', [_.keys(userData).length], false,  false);
        }
        return saved;
    }

    async loadUserData () {
        this.log('Loading user data', 'info', [], true);
        let userDataName = this.getUserDataStorageName();
        let userData = await this.getHelper('storage').get(userDataName);
        if (userData){
            this.addUserMessage('Loaded {1} user data variables.', 'info', [_.keys(userData).length], false,  false);
        } else {
            if (userData !== null) {
                this.addUserMessage('Could not load user data.', 'warning', [], false,  false);
            }
            userData = {};
        }
        return userData;
    }

}

exports.UserDataHelper = UserDataHelper;