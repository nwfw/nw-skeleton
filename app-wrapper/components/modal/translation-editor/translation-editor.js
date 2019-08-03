/**
 * @fileOverview translation-editor component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

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
            currentModal: appState.modalData.currentModal,
            originalData: _.cloneDeep(appState.modalData.currentModal.translationData),
            activeTabIndex: 0,
            translationInProgress: false,
            tabTranslationInProgress: false,
        };
    },
    mounted: function() {
        appState.modalData.currentModal.busy = false;
        appState.modalData.modalContentVisible = true;
        setTimeout(() => {
            this.$el.querySelector('.translation-editor-search-field').focus();
        }, 100);
    },
    computed: {
        appState: function(){
            return appState;
        },
        allTranslated: function(){
            var allTranslated = true;
            for (let languageKey in appState.modalData.currentModal.translationData[this.currentModal.currentModule]){
                if (appState.modalData.currentModal.translationData[this.currentModal.currentModule][languageKey].notTranslated){
                    if (_.keys(appState.modalData.currentModal.translationData[this.currentModal.currentModule][languageKey].notTranslated).length){
                        allTranslated = false;
                    }
                }
            }
            return allTranslated;
        },
        _: function() {
            return _;
        },
        dataChanged: function(){
            return JSON.stringify(this.originalData) != JSON.stringify(this.currentModal.translationData);
        }
    },
    methods: {
        resetData: function(){
            this.currentModal.translationData = _.cloneDeep(this.originalData);
        },
        clearSearch: function(e){
            if (e && e.preventDefault && _.isFunction(e.preventDefault)){
                e.preventDefault;
            }
            this.$el.querySelector('.translation-editor-search-field').value = '';
            this.performSearch();

        },
        performSearch: function(e){
            if (e && e.keyCode && e.keyCode == 27){
                this.$el.querySelector('.translation-editor-search-field').value = '';
            }
            var value = this.$el.querySelector('.translation-editor-search-field').value;
            if (value && value.length >= 2){
                this.$el.addClass('has-search');
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
                this.$el.removeClass('has-search');
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
            this.activeTabIndex = e.target.getAttribute('data-index');
        },
        copyLabel: function(e){
            let target = e.target;
            if (e && e.preventDefault && _.isFunction(e.preventDefault)){
                e.preventDefault;
            }
            let labelElement = target.parentNode;
            let formRow = labelElement.parentNode;
            let textarea = formRow.querySelector('textarea');
            let label = target.getAttribute('data-label');
            textarea.value = label;
            this.currentModal.translationData[this.currentModal.currentModule][textarea.getAttribute('data-code')].notTranslated[label] = label;
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
                this.currentModal.translationData[this.currentModal.currentModule][textarea.getAttribute('data-code')].notTranslated[label] = label;
            }

        },
        copyAllTab: function(e){
            let target = e.target;
            if (e && e.preventDefault && _.isFunction(e.preventDefault)){
                e.preventDefault;
            }
            let langCode = target.getAttribute('data-code');
            let tabItem = this.$el.querySelector('.tab-item[data-code=' + langCode + ']');
            let untranslatedRows = tabItem.querySelectorAll('.lang-form-row-not-translated');
            for (let i=0; i<untranslatedRows.length; i++){
                let formRow = untranslatedRows[i];
                let textarea = formRow.querySelector('textarea');
                let label = formRow.getAttribute('data-label');
                textarea.value = label;
                this.currentModal.translationData[this.currentModal.currentModule][langCode].notTranslated[label] = label;
            }

        },
        transliterateAllTab: async function(e){
            let target = e.target;
            if (e && e.preventDefault && _.isFunction(e.preventDefault)){
                e.preventDefault;
            }
            let langCode = target.getAttribute('data-code');
            let tabItem = this.$el.querySelector('.tab-item[data-code=' + langCode + ']');
            let translatedRows = tabItem.querySelectorAll('.lang-form-row-translated');
            let direction;
            if (langCode.match(/latn/i)){
                direction = 'c2l';
            }
            if (langCode.match(/cyrl/i)){
                direction = 'l2c';
            }
            if (!direction){
                return;
            }
            for (let i=0; i<translatedRows.length; i++){
                let formRow = translatedRows[i];
                let label = formRow.getAttribute('data-label');
                let textarea = formRow.querySelector('textarea');
                let originalValue = textarea.value;
                let value = _appWrapper.appTranslations.transliterateText(originalValue, direction);
                textarea.value = value;

                this.currentModal.translationData[this.currentModal.currentModule][langCode].translated[label] = value;
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
            if (!this.tabTranslationInProgress){
                let target = e.target;
                let locale = target.getAttribute('data-locale');

                let fieldset = this.$el.querySelector('.tab-item.active').querySelector('.translation-fieldset');

                let labels = Object.keys(appState.modalData.currentModal.translationData[this.currentModal.currentModule][target.getAttribute('data-code')].notTranslated);
                let total = labels.length;
                let count = 0;

                if (total){
                    target.addClass(['fa-spinner', 'fa-spin']);

                    _appWrapper.addModalMessage('Translation in progress...', 'info');
                    this.tabTranslationInProgress = true;

                    _appWrapper.getHelper('appOperation').operationStart(_appWrapper.translate('Translating'), false, true, true, _appWrapper.translate('Label'));
                    _appWrapper.getHelper('appOperation').operationUpdate(0, total);


                    let groups;
                    if (labels.length > 50){
                        groups = this.splitLabelGroup(labels);
                    } else {
                        groups = [labels];
                    }

                    let groupCount = groups.length;

                    // let result = [];

                    for (let i=0; i<groupCount;i++){
                        let group = groups[i];
                        // let groupSize = group.length;
                        let source = group.join('\n\n----\n\n');
                        let translated = await _appWrapper.appTranslations.googleTranslate(source, locale);
                        let destination = translated.split('\n\n----\n\n');

                        let translatedLabels = _.map(group, (gr, index) => {
                            return {
                                original: gr,
                                translated: destination[index],
                                index: count + index,
                            };
                        });

                        count += translatedLabels.length;

                        for (let j=0; j<translatedLabels.length;j++){

                            let label = translatedLabels[j].original;
                            let translated = translatedLabels[j].translated;
                            if (translated && translated != label){
                                let textarea = fieldset.querySelector('textarea[name="' + label.replace(/"/g, '\\"') + '"]');
                                if (textarea){
                                    if (translated){
                                        textarea.setInputValue(translated);
                                        this.currentModal.translationData[this.currentModal.currentModule][target.getAttribute('data-code')].notTranslated[label] = translated;
                                        count++;
                                    } else {
                                        _appWrapper.addModalMessage('Could not translate label "{1}"', 'warning', [label], false, false, false, true);
                                    }
                                } else {
                                    _appWrapper.addModalMessage('Could not find textarea for label "{1}"', 'warning', [label], false, false, false, true);
                                }
                            }
                        }
                        _appWrapper.getHelper('appOperation').operationUpdate(count, total);
                        await _appWrapper.wait(100);
                    }

                    target.removeClass(['fa-spinner', 'fa-spin']);
                    _appWrapper.setAppStatus(false, 'success');
                    _appWrapper.getHelper('appOperation').operationUpdate(total, total);
                    _appWrapper.getHelper('appOperation').operationFinish(_appWrapper.translate('Translation finished'));
                    _appWrapper.addModalMessage('Translated {1} of {2} labels', 'info', [count, total], false, false, false, true);
                    this.tabTranslationInProgress = false;
                }




                // target.addClass(['fa-spinner', 'fa-spin']);
                // let fieldset = this.$el.querySelector('.tab-item.active').querySelector('.translation-fieldset');
                // // let labels = Object.keys(appState.modalData.currentModal.translationData[this.currentModal.currentModule][target.getAttribute('data-code')].notTranslated);


                // if (total){
                //     _appWrapper.addModalMessage('Translation in progress...', 'info');
                //     this.tabTranslationInProgress = true;
                // }
                // _appWrapper.getHelper('appOperation').operationStart(_appWrapper.translate('Translating'), false, true, true, _appWrapper.translate('Label'));
                // _appWrapper.getHelper('appOperation').operationUpdate(0, total);



                // for (let i=0; i<total;i++){
                //     let textarea = fieldset.querySelector('textarea[name="' + labels[i].replace(/"/g, '\\"') + '"]');
                //     if (textarea){
                //         let translated = await _appWrapper.appTranslations.googleTranslate(labels[i], locale);
                //         _appWrapper.getHelper('appOperation').operationUpdate(i+1, total);
                //         await _appWrapper.wait(100);
                //         if (translated){
                //             textarea.setInputValue(translated);
                //             this.currentModal.translationData[this.currentModal.currentModule][target.getAttribute('data-code')].notTranslated[labels[i]] = translated;
                //             count++;
                //         } else {
                //             _appWrapper.addModalMessage('Could not translate label "{1}"', 'warning', [labels[i]], false, false, false, true);
                //         }
                //     } else {
                //         _appWrapper.addModalMessage('Could not find textarea for label "{1}"', 'warning', [labels[i]], false, false, false, true);
                //     }
                // }
                // target.removeClass(['fa-spinner', 'fa-spin']);
                // _appWrapper.setAppStatus(false, 'success');
                // _appWrapper.getHelper('appOperation').operationUpdate(total, total);
                // _appWrapper.getHelper('appOperation').operationFinish(_appWrapper.translate('Translation finished'));
                // _appWrapper.addModalMessage('Translated {1} of {2} labels', 'info', [count, total], false, false, false, true);
                // this.tabTranslationInProgress = false;
            }
        },

        splitLabelGroup (labels, chunkSize = 50) {
            const chunks = [];
            let source = _.cloneDeep(labels);
            while(source.length) {
                // const chunkSize = Math.ceil(source.length / groupCount--);
                const chunk = source.slice(0, chunkSize);
                chunks.push(chunk);
                source = source.slice(chunkSize);
            }
            return chunks;
        },

        googleTranslateBulk: async function(labels = [], from = '') {
            let count = 0;
            // let labelIndex = 0;
            let groups;
            if (labels.length > 50){
                groups = this.splitLabelGroup(labels);
            } else {
                groups = [labels];
            }

            let groupCount = groups.length;

            let result = [];

            for (let i=0; i<groupCount;i++){
                let group = groups[i];
                let groupSize = group.length;
                let source = group.join('\n\n----\n\n');
                let translated = await _appWrapper.appTranslations.googleTranslate(source, from);
                let destination = translated.split('\n\n----\n\n');

                let translatedLabels = _.map(group, (gr, index) => {
                    return {
                        original: gr,
                        translated: destination[index],
                        index: count + index,
                    };
                });

                result = result.concat(translatedLabels);
                count += groupSize;
                console.warn(result);
                // if (textarea){
                //     _appWrapper.getHelper('appOperation').operationUpdate(i+1, total);
                //     await _appWrapper.wait(100);
                //     if (translated){
                //         textarea.setInputValue(translated);
                //         this.currentModal.translationData[this.currentModal.currentModule][target.getAttribute('data-code')].notTranslated[labels[i]] = translated;
                //         count++;
                //     } else {
                //         _appWrapper.addModalMessage('Could not translate label "{1}"', 'warning', [labels[i]], false, false, false, true);
                //     }
                // } else {
                //     _appWrapper.addModalMessage('Could not find textarea for label "{1}"', 'warning', [labels[i]], false, false, false, true);
                // }
            }
        },

        googleTranslate: async function(e) {
            let target = e.target;
            let locale = target.getAttribute('data-locale');
            let label = target.getAttribute('data-label');
            let textarea;

            try {
                textarea = target.getParentByClass('lang-form-row').querySelector('textarea');
            } catch (ex) {
                _appWrapper.addModalMessage('Problem translating label "{1}" - "{2}"', 'error', [label, ex.stack], false, false, false, true);
            }
            _appWrapper.addModalMessage('Translation in progress...', 'info');
            target.addClass('fa-spinner');
            target.addClass('fa-spinn');
            let translated = await _appWrapper.appTranslations.googleTranslate(label, locale);
            if (translated){
                textarea.setInputValue(translated);
                this.currentModal.translationData[this.currentModal.currentModule][target.getAttribute('data-code')].notTranslated[label] = translated;
                _appWrapper.addModalMessage('Translation complete.', 'info');
            } else {
                _appWrapper.addModalMessage('Could not translate label "{1}"', 'warning', [label], false, false, false, true);
            }
            target.removeClass('fa-spinner');
            target.removeClass('fa-spinn');
        },

        textareaInput: function(e){
            let label = e.target.getAttribute('name');
            let code = e.target.getAttribute('data-code');
            let isTranslated = e.target.getAttribute('data-translated') == '1';
            let value = e.target.value;
            if (isTranslated){
                this.currentModal.translationData[this.currentModal.currentModule][code].translated[label] = value;
            } else {
                this.currentModal.translationData[this.currentModal.currentModule][code].notTranslated[label] = value;
            }
        }
    }
};