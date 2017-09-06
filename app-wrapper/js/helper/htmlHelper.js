/**
 * @fileOverview HtmlHelper class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

const _ = require('lodash');
const AppBaseClass = require('../lib/appBase').AppBaseClass;

var _appWrapper;
// var appState;
/**
 * HtmlHelper class - manages HTML element operations
 *
 * @class
 * @extends {appWrapper.AppBaseClass}
 * @memberof appWrapper.helpers
 */

class HtmlHelper extends AppBaseClass {

    /**
     * Creates HtmlHelper instance
     *
     * @constructor
     * @return {HtmlHelper}              Instance of HtmlHelper class
     */
    constructor(){
        super();

        _appWrapper = window.getAppWrapper();
        // appState = _appWrapper.getAppState();

        this.intervals = {
            scrollTo: {}
        };
    }

    /**
     * Initializes htmlHelper and extends HTMLElement prototype with its methods
     *
     * @return {HtmlHelper} Instance of HtmlHelper class
     */
    async initialize () {
        await super.initialize();
        this.extendElementProto();
        return this;
    }

    /**
     * Extends HTMLElement prototype with methods from htmlHelper
     *
     * @return {undefined}
     */
    extendElementProto () {
        var self = this;

        var customMethods = _.without((Object.getOwnPropertyNames(HtmlHelper.prototype).filter(function (p) {
            return typeof HtmlHelper.prototype[p] == 'function';
        })), 'constructor', 'initialize', 'finalize', 'extendElementProto');

        Element.prototype.getCustomMethods = function() {
            return customMethods;
        };

        for (let i=0; i<customMethods.length; i++){
            Element.prototype[customMethods[i]] = function() {
                if (arguments && arguments.length){
                    if (typeof arguments[0] == Element){
                        // if first argument is Element, use 'this' instead
                        return self[customMethods[i]].apply(self, arguments);
                    } else {
                        // call method with unchanged arguments
                        return self[customMethods[i]].apply(self, _.union([this], arguments));
                    }
                } else {
                    // call method with 'this' as only argument
                    return self[customMethods[i]](this);
                }
            };
        }
    }

    /**
     * Sets element CSS styles
     *
     * @param {HTMLElement} element Html element for style manipulation
     * @param {array}       styles  An array of objects representing style properties to set
     * @param {Boolean}     merge   Flag to indicate merging existing styles with new ones instead of rewriting entire style attribute
     * @return {undefined}
     */
    setElementStyles (element, styles, merge){
        if (this instanceof Element){
            element = this;
        }
        if (element && element.setAttribute && _.isFunction(element.setAttribute) && styles && _.isObject(styles)){
            var newStyles;
            if (merge){
                newStyles = _.assignIn(this.getElementStyles(element), styles);
            } else {
                newStyles = styles;
            }
            var styleString = '';
            var stylesData = [];
            var propertyNames = _.keys(newStyles);
            for (let i=0; i<propertyNames.length; i++){
                stylesData.push(propertyNames[i] + ': ' + newStyles[propertyNames[i]]);
            }
            styleString = stylesData.join('; ');
            element.setAttribute('style', styleString);
        }
    }

    /**
     * Returns current element style values from style attribute
     *
     * @param  {HTMLElement}    element Element to get styles for
     * @return {Object}                 An array of objects representing style properties
     */
    getElementStyles (element){
        var styles = {};
        if (element && element.getAttribute && _.isFunction(element.getAttribute)){
            var elementStyleString = element.getAttribute('style');
            if (elementStyleString){
                var elementStyles = elementStyleString.split(';');
                for (let i=0; i<elementStyles.length; i++){
                    var styleData = elementStyles[i].split(':');
                    if (styleData && styleData.length == 2){
                        styles[styleData[0].trim()] = styleData[1].trim();
                    }
                }
            }
        }
        return styles;
    }

    /**
     * Removes style properties from element style attribute
     *
     * @param  {HTMLElement}    element Element to remove styles from
     * @param  {string[]} propertyNames An array of style property names to remove
     * @return {undefined}
     */
    removeElementStyles (element, propertyNames){
        if (propertyNames && propertyNames.length && element && element.getAttribute && _.isFunction(element.getAttribute)){
            if (_.isString(propertyNames)){
                propertyNames = [propertyNames];
            }
            var elementStyles = this.getElementStyles(element);
            for(let i=0; i<propertyNames.length; i++){
                if (elementStyles && elementStyles[propertyNames[i]]){
                    delete elementStyles[propertyNames[i]];
                }
            }
            this.setElementStyles(element, elementStyles);
        }
    }

