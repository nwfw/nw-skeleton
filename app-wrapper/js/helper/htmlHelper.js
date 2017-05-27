var eventEmitter = require('events');
var _ = require('lodash');

var _appWrapper;
var appUtil;
var appState;


class HtmlHelper extends eventEmitter {

    constructor(){
        super();

        _appWrapper = window.getAppWrapper();
        appUtil = _appWrapper.getAppUtil();
        appState = appUtil.getAppState();

        this.tweens = {};
        this.tweenIntervals = {};

        this.forceDebug = appUtil.getConfig('forceDebug.htmlHelper');
        this.forceUserMessages = appUtil.getConfig('forceUserMessages.htmlHelper');

        this.operationStart = null;
        this.lastTimeCalculation = null;
        this.lastTimeValue = 0;
        this.timeCalculationDelay = 1;
        this.minPercentComplete = 0.3;

        _appWrapper = window.getAppWrapper();
        appUtil = _appWrapper.getAppUtil();
        appState = appUtil.getAppState();
    }

    async initialize () {
        return this;
    }

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

    getUniqueElementIdentifier(element, setAttr){
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
                console.log(defaultDisplay);
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

        clearInterval(appState.intervals.scrollTo[identifier]);
        appState.intervals.scrollTo[identifier] = setInterval(() => {
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
            clearInterval(appState.intervals.scrollTo[identifier]);
        } else if (stepIncrease < 0 && nextValue <= finalValue){
            clearInterval(appState.intervals.scrollTo[identifier]);
        }
    }

    startProgress (total, operationText) {
        appState.progressData.inProgress = true;
        this.updateProgress(0, total, operationText);
    }

    updateProgress (completed, total, operationText) {
        if (!appState.progressData.inProgress){
            appUtil.log('Trying to update progress while appState.progressData.inProgress is false', 'warning', [], false, this.forceDebug);
            return;
        }
        if (!this.operationStart){
            this.operationStart = (+ new Date()) / 1000;
        }
        var percentComplete = (completed / total) * 100;
        var remainingTime = this.calculateTime(percentComplete);
        percentComplete = parseInt(percentComplete);
        if (operationText){
            appState.progressData.operationText = operationText;
        }
        appState.progressData.detailText = completed + ' / ' + total;
        var formattedDuration = _appWrapper.appTranslations.translate('calculating');
        if (percentComplete >= this.minPercentComplete){
            formattedDuration = this.formatDuration(remainingTime);
        }
        appState.progressData.percentComplete = percentComplete + '% (ETA: ' + formattedDuration + ')';
        appState.progressData.styleObject = {
            width: percentComplete + '%'
        };
    }

    formatDuration (time) {
        if (isNaN(time)){
            time = 0;
        }

        var sec_num = parseInt(time, 10);

        var days   = Math.floor(sec_num / 86400);

        var hours   = Math.floor((sec_num - (days * 86400)) / 3600);

        var minutes = Math.floor((sec_num - (hours * 3600) - (days * 86400)) / 60);

        var seconds = sec_num - (days * 86400) - (hours * 3600) - (minutes * 60);

        if (!time){
            // var num = parseInt(Math.random() * 100 / 33, 10);
            var val = '';
            // for (var i = 0; i<num; i++){
            //     val += '.';
            // }
            return val;
        }

        var hasDays = false;
        if (days){
            hasDays = true;
        }

        var hasHours = false;
        if (hours){
            hasHours = true;
        }

        if (hours   < 10) {
            hours   = '0' + hours;
        }

        if (minutes < 10) {
            minutes = '0' + minutes;
        }

        if (seconds < 10) {
            seconds = '0' + seconds;
        }

        var formattedTime;
        if (hasDays){
            formattedTime = days + ' ' + _appWrapper.appTranslations.translate('days') + ' ' + hours + ':' + minutes + ':' + seconds;
        } else if (hasHours){
            formattedTime = hours + ':' + minutes + ':' + seconds;
        } else {
            formattedTime = minutes + ':' + seconds;
        }

        return formattedTime;
    }

    formatDate  (date, options, includeTime) {
        var appState = this.getAppState();

        var defaultOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        };

        if (includeTime) {
            defaultOptions.hour = '2-digit';
            defaultOptions.minute = '2-digit';
            defaultOptions.second = '2-digit';
        }

        var dateOptions = defaultOptions;

        if (options){
            dateOptions = _.defaults(defaultOptions, options);
        }

        var formattedDate = date.toLocaleString(appState.config.currentLocale, dateOptions);
        return formattedDate;
    }

    formatDateNormalize (date, options, includeTime, omitSeconds){

        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();

        var hours = date.getHours();
        var minutes = date.getMinutes();
        var seconds = date.getSeconds();

        if (month < 10){
            month = '0' + month;
        }


        if (day < 10){
            day = '0' + day;
        }

        if (hours < 10){
            hours = '0' + hours;
        }

        if (minutes < 10){
            minutes = '0' + minutes;
        }
        if (seconds < 10){
            seconds = '0' + seconds;
        }

        var formattedDate = year + '-' + month + '-' + day;

        if (includeTime) {
            formattedDate += ' ';
            formattedDate += hours;
            formattedDate += ':' + minutes;
            if (!omitSeconds) {
                formattedDate += ':' + seconds;
            }
        }

        return formattedDate;

    }

    clearProgress () {
        appState.progressData.inProgress = false;
        this.operationStart = null;
    }

    calculateTime(percent){
        var currentTime = (+ new Date()) / 1000;
        var remainingTime = null;
        if (percent && percent > this.minPercentComplete && (!this.lastTimeValue || (currentTime - this.lastTimeCalculation > this.timeCalculationDelay))){
            var remaining = 100 - percent;
            this.lastTimeCalculation = currentTime;
            var elapsedTime = currentTime - this.operationStart;
            var timePerPercent = elapsedTime / percent;
            remainingTime = remaining * timePerPercent;
            this.lastTimeValue = remainingTime;
        } else {
            remainingTime = this.lastTimeValue;
        }
        return remainingTime;
    }

    formatCurrency (value){
        var returnValue = Intl.NumberFormat(appState.languageData.currentLocale, {maximumFractionDigits: 2}).format(value);
        return returnValue;
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

    nl2br (value) {
        return value.replace(/\r?\n/g, '<br />');
    }

    selectAll (element){
        var selection = window.getSelection();
        var range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

exports.HtmlHelper = HtmlHelper;