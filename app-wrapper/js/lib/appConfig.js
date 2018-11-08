/**
 * @fileOverview AppConfig class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

const AppBaseClass = require('./appBase').AppBaseClass;

var _appWrapper;
var appState;

/**
 * A class for app config operations and manipulation
 *
 * @class
 * @extends {appWrapper.AppBaseClass}
 * @memberOf appWrapper
 *
 * @property {Object}           initialAppConfig    Object that stores initial app config that wrapper was initialized with
 * @property {Object}           baseConfig          Object that stores base app config
 * @property {Object}           defaultConfig       Object that stores default config
 * @property {Object}           config              Object that stores app config
 * @property {Object}           userConfig          Object that stores user config
 * @property {Object}           previousConfig      Object that stores previous app config
 * @property {Boolean}          watchConfig         Flag to indicate whether to watch for config changes
 */
class AppConfig extends AppBaseClass {

    /**
     * Creates AppConfig instance using initial app config object
     *
     * @constructor
     * @param  {Object} initialAppConfig Initial app config object
     * @return {AppConfig}              Instance of AppConfig class
     */
    constructor(initialAppConfig) {
        super();

        if (window && window.getAppWrapper && _.isFunction(window.getAppWrapper)){
            _appWrapper = window.getAppWrapper();
            appState = _appWrapper.getAppState();
        }

        this.forceDebug = true;
        this.forceUserMessages = true;

        this.initialAppConfig = initialAppConfig;
        this.baseConfig = {};
        this.defaultConfig = {};
        this.config = {};
        this.userConfig = {};
        this.previousConfig = {};
        this.watchConfig = true;

        this.boundMethods = {
            clearUserConfig: null
        };

        this.needsConfig = false;

        return this;
    }

    /**
     * Initializes application configuration
     *
     * @async
     * @return {Object} Application configuration object
     */
    async initializeConfig () {

        let theConfig = _.cloneDeep(this.initialAppConfig);
        _.each(theConfig.configData.vars, function(value, key){
            if (!value.editable){
                theConfig.configData.uneditableConfig.push(key);
            } else {
                theConfig.configData.editableConfig.push(key);
            }
            if (!value.reload){
                theConfig.configData.noReloadConfig.push(key);
            } else {
                theConfig.configData.reloadConfig.push(key);
            }
        });
        this.config = _.cloneDeep(theConfig);
        this.baseConfig = _.cloneDeep(theConfig);
        this.defaultConfig = _.cloneDeep(theConfig);
        return theConfig;
    }

    /**
     * Returns storage variable name under which user config for this app is stored
     *
     * @return {string} storage config variable name
     */
    getConfigStorageName(){
        let mindOsUsers = this.getConfig('mindOsUsers');
        let configName = this.getConfig('appInfo.name') + '_config';

        let username = '';
        if (mindOsUsers){
            username = _appWrapper.getPlatformData().platform.userInfo.username;
        }
        if (username){
            configName += '_' + username;
        }
        configName = configName.replace(/[^A-Za-z0-9]+/g, '_');
        return configName;
    }


    /**
     * Loads user config from storage
     *
     * @async
     * @return {Object} Application config with user config data (if found)
     */
    async loadUserConfig () {
        let configName = this.getConfigStorageName();
        this.log('Loading user config...', 'group', []);
        let userConfig = await _appWrapper.getHelper('storage').get(configName);
        if (userConfig && _.keys(userConfig).length){
            this.log('Loaded {1} user config keys.', 'info', [_.keys(userConfig).length]);
            this.log('User config keys: "{1}".', 'debug', [_.keys(userConfig).join('", "')]);
            appState.hasUserConfig = true;
        } else {
            this.log('User config empty.', 'info', []);
            appState.hasUserConfig = false;
            userConfig = {};
        }
        this.userConfig = _.cloneDeep(userConfig);
        appState.userConfig = _.cloneDeep(userConfig);
        userConfig = _.merge({}, appState.config, userConfig);
        this.previousConfig = _.cloneDeep(userConfig);
        this.log('Loading user config...', 'groupend', []);
        return userConfig;
    }

