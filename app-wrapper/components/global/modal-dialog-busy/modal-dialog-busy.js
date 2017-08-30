/**
 * @fileOverview modal-dialog-busy component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.0
 */

// const _ = require('lodash');
var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * Modal dialog busy indicator component
 *
 * @name modal-dialog-busy
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
var component;
component = {
    name: 'modal-dialog-busy',
    template: '',
    methods: {},
    data: function () {
        return appState.modalData;
    },

    computed: {
        appState: function(){
            return appState;
        }
    },
};

exports.component = component;