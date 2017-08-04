/**
 * @fileOverview AppTranslations class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.2.1
 */


const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const AppBaseClass = require('./appBase').AppBaseClass;


var Gta;
try {
    Gta = require('google-translate-api');
} catch (ex) {
    _.noop(ex);
}


var _appWrapper;
var appState;

/**
 * A class for app translations/languages operations and manipulation
 *
 * @class
 * @extends {appWrapper.AppBaseClass}
 * @memberOf appWrapper
 *
 * @property {Object}           addingLabels        Object that stores labels that are currently being added (prevents double adding)
 * @property {Boolean}          translationsLoaded  Flag to indicate whether translation data is loaded
 */
class AppTranslations extends AppBaseClass {
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

    /**
     * Initializes language data, loading available languages and their translations
     *
     * @async
     * @return {Object} Translation data with populated languages and translations
     */
    async initializeLanguage(){
        this.log('Initializing languages...', 'group', []);
        this.translationData = await this.loadTranslations();

        var availableLanguageCodes = _.map(appState.languageData.availableLanguages, (item) => {
            return item.code;
        });

        if (!(appState.languageData.availableLanguages && appState.languageData.availableLanguages.length)){
            this.log('No available languages found!', 'error', []);
        } else if (!availableLanguageCodes.indexOf(appState.languageData.currentLanguage) == -1){
            this.log('Language "{1}" invalid!', 'error', [appState.languageData.currentLanguage]);
        } else {
            if (!appState.languageData.translations){
                this.log('No translations found!', 'error', []);
            } else if (!appState.languageData.translations[appState.languageData.currentLanguage]){
                this.log('No translations found for language "{1}"!', 'error', [appState.languageData.currentLanguage]);
            }
        }
        this.log('{1} languages initialized.', 'debug', [appState.languageData.availableLanguages.length]);
        this.log('Initializing languages...', 'groupend', []);
        appState.status.languageInitialized = true;
        return this.translationData;
    }

    /**
     * Loads translations from translation files
     *
     * @async
     * @return {Object} Translation data with populated languages and translations
     */
    async loadTranslations () {
        this.log('Loading translations.', 'info', []);
        var translationData = await this.loadTranslationsFromDir(path.resolve(this.getConfig('wrapper.translationsRoot')), this.getConfig('wrapper.translationExtensionRegex'));
        appState.languageData.availableLanguages = translationData.availableLanguages;
        appState.languageData.translations = translationData.translations;
        this.log('Translations loaded.', 'info', []);
        return translationData;
    }

    /**
     * Prepares config editor data object for config-editor component
     *
     * @return {Object} Config editor data object for config-editor component
     */
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

    /**
     * Opens translation editor modal
     *
     * @param  {Event} e Event that triggered the method
     * @return {undefined}
     */
    openTranslationEditor (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }

        // appState.status.noHandlingKeys = true;

