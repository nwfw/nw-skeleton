var _ = require('lodash');
var path = require('path');
var fs = require('fs');
var BaseClass = require('./base').BaseClass;

var _appWrapper;
var appUtil;
var appState;


class AppTranslations extends BaseClass {
	constructor() {
		super();

		_appWrapper = this.getAppWrapper();
		appUtil = this.getAppUtil();
		appState = this.getAppState();

		this.forceDebug = false;
		this.forceUserMessages = false;

		this.addingLabels = {};
		this.translationsLoaded = false;

		this.timeouts = {
			translationModalInitTimeout: null
		};
		return this;
	}

	async initializeLanguage(){
		appUtil.log("Initializing languages...", "debug", [], true, this.forceDebug);
		this.translationData = await this.loadTranslations();

		var availableLanguageCodes = _.map(appState.languageData.availableLanguages, function(item){
			return item.code;
		});

		if (!(appState.languageData.availableLanguages && appState.languageData.availableLanguages.length)){
			appUtil.log("No available languages found!", "error", [], false, this.forceDebug);
		} else if (!availableLanguageCodes.indexOf(appState.languageData.currentLanguage) == -1){
			appUtil.log("Language '{1}' invalid!", "error", [appState.languageData.currentLanguage], false, this.forceDebug);
		} else {
			if (!appState.languageData.translations){
				appUtil.log("No translations found!", "error", [], false, this.forceDebug);
			} else if (!appState.languageData.translations[appState.languageData.currentLanguage]){
				appUtil.log("No translations found for language '{1}'!", "error", [appState.languageData.currentLanguage], false, this.forceDebug);
			}
		}
		appUtil.log("{1} languages initialized.", "debug", [appState.languageData.availableLanguages.length], false, this.forceDebug);
		return this.translationData;
	}

	async loadTranslations () {
		var translationData = await this.loadTranslationsFromDir(path.resolve(appState.config.app.translationsRoot), appState.config.app.translationExtensionRegex);
		appState.languageData.availableLanguages = translationData.availableLanguages;
		appState.languageData.translations = translationData.translations;
		return translationData;
	}

	getTranslationEditorData (){
		var translations = _.cloneDeep(appState.languageData.translations);
		var translationObject = {};
		var codes = _.keys(translations);
		for(var i=0; i<codes.length; i++){
			translationObject[codes[i]] = {
				translated: {},
				notTranslated: {}
			};
			let labels = _.sortBy(_.keys(translations[codes[i]]), function(key){
				return key.replace(/^(\*\s*)/, '');
			});
			for (var j=0; j<labels.length; j++){
				var value = translations[codes[i]][labels[j]];
				if (value.match(/^--.*--$/)){
					value = '';
					translationObject[codes[i]].notTranslated[labels[j]] = value;
				} else {
					translationObject[codes[i]].translated[labels[j]] = value;
				}

			}
		}
		return translationObject;
	}

	openTranslationEditor (e) {
		if (e && e.preventDefault && _.isFunction(e.preventDefault)){
			e.preventDefault();
		}

		_appWrapper.windowManager.noHandlingKeys = true;

		appState.modalData.currentModal = _.cloneDeep(appState.translationModal);
		appState.modalData.currentModal.hasSearch = false;
		appState.modalData.currentModal.title = _appWrapper.appTranslations.translate('Translation editor');
		appState.modalData.currentModal.confirmButtonText = _appWrapper.appTranslations.translate('Save');
		appState.modalData.currentModal.cancelButtonText = _appWrapper.appTranslations.translate('Cancel');
		appState.modalData.currentModal.translationData = this.getTranslationEditorData();
		_appWrapper.modalBusy(this.translate('Please wait...'));
		appState.modalData.currentModal.translations = {
			'not translated': this.translate('not translated'),
			'Copy label to translation': this.translate('Copy label to translation')
		};
		_appWrapper._confirmModalAction = this.saveTranslations.bind(this);
		_appWrapper._cancelModalAction = function(evt){
			if (evt && evt.preventDefault && _.isFunction(evt.preventDefault)){
				evt.preventDefault();
			}
			_appWrapper.windowManager.noHandlingKeys = false;
			_appWrapper.modalNotBusy();
			clearTimeout(_appWrapper.appTranslations.timeouts.translationModalInitTimeout);
			_appWrapper._cancelModalAction = _appWrapper.__cancelModalAction;
			return _appWrapper.__cancelModalAction(e);
		};
		_appWrapper.openCurrentModal();
	}

