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
    props: {
        circularProgressData: {
            type: Object,
            required: true
        },
        onCancel: {
            type: Function,
        },
    },
    currentData: {},
    previousProgress: 0,
    created: function(){
        this.previousProgress = 0;
    },
    data: function () {
        return {
            progressData: this.circularProgressData,
            cancelling: false,
        };
    },
    methods: {
        getDashArray: function(radius) {
            return radius * 2 * Math.PI;
        },
        getDashOffset: function(radius) {
            let progress = this.progressData.progress;
            if (isNaN(Math.floor(progress))){
                progress = this.previousProgress;
            } else {
                this.previousProgress = progress;
            }
            return (radius * 2 * Math.PI * (1 - (progress / 100)));
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
        getProgressValue: function(){
            let progress = Math.floor(this.progressData.progress);
            if (!isNaN(progress)){
                return progress + '%';
            } else {
                return this.progressData.progress;
            }
        },
        handleCancelClick (e) {
            if (this.onCancel && this.onCancel.call){
                this.onCancel(e);
            }
        }
    },
    computed: {
        appState: function(){
            return appState;
        }
    }
};