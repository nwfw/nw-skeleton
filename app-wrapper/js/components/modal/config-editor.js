var _ = require('lodash');
var appUtil = window.getAppWrapper().getAppUtil();
var appState = appUtil.getAppState();

exports.component = {
    name: 'config-editor',
    template: window.getAppWrapper().templateContents.componentTemplates['config-editor'],
    data: function () {
        var getControlObject = function(configValue, configName, path, isInner){
            if (!path){
                path = configName;
            } else {
                path += '.' + configName;
            }
            if (!isInner){
                isInner = false;
            }
            var objValue;
            var configVar = {
                path: path,
                name: configName,
                value: _.cloneDeep(configValue),
                controlData: null
            };
            var innerPath = path.replace(/^config\./, '');
            if (appState.config.configData.vars[innerPath] && appState.config.configData.vars[innerPath]['control']){
                configVar.formControl = 'form-control-' + appState.config.configData.vars[innerPath]['control'];
                configVar.type = appState.config.configData.vars[innerPath]['type'];
                if (appState.config.configData.vars[innerPath]['controlData']){
                    configVar.controlData = appState.config.configData.vars[innerPath]['controlData'];
                }
            } else {
                if (_.isBoolean(configValue)){
                    configVar.formControl = 'form-control-checkbox';
                    configVar.type = 'boolean';
                } else if (_.isString(configValue)){
                    configVar.formControl = 'form-control-text';
                    configVar.type = 'string';
                } else if (_.isArray(configValue)){
                    configVar.formControl = 'form-control-array';
                    configVar.type = 'array';
                    objValue = [];
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
                    objValue = [];
                    var keys = _.keys(configValue);
                    for(var i=0; i<keys.length;i++){
                        var name = keys[i];
                        var value;
                        try {
                            value = configValue[keys[i]];
                        } catch (ex){
                            value = configValue[keys[i]];
                        }
                        var newObjValue = getControlObject(value, name, path, true);
                        objValue.push(newObjValue);
                    }
                    configVar.value = _.cloneDeep(objValue);
                } else {
                    configVar.formControl = 'form-control-text';
                    configVar.type = 'unknown';
                }
            }
            return configVar;
        };

        var appConfig = _.cloneDeep(appState.configEditorData);
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
        },
        configEditorData: function(){
            return appState.configEditorData;
        }
    },
    components: []
};