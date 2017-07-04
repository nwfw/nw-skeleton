const _ = require('lodash');
const BaseClass = require('../base').BaseClass;


class HtmlHelper extends BaseClass {

    constructor(){
        super();
        this.intervals = {
            scrollTo: {}
        };
    }

    async initialize () {
        await super.initialize();
        this.extendElementProto();
        return this;
    }

    async finalize () {
        return true;
    }

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

    setElementStyles (element, styles, merge){
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

    unsetFixedSize (element) {
        var propertiesToRemove = ['width', 'height', 'overflow'];
        this.removeElementStyles(element, propertiesToRemove);
    }

    getRealDimensions (element, selector){
        var dimensions = {
            width: 0,
            height: 0
        };

        var originalElement = element;

        if (originalElement && originalElement.cloneNode && _.isFunction(originalElement.cloneNode)){
            var clonedEl = originalElement.cloneNode(true);

            var clonedElStyles = this.getElementStyles(originalElement);
            // clonedElStyles['margin-top'] = '-10000px';

            this.setElementStyles(clonedEl, clonedElStyles);

            var clonedMounted = document.body.appendChild(clonedEl);

            var dimsElement = clonedEl;
            if (selector && dimsElement.querySelector(selector)){
                dimsElement = dimsElement.querySelector(selector);
            }

            var dimsElementStyles = this.getElementStyles(dimsElement);
            delete dimsElementStyles.width;
            delete dimsElementStyles.height;

            this.setElementStyles(dimsElement, dimsElementStyles);

            dimensions.height = parseInt(dimsElement.offsetHeight, 10);
            dimensions.width = parseInt(dimsElement.offsetWidth, 10);

            clonedMounted.parentNode.removeChild(clonedMounted);
            clonedEl = null;
            clonedMounted = null;


        }

        return dimensions;
    }

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

    addClass (element, className){
        var classes = element.getAttribute('class');
        if (classes && classes.split && _.isFunction(classes.split)){
            classes = classes.split(' ');
            classes.push(className);
            element.setAttribute('class', classes.join(' '));
        } else {
            element.setAttribute('class', className);
        }
        return element;
    }

    removeClass (element, className){
        var classes = element.getAttribute('class');
        if (classes && classes.split && _.isFunction(classes.split)){
            classes = classes.split(' ');
            classes = _.without(classes, className);
            element.setAttribute('class', classes.join(' '));
        }
        return element;
    }

    hasClass (element, className){
        var hasClass = false;
        var classes = element.getAttribute('class');
        if (classes && classes.split && _.isFunction(classes.split)){
            classes = classes.split(' ');
            hasClass = _.includes(classes, className);
        }
        return hasClass;
    }

    toggleClass (element, className){
        let hasClass = this.hasClass(element, className);
        if (hasClass){
            return this.removeClass(element, className);
        } else {
            return this.addClass(element, className);
        }
    }

    show (element) {
        if (element){
            this.removeElementStyles(element, 'display');
        }
    }

    hide (element) {
        if (element){
            this.setElementStyles(element, {display: 'none'}, true);
        }
    }

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

    scrollParentToElement (element, duration) {
        let parentElement = element.parentNode;
        let currentParentScrollTop = parentElement.scrollTop;
        element.scrollIntoView();
        let newParentScrollTop = parentElement.scrollTop;
        parentElement.scrollTop = currentParentScrollTop;
        return this.scrollElementTo(parentElement, newParentScrollTop, duration);
    }

    getParentByClass(element, targetClass){
        var parent;
        if (element && element.parentNode){
            parent = element;
            while (!this.hasClass(parent, targetClass)) {
                parent = parent.parentNode;
            }
        }
        return parent;
    }

    selectAll (element){
        var selection = window.getSelection();
        selection.removeAllRanges();
        var range = document.createRange();
        range.selectNode(element);
        selection.addRange(range);
    }

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

    getAbsolutePosition (element){
        var offsetLeft = element.offsetLeft;
        var offsetTop = element.offsetTop;
        var parent = element.parentNode;

        if (parent.tagName.toLowerCase() !== 'body'){
            var parentOffset = this.getAbsolutePosition(parent);
            offsetLeft += parentOffset.offsetLeft;
            offsetTop += parentOffset.offsetTop;
        }

        return {
            offsetLeft: offsetLeft,
            offsetTop: offsetTop
        };
    }

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
}

exports.HtmlHelper = HtmlHelper;