var _ = require('lodash');

var _appWrapper = window.getAppWrapper();
var appUtil = _appWrapper.getAppUtil();
var appState = appUtil.getAppState();

exports.component = {
	name: 'form-control-object',
	template: _appWrapper.templateContents.componentTemplates['form-control-object'],
	props: ['control'],
	data: function () {
		return appState.appInfo
	},
	components: []
};