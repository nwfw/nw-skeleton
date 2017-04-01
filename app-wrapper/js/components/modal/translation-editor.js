var _ = require('lodash');
var appUtil = window.getAppWrapper().getAppUtil()
var appState = appUtil.getAppState();

exports.component = {
	name: 'translation-editor',
	template: window.getAppWrapper().templateContents.componentTemplates['translation-editor'],
	data: function () {
		return appState.modalData;
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
	}
}