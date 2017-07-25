/**
 * @fileOverview inspector-json component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.1.0
 */

const _ = require('lodash');
var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * Inspector json component
 *
 * @name inspector-json
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
let inspectorJson = require('../../../js/lib/ext/inspector-json');

exports.component = {
    name: 'inspector-json',
    template: '',
    props: ['jsonData', 'collapsed', 'allowDrag'],
    inspector: null,
    dragging: false,
    mouseXOffset: null,
    data: function () {
        return {};
    },
    methods: {
        startDrag(e){
            if (e && e.preventDefault && _.isFunction(e.preventDefault)){
                e.preventDefault();
            }

            var posX = e.clientX;
            var elLeft = this.$el.parentNode.offsetLeft;
            this.mouseXOffset = posX - elLeft;

            this.dragging = true;
        },
        stopDrag(e){
            if (e && e.preventDefault && _.isFunction(e.preventDefault)){
                e.preventDefault();
            }
            this.dragging = false;
        },
        drag(e){
            if (this.dragging){
                var posX = e.clientX;
                var elLeft = this.$el.parentNode.offsetLeft;
                var newMouseXOffset = posX - elLeft;
                var diff = this.mouseXOffset - newMouseXOffset;
                var width = this.$el.clientWidth;
                var newWidth = width + diff;
                var newStyles = { width: newWidth + 'px;'};
                this.$el.setElementStyles(newStyles, true);
            }
        }
    },
    mounted: function(){
        let element = this.$el.querySelector('.inspector-json');
        let jsonData = this.$el.getAttribute('data-jsonData');
        this.inspector = new inspectorJson({
            element: element,
            json: jsonData,
            collapsed: this.collapsed
        });
    },
    updated: function(){
        let jsonData = this.$el.getAttribute('data-jsonData');
        this.inspector.view(jsonData);
    },
    beforeDestroy: function(){
        this.inspector.destroy();
    },
    computed: {
        appState: function(){
            return appState;
        }
    },
    components: {}
};