        let modalHelper = _appWrapper.getHelper('modal');
        let modalOptions = {
            hasSearch: false,
            title: _appWrapper.appTranslations.translate('Translation editor'),
            confirmButtonText: _appWrapper.appTranslations.translate('Save'),
            cancelButtonText: _appWrapper.appTranslations.translate('Cancel'),
            translationData: this.getTranslationEditorData(),
            hasGoogleTranslate: false,
            translations: {
                'not translated': this.translate('not translated'),
                'Copy label to translation': this.translate('Copy label to translation')
            },
        };
        if (Gta){
            modalOptions.hasGoogleTranslate = true;
        }
        appState.modalData.currentModal = modalHelper.getModalObject('translationModal', modalOptions);
        _appWrapper.helpers.modalHelper.modalBusy(this.translate('Please wait...'));
        _appWrapper._confirmModalAction = this.saveTranslations.bind(this);
        _appWrapper._cancelModalAction = (evt) => {
            if (evt && evt.preventDefault && _.isFunction(evt.preventDefault)){
                evt.preventDefault();
            }
            _appWrapper.helpers.modalHelper.modalNotBusy();
            clearTimeout(_appWrapper.appTranslations.timeouts.translationModalInitTimeout);
            _appWrapper._cancelModalAction = _appWrapper.__cancelModalAction;
            return _appWrapper.__cancelModalAction(e);
        };
        _appWrapper.helpers.modalHelper.openCurrentModal();
    }

    /**
     * Saves translations to translation files
     *
     * @async
     * @param  {Event} e  Event that triggered the method
     * @return {undefined}
     */
    async saveTranslations (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        let autoAdd = appState.config.autoAddLabels;
        appState.config.autoAddLabels = false;
        var modalElement = window.document.querySelector('.modal-dialog-wrapper');
        var allSaved = true;
        var savedLangs = [];
        var translationsCount = 0;
        if (modalElement){
            var modalForm = modalElement.querySelector('form');
            if (modalForm){
                this.log('Saving translations.', 'info', []);
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
            this.addUserMessage('* Saved {1} translations for {2} languages ("{3}") in translation files.', 'info', [translationsCount, savedLangs.length, savedLangs.join('", "')], false, false, true);
        } else {
            if (translationsCount && savedLangs.length){
                this.addUserMessage('* Can\'t save {1} translations for {2} languages ("{3}") in translation files.', 'error', [translationsCount, savedLangs.length, savedLangs.join('", "')], false, false);
            }
        }
        appState.config.autoAddLabels = autoAdd;
        // appState.status.noHandlingKeys = false;
        clearTimeout(this.timeouts.translationModalInitTimeout);
        _appWrapper.helpers.modalHelper.modalNotBusy();
        _appWrapper.helpers.modalHelper.closeCurrentModal();

    }

    /**
     * Returns default value for untranslated labels
     *
     * @param  {string} label Label name
     * @return {string}       Default value for untranslated label
     */
    getNewLabel (label){
        return '--' + label + '--';
    }

    /**
     * Loads all translation data from directory passed in argument
     *
     * @async
     * @param  {string} translationsPath          Absolute path to directory containing translation files
     * @param  {RegExp} translationExtensionRegex Regular expression for matching file names containing translation data
     * @param  {boolean} asString                 Flag to indicate whether to return file contents as string or require() it
     * @return {Object}                           Object containing loaded translation data
     */
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
                            this.log('Loading translations from "{1}"...', 'debug', [translationFilePath]);
                            var translationData = null;
                            if (asString){
                                translationData = fs.readFileSync(translationFilePath, {encoding: 'utf8'}).toString();
                                translations[languageName] = translationData;
                            } else {
                                translationData = require(translationFilePath).data;
                                translations[languageName] = translationData.translations;
                            }

                            if (translations[languageName] && (translations[languageName].length || _.keys(translations[languageName]).length)){
                                this.log('Loaded translations from "{1}"...', 'debug', [translationFilePath]);
                                if (!translationData.locale){
                                    this.log('Language "{1}" has no locale set!', 'warning', [languageName]);
                                }
                                availableLanguages.push({name: translationData.name, code: translationData.code, locale: translationData.locale});
                            } else {
                                this.log('Invalid or incomplete translations in "{1}"', 'error', [translationFilePath]);
                            }
                        } else {
                            this.log('Omitting translations from "{1}", extension invalid.', 'warning', [translationFilePath]);
                        }
                    } else {
                        this.log('Omitting translation file "{1}", file is a directory.', 'debug', [translationFilePath]);

                    }
                });
                var returnObj = {
                    translations: translations,
                    availableLanguages: availableLanguages
                };
                this.translationsLoaded = true;
                return returnObj;

            } else {
                this.log('Translation dir "{1}" is not a directory!', 'error', [translationsPath]);
                return false;
            }
        } else {
            this.log('Translation dir "{1}" does not exist!', 'error', [translationsPath]);
            return false;
        }
    }

    /**
     * Returns translated value for passed label
     *
     * Translation is being interpolated by replacing placeholders
     * such as '{1}', '{2}' etc. by corresponding values from 'data' argument
     *
     * @param  {string} label           Label for translation
     * @param  {string} currentLanguage Current language code
     * @param  {array} data             An array of data strings to be used for interpolation
     * @return {string}                 Translated label with interpolated data
     */
    translate (label, currentLanguage, data){
        var languageData = appState.languageData;
        if (!currentLanguage){
            currentLanguage = languageData.currentLanguage;
        }
        var translation = label;
        if (!data){
            data = [];
        }
        try {
            if (languageData.translations[currentLanguage] && (languageData.translations[currentLanguage][label])){
                translation = languageData.translations[currentLanguage][label];
                if (languageData.translations[currentLanguage][label].match(/^--.*--$/)){
                    // this.log('Label "{1}" for language "{2}" is not translated!', 'warning', [label, currentLanguage]);

                    translation = label;
                }
            } else {
                this.log('No translation found for label "{1}" using language "{2}".', 'warning', [label, currentLanguage]);
                translation = '__' + label + '__';
                if (appState.config.autoAddLabels){
                    this.addLabel(label);
                    translation = '_' + label + '_';
                }
            }
        } catch(e) {
            this.log('Problem translating label "{1}" for language "{2}" - "{3}".', 'error', [label, currentLanguage, e]);
        }

        if (translation && translation.match && translation.match(/{(\d+)}/) && _.isArray(data) && data.length) {
            translation = translation.replace(/{(\d+)}/g, (match, number) => {
                var index = number - 1;
                return !_.isUndefined(data[index]) ? data[index] : match;
            });
        }
        return translation;
    }

    /**
     * Returns absolute path to translations data file for given langauge code
     *
     * @param  {string} languageCode Language code to get path for
     * @return {string}              Absolute path to translation data file
     */
    getLanguageFilePath(languageCode){
        var translationFileName = (this.getConfig('wrapper.translationExtensionRegex') + '');
        translationFileName = translationFileName.replace(/\\./g, '.').replace(/\$/, '').replace(/^\//, '').replace(/\/$/, '');
        translationFileName = languageCode + translationFileName;
        var translationFilePath = path.join(path.resolve(this.getConfig('wrapper.translationsRoot')), translationFileName);
        return translationFilePath;
    }

    /**
     * Adds label to translation data (for all languages)
     *
     * @async
     * @param {string} label Label to add
     * @return {undefined}
     */
    async addLabel (label) {
        if (this.addingLabels[label]){
            return;
        } else {
            this.addingLabels[label] = true;
        }
        this.log('Auto-adding label "{1}"...', 'debug', [label]);
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
            this.log('- Label "{1}" for language "{2}" has been added to translation file.', 'debug', [label, currentName]);
        }
        this.log('Auto-added label "{1}" for all languages.', 'debug', [label]);
        this.addingLabels[label] = false;
    }

    /**
     * Add all labels from argument to given language
     *
     * @async
     * @param {Object} language  Language data object with properties code, name and locale
     * @param {Object} labelData Labels to be added in format { labelText: translationText }
     * @return {undefined}
     */
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
            this.log('- Label "{1}" for language "{2}" has been added to translation file.', 'debug', [label, language.name]);
        }
        var newTranslationDataString = this.getTranslationDataString(translationData);
        var saved = false;
        try {
            fs.writeFileSync(translationFilePath, newTranslationDataString, {encoding: 'utf8'});
            saved = true;
            appState.languageData.translations[language.code] = translationData.translations;
        } catch (e) {
            this.log(e, 'error', []);
        }

        if (saved){
            this.log('- Saved "{1}" translations for language "{2}"in translation file "{3}".', 'debug', [labels.length, language.name, translationFilePath]);
        } else {
            if (labels.length){
                this.log('- Can\'t save "{1}" translations for language "{2}"in translation file "{3}".', 'error', [labels.length, language.name, translationFilePath]);
            }
        }

        return saved;
    }

    /**
     * Handler method for changing app language
     *
     * @param  {Event} e Event that triggered the method
     * @return {undefined}
     */
    changeLanguage (e){
        var target = e.target;
        var selectedCode = false;
        var selectedName = '';
        var selectedLocale = '';
        var options = target.querySelectorAll('option');
        _.each(options, (option) => {
            if (option.selected){
                selectedCode = option.getAttribute('value');
                selectedLocale = option.getAttribute('data-locale');
                selectedName = option.innerHTML;
            }
        });
        this.doChangeLanguage(selectedName, selectedCode, selectedLocale);
    }

    /**
     * Method that changes current app language
     *
     * @param  {string}     selectedName        New app language name
     * @param  {string}     selectedCode        New app language code
     * @param  {string}     selectedLocale      New app language locale
     * @param  {boolean}    skipOtherWindow     Flag to indicate whether to skip changing languages in other windows
     * @return {boolean}                        Result of language changing
     */
    doChangeLanguage (selectedName, selectedCode, selectedLocale, skipOtherWindow) {
        if (selectedCode){
            this.addUserMessage('Changing language to "{1}".', 'info', [selectedName], false, false, true);

            appState.languageData.currentLanguageName = selectedName;
            appState.languageData.currentLanguage = selectedCode;
            appState.languageData.currentLocale = selectedLocale;

            _appWrapper.appConfig.setConfig({
                currentLanguageName: selectedName,
                currentLanguage: selectedCode,
                currentLocale: selectedLocale
            });

            if (!skipOtherWindow && appState.isDebugWindow){
                this.addUserMessage('Changing language in main window to "{1}".', 'info', [selectedName], false, false, true);
                _appWrapper.mainWindow.getAppWrapper().appTranslations.doChangeLanguage.call(_appWrapper.mainWindow.app, selectedName, selectedCode, selectedLocale, true);
            } else if (!skipOtherWindow && appState.hasDebugWindow){
                this.addUserMessage('Changing language in debug window to "{1}".', 'info', [selectedName], false, false, true);
                _appWrapper.debugWindow.getAppWrapper().appTranslations.doChangeLanguage.call(_appWrapper.debugWindow.app, selectedName, selectedCode, selectedLocale, true);
            }
            return true;
        } else {
            this.addUserMessage('Could not change language!', 'error', [], false, false);
            return false;
        }
    }

    /**
     * Prepares and returns translation data string for saving in translation file
     *
     * @param  {Object} translationData Object with translation data
     * @return {string}                 String for writing to translation data file
     */
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
        newTranslationDataString += '};';
        return newTranslationDataString;

    }

    /**
     * Detects and returns unused labels in the app
     *
     * @async
     * @return {array} An array of unused labels
     */
    async getExcessLabels () {
        let scannedTranslations = await this.scanAppTranslations();
        let excessLabels = _.difference(Object.keys(appState.languageData.translations[appState.languageData.currentLanguage]), scannedTranslations);
        let labelDiffs = [];
        for (let i=0; i<appState.languageData.availableLanguages.length; i++){
            let translations = _.omit(_.cloneDeep(appState.languageData.translations[appState.languageData.availableLanguages[i].code]), excessLabels);
            let translationLabels = Object.keys(translations);
            labelDiffs = _.union(labelDiffs, _.difference(excessLabels, translationLabels));
        }
        labelDiffs = _.uniq(labelDiffs);
        return labelDiffs;
    }

    /**
     * Detects unused labels in app and removes them from translation files automatically
     *
     * @async
     * @return {undefined}
     */
    async autoTrimTranslations () {
        let scannedTranslations = await this.scanAppTranslations();
        let excessTranslations = _.difference(Object.keys(appState.languageData.translations[appState.languageData.currentLanguage]), scannedTranslations);
        let beforeCount = 0;
        let afterCount = 0;
        for (let i=0; i<appState.languageData.availableLanguages.length; i++){
            beforeCount = Object.keys(appState.languageData.translations[appState.languageData.availableLanguages[i].code]).length;
            let translations = _.omit(_.cloneDeep(appState.languageData.translations[appState.languageData.availableLanguages[i].code]), excessTranslations);
            afterCount = Object.keys(translations).length;
            await this.addLabels(appState.languageData.availableLanguages[i], translations);
        }
        let countDiff = beforeCount - afterCount;
        if (countDiff){
            this.addUserMessage('Trimmed {1} excess translations.', 'info', [countDiff], false, false, true);
        } else {
            this.addUserMessage('No excess translations found.', 'info', [], false, false, true);
        }
    }

    /**
     * Scans app files labels and returns them
     *
     * @async
     * @return {array} An array of found labels
     */
    async scanAppTranslations() {
        let appDir = appState.appDir;
        let wrapperDir = path.resolve(path.join(appDir, '../node_modules/nw-skeleton/app-wrapper'));
        let files = await _appWrapper.fileManager.readDirRecursive(appDir, /\.(js|html)$/);
        let labels = [];
        let translateRegex = new RegExp('trans' + 'late\\(\'([^\']+)\'\\)', 'g');
        let userMessageRegex = new RegExp('addUserMessage\\(\'([^\']+)\'(,|\\))', 'g');
        files = _.union(files, await _appWrapper.fileManager.readDirRecursive(wrapperDir, /\.(js|html)$/));

        for (let i=0; i<files.length; i++){
            let fileContents = await _appWrapper.fileManager.readFileSync(files[i], {encoding: 'utf8'});
            if (fileContents){
                let fileTranslations = fileContents.match(translateRegex);
                fileTranslations = _.union(fileTranslations, fileContents.match(userMessageRegex));
                if (fileTranslations && fileTranslations.length){
                    fileTranslations = _.map(fileTranslations, (translation) => {
                        // return translation.replace(/^translate\('/, '').replace(/'\)$/, '');
                        return translation.replace(/^(translate|addUserMessage)\('/, '').replace(/',?\)?$/, '');

                    });
                    labels = _.union(labels, fileTranslations);
                }
            }
        }
        return labels;
    }


    /**
     * Translates text using google-translate-api module
     *
     * @async
     * @param  {String} text Text to translate
     * @param  {String} to   Source language code
     * @param  {String} from Destination language code
     * @return {String}      Translated text
     */
    async googleTranslate(text, to, from){
        if (!Gta){
            return text;
        }
        let options = {
            to: to
        };
        if (from){
            options.from = from;
        }

        var returnPromise;
        var resolveReference;
        returnPromise = new Promise((resolve) => {
            resolveReference = resolve;
        });

        Gta(text, options).then(res => {
            resolveReference(res.text);
        }).catch(err => {
            this.log('Error translating "{1}" - "{2}"', 'error', [text, err]);
            resolveReference(text);
        });

        return returnPromise;
    }


    /**
     * Takes text string as parameter and transliterates it based on set options
     *
     * @param {String} text             Text to transliterate
     * @param {String} direction        Direction for transliteration ('c2l', 'l2c' or 'yu2ascii')
     * @return {String} transliterated    Transliterated text
     */
    transliterateText(text, direction){
        let options = this.getTransliterateData();
        if (direction){
            options.direction = direction;
        }
        var _text = new String(text);
        if (_text){
            /*
         * preprocessing - performing all multi-char replacements
         * before 1:1 transliteration based on options
         */
            _text = this.multiReplace(_text, options.maps[options.direction].multiPre);
            /*
         * 1:1 transliteration - transliterating the text using
         * character maps supplied in options
         */
            _text = this.charTransliteration(_text);

            /*
         * postrocessing - performing all multi-char replacements after
         * 1:1 transliteration based on options
         */
            _text = this.multiReplace(_text, options.maps[options.direction].multiPost);
        };
        return _text;
    }

    /**
     * Transliterates char to char using charmap
     *
     * @param {String} text             Text to transliterate
     * @return {String} transliterated    Transliterated text
     */
    charTransliteration(text){
        let options = this.getTransliterateData();
        var _text = new String(text);
        if (_text){
            var fromChars = options.maps[options.direction].charMap[0].split('');
            var toChars = options.maps[options.direction].charMap[1].split('');
            var charMap = {};
            for(var i = 0; i < fromChars.length; i++) {
                var c = i < toChars.length ? toChars[i] : fromChars[i];
                charMap[fromChars[i]] = c;
            };
            var re = new RegExp(fromChars.join("|"), "g");
            _text = _text.replace(re, function(c) {
                if (charMap[c]){
                    return charMap[c];
                } else {
                    return c;
                };
            });
        };
        return _text;
    }

    /**
     * multiReplace - replaces all occurrences of all present elements of multiMap[0] with multiMap[1] in a string and returns the string
     *
     * @param {String} text             Text to replace
     * @param {Array[][]} multiMap      An array of arrays (patterns and replacements) for regex
     * @return {String}                 Transliterated text
     */
    multiReplace(text, multiMap){
        if (multiMap[0]){
            var len = multiMap[0].length;
            for(var i=0;i<len;i++){
                var tempReplacements = [];
                var pattern = multiMap[0][i];
                var regex = new RegExp(pattern);
                var replacement = multiMap[1][i];
                if (replacement.match(regex)){
                    var _tempReplacement = (new Date).getTime();
                    while (_tempReplacement == (new Date).getTime()){
                        _tempReplacement = _tempReplacement;
                    };
                    var _tempReplacements = tempReplacements;
                    tempReplacements = [];
                    for(var k=0; k<_tempReplacements.length;k++){
                        if (_tempReplacements[k][0] == multiMap[0][i]){
                            continue
                        } else {
                            tempReplacements.push(_tempReplacements[k]);
                        };
                    };
                    tempReplacements.push([multiMap[0][i], _tempReplacement]);
                    while(regex.test(text)){
                        text = text.replace(regex, _tempReplacement);
                    };
                } else if (pattern.match(new RegExp(replacement))){
                    for(var j=0;j<tempReplacements.length;j++){
                        var tempRegex = new RegExp(tempReplacements[j][1]);
                        while(text.match(tempRegex)){
                            text = text.replace(tempRegex, tempReplacements[j][0]);
                        };
                    };
                };
                while(regex.test(text)){
                    text = text.replace(regex, replacement);
                };
            };
        };
        return text;
    }

    /**
     * Returns data used for transliteration
     *
     * @todo  move elsewhere
     * @return {Object} Data for transliteration
     */
    getTransliterateData () {
        return {
            direction : 'c2l',
            transliterateFormValues : true,
            maps : {
                l2c : {
                    charMap : ['abcdefghijklmnoprstuvzšđžčćABCDEFGHIJKLMNOPRSTUVZŠĐŽČĆ', 'абцдефгхијклмнопрстувзшђжчћАБЦДЕФГХИЈКЛМНОПРСТУВЗШЂЖЧЋ'],
                    multiPre : [[], []],
                    multiPost : [['&\u043d\u0431\u0441\u043f;', '&\u0430\u043c\u043f;',  '\u043bј', '\u043dј', '\u041bј', '\u041d\u0458', '\u041bЈ', '\u041d\u0408', '\u0434ж', '\u0414\u0436', '\u0414\u0416'], ['&nbsp;', '&amp;', '\u0459', '\u045a', '\u0409', '\u040a', '\u0409', '\u040a', '\u045f', '\u040f', '\u040f']]
                },
                c2l : {
                    charMap : ['абцдефгхијклмнопрстувзшђжчћАБЦДЕФГХИЈКЛМНОПРСТУВЗШЂЖЧЋ', 'abcdefghijklmnoprstuvzšđžčćABCDEFGHIJKLMNOPRSTUVZŠĐŽČĆ'],
                    multiPre : [[], []],
                    multiPost : [['\u0459', '\u045a', '\u0409', '\u040a', '\u045f', '\u040f'], ['lj', 'nj', 'Lj', 'Nj', 'Dž', 'Dž']]
                },
                yu2ascii : {
                    charMap : ['абцдефгхијклмнопрстувзшђжчћАБЦДЕФГХИЈКЛМНОПРСТУВЗШЂЖЧЋabcdefghijklmnoprstuvzšđžčćABCDEFGHIJKLMNOPRSTUVZŠĐŽČĆ','abcdefghijklmnoprstuvzsđzccABCDEFGHIJKLMNOPRSTUVZSĐZCCabcdefghijklmnoprstuvzsđzccABCDEFGHIJKLMNOPRSTUVZSĐZCC'],
                    multiPre : [[], []],
                    multiPost : [['\u0459', '\u045a', '\u0409', '\u040a', '\u045f', '\u040f', 'đ', 'Đ'], ['lj', 'nj', 'Lj', 'Nj', 'Dž', 'Dž', 'dj', 'Dj']]
                }
            }
        };
    }
}
exports.AppTranslations = AppTranslations;