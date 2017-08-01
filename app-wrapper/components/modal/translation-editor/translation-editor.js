/**
 * @fileOverview translation-editor component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.2.1
 */

const _ = require('lodash');
var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * Translation editor component
 *
 * @name translation-editor
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
    name: 'translation-editor',
    template: '',
    data: function () {
        return {
            currentModal: appState.modalData.currentModal
        };
    },
    computed: {
        appState: function(){
            return appState;
        },
        allTranslated: function(){
            var allTranslated = true;
            for (let languageKey in appState.modalData.currentModal.translationData){
                if (appState.modalData.currentModal.translationData[languageKey].notTranslated){
                    if (_.keys(appState.modalData.currentModal.translationData[languageKey].notTranslated).length){
                        allTranslated = false;
                    }
                }
            }
            return allTranslated;
        },
        _: function() {
            return _;
        }
    },
    methods: {
        clearSearch: function(e){
            if (e && e.preventDefault && _.isFunction(e.preventDefault)){
                e.preventDefault;
            }
            this.$el.querySelector('.translation-editor-search-field').value = '';
            this.$el.querySelector('.tab-item.active').unsetFixedSize();
            this.performSearch();

        },
        performSearch: function(e){
            if (e && e.keyCode && e.keyCode == 27){
                this.$el.querySelector('.translation-editor-search-field').value = '';
            }
            var value = this.$el.querySelector('.translation-editor-search-field').value;
            if (value && value.length >= 2){
                this.$el.querySelector('.tab-item.active').setFixedSize();
                var valueRegex = new RegExp(value, 'i');
                let rows = this.$el.querySelectorAll('.lang-form-row');
                for(let i=0; i<rows.length; i++){
                    var label = rows[i].getAttribute('data-label');
                    var translation = rows[i].getAttribute('data-translation');
                    if ((label && label.match(valueRegex)) || (translation && translation.match(valueRegex))){
                        rows[i].removeClass('lang-form-row-hidden');
                    } else {
                        rows[i].addClass('lang-form-row-hidden');
                    }
                }
                appState.modalData.currentModal.searchResults = this.$el.querySelectorAll('.lang-form-row:not(.lang-form-row-hidden)').length;
            } else {
                this.$el.querySelector('.tab-item.active').unsetFixedSize();
                let rows = this.$el.querySelectorAll('.lang-form-row-hidden');
                for (let i=0; i<rows.length; i++){
                    rows[i].removeClass('lang-form-row-hidden');
                }
            }
            if (value && value.length){
                appState.modalData.currentModal.hasSearch = true;
            } else {
                appState.modalData.currentModal.hasSearch = false;
                appState.modalData.currentModal.searchResults = null;
            }
            this.$forceUpdate();
        },
        setTab: function(e){
            if (e && e.preventDefault && _.isFunction(e.preventDefault)){
                e.preventDefault;
            }

            var target = e.target;

            var tabLinks = this.$el.querySelectorAll('.tab-link');
            var tabItems = this.$el.querySelectorAll('.tab-item');

            var index = target.getAttribute('data-index');
            for(var i=0; i<tabLinks.length; i++){
                tabLinks[i].className = tabLinks[i].className.replace(/\s?active/, '');
                tabItems[i].className = tabItems[i].className.replace(/\s?active/, '');
            }
            tabLinks[index].className += ' active';
            tabItems[index].className += ' active';
        },
        copyLabel: function(e){
            var target = e.target;
            if (e && e.preventDefault && _.isFunction(e.preventDefault)){
                e.preventDefault;
            }
            var labelElement = target.parentNode;
            var formRow = labelElement.parentNode;
            var textarea = formRow.querySelector('textarea');
            var label = target.getAttribute('data-label');
            textarea.value = label;
        },
        copyAll: function(e){
            if (e && e.preventDefault && _.isFunction(e.preventDefault)){
                e.preventDefault;
            }
            var untranslatedRows = this.$el.querySelectorAll('.lang-form-row-not-translated');
            for (let i=0; i<untranslatedRows.length; i++){
                let formRow = untranslatedRows[i];
                var textarea = formRow.querySelector('textarea');
                var label = formRow.getAttribute('data-label');
                textarea.value = label;
            }

        },
        copyAllTab: function(e){
            var target = e.target;
            if (e && e.preventDefault && _.isFunction(e.preventDefault)){
                e.preventDefault;
            }
            var langCode = target.getAttribute('data-code');
            var tabItem = this.$el.querySelector('.tab-item[data-code=' + langCode + ']');
            var untranslatedRows = tabItem.querySelectorAll('.lang-form-row-not-translated');
            for (let i=0; i<untranslatedRows.length; i++){
                let formRow = untranslatedRows[i];
                var textarea = formRow.querySelector('textarea');
                var label = formRow.getAttribute('data-label');
                textarea.value = label;
            }

        },
        deleteLabel: async function(e){
            if (e && e.preventDefault && _.isFunction(e.preventDefault)){
                e.preventDefault;
            }

            var target = e.target;
            if (target.tagName == 'A'){
                target = target.parentNode;
            }

            var formRow = target.parentNode;

            var label = formRow.getAttribute('data-label');
            var allRows = this.$el.querySelectorAll('.lang-form-row');

            for (let i=0; i< allRows.length; i++){
                if (allRows[i].getAttribute('data-label') == label){
                    allRows[i].parentNode.removeChild(allRows[i]);
                }
            }
        },
        trimTranslations: async function () {
            let labelDiffs = await _appWrapper.appTranslations.getExcessLabels();
            let count = 0;
            for (let index in labelDiffs){
                let selector = 'textarea[name="' + labelDiffs[index].replace(/"/g, '\\"') + '"]';
                let tas = this.$el.querySelectorAll(selector);

                if (tas && tas.length){
                    count++;
                    for (let j=0; j<tas.length;j++){
                        let parentDiv = tas[j].parentNode;
                        let clickEvent = new CustomEvent('click', {});
                        parentDiv.querySelector('.remove-translation').dispatchEvent(clickEvent);
                    }
                }
            }
            if (count){
                await _appWrapper.appTranslations.addUserMessage('Trimmed {1} excess translations.', 'info', [count], false, false, true);
            } else {
                await _appWrapper.appTranslations.addUserMessage('No excess translations found.', 'info', [], false, false, true);
            }
            appState.modalData.currentModal.messages = [_.cloneDeep(appState.allUserMessages[appState.allUserMessages.length-1])];
        },
        googleTranslateTab: async function(e) {
            let target = e.target;
            let fieldset = target.getParentByClass('translation-fieldset');
            let code = target.getAttribute('data-code').replace(/_.*$/, '');
            let labels = Object.keys(appState.modalData.currentModal.translationData[target.getAttribute('data-code')].notTranslated);
            let total = labels.length;
            let count = 0;
            if (total){
                _appWrapper.addModalMessage('Translation in progress...', 'info');
            }
            for (let i=0; i<total;i++){
                let textarea = fieldset.querySelector('textarea[name="' + labels[i].replace(/"/g, '\\"') + '"]');
                if (textarea){
                    let translated = await _appWrapper.appTranslations.googleTranslate(labels[i], code);
                    if (translated){
                        translated = _appWrapper.appTranslations.transliterateText(translated, 'c2l');
                        textarea.setInputValue(translated);
                        count++;
                    } else {
                        _appWrapper.addModalMessage('Could not translate label "{1}"', 'warning', [labels[i]], false, false, false, true);
                    }
                } else {
                    _appWrapper.addModalMessage('Could not find textarea for label "{1}"', 'warning', [labels[i]], false, false, false, true);
                }
            }
            _appWrapper.addModalMessage('Translated {1} of {2} labels', 'info', [count, total], false, false, false, true);
        },
        googleTranslate: async function(e) {
            let target = e.target;
            let code = target.getAttribute('data-code').replace(/_.*$/, '');
            let label = target.getAttribute('data-label');
            let textarea;

            try {
                textarea = target.getParentByClass('lang-form-row').querySelector('textarea');
            } catch (ex) {
                _appWrapper.addModalMessage('Problem translating label "{1}" - "{2}"', 'error', [label, ex.stack], false, false, false, true);
            }
            _appWrapper.addModalMessage('Translation in progress...', 'info');
            let translated = await _appWrapper.appTranslations.googleTranslate(label, code);
            if (translated){
                translated = _appWrapper.appTranslations.transliterateText(translated, 'c2l');
                textarea.setInputValue(translated);
                _appWrapper.addModalMessage('Translation complete.', 'info');
            } else {
                _appWrapper.addModalMessage('Could not translate label "{1}"', 'warning', [label], false, false, false, true);
            }
        }
    },
    mounted: function() {
        var appState = _appWrapper.getAppState();
        appState.modalData.currentModal.busy = false;
        appState.modalData.modalContentVisible = true;
        var tabLinks = this.$el.querySelectorAll('.tab-link');
        var tabItems = this.$el.querySelectorAll('.tab-item');
        var activeTabIndex = 0;

        tabLinks[activeTabIndex].className += ' active';
        tabItems[activeTabIndex].className += ' active';

        setTimeout(() => {
            this.$el.querySelector('.translation-editor-search-field').focus();
        }, 100);
    }
};