	async saveTranslations (e) {
		if (e && e.preventDefault && _.isFunction(e.preventDefault)){
			e.preventDefault();
		}
		var modalElement = window.document.querySelector('.modal-dialog-wrapper');
		var allSaved = true;
		var savedLangs = [];
		var translationsCount = 0;
		if (modalElement){
			var modalForm = modalElement.querySelector('form');
			if (modalForm){
				_appWrapper.modalBusy(this.translate('Please wait...'));
				var fieldsets = modalForm.querySelectorAll('fieldset');
				for (var i=0; i<fieldsets.length; i++){
					var fieldset = fieldsets[i];
					var currentCode = fieldset.getAttribute("data-code");

					var currentLanguage;
					if (appState.languageData.availableLanguages[i].code == currentCode){
						currentLanguage = appState.languageData.availableLanguages[i];
					}

					if (currentLanguage){
						var textareas = fieldset.querySelectorAll('textarea');
						var translations = {};
						translationsCount = textareas.length;

						for (var j=0; j<translationsCount; j++) {
							var textarea = textareas[j];
							translations[textarea.name] = textarea.value;
						}

						var saved = await this.addLabels(currentLanguage, translations);
						if (saved){
							savedLangs.push(currentLanguage.name);
						} else {
							allSaved = false;
						}
					} else {
						allSaved = false;
					}
				}
			} else {
				allSaved = false;
			}
		} else {
			allSaved = false;
		}
		await this.loadTranslations();
		if (allSaved){
			appUtil.addUserMessage("* Saved {1} translations for {2} languages ('{3}') in translation files.", "info", [translationsCount, savedLangs.length, savedLangs.join(', ')], false, false, true, this.forceDebug);
		} else {
			if (translationsCount && savedLangs.length){
				appUtil.addUserMessage("* Can't save {1} translations for {2} languages ('{3}') in translation files.", "error", [translationsCount, savedLangs.length, savedLangs.join(', ')], false, false, this.forceUserMessages, this.forceDebug);
			}
		}
		_appWrapper.windowManager.noHandlingKeys = false;
		clearTimeout(this.timeouts.translationModalInitTimeout);
		_appWrapper.closeCurrentModal(true);

	}

	getNewLabel (label){
		return '--' + label + '--';
	}