    /**
     * Saves user config data to storage
     *
     * @async
     * @return {undefined}
     */
    async saveUserConfig () {
        let configName = this.getConfigStorageName();
        let utilHelper = _appWrapper.getHelper('util');
        let userConfig = utilHelper.difference(this.baseConfig, appState.config);

        let ignoreUserConfig = this.getConfig('configData.ignoreUserConfig');
        if (ignoreUserConfig && ignoreUserConfig.length){
            userConfig = _.omit(userConfig, ignoreUserConfig);
        }

        userConfig = _.omitBy(userConfig, (value) => {
            let returnValue = false;
            if (_.isObject(value) && Object.keys(value).length == 0){
                returnValue = true;
            }
            return returnValue;
        });

        let userConfigKeys = _.keys(userConfig);
        let userConfigKeyMap = utilHelper.propertyMap(userConfig);
        let oldUserConfigKeyMap = utilHelper.propertyMap(this.userConfig);
        let keyMapDiff = _.difference(userConfigKeyMap, oldUserConfigKeyMap);
        keyMapDiff = _.union(keyMapDiff, _.difference(oldUserConfigKeyMap, userConfigKeyMap));



        let reloadConfig = this.getConfig('configData.reloadConfig');
        let reloadChanges = _.intersection(keyMapDiff, reloadConfig);
        let shouldReload = reloadChanges.length > 0;

        try {
            if (userConfig && Object.keys(userConfigKeys).length){
                this.log('Saving user config...', 'debug', []);
                await _appWrapper.getHelper('storage').set(configName, userConfig);
                this.addUserMessage('Configuration data saved', 'debug', []);
                appState.hasUserConfig = true;
                this.userConfig = _.cloneDeep(userConfig);
                appState.userConfig = _.cloneDeep(userConfig);
                if (shouldReload){
                    _appWrapper.getHelper('modal').closeCurrentModal(true);
                    await _appWrapper.wait(appState.config.mediumPauseDuration);
                    _appWrapper.windowManager.reloadWindow(null, false);
                } else {
                    this.config = _.cloneDeep(appState.config);
                }
            } else {
                this.log('Removing user config...', 'debug', []);
                await _appWrapper.getHelper('storage').delete(configName);
                this.addUserMessage('Removed user config', 'debug', []);
                appState.hasUserConfig = false;
                this.userConfig = {};
                appState.userConfig = {};
                if (shouldReload){
                    _appWrapper.getHelper('modal').closeCurrentModal(true);
                    await _appWrapper.wait(appState.config.mediumPauseDuration);
                    _appWrapper.windowManager.reloadWindow(null, false);
                } else {
                    this.config = _.cloneDeep(appState.config);
                }
            }
        } catch (ex) {
            this.addUserMessage('Configuration data could not be saved - "{1}"', 'error', [ex.message], false, false);
        }
    }

    /**
     * Clears user config data from storage
     *
     * @async
     * @param  {Boolean} noReload Flag to indicate whether to prevent app window reload
     * @return {undefined}
     */
    async clearUserConfig (noReload) {
        let configName = this.getConfigStorageName();
        this.log('Clearing user config...', 'debug', []);
        try {
            await _appWrapper.getHelper('storage').delete(configName);
            this.addUserMessage('Configuration data cleared', 'debug', [], false,  false, true);
            if (!noReload){
                this.userConfig = {};
                appState.userConfig = {};
                appState.hasUserConfig = false;
                _appWrapper.getHelper('modal').closeCurrentModal(true);
                appState.appShuttingDown = true;
                appState.mainLoaderTitle = _appWrapper.appTranslations.translate('Please wait while application restarts...');
                setTimeout(() => {
                    _appWrapper.windowManager.reloadWindow(null, true, appState.mainLoaderTitle);
                }, 500);
            } else {
                appState.hasUserConfig = false;
                this.previousConfig = _.cloneDeep(appState.config);
                appState.config = _.cloneDeep(this.defaultConfig);
                this.userConfig = {};
                appState.userConfig = {};
                appState.hasUserConfig = false;
                _appWrapper.getHelper('modal').closeCurrentModal(true);
            }
        } catch (ex) {
            this.addUserMessage('Configuration data could not be cleared - "{1}"', 'error', [ex], false,  false);
        }
    }

