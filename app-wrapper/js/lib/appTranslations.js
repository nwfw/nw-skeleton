var _ = require('lodash');
var path = require('path');
var fs = require('fs');
var BaseClass = require('../base').BaseClass;

var _appWrapper;
var appState;

class AppTranslations extends BaseClass {
    constructor() {
        super();

        _appWrapper = window.getAppWrapper();
        appState = _appWrapper.getAppState();

        this.addingLabels = {};
        this.translationsLoaded = false;

        this.timeouts = {
            translationModalInitTimeout: null
        };
        return this;
    }

    async initialize(){
        return await super.initialize();
    }
    async initializeLanguage(){
        this.log('Initializing languages...', 'debug', [], true);
        this.translationData = await this.loadTranslations();

        var availableLanguageCodes = _.map(appState.languageData.availableLanguages, (item) => {
            return item.code;
        });

        if (!(appState.languageData.availableLanguages && appState.languageData.availableLanguages.length)){
            this.log('No available languages found!', 'error', [], false);
        } else if (!availableLanguageCodes.indexOf(appState.languageData.currentLanguage) == -1){
            this.log('Language "{1}" invalid!', 'error', [appState.languageData.currentLanguage], false);
        } else {
            if (!appState.languageData.translations){
                this.log('No translations found!', 'error', [], false);
            } else if (!appState.languageData.translations[appState.languageData.currentLanguage]){
                this.log('No translations found for language "{1}"!', 'error', [appState.languageData.currentLanguage], false);
            }
        }
        this.log('{1} languages initialized.', 'debug', [appState.languageData.availableLanguages.length], false);
        return this.translationData;
    }

