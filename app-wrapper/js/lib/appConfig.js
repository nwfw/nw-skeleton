var _ = require('lodash');
var BaseClass = require('../base').BaseClass;

var _appWrapper;
var appState;

class AppConfig extends BaseClass {
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
        this.appStateConfig = {};
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

    async initialize (options) {
        await super.initialize(options);
    }

    async _loadConfig () {
        return this.initialAppConfig;
    }

    async initializeConfig () {

        this.appStateConfig = require('../../../config/appWrapperConfig').config;

        var theConfig = _appWrapper.mergeDeep({}, this.appStateConfig, this.initialAppConfig);
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
        let className = this.constructor.name;
        if (this.config.forceDebug){
            if (_.isUndefined(this.config.forceDebug[className])){
                console.error('Class "' + className + '" has no forceDebug config set!');
            } else {
                this.forceDebug = _.get(this.config.forceDebug, className);
            }
        }

        if (this.config.forceUserMessages){
            if (_.isUndefined(this.config.forceUserMessages[className])){
                console.error('Class "' + className + '" has no forceUserMessages config set!');
            } else {
                this.forceUserMessages = _.get(this.config.forceUserMessages, className);
            }
        }
        return theConfig;
    }

    getConfigStorageName(){
        let configName = this.getConfig('appInfo.name') + '_config';
        configName = configName.replace(/[^A-Za-z0-9]+/g, '_');
        return configName;
    }

    loadUserConfig () {
        let configName = this.getConfigStorageName();
        this.log('Loading user config...', 'group', []);
        if (localStorage && localStorage.getItem(configName)){
            var userConfig = {};
            try {
                userConfig = JSON.parse(localStorage.getItem(configName));
            } catch (e) {
                this.log('Can\'t parse user config.!', 'warning', []);
            }
            if (userConfig && _.keys(userConfig).length){
                this.log('Loaded {1} user config keys.', 'info', [_.keys(userConfig).length]);
                this.log('User config keys: "{1}".', 'debug', [_.keys(userConfig).join('", "')]);
                appState.hasUserConfig = true;
            } else {
                this.log('User config empty.', 'info', []);
                appState.hasUserConfig = false;
            }
            this.userConfig = _.cloneDeep(userConfig);
            appState.userConfig = _.cloneDeep(userConfig);
            userConfig = _.merge({}, appState.config, userConfig);
            this.previousConfig = _.cloneDeep(userConfig);
            this.log('Loading user config...', 'groupend', []);
            return userConfig;
        } else {
            this.log('No user config found.', 'info', []);
            this.config = _.cloneDeep(appState.config);
            this.previousConfig = _.cloneDeep(appState.config);
            this.userConfig = {};
            appState.userConfig = {};
            this.log('Loading user config...', 'groupend', []);
            return appState.config;
        }
    }

    async saveUserConfig () {
        let configName = this.getConfigStorageName();
        if (localStorage){
            let utilHelper = _appWrapper.getHelper('util');
            var userConfig = utilHelper.difference(this.baseConfig, appState.config);

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

            var userConfigKeys = _.keys(userConfig);
            var userConfigKeyMap = utilHelper.propertyMap(userConfig);
            var oldUserConfigKeyMap = utilHelper.propertyMap(this.userConfig);
            var keyMapDiff = _.difference(userConfigKeyMap, oldUserConfigKeyMap);
            keyMapDiff = _.union(keyMapDiff, _.difference(oldUserConfigKeyMap, userConfigKeyMap));



            var reloadConfig = this.getConfig('configData.reloadConfig');
            var reloadChanges = _.intersection(keyMapDiff, reloadConfig);
            var shouldReload = reloadChanges.length > 0;

            try {
                if (userConfig && Object.keys(userConfigKeys).length){
                    this.log('Saving user config...', 'info', []);
                    let configString = JSON.stringify(userConfig);
                    localStorage.setItem(configName, configString);
                    this.addUserMessage('Configuration data saved', 'info', [], true);
                    appState.hasUserConfig = true;
                    this.userConfig = _.cloneDeep(userConfig);
                    appState.userConfig = _.cloneDeep(userConfig);
                    if (shouldReload){
                        _appWrapper.helpers.modalHelper.closeCurrentModal(true);
                        await _appWrapper.wait(appState.config.mediumPauseDuration);
                        _appWrapper.windowManager.reloadWindow(null, false);
                    } else {
                        this.config = _.cloneDeep(appState.config);
                    }
                } else {
                    this.log('Removing user config...', 'info', []);
                    if (localStorage.getItem(configName)){
                        localStorage.removeItem(configName);
                        this.log('Removed user config.', 'info', []);
                        appState.hasUserConfig = false;
                        this.userConfig = {};
                        appState.userConfig = {};
                        if (shouldReload){
                            _appWrapper.helpers.modalHelper.closeCurrentModal(true);
                            await _appWrapper.wait(appState.config.mediumPauseDuration);
                            _appWrapper.windowManager.reloadWindow(null, false);
                        } else {
                            this.config = _.cloneDeep(appState.config);
                        }
                    }
                }
            } catch (e) {
                this.addUserMessage('Configuration data could not be saved - "{1}"', 'error', [e], false,  false);
            }
        } else {
            this.log('Can\'t save user config.', 'warning', []);
        }
    }

