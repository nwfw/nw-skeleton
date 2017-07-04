const BaseClass = require('../base').BaseClass;

class StyleHelper extends BaseClass {

    constructor(){
        super();
    }

    async initialize () {
        await super.initialize();
        return this;
    }

    async finalize () {
        return true;
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
}

exports.StyleHelper = StyleHelper;