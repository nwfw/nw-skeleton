const _ = require('lodash');
var utilHelper = window.getAppWrapper().getHelper('util');

exports.component = {
    name: 'checkbox-styled',
    template: '',
    props: ['change', 'name', 'data', 'modelProperty'],
    modelParent: null,
    watchOn: false,
    noWatchChange: false,
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