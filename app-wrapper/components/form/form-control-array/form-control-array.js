/**
 * @fileOverview form-control-array component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.1.0
 */
const _ = require('lodash');

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * Form control array component
 *
 * @name form-control-array
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
    name: 'form-control-array',
    template: '',
    props: ['control'],
    data: function () {
        return appState.appInfo;
    },
    methods: {
        addNewArrayRow: function(e){
            e.preventDefault();

            var rowElement = e.target;
            while(!rowElement.hasAttribute('data-default-value')){
                rowElement = rowElement.parentNode;
            }

            var subRowElement = rowElement.querySelector('ul > li > .form-control-row');
            var defaultValueString;
            var defaultValue;
            if (subRowElement){
                defaultValueString = subRowElement.getAttribute('data-default-value');
                try {
                    defaultValue = JSON.parse(defaultValueString);
                    defaultValue.name = '';
                    defaultValue.value = '';
                } catch (ex) {
                    defaultValue = defaultValueString;
                }
            }
            var newName = this.$props.control.value.length;
            var newValue;
            if (newName){
                newValue = _.cloneDeep(this.$props.control.value[0]);
                newValue.name = newName;
            } else {
                if (defaultValue){
                    newValue = defaultValue;
                } else {
                    newValue = {
                        name: 0,
                        value: '',
                        formControl: 'form-control-text',
                        type: 'string'
                    };
                }
            }
            if (_.isArray(newValue.value)){
                _.each(newValue.value, function(val){
                    val.value = '';
                });
            } else {
                newValue.value = '';
            }
            this.$props.control.value.push(newValue);
        },
        removeArrayRow: function(e){
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
    },
    components: []
};