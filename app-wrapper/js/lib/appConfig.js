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

        this.initialAppConfig = initialAppConfig;
        this.baseConfig = {};
        this.appStateConfig = {};
        this.config = {};
        this.previousConfig = {};
        this.watchConfig = true;

        this.needsConfig = false;

        return this;
    }

    initialize () {
        return super.initialize();
    }

    async loadConfig () {
        return this.initialAppConfig;
    }

    async initializeConfig () {

        this.appStateConfig = require('../../../config/appWrapperConfig').config;

        var theConfig = _appWrapper.mergeDeep({}, this.appStateConfig, this.initialAppConfig);
        _.each(theConfig.configData.vars, function(value, key){
            if (!value.editable){
                theConfig.configData.uneditableConfig.push(key);
            }
            if (!value.reload){
                theConfig.configData.noReloadConfig.push(key);
            }
        });
        this.config = _.cloneDeep(theConfig);
        this.baseConfig = _.cloneDeep(theConfig);
        return theConfig;
    }

    getConfigStorageName(){
        let configName = this.getConfig('appInfo.name') + '_config';
        configName = configName.replace(/[^A-Za-z0-9]+/g, '_');
        return configName;
    }

    loadUserConfig () {
        let configName = this.getConfigStorageName();
        if (localStorage && localStorage.getItem(configName)){
            this.log('Loading user config...', 'info', [], false);
            var userConfig = {};
            try {
                userConfig = JSON.parse(localStorage.getItem(configName));
            } catch (e) {
                this.log('Can\'t parse user config.!', 'warning', [], false);
            }
            if (userConfig && _.keys(userConfig).length){
                appState.hasUserConfig = true;
            } else {
                appState.hasUserConfig = false;
            }
            userConfig = _.merge({}, appState.config, userConfig);
            // this.config = _.cloneDeep(userConfig);
            this.previousConfig = _.cloneDeep(userConfig);
            return userConfig;
        } else {
            this.log('No user config found.', 'info', [], false);
            this.config = _.cloneDeep(appState.config);
            this.previousConfig = _.cloneDeep(appState.config);
            return appState.config;
        }
    }

    saveUserConfig () {
        let configName = this.getConfigStorageName();
        if (localStorage){
            var userConfig = _appWrapper.getHelper('util').difference(this.baseConfig, appState.config);
            var userConfigKeys = _.keys(userConfig);
            var noReloadConfig = this.getConfig('configData.noReloadConfig');
            var noReloadChanges = _.difference(userConfigKeys, noReloadConfig);
            var shouldReload = userConfigKeys.length && (userConfigKeys.length - noReloadChanges.length) <= 0;


            try {
                if (userConfig && userConfigKeys.length){
                    this.log('Saving user config (changed: "{1}"}', 'info', [userConfigKeys.join(', ')], false);
                    localStorage.setItem(configName, JSON.stringify(userConfig));
                    this.addUserMessage('Configuration data saved', 'info', [], false);
                    appState.hasUserConfig = true;
                    if (shouldReload){
                        _appWrapper.windowManager.reloadWindow(null, true);
                    } else {
                        this.config = _.cloneDeep(appState.config);
                    }
                } else {
                    if (localStorage.getItem(configName)){
                        localStorage.removeItem(configName);
                        appState.hasUserConfig = false;
                        if (shouldReload){
                            _appWrapper.windowManager.reloadWindow(null, true);
                        } else {
                            this.config = _.cloneDeep(appState.config);
                        }
                    }
                }
            } catch (e) {
                this.addUserMessage('Configuration data could not be saved - "{1}"', 'error', [e], false,  false);
            }
        } else {
            this.log('Can\'t save user config.', 'warning', [], false);
        }
    }

    async clearUserConfig () {
        let configName = this.getConfigStorageName();
        if (localStorage){
            this.log('Clearing user config...', 'info', [], false);
            try {
                localStorage.removeItem(configName);
                this.addUserMessage('Configuration data cleared', 'info', [], false,  false, true);
                appState.hasUserConfig = false;
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
            this.log('Can\'t clear user config.', 'warning', [], false);
        }
    }

    async clearUserConfigHandler (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        var confirmed = await _appWrapper.helpers.modalHelper.confirm(_appWrapper.appTranslations.translate('Are you sure?'), _appWrapper.appTranslations.translate('This will delete your saved configuration data.'));
        if (confirmed){
            this.clearUserConfig();
        } else {
            _appWrapper.helpers.modalHelper.closeCurrentModal();
        }
    }

    hasConfigVar(name){
        return !_.isUndefined(appState.config[name]);
    }

    setConfigVar(name, value, noSave){
        appState.config[name] = value;
        if (!noSave){
            this.saveUserConfig();
        }
    }

    setConfig(data, noSave){
        if (data && _.isObject(data)){
            appState.config = _.merge(appState.config, data);
            if (!noSave){
                this.saveUserConfig();
            }
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
        // appState.noHandlingKeys = true;

        await this.prepareConfigEditorData();

        appState.modalData.currentModal = _.cloneDeep(appState.configEditorModal);
        appState.modalData.currentModal.title = _appWrapper.appTranslations.translate('Config editor');
        appState.modalData.currentModal.confirmButtonText = _appWrapper.appTranslations.translate('Save');
        appState.modalData.currentModal.cancelButtonText = _appWrapper.appTranslations.translate('Cancel');
        _appWrapper.helpers.modalHelper.modalBusy(_appWrapper.appTranslations.translate('Please wait...'));
        _appWrapper._confirmModalAction = this.saveConfig.bind(this);
        _appWrapper._cancelModalAction = function(evt){
            if (evt && evt.preventDefault && _.isFunction(evt.preventDefault)){
                evt.preventDefault();
            }
            // appState.noHandlingKeys = false;
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
                            // console.log(input);
                            // console.log(input.getAttribute('name'));
                            // console.log(currentConfig[pathChunk]);
                            // console.log(appConfig[pathChunk]);
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
            this.saveUserConfig();
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
                this.log('Config vars changed: "{1}"', 'info', [diffKeys.join(', ')], false);
                await this.saveUserConfig();
            }
        }
        this.previousConfig = _.cloneDeep(appState.config);

    }

}

exports.AppConfig = AppConfig;