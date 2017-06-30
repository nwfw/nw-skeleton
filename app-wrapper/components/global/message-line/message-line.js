var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'message-line',
    template: '',
    props: ['message', 'config'],
    methods: {
        getIconClass: function(message){
            if (message.iconClass){
                return message.iconClass;
            } else {
                var iconClass = 'fa fa-info-circle';
                if (message.type == 'warning'){
                    iconClass = 'fa fa-exclamation-circle';
                } else if (message.type == 'error'){
                    iconClass = 'fa fa-exclamation-triangle';
                }
                return iconClass;
            }
        },
        beforeEnter: function(el){
            let dims = _appWrapper.getHelper('html').getRealDimensions(el);
            _appWrapper.getHelper('html').setElementStyles(el, {height: dims.height + 'px'});
        },
        afterEnter: function(el){
            _appWrapper.getHelper('html').removeElementStyles(el, ['height']);
        },
        beforeLeave: function(el){
            _appWrapper.getHelper('html').setFixedSize(el);
        },
        afterLeave: function(el){
            _appWrapper.getHelper('html').unsetFixedSize(el);
        },
        toggleStackVisible: function() {
            this.message.stackVisible = !this.message.stackVisible;
        }
    },
    data: function () {
        return {};
    },
    computed: {
        appState: function(){
            return appState;
        }
    }
};