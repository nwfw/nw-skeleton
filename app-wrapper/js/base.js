var _ = require('lodash');
var _appWrapper;
var appUtil;
var appState;

class BaseClass {

	constructor () {
		if (window && window.getAppWrapper && _.isFunction(window.getAppWrapper)){
			_appWrapper = window.getAppWrapper();
			appUtil = _appWrapper.getAppUtil();
			appState = appUtil.getAppState();
		}

		this.forceUserMessages = false;
		this.forceDebug = false;
		this.boundMethods = {};

		return this;
	}

	initialize () {
		this.addBoundMethods();
		return this;
	}

	getAppWrapper () {
		return _appWrapper;
	}

	getAppUtil () {
		return appUtil;
	}

	getAppState () {
		return appState;
	}

	addBoundMethods () {
		if (this.boundMethods){
			var keys = _.keys(this.boundMethods);
			for (let i=0; i<keys.length; i++){
				if (this[keys[i]] && _.isFunction(this[keys[i]]) && this[keys[i]].bind && _.isFunction(this[keys[i]].bind)){
					this.boundMethods[keys[i]] = this[keys[i]].bind(this);
				}
			}
		}
	}

	removeBoundMethods () {
		var keys = _.keys(this.boundMethods);
		for (let i=0; i<keys.length; i++){
			this.boundMethods[keys[i]] = null;
		}
		this.boundMethods = {};
	}

	destroy () {
		this.removeBoundMethods();
	}

}
exports.BaseClass = BaseClass;