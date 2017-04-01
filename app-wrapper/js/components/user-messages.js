var _ = require('lodash');

var _appWrapper = window.getAppWrapper();
var appUtil = _appWrapper.getAppUtil();
var appState = appUtil.getAppState();

exports.component = {
	name: 'user-messages',
	template: _appWrapper.templateContents.componentTemplates['user-messages'],
	methods: {
		callViewHandler: _appWrapper.callViewHandler.bind(_appWrapper)
	},
	data: function () {
		return appState.userMessagesData;
	},
	components: {},
	computed: {
		appState: function(){
			return appState;
		}
	}
}