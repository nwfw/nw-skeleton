const _ = require('lodash');
const BaseClass = require('../../base').BaseClass;

class ClipboardHelper extends BaseClass {
    constructor() {
        super();
        return this;
    }

    async initialize () {
        return await super.initialize();
    }

    set (data, type){
        let clipboard = nw.Clipboard.get();
        if (!type){
            type = 'text';
        }
        clipboard.set(data, type);
    }

    get (type){
        let clipboard = nw.Clipboard.get();
        if (!type){
            type = 'text';
        }
        return clipboard.get(type, true);
    }

    getSelected () {
        let selectedText = '';
        let activeElement = document.activeElement;
        if (activeElement && activeElement.isTextSelectable()){
            selectedText = activeElement.value.slice(activeElement.selectionStart, activeElement.selectionEnd);
        } else {
            var selection = document.getSelection();
            if (selection.rangeCount > 0) {
                let range = selection.getRangeAt(0);
                var clonedSelection = range.cloneContents();
                var div = document.createElement('div');
                div.appendChild(clonedSelection);
                selectedText = div.innerHTML;
            }
        }
        return selectedText;
    }

    cut () {
        let selectedText = this.getSelected();
        this.log('Cutting {1} characters to clipboard.', 'debug', [selectedText.length || '0']);
        this.set(selectedText);
        if (selectedText){
            let activeElement = document.activeElement;
            if (activeElement && activeElement.canPasteText()){
                let selectionStart = activeElement.selectionStart;
                let selectionEnd = activeElement.selectionEnd;
                let newValue = activeElement.value.slice(0, selectionStart);
                newValue += activeElement.value.slice(selectionEnd);
                activeElement.value = newValue;
                activeElement.triggerCustomEvent('nwupdatemodel');
                activeElement.selectionStart = selectionStart;
                activeElement.selectionEnd = selectionStart;
            }
        }
    }

    copy () {
        let selectedText = this.getSelected();
        this.log('Copying {1} characters to clipboard.', 'debug', [selectedText.length || '0']);
        this.set(selectedText);
    }

    paste () {
        let activeElement = document.activeElement;
        if (activeElement && activeElement.canPasteText()){
            let clipboardText = this.get();
            this.log('Pasting {1} characters from clipboard.', 'debug', [clipboardText.length || '0']);
            let selectionStart = activeElement.selectionStart;
            let selectionEnd = activeElement.selectionEnd;
            if (_.isNull(selectionStart) && _.isNull(selectionEnd)){
                activeElement.value = clipboardText;
            } else {
                let oldText = activeElement.value.slice(0, selectionStart);
                let oldTextAdd = activeElement.value.slice(activeElement.selectionEnd);
                activeElement.value = oldText + clipboardText + oldTextAdd;
                activeElement.selectionStart = selectionStart + clipboardText.length;
                activeElement.selectionEnd = activeElement.selectionStart;
            }
            activeElement.triggerCustomEvent('nwupdatemodel');
        }
    }

    selectAll () {
        let activeElement = document.activeElement;
        if (activeElement && activeElement.isTextSelectable() && !_.isUndefined(activeElement.select) && _.isFunction(activeElement.select)){
            this.log('Selecting all text in element.', 'debug', []);
            activeElement.select();
        } else {
            this.log('Selecting all text in window.', 'debug', []);
            let selection = window.getSelection();
            let range = document.createRange();
            range.selectNodeContents(document.body);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    undo () {
        document.execCommand('undo');
    }

    redo () {
        document.execCommand('redo');
    }
}

exports.ClipboardHelper = ClipboardHelper;