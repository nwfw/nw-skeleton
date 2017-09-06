/**
 * @fileOverview ClipboardHelper class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

const _ = require('lodash');
const AppBaseClass = require('../../lib/appBase').AppBaseClass;

/**
 * ClipboardHelper class - handles clipboard operations
 *
 * @class
 * @extends {appWrapper.AppBaseClass}
 * @memberof appWrapper.helpers.systemHelpers
 */
class ClipboardHelper extends AppBaseClass {

    /**
     * Creates ClipboardHelper instance
     *
     * @constructor
     * @return {ClipboardHelper}              Instance of ClipboardHelper class
     */
    constructor() {
        super();
        return this;
    }

    /**
     * Sets clipboard contents
     *
     * @see {@link http://docs.nwjs.io/en/latest/References/Clipboard/#clipsetdata-type-raw}
     * @param {mixed} data Data to put to clipboard
     * @param {string} type Data type - one of text, png, jpeg, html and rtf (text is default)
     * @return {undefined}
     */
    set (data, type){
        let clipboard = nw.Clipboard.get();
        if (!type){
            type = 'text';
        }
        clipboard.set(data, type);
    }

    /**
     * Gets clipboard contents by type
     *
     * @see {@link http://docs.nwjs.io/en/latest/References/Clipboard/#clipgettype-raw}
     * @param {string} type Data type - one of text, png, jpeg, html and rtf (text is default)
     * @return {mixed}      Clipboard contents
     */
    get (type){
        let clipboard = nw.Clipboard.get();
        if (!type){
            type = 'text';
        }
        return clipboard.get(type, true);
    }

    /**
     * Gets currently selected text in the window
     *
     * @return {string} Selected text
     */
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

    /**
     * Cuts currently selected text to clipboard
     *
     * @return {undefined}
     */
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

    /**
     * Copies currently selected text to clipboard
     *
     * @return {undefined}
     */
    copy () {
        let selectedText = this.getSelected();
        this.log('Copying {1} characters to clipboard.', 'debug', [selectedText.length || '0']);
        this.set(selectedText);
    }

    /**
     * Pastes text from clipboard to currently active (focused) DOM element
     *
     * @return {undefined}
     */
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

    /**
     * Selects all text in current form element or entire window
     *
     * @return {undefined}
     */
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

    /**
     * Undoes previous operation
     *
     * @todo implement this
     * @return {undefined}
     */
    undo () {
        document.execCommand('undo');
    }

    /**
     * Redoes previous operation
     *
     * @todo implement this
     * @return {undefined}
     */
    redo () {
        document.execCommand('redo');
    }
}

exports.ClipboardHelper = ClipboardHelper;