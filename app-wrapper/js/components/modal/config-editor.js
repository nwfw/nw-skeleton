var _ = require('lodash');
var appUtil = window.getAppWrapper().getAppUtil()
var appState = appUtil.getAppState();

exports.component = {
	name: 'config-editor',
	template: window.getAppWrapper().templateContents.componentTemplates['config-editor'],
	data: function () {
		var getControlObject = function(configValue, configName, path){
			if (!path){
				path = configName;
			} else {
				path += '.' + configName;
			}
			var configVar = {
				path: path,
				name: configName,
				value: _.cloneDeep(configValue)
			};
			if (_.isBoolean(configValue)){
				configVar.formControl = 'form-control-checkbox';
				configVar.type = 'boolean';
			} else if (_.isString(configValue)){
				configVar.formControl = 'form-control-text';
				configVar.type = 'string';
			} else if (_.isArray(configValue)){
				configVar.formControl = 'form-control-array';
				configVar.type = 'array';
				var objValue = [];
				var values = _.cloneDeep(configValue);
				_.each(values, function(value, name){
					objValue.push(getControlObject(value, name, path));
				});
				configVar.value = _.cloneDeep(objValue);
			} else if (_.isObject(configValue) && configValue instanceof RegExp){
				configVar.formControl = 'form-control-text';
				configVar.type = 'string';
			} else if (_.isObject(configValue)){
				configVar.formControl = 'form-control-object';
				configVar.type = 'object';
				var objValue = [];
				var values = _.cloneDeep(configValue);
				_.each(values, function(value, name){
					objValue.push(getControlObject(value, name, path));
				});
				configVar.value = _.cloneDeep(objValue);
			} else {
				configVar.formControl = 'form-control-text';
				configVar.type = 'unknown';
			}
			return configVar;
		};

		var appConfig = _.cloneDeep(appState.config);
		var config = _.map(appConfig, function(value, name){
			return getControlObject(value, name, 'config');
		});

		var data = {
			config: config
		};

		return data;
	},
	computed: {
		appState: function(){
			return appState;
		}
	},
	components: []
}