    async loadTranslations () {
        var translationData = await this.loadTranslationsFromDir(path.resolve(this.getConfig('wrapper.translationsRoot')), this.getConfig('wrapper.translationExtensionRegex'));
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
            let labels = _.sortBy(_.keys(translations[codes[i]]), (key) => {
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

        appState.noHandlingKeys = true;

        appState.modalData.currentModal = _.cloneDeep(appState.translationModal);
        appState.modalData.currentModal.hasSearch = false;
        appState.modalData.currentModal.title = _appWrapper.appTranslations.translate('Translation editor');
        appState.modalData.currentModal.confirmButtonText = _appWrapper.appTranslations.translate('Save');
        appState.modalData.currentModal.cancelButtonText = _appWrapper.appTranslations.translate('Cancel');
        appState.modalData.currentModal.translationData = this.getTranslationEditorData();
        _appWrapper.helpers.modalHelper.modalBusy(this.translate('Please wait...'));
        appState.modalData.currentModal.translations = {
            'not translated': this.translate('not translated'),
            'Copy label to translation': this.translate('Copy label to translation')
        };
        _appWrapper._confirmModalAction = this.saveTranslations.bind(this);
        _appWrapper._cancelModalAction = (evt) => {
            if (evt && evt.preventDefault && _.isFunction(evt.preventDefault)){
                evt.preventDefault();
            }
            appState.noHandlingKeys = false;
            _appWrapper.helpers.modalHelper.modalNotBusy();
            clearTimeout(_appWrapper.appTranslations.timeouts.translationModalInitTimeout);
            _appWrapper._cancelModalAction = _appWrapper.__cancelModalAction;
            return _appWrapper.__cancelModalAction(e);
        };
        _appWrapper.helpers.modalHelper.openCurrentModal();
    }

    async saveTranslations (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        let autoAdd = appState.autoAddLabels;
        appState.autoAddLabels = false;
        var modalElement = window.document.querySelector('.modal-dialog-wrapper');
        var allSaved = true;
        var savedLangs = [];
        var translationsCount = 0;
        if (modalElement){
            var modalForm = modalElement.querySelector('form');
            if (modalForm){
                _appWrapper.helpers.modalHelper.modalBusy(this.translate('Please wait...'));
                var fieldsets = modalForm.querySelectorAll('fieldset');
                for (var i=0; i<fieldsets.length; i++){
                    var fieldset = fieldsets[i];
                    var currentCode = fieldset.getAttribute('data-code');

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
            this.addUserMessage('* Saved {1} translations for {2} languages ("{3}") in translation files.', 'info', [translationsCount, savedLangs.length, savedLangs.join(', ')], false, false, true);
        } else {
            if (translationsCount && savedLangs.length){
                this.addUserMessage('* Can\'t save {1} translations for {2} languages ("{3}") in translation files.', 'error', [translationsCount, savedLangs.length, savedLangs.join(', ')], false, false);
            }
        }
        appState.autoAddLabels = autoAdd;
        appState.noHandlingKeys = false;
        clearTimeout(this.timeouts.translationModalInitTimeout);
        _appWrapper.helpers.modalHelper.closeCurrentModal(true);

    }

    getNewLabel (label){
        return '--' + label + '--';
    }

    async loadTranslationsFromDir (translationsPath, translationExtensionRegex, asString){
        var translations = {};
        var availableLanguages = [];
        if (fs.existsSync(translationsPath)){
            var stats = fs.statSync(translationsPath);
            if (stats.isDirectory()){
                var files = fs.readdirSync(translationsPath);
                _.each(files, (filePath) => {
                    var translationFilePath = path.join(translationsPath, filePath);
                    var fileStat = fs.statSync(translationFilePath);
                    if (fileStat.isFile()){
                        if (filePath.match(translationExtensionRegex)){
                            var languageName = filePath.replace(translationExtensionRegex, '');
                            this.log('Loading translations from "{1}"...', 'debug', [translationFilePath], false);
                            var translationData = null;
                            if (asString){
                                translationData = fs.readFileSync(translationFilePath, {encoding: 'utf8'}).toString();
                                translations[languageName] = translationData;
                            } else {
                                translationData = require(translationFilePath).data;
                                translations[languageName] = translationData.translations;
                            }

                            if (translations[languageName] && (translations[languageName].length || _.keys(translations[languageName]).length)){
                                this.log('Loaded translations from "{1}"...', 'debug', [translationFilePath], false);
                                if (!translationData.locale){
                                    this.log('Language "{1}" has no locale set!', 'warning', [languageName], false);
                                }
                                availableLanguages.push({name: translationData.name, code: translationData.code, locale: translationData.locale});
                            } else {
                                this.log('Invalid or incomplete translations in "{1}"', 'error', [translationFilePath], false);
                            }
                        } else {
                            this.log('Omitting translations from "{1}", extension invalid.', 'warning', [translationFilePath], false);
                        }
                    } else {
                        this.log('Omitting translation file "{1}", file is a directory.', 'debug', [translationFilePath], false);

                    }
                });
                var returnObj = {
                    translations: translations,
                    availableLanguages: availableLanguages
                };
                this.translationsLoaded = true;
                return returnObj;

            } else {
                this.log('Translation dir "{1}" is not a directory!', 'error', [translationsPath], false);
                return false;
            }
        } else {
            this.log('Translation dir "{1}" does not exist!', 'error', [translationsPath], false);
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
                    // this.log('Label "{1}" for language "{2}" is not translated!', 'warning', [label, currentLanguage], true);

                    translation = label;
                }
            } else {
                this.log('No translation found for label "{1}" using language "{2}".', 'warning', [label, currentLanguage], false);
                translation = '__' + label + '__';
                if (appState.autoAddLabels){
                    this.addLabel(label);
                    translation = '_' + label + '_';
                }
            }
        } catch(e) {
            this.log('Problem translating label "{1}" for language "{2}" - "{3}".', 'error', [label, currentLanguage, e], false);
        }
        return translation;
    }

    getLanguageFilePath(languageCode){
        var translationFileName = (this.getConfig('wrapper.translationExtensionRegex') + '');
        translationFileName = translationFileName.replace(/\\./g, '.').replace(/\$/, '').replace(/^\//, '').replace(/\/$/, '');
        translationFileName = languageCode + translationFileName;
        var translationFilePath = path.join(path.resolve(this.getConfig('wrapper.translationsRoot')), translationFileName);
        return translationFilePath;
    }

    async addLabel (label) {
        if (this.addingLabels[label]){
            return;
        } else {
            this.addingLabels[label] = true;
        }
        this.log('Auto-adding label "{1}"...', 'debug', [label], false);
        var self = this;
        var languageData = appState.languageData;

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
            var newTranslationDataString = this.getTranslationDataString(newTranslationData);
            fs.writeFileSync(translationFilePath, newTranslationDataString, {encoding: 'utf8'});
            this.log('- Label "{1}" for language "{2}" has been added to translation file.', 'debug', [label, currentName], false);
        }
        this.log('Auto-added label "{1}" for all languages.', 'debug', [label], false);
        this.addingLabels[label] = false;
    }

    async addLabels (language, labelData) {
        var translationData = {};
        var translationFilePath = this.getLanguageFilePath(language.code);
        translationData.code = language.code;
        translationData.name = language.name;
        translationData.locale = language.locale;
        translationData.translations = {};
        var labels = _.keys(labelData);
        for(var i =0; i<labels.length; i++){
            var label = labels[i];
            var value = labelData[label];
            if (!value){
                value = '--' + label + '--';
            }
            translationData.translations[label] = value;
            this.log('- Label "{1}" for language "{2}" has been added to translation file.', 'debug', [label, language.name], false);
        }
        var newTranslationDataString = this.getTranslationDataString(translationData);
        var saved = false;
        try {
            fs.writeFileSync(translationFilePath, newTranslationDataString, {encoding: 'utf8'});
            saved = true;
            appState.languageData.translations[language.code] = translationData.translations;
        } catch (e) {
            this.log(e, 'error', [], true);
        }

        if (saved){
            this.log('- Saved "{1}" translations for language "{2}"in translation file "{3}".', 'debug', [labels.length, language.name, translationFilePath], false);
        } else {
            if (labels.length){
                this.log('- Can\'t save "{1}" translations for language "{2}"in translation file "{3}".', 'error', [labels.length, language.name, translationFilePath], false);
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
        _.each(options, (option) => {
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
            this.addUserMessage('Changing language to "{1}".', 'info', [selectedLanguageName], false, false, true);

            appState.languageData.currentLanguage = selectedLanguage;
            appState.languageData.currentLocale = selectedLocale;

            _appWrapper.appConfig.setConfig({
                currentLanguage: selectedLanguage,
                currentLocale: selectedLocale
            });

            if (!skipOtherWindow && appState.isDebugWindow){
                this.addUserMessage('Changing language in main window to "{1}".', 'info', [selectedLanguageName], false, false, true);
                _appWrapper.mainWindow.getAppWrapper().appTranslations.doChangeLanguage.call(_appWrapper.mainWindow.app, selectedLanguageName, selectedLanguage, selectedLocale, true);
            } else if (!skipOtherWindow && appState.hasDebugWindow){
                this.addUserMessage('Changing language in debug window to "{1}".', 'info', [selectedLanguageName], false, false, true);
                _appWrapper.debugWindow.getAppWrapper().appTranslations.doChangeLanguage.call(_appWrapper.debugWindow.app, selectedLanguageName, selectedLanguage, selectedLocale, true);
            }
            return true;
        } else {
            this.addUserMessage('Could not change language!', 'error', [], false, false);
            return false;
        }
    }

    getTranslationDataString (translationData) {
        let tab = '    ';
        var newTranslationDataString = 'exports.data = {\n';
        newTranslationDataString += tab + '\'name\': \'' + translationData.name + '\',\n';
        newTranslationDataString += tab + '\'code\': \'' + translationData.code + '\',\n';
        newTranslationDataString += tab + '\'locale\': \'' + translationData.locale + '\',\n';
        newTranslationDataString += tab + '\'translations\': {\n';
        for (let label in translationData.translations){
            newTranslationDataString += tab + tab + '\'' + label.replace(/'/g, '\\\'') + '\': \'' + translationData.translations[label].replace(/'/g, '\\\'') + '\',\n';
        }
        newTranslationDataString = newTranslationDataString.replace(/,\n$/, '\n');
        newTranslationDataString += tab + '}\n';
        newTranslationDataString += '}';
        return newTranslationDataString;

    }
}
exports.AppTranslations = AppTranslations;