    async clearUserConfig () {
        let configName = this.getConfigStorageName();
        if (localStorage){
            this.log('Clearing user config...', 'info', []);
            try {
                localStorage.removeItem(configName);
                this.addUserMessage('Configuration data cleared', 'info', [], false,  false, true);
                appState.hasUserConfig = false;
                this.userConfig = {};
                appState.userConfig = {};
                _appWrapper.helpers.modalHelper.closeCurrentModal(true);
                appState.appShuttingDown = true;
                appState.mainLoaderTitle = _appWrapper.appTranslations.translate('Please wait while application restarts...');
                setTimeout(() => {
                    _appWrapper.windowManager.reloadWindow(null, true, appState.mainLoaderTitle);
                }, 500);
            } catch (ex) {
                this.addUserMessage('Configuration data could not be cleared - "{1}"', 'error', [ex], false,  false);
            }
        } else {
            this.log('Can\'t clear user config.', 'warning', []);
        }
    }

    clearUserConfigHandler (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        _appWrapper.helpers.modalHelper.confirm(_appWrapper.appTranslations.translate('Are you sure?'), _appWrapper.appTranslations.translate('This will delete your saved configuration data.'), '', '', this.boundMethods.clearUserConfig);
    }

    hasConfigVar(name){
        return !_.isUndefined(appState.config[name]);
    }

    async setConfigVar(name, value, noSave){
        this.watchConfig = false;
        _.set(appState.config, name, value);
        // appState.config[name] = value;
        if (!noSave){
            await this.saveUserConfig();
        }
        this.watchConfig = true;
    }

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

    async openConfigEditorHandler (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        this.openConfigEditor();
    }

    async prepareConfigEditorData () {
        var self = this;
        appState.configEditorData = {};
        var keys = _.keys(appState.config);
        for(var i=0; i<keys.length; i++){
            var key = keys[i];
            var value = appState.config[key];
            if (key !== 'configData'){
                if (!_.includes(appState.config.configData.uneditableConfig, key)){
                    appState.configEditorData[key] = await self.prepareConfigEditorDataItem(value, key);
                }
            }
        }
    }

    async prepareConfigEditorDataItem (value) {
        var self = this;
        if (_.isArray(value)){
            for(let i=0; i<value.length; i++) {
                let innerValue = value[i];
                let innerKey = i;
                value[innerKey] = await self.prepareConfigEditorDataItem(innerValue, innerKey);
            }
        } else if (_.isObject(value)){
            var keys = _.keys(value);
            for(let i=0; i<keys.length; i++){
                let innerKey = keys[i];
                let innerValue = value[innerKey];
                value[innerKey] = await self.prepareConfigEditorDataItem(innerValue, innerKey);
            }
        }
        return value;
    }

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
        _appWrapper.helpers.modalHelper.modalBusy(_appWrapper.appTranslations.translate('Please wait...'));
        _appWrapper._confirmModalAction = this.saveConfig.bind(this);
        _appWrapper._cancelModalAction = function(evt){
            if (evt && evt.preventDefault && _.isFunction(evt.preventDefault)){
                evt.preventDefault();
            }
            // appState.status.noHandlingKeys = false;
            _appWrapper.helpers.modalHelper.modalNotBusy();
            // clearTimeout(_appWrapper.appTranslations.timeouts.translationModalInitTimeout);
            _appWrapper._cancelModalAction = _appWrapper.__cancelModalAction;
            return _appWrapper.__cancelModalAction();
        };
        _appWrapper.helpers.modalHelper.openCurrentModal();
    }

    async saveConfig (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        var form = e.target;
        var newConfig = {};
        _.each(form, function(input){
            var currentConfig = newConfig;
            var appConfig = _.cloneDeep(appState.config);
            var dataPath = input.getAttribute('data-path');
            if (dataPath && dataPath.split){
                var pathChunks = _.drop(dataPath.split('.'), 1);
                var chunkCount = pathChunks.length - 1;
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
        var oldConfig = _.cloneDeep(appState.config);
        var difference = _appWrapper.getHelper('util').difference(oldConfig, newConfig);

        if (difference && _.isObject(difference) && _.keys(difference).length){
            var finalConfig = _appWrapper.mergeDeep({}, appState.config, difference);
            appState.config = _.cloneDeep(finalConfig);
            await this.saveUserConfig();
            _appWrapper.helpers.modalHelper.closeCurrentModal();
        } else {
            _appWrapper.helpers.modalHelper.closeCurrentModal();
        }
    }

    async configChanged (oldValue, newValue){
        if (this.watchConfig){
            let utilHelper = _appWrapper.getHelper('util');
            let difference = utilHelper.difference(this.previousConfig, newValue);
            let diffKeys = Object.keys(difference);
            if (diffKeys && diffKeys.length){
                this.log('Config vars changed: "{1}"', 'info', [diffKeys.join(', ')]);
                await this.saveUserConfig();
            }
        }
        this.previousConfig = _.cloneDeep(appState.config);

    }

}

exports.AppConfig = AppConfig;