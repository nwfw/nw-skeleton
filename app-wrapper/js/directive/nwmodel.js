const _ = require('lodash');

exports.directive = {
    bind: function (el, binding, vnode) {
        let utilHelper = window.getAppWrapper().getHelper('util');
        el.nwModelData = {
            binding: binding,
            vnode: vnode,
            eventName: 'input',
            identifier: el.getUniqueElementIdentifier(true),
            propName: '',
            unwatch: null
        };


        el.nwWatcher = function(newVal){
            this.setInputValue(newVal);
        }.bind(el);

        if (binding.modifiers.literal){
            el.setInputValue(utilHelper.getVar(binding.expression));
            el.unwatch = vnode.context.$root.$watch(binding.expression, el.nwWatcher);
        } else if (binding.modifiers.eval) {
            el.nwModelData.propName = vnode.context[binding.expression];
            el.setInputValue(utilHelper.getVar(el.nwModelData.propName));
            el.unwatch = vnode.context.$root.$watch(el.nwModelData.propName, el.nwWatcher);
        } else {
            el.setInputValue(utilHelper.getVar(binding.expression, vnode.context));
            el.unwatch = vnode.context.$watch(binding.expression, el.nwWatcher);
        }
        if (binding.modifiers.lazy || _.includes(['checkbox'], el.getAttribute('type')) || _.includes(['select'], el.tagName.toLowerCase())){
            el.nwModelData.eventName = 'change';
        }
        el.addEventListener(el.nwModelData.eventName, el.nwModelData.vnode.context.nwModelInput);
        el.addEventListener('nwupdatemodel', el.nwModelData.vnode.context.nwModelInput);
    },
    update: function(el, binding, vnode){
        let utilHelper = window.getAppWrapper().getHelper('util');
        if (binding.modifiers.literal){
            el.setInputValue(utilHelper.getVar(binding.expression));
        } else if (binding.modifiers.eval) {
            el.setInputValue(utilHelper.getVar(el.nwModelData.propName));
        } else {
            el.setInputValue(utilHelper.getVar(binding.expression, vnode.context));
        }
    },
    unbind: function (el) {
        el.removeEventListener(el.nwModelData.eventName, el.nwModelData.vnode.context.nwModelInput);
        el.removeEventListener('nwupdatemodel', el.nwModelData.vnode.context.nwModelInput);
        el.unwatch();
        el.nwModelData = null;
    }
};