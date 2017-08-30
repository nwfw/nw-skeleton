/**
 * @fileOverview form-control component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.0
 */
const _ = require('lodash');

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * Form control component
 *
 * @name form-control
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
    name: 'form-control',
    template: '',
    props: ['control'],
    data: function () {
        return appState.appInfo;
    },
    mounted: function(){
        // console.log(this.$props.control);

        if (this.$props.control.value && this.$props.control.value.length){
            var defaultValue = {};

            if (_.isArray(this.$props.control.value)){
                defaultValue = _.cloneDeep(this.$props.control.value[0]);

            } else {
                defaultValue = _.cloneDeep(this.$props.control.value);
            }
            if (defaultValue){
                if (_.isObject(defaultValue)){
                    if (defaultValue.value){
                        if (_.isArray(defaultValue.value) && defaultValue.value.length){
                            defaultValue = defaultValue.value[0];
                        } else if (_.isObject(defaultValue.value)){
                            // console.log('object');
                            // console.log(defaultValue.value);
                            // var objKeys = _.keys(defaultValue.value);
                            // console.log(objKeys)
                        }
                    }
                }
                this.$el._defaultValue = defaultValue;
                this.$el.setAttribute('data-default-value', JSON.stringify(defaultValue));
            }
        }
    },
    components: []
};