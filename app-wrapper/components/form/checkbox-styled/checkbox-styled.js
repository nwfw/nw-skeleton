var _ = require('lodash');

var _appWrapper = window.getAppWrapper();

exports.component = {
    name: 'checkbox-styled',
    template: '',
    props: ['class','change','checked','name','side', 'table', 'model'],
    isChecked: false,
    state: false,
    cbModel: false,
    data: function () {
        return {
            inputChecked: this.isChecked || this.cbModel,
            state: this.state || this.cbModel,
            cbModel: this.cbModel || this.isChecked
        };
    },
    created: function() {
        this.isChecked = this.checked || this.model;
        this.state = this.checked || this.model;
        this.cbModel = this.model || this.checked;
    },
    methods: {
        handleChange: function(){
            let input = this.$el.querySelector('.hidden-checkbox');
            if (input){
                let event = new Event('change1');
                this.isChecked = input.checked;
                this.state = this.isChecked;
                this.cbModel = this.isChecked;
                input.dispatchEvent(event);
                if (this.change && _.isFunction(this.change)){
                    this.change(event);
                }
            }
        },
        setChecked: function(checked){
            this.isChecked = checked;
            this.state = checked;
            this.cbModel = checked;
        }
    },
    computed: {
        checkboxChecked: function(){
            return this.isChecked || this.cbModel;
        }
    },
    components: []
};