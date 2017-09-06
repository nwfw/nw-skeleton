/**
 * @fileOverview checkbox-styled component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

var _appWrapper = window.getAppWrapper();
// var appState = _appWrapper.getAppState();

const _ = require('lodash');
var utilHelper = _appWrapper.getHelper('util');

/**
 * Styled checkbox controls component
 *
 * @name checkbox-styled
 * @memberOf components
 * @property {string}   name        Name of the component
 * @property {string}   template    Component template contents
 * @property {string[]} props       Component properties
 * @property {Function} watchOn     Method for property watching
 * @property {Function} data        Data function
 * @property {Object}   methods     Component methods
 * @property {Object}   watch       Component watchers
 * @property {Object}   computed    Computed properties
 * @property {Object}   components  Child components
 */
exports.component = {
    name: 'checkbox-styled',
    template: '',
    props: ['change', 'name', 'data', 'modelProperty'],
    watchOn: false,
    data: function () {
        return {

        };
    },
    created: function() {
        // this.cbModel = utilHelper.getVar(this.modelProperty);
    },
    mounted: function(){
        if (!this.watchOn && window && window.feApp && window.feApp.$watch){
            this.watchOn = window.feApp.$watch(this.modelProperty, this.modelPropertyChanged.bind(this));
        }
    },
    beforeUnmount: function(){
        if (this.watchOn){
            this.watchOn();
            this.watchOn = false;
        }
    },
    beforeDestroy: function(){
        if (this.watchOn){
            this.watchOn();
            this.watchOn = false;
        }
    },
    methods: {
        handleChange: function(e){
            utilHelper.setVar(this.modelProperty, e.target.checked);
            if (this.change && _.isFunction(this.change)){
                this.change(e);
            }
        },
        modelPropertyChanged: function(){
            // let newVal = utilHelper.getVar(this.modelProperty);
            // this.cbModel = newVal;

        }
    },
    computed: {
        cbModel: function(){
            return utilHelper.getVar(this.modelProperty);
        }
    }
};