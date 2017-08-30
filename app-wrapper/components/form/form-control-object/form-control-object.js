/**
 * @fileOverview form-control-object component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.0
 */
const _ = require('lodash');

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * Form control object component
 *
 * @name form-control-object
 * @memberOf components
 * @property {string}   name        Name of the component
 * @property {string}   template    Component template contents
 * @property {string[]} props       Component properties
 * @property {Function} data        Data function
 * @property {Object}   methods     Component methods
 * @property {Object}   watch       Component watchers
 * @property {Object}   computed    Computed properties
 * @property {Object}   components  Child components
 */
exports.component = {
    name: 'form-control-object',
    template: '',
    props: ['control'],
    data: function () {
        return appState.appInfo;
    },
    methods: {
        addNewObjectRow: function(e){
            console.log(this.$props.control);
            e.preventDefault();
            let utilHelper = _appWrapper.getHelper('util');
            let value = '';
            let newType = prompt('Property type:\n    -form-control-text (default),\n    -form-control-array,\n    -form-control-checkbox,\n    -form-control-object');
            if (newType){
                if (newType == 'form-control-checkbox'){
                    value = false;
                }
                if (newType == 'form-control-array'){
                    value = [];
                }
                if (newType == 'form-control-object'){
                    value = {};
                }
            }


            let newName = prompt('Property name', 'newProperty');
            if (newName){
                let found = _.find(this.$props.control.value, {name: newName});
                if (!found){
                    let newValue = utilHelper.getControlObject (value, newName, this.$props.control.path);
                    this.$props.control.value.push(newValue);
                } else {
                    _appWrapper.addNotification('Property with name "{1}" already exists', 'error', [newName], false);
                }
            }
        },
        removeObjectRow: function(e){
            var target = e.target;
            var subRow = target.parentNode;
            var parentRow = subRow.parentNode;
            var currentIndex;
            _.each(parentRow.childNodes, function(node, i){
                if (node == subRow){
                    currentIndex = i;
                }
            });
            if (currentIndex || currentIndex === 0){
                var newValue = [];
                var values = _.cloneDeep(this.$props.control.value);
                _.each(values, function(value, index){
                    if (index != currentIndex){
                        newValue.push(value);
                    }
                });
                this.$props.control.value = newValue;
            }
        }
    }
};