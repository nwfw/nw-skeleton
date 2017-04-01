var _ = require('lodash');

var _appWrapper = window.getAppWrapper();
var appUtil = _appWrapper.getAppUtil();
var appState = appUtil.getAppState();

exports.component = {
	name: 'app-debug',
	template: window.getAppWrapper().templateContents.componentTemplates['app-debug'],
	data: function () {
		return appState.debugData;
	},
	computed: {
		appState: function(){
			return appState;
		}
	},
	methods: {
		callViewHandler: _appWrapper.callViewHandler.bind(_appWrapper)
	},
	watch: {
        debugMessages: function(messages){
        	var el = this.$el;
        	_appWrapper.debugHelper.processDebugMessages.call(_appWrapper.debugHelper, el);
        }
    }
};