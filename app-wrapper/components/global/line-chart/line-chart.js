/**
 * @fileOverview line-chart component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

/**
 * Line chart bar component
 *
 * @name line-chart
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
    name: 'line-chart',
    template: '',
    props: ['axis', 'data', 'config'],
    data: function () {
        return {};
    },
    mounted: function(){


    },
    methods: {
        drawAxis: function(){
            let ctx = this.$el.querySelector('canvas').getContext('2d');

        }
    },
    computed: {
        appState: function(){
            return appState;
        },
        chartConfig: function(){
            return _.defaultsDeep(this.config, {
                live: false,
                maxValues: 10
            });
        }
    }
};