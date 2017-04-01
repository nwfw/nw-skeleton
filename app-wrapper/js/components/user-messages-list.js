var _ = require('lodash');

var _appWrapper = window.getAppWrapper();
var appUtil = _appWrapper.getAppUtil();
var appState = appUtil.getAppState();

exports.component = {
	name: 'user-messages-list',
	template: _appWrapper.templateContents.componentTemplates['user-messages-list'],
	methods: {
		callViewHandler: _appWrapper.callViewHandler.bind(_appWrapper)
	},
	data: function () {
		return appState.userMessagesData;
	},
	computed: {
		appState: function(){
			return appState;
		}
	}
}