    /**
     * Handler for clearUserConfig method
     *
     * @param  {Event} e    Event that triggered the handler
     * @return {undefined}
     */
    clearUserConfigHandler (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        _appWrapper.getHelper('modal').confirm(_appWrapper.appTranslations.translate('Are you sure?'), _appWrapper.appTranslations.translate('This will delete your saved configuration data.'), '', '', this.boundMethods.clearUserConfig);
    }

    /**
     * Checks whether given config var exists and returns true or false
     *
     * @param  {string}  name Name of config var
     * @return {Boolean}      True if var exists, false otherwise
     */
    hasConfigVar(name){
        return !_.isUndefined(appState.config[name]);
    }

    /**
     * Sets config var
     *
     * @async
     * @param {string}  name   Name of config variable
     * @param {mixed}   value  Value of config variable
     * @param {Boolean} noSave Prevents auto-saving of user config
     * @return {undefined}
     */
    async setConfigVar(name, value, noSave){
        this.watchConfig = false;
        _.set(appState.config, name, value);
        // appState.config[name] = value;
        if (!noSave){
            await this.saveUserConfig();
        }
        this.watchConfig = true;
    }

    /**
     * Sets entire app configuration to value from argument
     *
     * @async
     * @param {Object} data   New app configuration object
     * @param {Boolean} noSave Prevents auto-saving of user config
     * @return {undefined}
     */
    async setConfig(data, noSave){
        if (data && _.isObject(data)){
            this.watchConfig = false;
            appState.config = _.merge(appState.config, data);
            if (!noSave){
                await this.saveUserConfig();
            }
            this.watchConfig = true;
        }
    }

    /**
     * Event handler for opening config editor
     *
     * @async
     * @param  {Event} e    Event that triggered the method
     * @return {undefined}
     */
    async openConfigEditorHandler (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        this.openConfigEditor();
    }

    /**
     * Prepares config editor data object to be used in config-editor component
     *
     * @async
     * @return {Object} Config editor data
     */
    async prepareConfigEditorData () {
        appState.configEditorData = {};
        let configData = {};
        let keys = _.keys(appState.config);
        for(let i=0; i<keys.length; i++){
            let key = keys[i];
            let value = appState.config[key];
            if (key !== 'configData'){
                if (!_.includes(appState.config.configData.uneditableConfig, key)){
                    configData[key] = await this.prepareConfigEditorDataItem(value, key);
                }
            }
        }
        appState.configEditorData = _appWrapper.getHelper('util').sortObject(configData, true);
    }

    /**
     * Prepares single config editor data value for passing to config-editor component
     * Used recursively for config variables of type object or array
     *
     * @async
     * @param  {(array|Object)} value   Config var value
     * @return {(array|Object)}         Prepared config editor data value
     */
    async prepareConfigEditorDataItem (value) {
        if (_.isArray(value)){
            for(let i=0; i<value.length; i++) {
                let innerValue = value[i];
                let innerKey = i;
                value[innerKey] = await this.prepareConfigEditorDataItem(innerValue, innerKey);
            }
        } else if (_.isObject(value)){
            let keys = _.keys(value);
            for(let i=0; i<keys.length; i++){
                let innerKey = keys[i];
                let innerValue = value[innerKey];
                value[innerKey] = await this.prepareConfigEditorDataItem(innerValue, innerKey);
            }
        }
        return value;
    }

