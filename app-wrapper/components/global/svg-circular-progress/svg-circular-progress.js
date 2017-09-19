/**
 * @fileOverview svg-circular-progress component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * SVG circular progresss component
 *
 * @name svg-circular-progress
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
    name: 'svg-circular-progress',
    template: '',
    props: ['circularProgressData'],
    currentData: {},
    data: function () {
        return {
            progressData: this.circularProgressData
        };
    },
    methods: {
        getDashArray: function(radius) {
            return radius * 2 * Math.PI;
        },
        getDashOffset: function(radius) {
            return (radius * 2 * Math.PI * (1 - (this.progressData.progress / 100)));
        },
        getDashOffsetFront: function(radius) {
            let dashOffset = this.getDashOffset(radius);
            // dashOffset -= 4;
            dashOffset *= 0.985;
            return dashOffset;
        },
        getDashOffsetFront2: function(radius) {
            let dashOffset = this.getDashOffset(radius);
            // dashOffset -= 2;
            dashOffset *= 0.995;
            return dashOffset;
        },
    },
    computed: {
        appState: function(){
            return appState;
        }
    }
};