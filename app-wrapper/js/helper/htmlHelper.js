/**
 * @fileOverview HtmlHelper class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

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
        if (!element && this instanceof Element){
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
        if (this instanceof Element){
            element = this;
        }
        if (element && element.offsetHeight){
            if (!(!_.isUndefined(elementHeight) && _.isFinite(elementHeight))){
                elementHeight = parseInt(element.offsetHeight, 10);
            }
            if (!(!_.isUndefined(elementWidth) && _.isFinite(elementWidth))){
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
        if (this instanceof Element){
            element = this;
        }
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

        if (!element && this instanceof Element){
            element = this;
        }

        if (element){
            var dimsElement = element;
            if (selector && dimsElement.querySelector(selector)){
                dimsElement = dimsElement.querySelector(selector);
            }

            var dimsElementStyles = this.getComputedStyles(dimsElement);
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

        if (!element && this instanceof Element){
            element = this;
        }

        if (element && element.cloneNode && _.isFunction(element.cloneNode)){
            let clonedEl = element.cloneNode(true);

            let clonedElStyles = this.getElementStyles(element);
            // clonedElStyles['margin-top'] = '-10000px';

            this.setElementStyles(clonedEl, clonedElStyles);
            this.removeElementStyles(clonedEl, ['width', 'height']);

            if (!selector && element && element.parentNode){
                element.parentNode.appendChild(clonedEl);
            } else {
                element.ownerDocument.body.appendChild(clonedEl);
            }

            let originalCloned = clonedEl;

            if (selector && clonedEl.querySelector(selector)){
                clonedEl = clonedEl.querySelector(selector);
            }

            clonedEl.removeClass('transition-wh');

            // this.setElementStyles(clonedEl, {display: 'unset'}, true);
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
        let identifier = '';
        let found = false;
        let id = false;
        if (element.getAttribute('data-identifier')){
            identifier = element.getAttribute('data-identifier');
            found = true;
        } else if (element.getAttribute('id')){
            identifier = element.getAttribute('id');
            id = true;
        } else {
            identifier = element.tagName + '_' + element.className.replace(/\s+?/g, '_') + '_' + element.offsetTop + '_' + element.offsetHeight;
        }
        if (!found && !id){
            identifier += _appWrapper.getHelper('util').getRandomString(5);
        }

        if (identifier && setAttr && !found){
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
            let styles = this.getComputedStyles(element);
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
        var newElement = element.ownerDocument.createElement(tag);
        var gcs = 'getComputedStyle' in element.ownerDocument.defaultView;

        element.ownerDocument.body.appendChild(newElement);
        cStyle = (gcs ? element.ownerDocument.defaultView.getComputedStyle(newElement, '') : newElement.currentStyle).display;
        element.ownerDocument.body.removeChild(newElement);

        return cStyle;
    }

    /**
     * Scrolls element to its child element
     *
     * @param {HTMLElement} element     Element to scroll
     * @param  {Number}     childSelector   Child element selector to scroll to
     * @param  {Number}     duration        Duration for animated scrolls
     * @param  {Number}     offset          Offset for fine tuning
     * @param  {Function}   callback        Callback
     * @return {undefined}
     */
    scrollElementToSelector (element, childSelector, duration, offset = 0, callback) {
        if (!element && this instanceof Element){
            element = this;
        }
        let childElement = element.querySelector(childSelector);
        if (!childElement){
            return;
        }
        let childTop = childElement.getOffsetPosition().offsetTop;
        let elTop = element.getOffsetPosition().offsetTop;
        if (childTop && elTop){
            let finalTop = childTop - elTop;
            if (_.isNumber(offset)){
                finalTop += offset;
            }
            if (finalTop < 0){
                finalTop = 0;
            }
            this.scrollElementTo(element, finalTop, duration, callback);
        }
    }

    /**
     * Scrolls element to given value
     *
     * @param {HTMLElement} element Element to scroll
     * @param  {Number}     to          Value to scroll to
     * @param  {Number}     duration    Duration for animated scrolls
     * @param  {Function}   callback    Callback
     * @return {undefined}
     */
    scrollElementTo (element, to, duration, callback) {
        let identifier = this.getUniqueElementIdentifier(element, true);
        let frameDuration = parseInt(1000/60, 10);
        let maxScrollHeight = element.scrollHeight - element.clientHeight;
        clearInterval(element.scrollToInterval);
        element._scrollCallback = callback;
        let finished = false;

        if (duration <= 0) {
            if (to > maxScrollHeight){
                to = maxScrollHeight;
            }
            element.scrollTop = to;
            finished = true;
        }

        if (!finished && element.scrollHeight <= element.clientHeight){
            finished = true;
        }

        if (!finished) {
            let finalValue = to;
            let difference = finalValue - element.scrollTop;
            if (difference > 0 && finalValue >= maxScrollHeight){
                finalValue = maxScrollHeight;
                difference = finalValue - element.scrollTop;
            }

            if (finalValue < 0){
                finalValue = 0;
            }

            let frameCount = parseInt(duration/frameDuration, 10);
            let stepIncrease = parseInt(difference / frameCount, 10);
            if (!stepIncrease){
                stepIncrease = difference > 0 ? 1 : -1;
            }

            if (stepIncrease != 0){
                element.scrollToInterval = setInterval(() => {
                    this.scrollElementStep(element, stepIncrease, finalValue, identifier);
                }, frameDuration);
            } else {
                finished = true;
            }
        }
        if (finished) {
            if (element._scrollCallback && _.isFunction(element._scrollCallback)){
                element._scrollCallback();
            }
        }
    }

    /**
     * Helper method for animated element scrolling, used by this.scrollElementTo
     *
     * @param {HTMLElement} element    Element to scroll
     * @param {Number} stepIncrease    Value for each scrolling step
     * @param {Number} finalValue      Final element scroll value
     * @param {String} identifier      Unique element identifier
     *
     * @return {undefined}
     */
    scrollElementStep (element, stepIncrease, finalValue, identifier){
        let currentValue = element.scrollTop;
        let nextValue = currentValue + stepIncrease;
        let maxValue = element.scrollHeight;
        let minValue = 0;
        if (!identifier){
            identifier = this.getUniqueElementIdentifier(element, false);
        }

        if (stepIncrease >= 0){
            if (currentValue >= maxValue){
                nextValue = maxValue;
            }
        } else {
            if (currentValue <= minValue){
                nextValue = minValue;
            }
        }

        if (stepIncrease >= 0 && nextValue >= finalValue){
            nextValue = finalValue;
        } else if (stepIncrease < 0 && nextValue <= finalValue){
            nextValue = finalValue;
        }

        element.scrollTop = nextValue;

        if (stepIncrease >= 0 && nextValue >= finalValue){
            clearInterval(element.scrollToInterval);
            if (element._scrollCallback && _.isFunction(element._scrollCallback)){
                element._scrollCallback();
            }
        } else if (stepIncrease < 0 && nextValue <= finalValue){
            clearInterval(element.scrollToInterval);
            if (element._scrollCallback && _.isFunction(element._scrollCallback)){
                element._scrollCallback();
            }
        }
    }

    /**
     * Scrolls parent until its child element is visible
     *
     * @param {HTMLElement} element    Element whose parent will be scrolled
     * @param {Number}      duration   Duration for animated scrolls
     * @param {Boolean}     center     Center child vertically
     * @param {Function}    callback   Callback
     * @return {undefined}
     */
    scrollParentToElement (element, duration, center = false, callback) {
        let parentElement = element.parentNode;
        let currentParentScrollTop = parentElement.scrollTop;
        element.scrollIntoViewIfNeeded(center);
        let newParentScrollTop = parentElement.scrollTop;
        parentElement.scrollTop = currentParentScrollTop;
        return this.scrollElementTo(parentElement, newParentScrollTop, duration, callback);
    }

    /**
     * Scrolls parent until its child element is visible
     *
     * @param {HTMLElement} parent     Parent element to scroll
     * @param {HTMLElement} child      Child element to which to scroll
     * @param {Number}      duration   Duration for animated scrolls
     * @param {Boolean}     center     Center child vertically
     * @param {Function}    callback   Callback
     * @return {undefined}
     */
    scrollElementToChild (parent, child, duration, center = false, callback) {
        let currentParentScrollTop = parent.scrollTop;
        child.scrollIntoViewIfNeeded(center);
        let newParentScrollTop = parent.scrollTop;
        parent.scrollTop = currentParentScrollTop;
        return this.scrollElementTo(parent, newParentScrollTop, duration, callback);
    }

    /**
     * Stops current scrolling animation on element
     * @param  {HTMLElement} element Element that should stop scrolling
     * @return {undefined}
     */
    stopElementScroll (element) {
        if (!element && this instanceof Element){
            element = this;
        }
        // let identifier = this.getUniqueElementIdentifier(element, true);
        clearInterval(element.scrollToInterval);
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
            if (parent && parent.hasClass && _.isFunction(parent.hasClass)){
                while (!parent.hasClass(targetClass)) {
                    parent = parent.parentNode;
                }
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
        if (!element && this instanceof Element){
            element = this;
        }
        var selection = element.ownerDocument.defaultView.getSelection();
        selection.removeAllRanges();
        var range = element.ownerDocument.createRange();
        range.selectNode(element);
        selection.addRange(range);
    }

    /**
     * Selects matched part of the text in element
     *
     * @param {HTMLElement} element     Element to select
     * @param {String}      text        Text to match
     * @return {undefined}
     */
    selectMatch (element, text){
        if (!element && this instanceof Element){
            element = this;
        }
        var selection = element.ownerDocument.defaultView.getSelection();
        selection.removeAllRanges();
        let elementValue = element.value;
        element.focus();
        if (elementValue){
            let utilHelper = this.getHelper('util');
            let match = elementValue.match(new RegExp(utilHelper.quoteRegex(text, 'i')));
            if (match && !_.isUndefined(match.index)){
                let start = match.index;
                let end = match.index + text.length;
                element.setSelectionRange(start, end);
            }
        }
    }

    /**
     * Selects text range in element
     *
     * @param {HTMLElement} element     Element to select
     * @param {Number}      start       Start index
     * @param {Number}      end         End index
     * @return {undefined}
     */
    selectRange (element, start, end){
        if (!element && this instanceof Element){
            element = this;
        }
        var selection = element.ownerDocument.defaultView.getSelection();
        selection.removeAllRanges();
        element.focus();
        element.setSelectionRange(start, end);
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
            style = element.ownerDocument.defaultView.getComputedStyle(element, null);
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
            style = element.ownerDocument.defaultView.getComputedStyle(element, null);
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
        if (!element && this instanceof Element){
            element = this;
        }

        let bcr = element.getBoundingClientRect();
        let offsetLeft = bcr.left;
        let offsetTop = bcr.top;
        // let parent = element;

        // while (parent.offsetParent){
        //     offsetLeft += parent.offsetLeft;
        //     offsetTop += parent.offsetTop;
        //     parent = parent.offsetParent;
        // }

        return {
            offsetLeft: offsetLeft,
            offsetTop: offsetTop
        };
    }

    /**
     * Gets absolute position for element
     *
     * @param  {HTMLElement} element     Element to get position for
     * @return {Object}                  Object with 'offsetTop' and 'offsetLeft' numeric values
     */
    _getAbsolutePosition (element){
        if (!element && this instanceof Element){
            element = this;
        }
        let offsetLeft = element.offsetLeft;
        let offsetTop = element.offsetTop;
        let parent = element.parentNode;

        if (parent && parent.tagName && parent.tagName.toLowerCase() !== 'body'){
            let parentOffset = this.getAbsolutePosition(parent);
            offsetLeft += parentOffset.offsetLeft;
            offsetTop += parentOffset.offsetTop;
        }

        return {
            offsetLeft: offsetLeft,
            offsetTop: offsetTop
        };
    }

    /**
     * Gets position for element relative to its first offset parent
     *
     * @param  {HTMLElement} element     Element to get position for
     * @return {Object}                  Object with 'offsetTop' and 'offsetLeft' numeric values
     */
    getOffsetPosition (element){
        if (!element && this instanceof Element){
            element = this;
        }
        let offsetLeft = element.offsetLeft;
        let offsetTop = element.offsetTop;

        let marginLeft = this.getComputedStyle(element, 'margin-left');
        let marginTop = this.getComputedStyle(element, 'margin-top');

        if (marginLeft && marginLeft.match(/px/)){
            offsetLeft -= parseInt(marginLeft, 10);
        }

        if (marginTop && marginTop.match(/px/)){
            offsetTop -= parseInt(marginTop, 10);
        }

        return {
            offsetLeft: offsetLeft,
            offsetTop: offsetTop
        };
    }

    /**
     * Checks whether element is position:absolute
     *
     * @param  {HTMLElement}  element   HTML element to check
     * @return {Boolean}                Result
     */
    isAbsolute (element) {
        if (!element && this instanceof Element){
            element = this;
        }
        let position = this.getComputedStyle(element, 'position');
        return position && position == 'absolute';
    }

    /**
     * Checks whether element is position:relative
     *
     * @param  {HTMLElement}  element   HTML element to check
     * @return {Boolean}                Result
     */
    isRelative (element) {
        if (!element && this instanceof Element){
            element = this;
        }
        let position = this.getComputedStyle(element, 'position');
        return position && position == 'relative';
    }

    /**
     * Checks whether element is position:absolute or position: relative
     *
     * @param  {HTMLElement}  element   HTML element to check
     * @return {Boolean}                Result
     */
    isPositioned (element) {
        if (!element && this instanceof Element){
            element = this;
        }
        let position = this.getComputedStyle(element, 'position');
        return position && (position == 'relative' || position == 'absolute');
    }

    /**
     * Fixates element, leaving it in its current place
     *
     * @param  {HTMLElement}  element   HTML element to modify
     * @return {undefined}
     */
    fixate (element){
        if (!element && this instanceof Element){
            element = this;
        }
        // let position = this.getOffsetPosition(element);
        let styles = {
            position: 'fixed',
            // left: position.offsetLeft + 'px',
            // top: position.offsetTop + 'px'
        };
        this.setElementStyles(element, styles, true);
    }

    /**
     * Unfixates element, returning it to its original place
     *
     * @param  {HTMLElement}  element   HTML element to modify
     * @return {undefined}
     */
    unFixate (element){
        if (!element && this instanceof Element){
            element = this;
        }
        // this.removeElementStyles(element, ['position','left','top']);
        this.removeElementStyles(element, ['position']);
    }

    /**
     * Absolutizes element, leaving it in its current place
     *
     * @param  {HTMLElement}  element   HTML element to modify
     * @return {undefined}
     */
    absolutize (element){
        if (!element && this instanceof Element){
            element = this;
        }
        let position = this.getOffsetPosition(element);
        let styles = {
            position: 'absolute',
            left: position.offsetLeft + 'px',
            top: position.offsetTop + 'px'
        };
        this.setElementStyles(element, styles, true);
    }

    /**
     * Unabsolutizes element, returning it to its original place
     *
     * @param  {HTMLElement}  element   HTML element to modify
     * @return {undefined}
     */
    unAbsolutize (element){
        if (!element && this instanceof Element){
            element = this;
        }
        this.removeElementStyles(element, ['position','left','top']);
    }

    /**
     * Relativizes element
     *
     * @param  {HTMLElement}  element   HTML element to modify
     * @return {undefined}
     */
    relativize (element){
        if (!element && this instanceof Element){
            element = this;
        }
        let position = this.getOffsetPosition(element);
        let styles = {
            position: 'relative',
            left: position.offsetLeft + 'px',
            top: position.offsetTop + 'px'
        };
        this.setElementStyles(element, styles, true);
    }

    /**
     * Unrelativizes element
     *
     * @param  {HTMLElement}  element   HTML element to modify
     * @return {undefined}
     */
    unRelativize (element){
        if (!element && this instanceof Element){
            element = this;
        }
        this.removeElementStyles(element, ['position','left','top']);
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
        } else if (element.tagName.toLowerCase() == 'select' && _.isArray(value)){
            for (let i=0; i<element.options.length; i++) {
                if (_.includes(value, element.options[i].getAttribute('value'))){
                    element.options[i].selected = true;
                } else {
                    element.options[i].selected = false;
                }
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

        let styles = this.getComputedStyles(element);
        if (styles && styles['transition-duration']){
            let newDuration = parseFloat(styles['transition-duration']);
            if (newDuration && !isNaN(newDuration)){
                duration = newDuration * 1000;
            }
        }
        return duration;
    }

    /**
     * Returns value depending on whether element is on its scroll bottom
     *
     * @param {HTMLElement}    element  Element for which should transition-duration be returned
     *
     * @return {Boolean}                'true' if element is at bottom, 'false' otherwise
     */
    isAtScrollBottom(element){
        if (this instanceof Element){
            element = this;
        }
        let atBottom = false;
        if (element.scrollHeight - (element.scrollTop + element.clientHeight) == 0){
            atBottom = true;
        }
        return atBottom;
    }

    /**
     * Returns value depending on whether element is on its scroll top
     *
     * @param {HTMLElement}    element  Element for which should transition-duration be returned
     *
     * @return {Boolean}                'true' if element is at bottom, 'false' otherwise
     */
    isAtScrollTop(element){
        if (this instanceof Element){
            element = this;
        }
        let atTop = false;
        if (element.scrollTop == 0){
            atTop = true;
        }
        return atTop;
    }

    /**
     * Returns value depending on whether element is on its scroll bottom
     *
     * @param {HTMLElement}    element  Element for which should transition-duration be returned
     *
     * @return {Boolean}                'true' if element is at bottom, 'false' otherwise
     */
    isAtScrollRight(element){
        if (this instanceof Element){
            element = this;
        }
        let atRight = false;
        if (element.scrollWidth - (element.scrollLeft + element.clientWidth) == 0){
            atRight = true;
        }
        return atRight;
    }

    /**
     * Returns value depending on whether element is on its scroll top
     *
     * @param {HTMLElement}    element  Element for which should transition-duration be returned
     *
     * @return {Boolean}                'true' if element is at bottom, 'false' otherwise
     */
    isAtScrollLeft(element){
        if (this instanceof Element){
            element = this;
        }
        let atLeft = false;
        if (element.scrollLeft == 0){
            atLeft = true;
        }
        return atLeft;
    }
}

exports.HtmlHelper = HtmlHelper;