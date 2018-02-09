/**
 * @fileOverview StyleHelper class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

const _ = require('lodash');
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

    getStylesheets () {
        return window.document.styleSheets;
    }

    getRulesBySelector (selectorText, looseMatch = false) {
        let stylesheets = this.getStylesheets();
        let utilHelper = this.getHelper('util');
        let selectorRegex = utilHelper.quoteRegex(selectorText);
        if (!looseMatch) {
            selectorRegex += '\\s?$';
        }
        for (let i=0; i<stylesheets.length; i++){
            let rules = _.filter(stylesheets[i].rules, (rule) => { return rule && rule.selectorText && rule.selectorText.match && rule.selectorText.match(new RegExp(selectorRegex)); });
            if (rules && rules.length){
                return rules;
            }
        }
        return false;
    }

    getRuleBySelector (selectorText, looseMatch = false) {
        let rules = this.getRulesBySelector(selectorText, looseMatch);
        if (rules && rules.length){
            return rules[0];
        }
        return false;
    }

    getRuleStyles (rule) {
        let styles = {};
        if (rule && rule.style) {
            let props = _.pickBy(rule.style, (val, key) => {
                return (rule.style[val] != '' && key.match(/^\d\d+?$/));
            });
            let keys = _.values(props);
            if (keys && keys.length){
                styles = _.pick(rule.style, keys);
            }
        }
        return styles;
    }

    getStylesBySelector(selectorText, looseMatch = false) {
        let rules = this.getRulesBySelector(selectorText, looseMatch);
        let styles = {};
        if (rules && rules.length){
            for (let i=0; i<rules.length; i++) {
                styles = _.merge(styles, this.getRuleStyles(rules[i]));
            }
        }
        return styles;
    }
}

exports.StyleHelper = StyleHelper;