/**
 * @fileOverview message-line component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.2.1
 */

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * Message line component
 *
 * @name message-line
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
    name: 'message-line',
    template: '',
    props: ['message', 'config', 'hideStacks'],
    methods: {
        getIconClass: function(message){
            if (message.iconClass){
                return message.iconClass;
            } else {
                let iconClass = 'fa fa-info-circle';
                if (message.type == 'warning'){
                    iconClass = 'fa fa-exclamation-circle';
                } else if (message.type == 'error'){
                    iconClass = 'fa fa-exclamation-triangle';
                }
                return iconClass;
            }
        },
        beforeEnter: function(el){
            let dims = el.getRealDimensions();
            el.setElementStyles({height: dims.height + 'px'});
        },
        afterEnter: function(el){
            el.removeElementStyles(['height']);
        },
        beforeLeave: function(el){
            el.setFixedSize();
        },
        afterLeave: function(el){
            el.unsetFixedSize();
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