	async loadTranslationsFromDir (translationsPath, translationExtensionRegex, asString){
		var self = this;
		var translations = {};
		var availableLanguages = [];
		if (fs.existsSync(translationsPath)){
			var stats = fs.statSync(translationsPath);
			if (stats.isDirectory()){
				var files = fs.readdirSync(translationsPath);
				_.each(files, function(filePath){
					var translationFilePath = path.join(translationsPath, filePath);
					var fileStat = fs.statSync(translationFilePath);
					if (fileStat.isFile()){
						if (filePath.match(translationExtensionRegex)){
							var languageName = filePath.replace(translationExtensionRegex, '');
							appUtil.log("Loading translations from '{1}'...", "debug", [translationFilePath], false, self.forceDebug);
							var translationData = null;
							if (asString){
								translationData = fs.readFileSync(translationFilePath, {encoding: 'utf8'}).toString();
								translations[languageName] = translationData;
							} else {
								translationData = require(translationFilePath).data;
								translations[languageName] = translationData.translations;
							}

							if (translations[languageName] && (translations[languageName].length || _.keys(translations[languageName]).length)){
								appUtil.log("Loaded translations from '{1}'...", "debug", [translationFilePath], false, self.forceDebug);
								if (!translationData.locale){
									appUtil.log("Language '{1}' has no locale set!", "warning", [languageName], false, self.forceDebug);
								}
								availableLanguages.push({name: translationData.name, code: translationData.code, locale: translationData.locale});
							} else {
								appUtil.log("Invalid or incomplete translations in '{1}'", "error", [translationFilePath], false, self.forceDebug);
							}
						} else {
							appUtil.log("Omitting translations from '{1}', extension invalid.", "warning", [translationFilePath], false, self.forceDebug);
						}
					} else {
						appUtil.log("Omitting translation file '{1}', file is a directory.", "debug", [translationFilePath], false, self.forceDebug);

					}
				});
				var returnObj = {
					translations: translations,
					availableLanguages: availableLanguages
				};
				self.translationsLoaded = true;
				return returnObj;

			} else {
				appUtil.log("Translation dir '{1}' is not a directory!", "error", [translationsPath], false, this.forceDebug);
				return false;
			}
		} else {
			appUtil.log("Translation dir '{1}' does not exist!", "error", [translationsPath], false, this.forceDebug);
			return false;
		}
	}

	translate (label, currentLanguage){
		var languageData = appState.languageData;
		if (!currentLanguage){
			currentLanguage = languageData.currentLanguage;
		}
		var translation = label;
		try {
			if (languageData.translations[currentLanguage] && (languageData.translations[currentLanguage][label])){
				translation = languageData.translations[currentLanguage][label];
				if (languageData.translations[currentLanguage][label].match(/^--.*--$/)){
					// appUtil.log("Label '{1}' for language '{2}' is not translated!", "warning", [label, currentLanguage], true, this.forceDebug);

					translation = label;
				}
			} else {
				appUtil.log("No translation found for label '{1}' using language '{2}'.", "warning", [label, currentLanguage], false, this.forceDebug);
				translation = '__' + label + '__';
				if (appState.autoAddLabels){
					this.addLabel(label);
					translation = '_' + label + '_';
				}
			}
		} catch(e) {
			appUtil.log("Problem translating label '{1}' for language '{2}' - '{3}'.", "error", [label, currentLanguage, e], false, this.forceDebug);
		}
		return translation;
	}

