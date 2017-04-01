var _ = require('lodash');

var _appWrapper = window.getAppWrapper();
var appUtil = _appWrapper.getAppUtil();
var appState = appUtil.getAppState();

exports.component = {
	name: 'form-control-text',
	template: _appWrapper.templateContents.componentTemplates['form-control-text'],
	props: ['control'],
	data: function () {
		return appState.appInfo
	},
	components: []
};