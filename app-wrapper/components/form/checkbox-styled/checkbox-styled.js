const _ = require('lodash');
var utilHelper = window.getAppWrapper().getHelper('util');

exports.component = {
    name: 'checkbox-styled',
    template: '',
    props: ['change', 'name', 'data', 'modelProperty'],
    cbModel: false,
    modelParent: null,
    watchOn: false,
    noWatchChange: false,
    data: function () {
        return {
            cbModel: this.cbModel
        };
    },
    created: function() {
        this.cbModel = utilHelper.getVar(this.modelProperty);
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
            utilHelper.setVar(this.modelProperty, this.cbModel);
            if (this.change && _.isFunction(this.change)){
                this.change(e);
            }
        },
        modelPropertyChanged: function(){
            this.cbModel = utilHelper.getVar(this.modelProperty);
        }
    }
};