	getLanguageFilePath(languageCode){
		var translationFileName = (appState.config.app.translationExtensionRegex + '');
		translationFileName = translationFileName.replace(/\\./g, '.').replace(/\$/, '').replace(/^\//, '').replace(/\/$/, '');
		translationFileName = languageCode + translationFileName;
		var translationFilePath = path.join(path.resolve(appState.config.app.translationsRoot), translationFileName);
		return translationFilePath;
	}

	async addLabel (label) {
		if (this.addingLabels[label]){
			return;
		} else {
			this.addingLabels[label] = true;
		}
		appUtil.log("Auto-adding label '{1}'...", "debug", [label], false, this.forceDebug);
		var self = this;
		var translationRegex = appState.config.app.translationExtensionRegex
		var languageData = appUtil.getAppState().languageData;

		var translationData = appState.languageData;

		var newLabel = this.getNewLabel(label);

		for (var i =0; i< languageData.availableLanguages.length; i++){
			var availableLanguage = languageData.availableLanguages[i];
			var currentCode = availableLanguage.code;
			var currentName = availableLanguage.name;
			var currentLocale = availableLanguage.locale;
			var currentTranslations = translationData.translations[currentCode];

			appState.languageData.translations[currentCode][label] = newLabel;

			var translationFilePath = self.getLanguageFilePath(currentCode);

			currentTranslations[label] = newLabel;

			var newTranslationData = {
				name: currentName,
				code: currentCode,
				locale: currentLocale,
				translations: currentTranslations
			};

			appUtil.log("- Auto-adding label '{1}' for language '{2}'...", "debug", [label, currentName], false, this.forceDebug);
			var newTranslationDataString = 'exports.data = ' + JSON.stringify(newTranslationData, ' ', 4) + ';';
			fs.writeFileSync(translationFilePath, newTranslationDataString, {encoding: 'utf8'});
			appUtil.log("- Label '{1}' for language '{2}' has been added to translation file.", "debug", [label, currentName], false, this.forceDebug);
		}
		appUtil.log("Auto-added label '{1}' for all languages.", "debug", [label], false, this.forceDebug);
		this.addingLabels[label] = false;
	}

	async addLabels (language, labelData) {
		var translationData = {};
		var translationFilePath = this.getLanguageFilePath(language.code);
		translationData.code = language.code;
		translationData.name = language.name;
		translationData.locale = language.locale;
		translationData.translations = {};
		var labels = _.keys(labelData)
		for(var i =0; i<labels.length; i++){
			var label = labels[i];
			var value = labelData[label];
			if (!value){
				value = '--' + label + '--';
			}
			translationData.translations[label] = value;
			appUtil.log("- Label '{1}' for language '{2}' has been added to translation file.", "debug", [label, language.name], false, this.forceDebug);
		}
		var newTranslationDataString = 'exports.data = ' + JSON.stringify(translationData, ' ', 4) + ';';
		var saved = false;
		try {
			fs.writeFileSync(translationFilePath, newTranslationDataString, {encoding: 'utf8'});
			saved = true;
		} catch (e) {
			appUtil.log(e, "error", [], true, this.forceDebug);
		}

		if (saved){
			appUtil.log("- Saved '{1}' translations for language '{2}'in translation file '{3}'.", "debug", [labels.length, language.name, translationFilePath], false, this.forceDebug);
		} else {
			if (labels.length){
				appUtil.log("- Can't save '{1}' translations for language '{2}'in translation file '{3}'.", "error", [labels.length, language.name, translationFilePath], false, this.forceDebug);
			}
		}

		return saved;
	}

	changeLanguage (e){
		var target = e.target;
		var selectedLanguage = false;
		var selectedLanguageName = '';
		var selectedLocale = '';
		var options = target.querySelectorAll('option');
		_.each(options, function(option){
			if (option.selected){
				selectedLanguage = option.getAttribute('value');
				selectedLocale = option.getAttribute('data-locale');
				selectedLanguageName = option.innerHTML;
			}
		});
		this.doChangeLanguage(selectedLanguageName, selectedLanguage, selectedLocale);
	}

	doChangeLanguage (selectedLanguageName, selectedLanguage, selectedLocale, skipOtherWindow) {
		if (selectedLanguage){
			appUtil.addUserMessage("Changing language to '{1}'.", "info", [selectedLanguageName], false, false, this.forceUserMessages, this.forceDebug);

			appState.languageData.currentLanguage = selectedLanguage;
			appState.languageData.currentLocale = selectedLocale;

			_appWrapper.configHelper.setConfig({
				currentLanguage: selectedLanguage,
				currentLocale: selectedLocale
			});

			if (!skipOtherWindow && appState.isDebugWindow){
				appUtil.addUserMessage("Changing language in main window to '{1}'.", "info", [selectedLanguageName], false, false, true, this.forceDebug);
				this.mainWindow.getAppWrapper().appTranslations.doChangeLanguage.call(this.mainWindow.app, selectedLanguageName, selectedLanguage, selectedLocale, true);
			} else if (!skipOtherWindow && appState.hasDebugWindow){
				appUtil.addUserMessage("Changing language in debug window to '{1}'.", "info", [selectedLanguageName], false, false, true, this.forceDebug);
				this.debugWindow.getAppWrapper().appTranslations.doChangeLanguage.call(this.debugWindow.app, selectedLanguageName, selectedLanguage, selectedLocale, true);
			}
			return true;
		} else {
			appUtil.addUserMessage("Could not change language!", "error", [], false, false, this.forceUserMessages, this.forceDebug);
			return false;
		}
	}
}
exports.AppTranslations = AppTranslations;