    /**
     * Sets element width and height to current values, forcing its size to be fixed
     *
     * @param {HTMLElement}    element  Element to set fixed size on
     * @param {Number} elementHeight    Optional height value to force element size
     * @param {Number} elementWidth     Optional width value to force element size
     * @return {undefined}
     */
    setFixedSize (element, elementHeight, elementWidth) {
        if (element && element.offsetHeight){
            if (_.isUndefined(elementHeight)){
                elementHeight = parseInt(element.offsetHeight, 10);
            }
            if (_.isUndefined(elementWidth)){
                elementWidth = parseInt(element.offsetWidth, 10);
            }

            var elementStyles = this.getElementStyles(element);

            elementStyles.height = elementHeight + 'px';
            elementStyles.width = elementWidth + 'px';
            elementStyles.overflow = 'hidden';

            this.setElementStyles(element, elementStyles);
        }
    }

    /**
     * Removes fixed size set by this.setFixedSize method
     *
     * @param {HTMLElement}    element  Element to unset fixed size on
     * @return {undefined}
     */
    unsetFixedSize (element) {
        var propertiesToRemove = ['width', 'height', 'overflow'];
        this.removeElementStyles(element, propertiesToRemove);
    }

    /**
     * Forces element width and height to values from the arguments, if values are omitted, current element size is used
     *
     * @param {HTMLElement}    element  Element to set fixed size on
     * @param {Number} elementHeight    Optional height value to force element size
     * @param {Number} elementWidth     Optional width value to force element size
     * @return {undefined}
     */
    forceSize (element, elementHeight, elementWidth) {
        if (element && element.offsetHeight){
            if (_.isUndefined(elementHeight)){
                elementHeight = parseInt(element.offsetHeight, 10);
            } else {
                element.setAttribute('data-previous-height', parseInt(element.offsetHeight, 10));
            }

            if (_.isUndefined(elementWidth)){
                elementWidth = parseInt(element.offsetWidth, 10);
            } else {
                element.setAttribute('data-previous-width', parseInt(element.offsetWidth, 10));
            }

            let newStyles = {
                height: elementHeight + 'px',
                width: elementWidth + 'px'
            };

            this.setElementStyles(element, newStyles, true);
            element.setAttribute('data-forced-size', '1');
        }
    }

    /**
     * Removes forced size values from element style
     *
     * @param {HTMLElement}    element  Element to unset fixed size on
     * @return {undefined}
     */
    unforceSize (element) {
        let previousWidth = element.getAttribute('data-previous-width');
        let previousHeight = element.getAttribute('data-previous-height');
        this.removeElementStyles(element, ['width', 'height']);

        let newStyles = {};

        if (previousWidth){
            element.removeAttribute('data-previous-width');
            newStyles.width = previousWidth;
        }

        if (previousHeight){
            element.removeAttribute('data-previous-height');
            newStyles.width = previousHeight;
        }

        if (Object.keys(newStyles).length){
            this.setElementStyles(element, newStyles, true);
        }
        element.removeAttribute('data-forced-size');

    }

    /**
     * Gets element "real" dimensions, taking paddings, borders etc. into consideration
     *
     * @param {HTMLElement} element     Element to get dimensions (or parent in which selector argument will be applied)
     * @param  {string}     selector    Optional selector to filter children in 'element' argument
     * @return {Object}                 Object with width and height properties
     */
    getRealDimensions (element, selector){
        let dimensions = {
            width: 0,
            height: 0
        };

        if (this instanceof Element){
            element = this;
        }

        if (element){
            var dimsElement = element;
            if (selector && dimsElement.querySelector(selector)){
                dimsElement = dimsElement.querySelector(selector);
            }

            var dimsElementStyles = dimsElement.getComputedStyles();
            dimensions.height = parseFloat(dimsElementStyles.height, 10);
            dimensions.width = parseFloat(dimsElementStyles.width, 10);

            let widthOffset = 0;
            let heightOffset = 0;

            let widthOffsetProperties = ['padding-left', 'padding-right', 'border-left-width', 'border-right-width'];
            let heightOffsetProperties = ['padding-top', 'padding-bottom', 'border-top-width', 'border-bottom-width'];

            for (let i=0; i<widthOffsetProperties.length; i++){
                if (dimsElementStyles[widthOffsetProperties[i]] && parseFloat(dimsElementStyles[widthOffsetProperties[i]], 10)){
                    widthOffset -= parseFloat(dimsElementStyles[widthOffsetProperties[i]], 10);
                }
            }

            for (let i=0; i<heightOffsetProperties.length; i++){
                if (dimsElementStyles[heightOffsetProperties[i]] && parseFloat(dimsElementStyles[heightOffsetProperties[i]], 10)){
                    heightOffset -= parseFloat(dimsElementStyles[heightOffsetProperties[i]], 10);
                }
            }

            dimensions.width += widthOffset;
            dimensions.height += heightOffset;
        }

        return dimensions;
    }

