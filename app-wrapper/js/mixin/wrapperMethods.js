var _ = require('lodash');

var _appWrapper = window.getAppWrapper();

var MixinWrapperMethods  = {
    methods: {
        callViewHandler: _appWrapper.callViewHandler.bind(_appWrapper),
        log: function(value){
            console.log(value);
        },
        toJson: function(value, minified){
            return _appWrapper.getHelper('util').toJson(value, minified);
        },
        def: function(){
            var value;
            if (arguments && arguments.length){
                value = arguments[0];
            }
            var defaultTexts = Array.prototype.slice.call(arguments, 1, arguments.length);
            if (_.isUndefined(value)){
                for(let i=0; i<defaultTexts.length;i++){
                    value = defaultTexts[i];
                    if (!_.isUndefined(value)){
                        break;
                    }
                }
            }
            if (_.isUndefined(value)){
                value = '';
            }
            return value;
        },
        // this one returns default for all falsy values
        defAll: function(){
            var value;
            if (arguments && arguments.length){
                value = arguments[0];
            }
            var defaultTexts = Array.prototype.slice.call(arguments, 1, arguments.length);
            if (!(!_.isUndefined(value) && value)){
                for(let i=0; i<defaultTexts.length;i++){
                    value = defaultTexts[i];
                    if (!_.isUndefined(value)){
                        break;
                    }
                }
            }
            if (_.isUndefined(value)){
                value = '';
            }
            return value;
        },
        onUpdateModel: function(e) {
            console.log('nwModel onUpdateModel', e.target);
            if (e && e.target && e.target.triggerCustomEvent && _.isFunction(e.target.triggerCustomEvent)) {
                e.target.triggerCustomEvent('input');
                e.target.triggerCustomEvent('change');
            }
        },
        nwModelInput: function (e){

            let utilHelper = _appWrapper.getHelper('util');
            let binding = e.target.nwModelData.binding;
            let context = e.target.nwModelData.vnode.context;
            let value = e.target.getInputValue();
            if (binding.modifiers.number){
                value = +value;
            }
            if (binding.modifiers.trim){
                value = _.trim(value);
            }
            if (binding.modifiers.literal){
                utilHelper.setVar(binding.expression, value);
            } else if (binding.modifiers.eval){
                utilHelper.setVar(e.target.nwModelData.propName, value);
            } else {
                context[binding.expression] = value;
            }

        },
    }
};
exports.mixin = MixinWrapperMethods;