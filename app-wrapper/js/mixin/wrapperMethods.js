/**
 * @fileOverview wrapperMethods mixin file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

const _ = require('lodash');
var _appWrapper = window.getAppWrapper();

/**
 * Wrapper methods mixin
 *
 * @name MixinWrapperMethods
 * @memberOf mixins
 */
var MixinWrapperMethods  = {
    methods: {
        callViewHandler: _appWrapper.callViewHandler.bind(_appWrapper),
        /**
         * Logs output to console
         *
         * @param  {mixed} value  Value to log
         * @return {undefined}
         */
        log: function(value){
            console.log(value);
        },
        /**
         * Converts value to JSON and returns it
         *
         * @param  {mixed} value        Value to convert
         * @param  {Boolean} minified   Flag to force minified JSON output
         * @return {string}             JSON-encoded value representation
         */
        toJson: function(value, minified){
            return _appWrapper.getHelper('util').toJson(value, minified);
        },
        /**
         * Takes a var and returns default value if no value found
         *
         * @return {mixed} Value or default value from arguments
         */
        def: function(){
            let value;
            if (arguments && arguments.length){
                value = arguments[0];
            }
            let defaultTexts = Array.prototype.slice.call(arguments, 1, arguments.length);
            if (_.isUndefined(value)){
                for(let i=0; i<defaultTexts.length;i++){
                    value = defaultTexts[i];
                    if (!_.isUndefined(value)){
                        break;
                    }
                }
            }
            if (_.isUndefined(value)){
                value = '';
            }
            return value;
        },

        /**
         * Takes a var and returns default value if no value found or value is falsy
         *
         * @return {mixed} Value or default value from arguments
         */
        defAll: function(){
            let value;
            if (arguments && arguments.length){
                value = arguments[0];
            }
            let defaultTexts = Array.prototype.slice.call(arguments, 1, arguments.length);
            if (!(!_.isUndefined(value) && value)){
                for(let i=0; i<defaultTexts.length;i++){
                    value = defaultTexts[i];
                    if (!_.isUndefined(value)){
                        break;
                    }
                }
            }
            if (_.isUndefined(value)){
                value = '';
            }
            return value;
        },

        /**
         * Handler for nw-model directive triggered on model update
         *
         * @param  {Event} e    Event that triggered the method
         * @return {undefined}
         */
        onUpdateModel: function(e) {
            // console.log('nwModel onUpdateModel', e.target);
            if (e && e.target && e.target.triggerCustomEvent && _.isFunction(e.target.triggerCustomEvent)) {
                e.target.triggerCustomEvent('input');
                e.target.triggerCustomEvent('change');
            }
        },

        /**
         * Handler for 'input' event on fields bound to nw-model directive
         *
         * @param  {Event} e    Event that triggered the method
         * @return {undefined}
         */
        nwModelInput: function (e){

            let utilHelper = _appWrapper.getHelper('util');
            let binding = e.target.nwModelData.binding;
            let context = e.target.nwModelData.vnode.context;
            let value = e.target.getInputValue();
            if (binding.modifiers.number){
                value = +value;
            }
            if (binding.modifiers.trim){
                value = _.trim(value);
            }
            if (binding.modifiers.literal){
                utilHelper.setVar(binding.expression, value);
            } else if (binding.modifiers.eval){
                utilHelper.setVar(e.target.nwModelData.propName, value);
            } else {
                context[binding.expression] = value;
            }
        },

        /**
         * Converts decimal value to hexadecimal
         *
         * @param  {Number} decimalValue Decimal value
         * @return {string}              Hexadecimal value
         */
        decToHex: function(decimalValue){
            return _appWrapper.getHelper('format').decToHex(decimalValue);
        },

        /**
         * Converts hexadecimal value to decimal
         *
         * @param  {string} hexadecimalValue Hexadecimal value
         * @return {Number}                  Decimal value
         */
        hexToDec: function(hexadecimalValue){
            return _appWrapper.getHelper('format').hexToDec(hexadecimalValue);
        },

        /**
         * Convers hex color representation to r,g,b array
         *
         * @param  {string} hexColor Hexadecimal color value
         * @return {Integer[]}       r,g,b array
         */
        hexToDecColor: function(hexColor){
            return _appWrapper.getHelper('format').hexToDecColor(hexColor);
        },

        /**
         * Converts r,g,b array to hexadecimal color value
         *
         * @param  {Integer[]} decColorArray    r,g,b values arrat
         * @return {string}                     Hexadecimal color value
         */
        decToHexColor: function(decColorArray){
            return _appWrapper.getHelper('format').decToHexColor(decColorArray);
        },

        /**
         * Formats file size from bytes to human-readable format
         *
         * @param  {Integer} bytes File size in bytes
         * @return {string}        Formatted file size
         */
        formatFileSize: function(bytes, lesserUnits = 0, minUnit = 0, treshold = 0, floatValue = false){
            return _appWrapper.getHelper('format').formatFileSize(bytes, lesserUnits, minUnit, treshold, floatValue);
        },

        /**
         * Formats file size from bytes to human-readable format, returning one lesser unit if file size in default units is larger than minRest param
         *
         * @param  {Integer} bytes   File size in bytes
         * @param  {Boolean} format  Flag to indicate whether to format output (add commas)
         * @param  {Integer} minRest Minimum file size in default units
         * @return {string}          Formatted file size
         */
        formatLargeFileSize: function(bytes, format, minRest){
            return _appWrapper.getHelper('format').formatLargeFileSize(bytes, format, minRest);
        },

        /**
         * Checks whether debug is enabled and returns value accordingly
         *
         * @return {Boolean} True if debug is on, false otherwise
         */
        isDebugEnabled: function(){
            return _appWrapper.isDebugEnabled();
        },
        /**
         * Rounds number to decimals from argument
         *
         * @param  {Number}     value    Value to round
         * @param  {Integer}    decimals Max decimal places
         * @return {Number}              Rounded value
         */
        round: function(value, decimals){
            return _.round(value, decimals);
        },

        /**
         * Checks whether current window is subwindow
         *
         * @return {Boolean} True if subwindow, false otherwise
         */
        isSubWindow(){
            return window.subWindowId ? true : false;
        },

        /**
         * Gets current subwindow id
         *
         * @return {String|null} Subwindow id or null if none
         */
        getSubWindowId(){
            return window.subWindowId ? window.subWindowId : null;
        }

    }
};
exports.mixin = MixinWrapperMethods;