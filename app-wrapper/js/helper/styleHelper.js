/**
 * @fileOverview StyleHelper class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.0
 */

const AppBaseClass = require('../lib/appBase').AppBaseClass;

/**
 * StyleHelper class - handles and manages html element style operations
 *
 * @class
 * @extends {appWrapper.AppBaseClass}
 * @memberof appWrapper.helpers
 */
class StyleHelper extends AppBaseClass {

    /**
     * Creates StyleHelper instance
     *
     * @constructor
     * @return {StyleHelper}              Instance of StyleHelper class
     */
    constructor(){
        super();
    }

    /**
     * Gets CSS variable value by its name
     *
     * @param  {string}         name         Name of CSS variable
     * @param  {string}         defaultValue Default value to return if var not found
     * @param  {HTMLElement}    element      HTML element for which to return variable value (windwo by default)
     * @return {string}                      CSS variable value
     */
    getCssVarValue (name, defaultValue, element) {
        if (!element){
            element = document.body;
        }
        var elementStyles = window.getComputedStyle(element);
        var value = elementStyles.getPropertyValue(name);
        if (!value && defaultValue) {
            value = defaultValue;
        }
        return value;
    }
}

exports.StyleHelper = StyleHelper;