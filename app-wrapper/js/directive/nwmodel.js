/**
 * @fileOverview nw-model filter file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

/**
 * NW-model directive
 *
 * @name nw-model
 * @memberOf directives
 */
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
            el.nwModelData.propName = _.get(vnode.context, binding.expression);
            el.setInputValue(utilHelper.getVar(el.nwModelData.propName));
            el.unwatch = vnode.context.$root.$watch(() => { return _.get(el.nwModelData.propName); }, el.nwWatcher);
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
        let updatedValue;
        if (binding.modifiers.literal){
            updatedValue = utilHelper.getVar(binding.expression);
        } else if (binding.modifiers.eval) {
            updatedValue = utilHelper.getVar(el.nwModelData.propName);
        } else {
            updatedValue = utilHelper.getVar(binding.expression, vnode.context);
        }
        el.setInputValue(updatedValue);
    },
    unbind: function (el) {
        el.removeEventListener(el.nwModelData.eventName, el.nwModelData.vnode.context.nwModelInput);
        el.removeEventListener('nwupdatemodel', el.nwModelData.vnode.context.nwModelInput);
        el.unwatch();
        el.nwModelData = null;
    }
};