    /**
     * Gets element "real" dimensions, by cloning given element
     *
     * @param {HTMLElement} element     Element to get dimensions (or parent in which selector argument will be applied)
     * @param  {string}     selector    Optional selector to filter children in 'element' argument
     * @return {Object}                 Object with width and height properties
     */
    getCloneRealDimensions (element, selector){
        let dimensions = {
            width: 0,
            height: 0
        };

        if (element && element.cloneNode && _.isFunction(element.cloneNode)){
            let clonedEl = element.cloneNode(true);

            let clonedElStyles = this.getElementStyles(element);
            // clonedElStyles['margin-top'] = '-10000px';

            this.setElementStyles(clonedEl, clonedElStyles);
            this.removeElementStyles(clonedEl, ['width', 'height']);

            if (!selector && element && element.parentNode){
                element.parentNode.appendChild(clonedEl);
            } else {
                document.body.appendChild(clonedEl);
            }

            let originalCloned = clonedEl;

            if (selector && clonedEl.querySelector(selector)){
                clonedEl = clonedEl.querySelector(selector);
            }

            clonedEl.removeClass('transition-wh');

            this.removeElementStyles(clonedEl, ['width', 'height']);

            dimensions.height = parseInt(clonedEl.offsetHeight, 10);
            dimensions.width = parseInt(clonedEl.offsetWidth, 10);

            originalCloned.parentNode.removeChild(originalCloned);
            originalCloned = null;
        }

        return dimensions;
    }

    /**
     * Sets or returns elements unique identifier
     *
     * @param {HTMLElement} element Element to set identifier on
     * @param  {Boolean}    setAttr Flag to indicate whether to set 'data-identifier' attribute on element
     * @return {string}             Element unique identifier
     */
    getUniqueElementIdentifier (element, setAttr){
        var identifier = '';

        if (element.getAttribute('data-identifier')){
            identifier = element.getAttribute('data-identifier');
        } else if (element.getAttribute('id')){
            identifier = element.getAttribute('id');
        } else {
            identifier = element.tagName + '_' + element.className + '_' + element.offsetTop + '_' + element.offsetHeight;
        }

        if (identifier && setAttr){
            element.setAttribute('data-identifier', identifier);
        }

        return identifier;
    }

    /**
     * Adds css class to element
     *
     * @param {HTMLElement}         element     Element to add class to
     * @param {(string|string[])}   className   Class name to add
     * @return {HTMLElement}                    Same element for chaining
     */
    addClass (element, className){
        if (this instanceof Element){
            element = this;
        }
        if (_.isArray(className)){
            for (let i=0; i<className.length;i++){
                this.addClass(element, className[i]);
            }
        } else {
            if (!this.hasClass(element, className)){
                let classes = element.getAttribute('class');
                if (classes && classes.split && _.isFunction(classes.split)){
                    classes = classes.split(' ');
                    classes.push(className);
                    element.setAttribute('class', classes.join(' '));
                } else {
                    element.setAttribute('class', className);
                }
            }
        }
        return element;
    }

    /**
     * Removes css class from element
     *
     * @param {HTMLElement}         element     Element to remove class from
     * @param {(string|string[])}   className   Class name to remove
     * @return {HTMLElement}                    Same element for chaining
     */
    removeClass (element, className){
        if (this instanceof Element){
            element = this;
        }
        if (_.isArray(className)){
            for (let i=0; i<className.length;i++){
                this.removeClass(element, className[i]);
            }
        } else {
            if (this.hasClass(element, className)){
                let classes = element.getAttribute('class');
                if (classes && classes.split && _.isFunction(classes.split)){
                    classes = classes.split(' ');
                    classes = _.without(classes, className);
                    element.setAttribute('class', classes.join(' '));
                }
            }
        }
        return element;
    }

