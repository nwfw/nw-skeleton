var _ = require('lodash');

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

var inspectorJson = require('../../../js/lib/ext/inspector-json');
var inspector;
var dragging = false;
var mouseXOffset = null;

exports.component = {
    name: 'inspector-json',
    template: '',
    props: ['jsonData', 'collapsed'],
    data: function () {
        return appState;
    },
    methods: {
        startDrag(e){
            if (e && e.preventDefault && _.isFunction(e.preventDefault)){
                e.preventDefault();
            }

            var posX = e.clientX;
            var elLeft = this.$el.parentNode.offsetLeft;
            mouseXOffset = posX - elLeft;

            dragging = true;
        },
        stopDrag(e){
            if (e && e.preventDefault && _.isFunction(e.preventDefault)){
                e.preventDefault();
            }
            console.log('stopDrag');
            dragging = false;
        },
        drag(e){
            if (dragging){
                var posX = e.clientX;
                var elLeft = this.$el.parentNode.offsetLeft;
                var newMouseXOffset = posX - elLeft;
                var diff = mouseXOffset - newMouseXOffset;
                var width = this.$el.clientWidth;
                var newWidth = width + diff;
                var newStyles = { width: newWidth + 'px;'};
                _appWrapper.getHelper('html').setElementStyles(this.$el, newStyles, true);
            }
        }
    },
    mounted: function(){
        var element = this.$el.querySelector('.inspector-json');
        var jsonData = this.$el.getAttribute('data-jsonData');
        inspector = new inspectorJson({
            element: element,
            json: jsonData,
            collapsed: this.collapsed
        });
    },
    updated: function(){
        var jsonData = this.$el.getAttribute('data-jsonData');
        inspector.view(jsonData);
    },
    beforeDestroy: function(){
        inspector.destroy();
    },
    computed: {
        appState: function(){
            return appState;
        }
    },
    components: {}
};