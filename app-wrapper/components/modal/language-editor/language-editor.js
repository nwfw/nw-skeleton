/**
 * @fileOverview language-editor component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.0
 */

const _ = require('lodash');
var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * Language editor component
 *
 * @name language-editor
 * @memberOf components
 * @property {string}   name        Name of the component
 * @property {string}   template    Component template contents
 * @property {string[]} props       Component properties
 * @property {Function} data        Data function
 * @property {Object}   methods     Component methods
 * @property {Object}   watch       Component watchers
 * @property {Object}   computed    Computed properties
 * @property {Object}   components  Child components
 */
exports.component = {
    name: 'language-editor',
    template: '',
    data: function () {
        let utilHelper = _appWrapper.getHelper('util');
        let languageVars = [];
        for (let i=0; i<appState.languageData.availableLanguages.length; i++) {
            let lang = appState.languageData.availableLanguages[i];
            let languageVar = {
                name: utilHelper.getControlObject(lang.name, 'name', 'languageData.availableLanguages.' + i, {required: true}),
                locale: utilHelper.getControlObject(lang.locale, 'locale', 'languageData.availableLanguages.' + i, {required: true}),
                code: utilHelper.getControlObject(lang.code, 'code', 'languageData.availableLanguages.' + i, {required: true, readonly: true}),
                new: false,
            };
            languageVars.push(languageVar);
        }


        appState.modalData.currentModal.modalData.languages = appState.languageData.availableLanguages;
        appState.modalData.currentModal.modalData.languageVars = languageVars;

        if (!appState.modalData.currentModal.modalData.activeTabIndex){
            appState.modalData.currentModal.modalData.activeTabIndex = 0;
        }

        return appState.modalData.currentModal.modalData;
    },
    computed: {
        appState: function(){
            return appState;
        }
    },
    methods: {
        setTab: function(e){
            if (e && e.preventDefault && _.isFunction(e.preventDefault)){
                e.preventDefault;
            }
            this.activeTabIndex = e.target.getAttribute('data-index');
        },
        addLanguage: function(){
            let utilHelper = _appWrapper.getHelper('util');
            let newIndex = this.languages.length;
            this.languages.push({
                code: '',
                locale: '',
                name: 'New'
            });
            let languageVar = {
                name: utilHelper.getControlObject('', 'name', 'languageData.availableLanguages.' + newIndex, {required: true, rowErrorText: 'Name is required.'}),
                locale: utilHelper.getControlObject('', 'locale', 'languageData.availableLanguages.' + newIndex, {required: true, rowErrorText: 'Locale is required.'}),
                code: utilHelper.getControlObject('', 'code', 'languageData.availableLanguages.' + newIndex, {required: true, rowErrorText: 'Code is required.'}),
                new: true,
            };
            this.languageVars.push(languageVar);
            this.activeTabIndex = newIndex;
        },
        removeLanguage: async function(e){
            let code = e.target.getAttribute('data-code');
            this.activeTabIndex = 0;
            await _appWrapper.appTranslations.removeLanguage(code);

        },
        cloneLanguage: async function(e){
            let index = e.target.getAttribute('data-index');
            let utilHelper = _appWrapper.getHelper('util');
            let originalLanguage = this.languages[index];
            let newIndex = this.languages.length;
            this.languages.push({
                code: originalLanguage.code + ' clone',
                locale: originalLanguage.locale + ' clone',
                name: originalLanguage.name + ' clone'
            });
            let languageVar = {
                name: utilHelper.getControlObject('', 'name', 'languageData.availableLanguages.' + newIndex, {required: true, rowErrorText: 'Name is required.'}),
                locale: utilHelper.getControlObject('', 'locale', 'languageData.availableLanguages.' + newIndex, {required: true, rowErrorText: 'Locale is required.'}),
                code: utilHelper.getControlObject('', 'code', 'languageData.availableLanguages.' + newIndex, {required: true, rowErrorText: 'Code is required.'}),
                new: true,
            };
            this.languageVars.push(languageVar);
            this.activeTabIndex = newIndex;
        }

    }
};