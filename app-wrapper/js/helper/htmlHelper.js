var eventEmitter = require('events');
var _ = require('lodash');

var _appWrapper;
var appUtil;
var appState;


class HtmlHelper extends eventEmitter {

	constructor(){
		super();
		this.tweens = {};
		this.tweenIntervals = {};

		this.operationStart = null;
		this.lastTimeCalculation = null;
		this.lastTimeValue = 0;
		this.timeCalculationDelay = 1;
		this.minPercentComplete = 0.3;

		_appWrapper = window.getAppWrapper();
		appUtil = _appWrapper.getAppUtil();
		appState = appUtil.getAppState()

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
		}

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
		var identifier = ''

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

	scrollElementTo (element, to, duration) {
		var identifier = this.getUniqueElementIdentifier(element, true);
		var frameDuration = parseInt(1000/60, 10);
		var maxScrollHeight = element.scrollHeight - element.clientHeight;

		if (duration <= 0) {
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

	async confirmResolve (e) {
		if (e && e.preventDefault && _.isFunction(e.preventDefault)){
			e.preventDefault();
		}
		if (appState.closeModalResolve && _.isFunction(appState.closeModalResolve)){
	 		appState.closeModalResolve(true);
	 	}
	 	_appWrapper.closeCurrentModal();
	}

	async confirm (title, text, confirmButtonText, cancelButtonText) {
		appState.modalData.currentModal = _.cloneDeep(appState.defaultModal);

		if (!text){
			text = '';
		}

		if (!confirmButtonText){
			confirmButtonText = _appWrapper.appTranslations.translate('Confirm');
		}

		if (!cancelButtonText){
			cancelButtonText = _appWrapper.appTranslations.translate('Cancel');
		}

		appState.modalData.currentModal.bodyComponent = 'modal-body';
		appState.modalData.currentModal.title = title;
		appState.modalData.currentModal.body = text;
		appState.modalData.currentModal.confirmButtonText = confirmButtonText;
		appState.modalData.currentModal.cancelButtonText = cancelButtonText;
		appState.modalData.currentModal.modalClassName = 'confirm-modal';
		appState.modalData.currentModal.cancelSelected = true;
		appState.modalData.currentModal.confirmSelected = false;

		_appWrapper.modalBusy(_appWrapper.appTranslations.translate('Please wait...'));
		_appWrapper._confirmModalAction = this.confirmResolve;
		_appWrapper.closeModalPromise = new Promise((resolve, reject) => {
			appState.closeModalResolve = resolve;
		});
		_appWrapper.openCurrentModal();
		return _appWrapper.closeModalPromise;
	}

	updateProgress (completed, total, operationText) {
		if (!this.operationStart){
			this.operationStart = (+ new Date()) / 1000;
		}
		var appState = appUtil.getAppState();
		var percentComplete = (completed / total) * 100;
		var remainingTime = this.calculateTime(percentComplete);
		appState.progressData.inProgress = true;
		percentComplete = parseInt(percentComplete);
		if (operationText){
			appState.progressData.operationText = operationText;
		}
		appState.progressData.detailText = completed + ' / ' + total;
		var formattedDuration = _appWrapper.appTranslations.translate('calculating');
		if (percentComplete >= this.minPercentComplete){
			formattedDuration = appUtil.formatDuration(remainingTime);
		}
		appState.progressData.percentComplete = percentComplete + '% (ETA: ' + formattedDuration + ')';
		appState.progressData.styleObject = {
			width: percentComplete + '%'
		};
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
		var returnValue = Intl.NumberFormat().format(value);
		return returnValue;
	};
}

exports.HtmlHelper = HtmlHelper;