/**
 * @fileOverview base-component mixin file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.0
 */

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

/**
 * Base component mixin
 *
 * @name base-component
 * @memberOf mixins
 */
exports.component = {
    name: 'base-component',
    template: '',
    methods: {
        callViewHandler: _appWrapper.callViewHandler.bind(_appWrapper)
    },
    computed: {
        appState: function(){
            return appState;
        }
    }
};