var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var BaseClass = require('../base').BaseClass;

var _appWrapper;
var appUtil;
var appState;

class ConfigHelper extends BaseClass {
	constructor(initialAppConfig) {
		super();

		_appWrapper = this.getAppWrapper();
		appUtil = this.getAppUtil();
		appState = this.getAppState();

		this.forceDebug = false;
		this.forceUserMessages = false;

		this.initialAppConfig = initialAppConfig;
		this.appStateConfig = {};
		this.config = {};

		this.initialize();

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

		var theConfig = appUtil.mergeDeep({}, this.appStateConfig, this.initialAppConfig);
		_.each(theConfig.configData.vars, function(value, key){
			if (!value.editable){
				theConfig.configData.uneditableConfig.push(key);
			}
			if (!value.reload){
				theConfig.configData.noReloadConfig.push(key);
			}
		});
		this.config = _.cloneDeep(theConfig);
		return theConfig;
	}

	loadUserConfig () {
		if (localStorage && localStorage.getItem('config')){
			appUtil.log("Loading user config...", "info", [], false, this.forceDebug);
			var userConfig = {};
			try {
				userConfig = JSON.parse(localStorage.getItem('config'));
			} catch (e) {
				appUtil.log("Can't parse user config.!", "warning", [], false, this.forceDebug);
			}
			if (userConfig && _.keys(userConfig).length){
				appState.hasUserConfig = true;
			} else {
				appState.hasUserConfig = false;
			}
			userConfig = _.merge({}, appState.config, userConfig);
			this.config = _.cloneDeep(userConfig);
			return userConfig;
		} else {
			appUtil.log("No user config found.", "info", [], false, this.forceDebug);
			this.config = _.cloneDeep(appState.config);
			return appState.config;
		}
	}

	saveUserConfig () {
		if (localStorage){
			var userConfig = appUtil.difference(this.config, appState.config);
			var userConfigKeys = _.keys(userConfig);
			var noReloadConfig = appUtil.getConfig('configData.noReloadConfig');

			var noReloadChanges = _.difference(userConfigKeys, noReloadConfig);

			var shouldReload = (userConfigKeys.length - noReloadChanges.length) <= 0;

			appUtil.log("Saving user config...", "warning", [], false, this.forceDebug);
			try {
				if (userConfig && _.keys(userConfig).length){
					localStorage.setItem('config', JSON.stringify(userConfig));
					appUtil.addUserMessage("Configuration data saved", "info", [], false,  false, true, this.forceDebug);
					appState.hasUserConfig = true;
					if (shouldReload){
						_appWrapper.windowManager.reloadWindow(null, true);
					} else {
						this.config = _.cloneDeep(appState.config)
					}
				} else {
					if (localStorage.getItem('config')){
						localStorage.removeItem('config');
						appState.hasUserConfig = false;
						if (shouldReload){
							_appWrapper.windowManager.reloadWindow(null, true);
						} else {
							this.config = _.cloneDeep(appState.config)
						}
					}
				}
			} catch (e) {
				appUtil.addUserMessage("Configuration data could not be saved - '{1}'", "error", [e], false,  false, this.forceUserMessages, this.forceDebug);
			}
		} else {
			appUtil.log("Can't save user config.", "warning", [], false, this.forceDebug);
		}
	}

	async clearUserConfig () {
		if (localStorage){
			var userConfig = {};
			appUtil.log("Clearing user config...", "info", [], false, this.forceDebug);
			try {
				localStorage.removeItem('config');
				appUtil.addUserMessage("Configuration data cleared", "info", [], false,  false, true, this.forceDebug);
				appState.hasUserConfig = false;
				_appWrapper.closeCurrentModal(true);
				appState.appShuttingDown = true;
				appState.mainLoaderTitle = _appWrapper.appTranslations.translate('Please wait while application restarts...');
				setTimeout(() => {
					_appWrapper.windowManager.reloadWindow(null, true, appState.mainLoaderTitle);
				}, 500);
			} catch (ex) {
				appUtil.addUserMessage("Configuration data could not be cleared - '{1}'", "error", [ex], false,  false, this.forceUserMessages, this.forceDebug);
			}
		} else {
			appUtil.log("Can't clear user config.", "warning", [], false, this.forceDebug);
		}
	}

	async clearUserConfigHandler (e) {
		if (e && e.preventDefault && _.isFunction(e.preventDefault)){
			e.preventDefault();
		}
		var confirmed = await _appWrapper.htmlHelper.confirm(_appWrapper.appTranslations.translate('Are you sure?'), _appWrapper.appTranslations.translate('This will delete your saved configuration data.'))
		if (confirmed){
			this.clearUserConfig();
		} else {
			_appWrapper.closeCurrentModal();
		}
	}

	setConfigVar(name, value){
		appState.config[name] = value;
		this.saveUserConfig();
	}

	setConfig(data){
		if (data && _.isObject(data)){
			appState.config = _.merge(appState.config, data);
			this.saveUserConfig();
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

	async prepareConfigEditorDataItem (value, key) {
		var self = this;
		if (_.isArray(value)){
			for(var i=0; i<value.length; i++) {
				var innerValue = value[i];
				var innerKey = i;
				value[innerKey] = await self.prepareConfigEditorDataItem(innerValue, innerKey);
			}
		} else if (_.isObject(value)){
			var keys = _.keys(value);
			for(var i=0; i<keys.length; i++){
				var innerKey = keys[i];
				var innerValue = value[innerKey];
				value[innerKey] = await self.prepareConfigEditorDataItem(innerValue, innerKey);
			}
		}
		return value;
	}

	async openConfigEditor () {
		// this.windowManager.noHandlingKeys = true;

		await this.prepareConfigEditorData();

		appState.modalData.currentModal = _.cloneDeep(appState.configEditorModal);
		appState.modalData.currentModal.title = _appWrapper.appTranslations.translate('Config editor');
		appState.modalData.currentModal.confirmButtonText = _appWrapper.appTranslations.translate('Save');
		appState.modalData.currentModal.cancelButtonText = _appWrapper.appTranslations.translate('Cancel');
		_appWrapper.modalBusy(_appWrapper.appTranslations.translate('Please wait...'));
		_appWrapper._confirmModalAction = this.saveConfig.bind(this);
		_appWrapper._cancelModalAction = function(evt){
			if (evt && evt.preventDefault && _.isFunction(evt.preventDefault)){
				evt.preventDefault();
			}
			// this.windowManager.noHandlingKeys = false;
			_appWrapper.modalNotBusy();
			// clearTimeout(_appWrapper.appTranslations.timeouts.translationModalInitTimeout);
			_appWrapper._cancelModalAction = _appWrapper.__cancelModalAction;
			return _appWrapper.__cancelModalAction();
		};
		_appWrapper.openCurrentModal();
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
			var dataPath = input.getAttribute("data-path");
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
		var difference = appUtil.difference(oldConfig, newConfig);

		if (difference && _.isObject(difference) && _.keys(difference).length){
			var finalConfig = appUtil.mergeDeep({}, appState.config, difference);
			appState.config = _.cloneDeep(finalConfig);
			this.saveUserConfig();
			_appWrapper.closeCurrentModal();
		} else {
			_appWrapper.closeCurrentModal();
		}
	}

}

exports.ConfigHelper = ConfigHelper;