    /**
     * Checks whether given element has certain className
     *
     * @param {HTMLElement} element Element to check
     * @param {string} className    Class name to check
     * @return {Boolean}            True if element has class, false otherwise
     */
    hasClass (element, className){
        if (this instanceof Element){
            element = this;
        }
        let hasClass = false;
        let classes = element.getAttribute('class');
        if (classes && classes.split && _.isFunction(classes.split)){
            classes = classes.split(' ');
            hasClass = _.includes(classes, className);
        }
        return hasClass;
    }

    /**
     * Toggles css class on element
     *
     * @param {HTMLElement} element Element to toggle class on
     * @param {string} className    Class name to toggle
     * @return {HTMLElement}        Same element for chaining
     */
    toggleClass (element, className){
        let hasClass = this.hasClass(element, className);
        if (hasClass){
            return this.removeClass(element, className);
        } else {
            return this.addClass(element, className);
        }
    }

    /**
     * Shows hidden element
     *
     * @param {HTMLElement} element Element to show
     * @return {undefined}
     */
    show (element) {
        if (element){
            this.removeElementStyles(element, 'display');
        }
    }

    /**
     * Hides the element
     *
     * @param {HTMLElement} element Element to hide
     * @return {undefined}
     */
    hide (element) {
        if (element){
            this.setElementStyles(element, {display: 'none'}, true);
        }
    }

    /**
     * Shows or hides an element
     *
     * @param {HTMLElement} element Element to show or hide
     * @return {undefined}
     */
    toggle (element) {
        if (element){
            if (!element.clientHeight && !element.clientWidth){
                var defaultDisplay = this.getElementDefaultDisplay(element);
                this.setElementStyles(element, {display: defaultDisplay}, true);
            } else {
                this.hide(element);
            }
        }
    }

    /**
     * Hides hidden element by setting 'visibility' css property
     *
     * @param {HTMLElement} element Element to hide
     * @return {undefined}
     */
    makeInvisible (element) {
        if (this instanceof Element){
            element = this;
        }
        if (element){
            this.setElementStyles(element, {visibility: 'hidden'}, true);
        }
    }

    /**
     * Shows hidden element by setting 'visibility' css property
     *
     * @param {HTMLElement} element Element to show
     * @return {undefined}
     */
    makeVisible (element) {
        if (this instanceof Element){
            element = this;
        }
        if (element){
            this.setElementStyles(element, {visibility: 'visible'}, true);
        }
    }

    /**
     * Toggles 'visibility' css property, showing or hiding the element
     *
     * @param {HTMLElement} element Element to toggle visibility on
     * @return {undefined}
     */
    toggleVisibility (element) {
        if (this instanceof Element){
            element = this;
        }
        if (element){
            let styles = element.getComputedStyles();
            if (styles && styles.visibility){
                if (styles.visibility == 'hidden'){
                    _appWrapper.getHelper('html').makeVisible(element);
                } else {
                    _appWrapper.getHelper('html').makeInvisible(element);
                }
            }
        }
    }

    /**
     * Gets default 'display' css property value for given element
     *
     * @param {HTMLElement} element Element to get value for
     * @return {string}             Default 'display' value for element
     */
    getElementDefaultDisplay(element) {
        var tag = element.tagName;
        var cStyle;
        var newElement = document.createElement(tag);
        var gcs = 'getComputedStyle' in window;

        document.body.appendChild(newElement);
        cStyle = (gcs ? window.getComputedStyle(newElement, '') : newElement.currentStyle).display;
        document.body.removeChild(newElement);

        return cStyle;
    }