    /**
     * Opens config editor modal
     *
     * @async
     * @return {undefined}
     */
    async openConfigEditor () {
        // appState.status.noHandlingKeys = true;

        await this.prepareConfigEditorData();

        let modalHelper = _appWrapper.getHelper('modal');
        let modalOptions = {
            title: _appWrapper.appTranslations.translate('Config editor'),
            confirmButtonText: _appWrapper.appTranslations.translate('Save'),
            cancelButtonText: _appWrapper.appTranslations.translate('Cancel'),
        };
        appState.modalData.currentModal = modalHelper.getModalObject('configEditorModal', modalOptions);
        _appWrapper.getHelper('modal').modalBusy(_appWrapper.appTranslations.translate('Please wait...'));
        _appWrapper._confirmModalAction = this.saveConfig.bind(this);
        _appWrapper._cancelModalAction = function(evt){
            if (evt && evt.preventDefault && _.isFunction(evt.preventDefault)){
                evt.preventDefault();
            }
            _appWrapper.getHelper('modal').modalNotBusy();
            _appWrapper._cancelModalAction = _appWrapper.__cancelModalAction;
            return _appWrapper.__cancelModalAction();
        };
        _appWrapper.getHelper('modal').openCurrentModal();
    }

    /**
     * Saves current user config (if it has changed) to storage
     *
     * @async
     * @param  {Event} e  Event that triggered the method
     * @return {undefined}
     */
    async saveConfig (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        let form = appState.modalData.modalElement.querySelector('form');
        let newConfig = {};
        _.each(form, function(input){
            let currentConfig = newConfig;
            let appConfig = _.cloneDeep(appState.config);
            let dataPath = input.getAttribute('data-path');
            if (dataPath && dataPath.split){
                let pathChunks = _.drop(dataPath.split('.'), 1);
                let chunkCount = pathChunks.length - 1;
                _.each(pathChunks, function(pathChunk, i){
                    if (i == chunkCount){
                        if (input.getAttribute('type') == 'checkbox'){
                            currentConfig[pathChunk] = input.checked;
                        } else {
                            currentConfig[pathChunk] = input.value;
                        }
                    } else {
                        if (_.isUndefined(currentConfig[pathChunk])){
                            if (!_.isNaN(parseInt(pathChunks[i+1], 10))){
                                currentConfig[pathChunk] = [];
                            } else {
                                currentConfig[pathChunk] = {};
                            }
                        }
                    }
                    currentConfig = currentConfig[pathChunk];
                    appConfig = appConfig[pathChunk];
                });
            }
        });
        let oldConfig = _.cloneDeep(appState.config);
        let difference = _appWrapper.getHelper('util').difference(oldConfig, newConfig);

        if (difference && _.isObject(difference) && _.keys(difference).length){
            let finalConfig = _appWrapper.mergeDeep({}, appState.config, difference);
            appState.config = _.cloneDeep(finalConfig);
            await this.saveUserConfig();
            _appWrapper.getHelper('modal').closeCurrentModal();
        } else {
            _appWrapper.getHelper('modal').closeCurrentModal();
        }
    }

    /**
     * Watcher for config variable changes
     *
     * @async
     * @param  {mixed} oldValue     Old config var value
     * @param  {mixed} newValue     New config var value
     * @return {undefined}
     */
    async configChanged (oldValue, newValue){
        if (!(appState.isDebugWindow || appState.notMainWindow)){
            await this.asyncMessage({instruction: 'setConfig', data: {config: appState.config}});
        }
        if (this.watchConfig){
            let utilHelper = _appWrapper.getHelper('util');
            let difference = utilHelper.difference(this.previousConfig, newValue);
            let diffKeys = Object.keys(difference);
            if (diffKeys && diffKeys.length){
                this.log('{1} config variables have changed: "{2}"', 'debug', [diffKeys.length, diffKeys.join(', ')]);
                await this.saveUserConfig();
            }
        }
        this.previousConfig = _.cloneDeep(appState.config);
        _appWrapper.emit('config:change');
    }
}

exports.AppConfig = AppConfig;