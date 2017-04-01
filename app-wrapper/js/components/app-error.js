var _ = require('lodash');

var _appWrapper = window.getAppWrapper();
var appUtil = _appWrapper.getAppUtil();
var appState = appUtil.getAppState();

exports.component = {
	name: 'app-error',
	template: _appWrapper.templateContents.componentTemplates['app-error'],
	data: function () {
		return appState.appInfo;
	},
	computed: {
		appState: function(){
			return appState;
		}
	}
}