    /**
     * Scrolls element to given value
     *
     * @param {HTMLElement} element Element to scroll
     * @param  {Number} to          Value to scroll to
     * @param  {Number} duration    Duration for animated scrolls
     * @return {undefined}
     */
    scrollElementTo (element, to, duration) {
        var identifier = this.getUniqueElementIdentifier(element, true);
        var frameDuration = parseInt(1000/60, 10);
        var maxScrollHeight = element.scrollHeight - element.clientHeight;

        if (duration <= 0) {
            if (to > maxScrollHeight){
                to = maxScrollHeight;
            }
            element.scrollTop = to;
            return;
        }

        if (element.scrollHeight <= element.clientHeight){
            return;
        }

        var finalValue = to;
        var difference = finalValue - element.scrollTop;
        if (difference > 0 && finalValue >= maxScrollHeight){
            finalValue = maxScrollHeight;
            difference = finalValue - element.scrollTop;
        }

        var frameCount = parseInt(duration/frameDuration, 10);
        var stepIncrease = parseInt(difference / frameCount, 10);
        if (!stepIncrease){
            stepIncrease = difference > 0 ? 1 : -1;
        }

        clearInterval(this.intervals.scrollTo[identifier]);
        this.intervals.scrollTo[identifier] = setInterval(() => {
            this.scrollElementStep(element, stepIncrease, finalValue);
        }, frameDuration);
    }

    /**
     * Helper method for animated element scrolling, used by this.scrollElementTo
     *
     * @param {HTMLElement} element    Element to scroll
     * @param {Number} stepIncrease    Value for each scrolling step
     * @param {Number} finalValue      Final element scroll value
     * @return {undefined}
     */
    scrollElementStep (element, stepIncrease, finalValue){
        var currentValue = element.scrollTop;
        var nextValue = currentValue + stepIncrease;
        var maxValue = element.scrollHeight;
        var minValue = 0;
        var identifier = this.getUniqueElementIdentifier(element, true);

        if (stepIncrease >= 0){
            if (currentValue >= maxValue){
                nextValue = maxValue;
            }
        } else {
            if (currentValue <= minValue){
                nextValue = minValue;
            }
        }

        element.scrollTop = nextValue;

        if (stepIncrease >= 0 && nextValue >= finalValue){
            clearInterval(this.intervals.scrollTo[identifier]);
        } else if (stepIncrease < 0 && nextValue <= finalValue){
            clearInterval(this.intervals.scrollTo[identifier]);
        }
    }

    /**
     * Scrolls parent until its child element is visible
     *
     * @param {HTMLElement} element    Element whose parent will be scrolled
     * @param {Number}      duration   Duration for animated scrolls
     * @return {undefined}
     */
    scrollParentToElement (element, duration) {
        let parentElement = element.parentNode;
        let currentParentScrollTop = parentElement.scrollTop;
        element.scrollIntoView();
        let newParentScrollTop = parentElement.scrollTop;
        parentElement.scrollTop = currentParentScrollTop;
        return this.scrollElementTo(parentElement, newParentScrollTop, duration);
    }

    /**
     * Returns first element in parent tree that has given class name
     *
     * @param {HTMLElement} element     Element whose parents will be searched
     * @param  {string} targetClass     Class name for searching
     * @return {HTMLElement}            Parent element that matches given criteria
     */
    getParentByClass(element, targetClass){
        if (this instanceof Element){
            element = this;
        }
        let parent;
        if (element && element.parentNode){
            parent = element;
            while (!parent.hasClass(targetClass)) {
                parent = parent.parentNode;
            }
        }
        return parent;
    }

    /**
     * Selects all text in element
     *
     * @param {HTMLElement} element     Element to select
     * @return {undefined}
     */
    selectAll (element){
        var selection = window.getSelection();
        selection.removeAllRanges();
        var range = document.createRange();
        range.selectNode(element);
        selection.addRange(range);
    }

    /**
     * Returns all computed styles for given element
     *
     * @param {HTMLElement} element     Element to get styles for
     * @return {Object}                 An array of objects representing style properties
     */
    getComputedStyles (element) {
        var style;
        var returns = {};
        if (element && element.tagName){
            style = window.getComputedStyle(element, null);
            for(let i=0; i<style.length; i++){
                var prop = style[i];
                var val = style.getPropertyValue(prop);
                returns[prop] = val;
            }
        }
        return returns;
    }

    /**
     * Returns single computed style property for given element
     *
     * @param  {HTMLElement} element     Element to get style for
     * @param  {string}      propName    Style property to get
     * @return {mixed}                 Style property value
     */
    getComputedStyle (element, propName) {
        let style;
        let val = '';
        if (propName && element && element.tagName){
            style = window.getComputedStyle(element, null);
            for(let i=0; i<style.length; i++){
                if (style[i] == propName){
                    val = style.getPropertyValue(style[i]);
                    break;
                }
            }
        }
        return val;
    }

