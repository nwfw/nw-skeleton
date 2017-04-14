var _ = require('lodash');
var _appWrapper = window.getAppWrapper();
var appUtil = _appWrapper.getAppUtil()
var appState = appUtil.getAppState();

exports.component = {
	name: 'translation-editor',
	template: _appWrapper.appTemplates.getTemplateContents('translation-editor'),
	data: function () {
		return appState.modalData;
	},
	computed: {
		appState: function(){
			return appState;
		},
		allTranslated: function(){
			var allTranslated = true;
			for (languageKey in this.currentModal.translationData){
				if (this.currentModal.translationData[languageKey].notTranslated){
					if (_.keys(this.currentModal.translationData[languageKey].notTranslated).length){
						allTranslated = false;
					}
				}
			}
			return allTranslated;
		}
	},
	methods: {
		clearSearch: function(e){
			if (e && e.preventDefault && _.isFunction(e.preventDefault)){
				e.preventDefault;
			}
			this.$el.querySelector('.translation-editor-search-field').value = '';
			this.performSearch();

		},
		performSearch: function(e){
			var value = this.$el.querySelector('.translation-editor-search-field').value;
			if (value && value.length >= 2){
				this.currentModal.hasSearch = true;
				var valueRegex = new RegExp(value, 'i');
				var rows = this.$el.querySelectorAll('.lang-form-row');
				for(let i=0; i<rows.length; i++){
					var label = rows[i].getAttribute('data-label');
					var translation = rows[i].getAttribute('data-translation');
					if ((label && label.match(valueRegex)) || (translation && translation.match(valueRegex))){
						_appWrapper.htmlHelper.removeClass(rows[i], 'lang-form-row-hidden');
					} else {
						_appWrapper.htmlHelper.addClass(rows[i], 'lang-form-row-hidden');
					}
				}
			} else {
				this.currentModal.hasSearch = false;
				var rows = this.$el.querySelectorAll('.lang-form-row-hidden');
				for (let i=0; i<rows.length; i++){
					_appWrapper.htmlHelper.removeClass(rows[i], 'lang-form-row-hidden');
				}
			}
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
			var target = e.target;
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
			console.log(untranslatedRows)
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

			console.log(target);
			console.log(formRow);

			var label = formRow.getAttribute('data-label');
			var allRows = this.$el.querySelectorAll('.lang-form-row');

			for (let i=0; i< allRows.length; i++){
				if (allRows[i].getAttribute('data-label') == label){
					allRows[i].parentNode.removeChild(allRows[i]);
				}
			}
		}
	},
	mounted: function() {
		var appState = appUtil.getAppState();
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
}