    /**
     * Gets absolute position for element
     *
     * @param  {HTMLElement} element     Element to get position for
     * @return {Object}                  Object with 'offsetTop' and 'offsetLeft' numeric values
     */
    getAbsolutePosition (element){
        var offsetLeft = element.offsetLeft;
        var offsetTop = element.offsetTop;
        var parent = element.parentNode;

        if (parent && parent.tagName && parent.tagName.toLowerCase() !== 'body'){
            var parentOffset = this.getAbsolutePosition(parent);
            offsetLeft += parentOffset.offsetLeft;
            offsetTop += parentOffset.offsetTop;
        }

        return {
            offsetLeft: offsetLeft,
            offsetTop: offsetTop
        };
    }

    /**
     * Returns first parent element that has children matching selector
     *
     * @param  {HTMLElement} element    Element to search
     * @param  {String}      selector   Selector to search
     * @return {(Boolean|HTMLElement)}  Parent element or false if none found
     */
    parentQuerySelector (element, selector){
        let parent = element;
        let parentFound = false;
        do {
            if (parent && parent.parentNode){
                parent = parent.parentNode;
                if (parent && parent.parentNode && parent.parentNode.querySelectorAll && _.isFunction(parent.parentNode.querySelectorAll)){
                    let parentChildren = parent.parentNode.querySelectorAll(selector);
                    parentFound = _.includes(parentChildren, parent);
                } else {
                    parentFound = true;
                    parent = false;
                }
            } else {
                parentFound = true;
            }
        } while (!parentFound);
        return parent;
    }

    /**
     * Checks whether text can be pasted into given element
     *
     * @param  {HTMLElement} element    Element to check
     * @return {Boolean}                True if text can be pasted, false otherwise
     */
    canPasteText (element) {
        return (element && !_.isUndefined(element.selectionStart) && !_.isUndefined(element.selectionEnd) && !_.isUndefined(element.value));
    }

    /**
     * Checks whether text in given element can be selected
     *
     * @param  {HTMLElement} element    Element to check
     * @return {Boolean}                True if text can be selected, false otherwise
     */
    isTextSelectable (element) {
        return (element && !_.isUndefined(element.selectionStart) && !_.isNull(element.selectionStart) && !_.isUndefined(element.selectionEnd) && !_.isNull(element.selectionEnd) && !_.isUndefined(element.value));
    }

    /**
     * Triggers custom event on the element
     *
     * @param  {HTMLElement}    element      Element to trigger event on
     * @param  {string}         eventName    Name of the event
     * @param  {Object}         eventOptions Object with event options
     * @return {undefined}
     */
    triggerCustomEvent (element, eventName, eventOptions){
        if (this instanceof Element){
            element = this;
        }
        if (!eventOptions){
            eventOptions = {};
        }
        let options = _.extend({
            bubbles: true,
            cancelable: true,
            target: element,
            type: 'input',
            isTrusted: true,
        }, eventOptions);

        var event = new CustomEvent(eventName, options);
        element.dispatchEvent(event);
    }

    /**
     * Gets input value for input elements
     *
     * @param  {HTMLElement}    element  Element to get value from
     * @return {string}                  Input element value
     */
    getInputValue (element){
        if (this instanceof Element){
            element = this;
        }
        let value;
        if (_.includes(['checkbox'], element.getAttribute('type'))){
            value = element.checked;
        } else {
            value = element.value;
        }
        return value;
    }

    /**
     * Sets input element value
     *
     * @param {HTMLElement}    element  Element to set value for
     * @param {mixed} value             Value to set
     * @return {undefined}
     */
    setInputValue (element, value){
        if (this instanceof Element){
            element = this;
        }
        if (_.includes(['checkbox'], element.getAttribute('type'))){
            if (value) {
                element.checked = true;
            } else {
                element.checked = false;
            }
        } else {
            element.value = value;
        }
        return value;
    }

    /**
     * Gets transition duration in milliseconds for given element
     *
     * @param {HTMLElement}    element  Element for which should transition-duration be returned
     * @return {Number}                 transition-duration in milliseconds
     */
    getTransitionDuration(element){
        let duration = 0;

        if (this instanceof Element){
            element = this;
        }

        let styles = element.getComputedStyles();
        if (styles && styles['transition-duration']){
            let newDuration = parseFloat(styles['transition-duration']);
            if (newDuration && !isNaN(newDuration)){
                duration = newDuration * 1000;
            }
        }
        return duration;
    }
}

exports.HtmlHelper = HtmlHelper;