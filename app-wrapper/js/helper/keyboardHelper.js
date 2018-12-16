/**
 * @fileOverview KeyboardHelper class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

/**
 * Object that contains key codes for keyboardHelper
 * @typedef  {Object}    KeyboardHelperKeyCodes
 *
 * @property {Number[]} debugKeys           An array of key codes for turning debug off or on
 * @property {Number[]} commandKeyCodes     An array of key codes for setting ctrlPressed
 * @property {Number[]} shiftKeyCodes       An array of key codes for setting shiftPressed
 * @property {Number[]} altKeyCodes         An array of key codes for setting altPressed
 * @property {Number[]} reloadKeyCodes      An array of key codes for window reloading
 * @property {Number[]} closeKeyCodes       An array of key codes for window closing
 * @property {Number[]} escKeyCodes         An array of key codes for "ESC" key
 * @property {Number[]} reloadCssKeyCodes   An array of key codes for CSS reloading
 */

const AppBaseClass = require('../lib/appBase').AppBaseClass;

var _appWrapper;
var appState;

/**
 * KeyboardHelper class - handles and manages keyboard events and operations
 *
 * @class
 * @extends {appWrapper.AppBaseClass}
 * @memberof appWrapper.helpers
 * @property {KeyboardHelperKeyCodes}   keyCodes        Key code definitions for keyboard helper
 * @property {Object}                   keyCodeNames    Hash for detecting 'ctrl', 'alt' and 'shift' buttons, mapping them to this.keyCodes members
 * @property {Object}                   globalKeyData   Data from configuration for global key handlers
 * @property {Number[]}                 pressedKeys     An array of previously pressed keys
 */
class KeyboardHelper extends AppBaseClass {

    /**
     * Creates KeyboardHelper instance
     *
     * @constructor
     * @return {KeyboardHelper}              Instance of KeyboardHelper class
     */
    constructor() {
        super();

        _appWrapper = this.getAppWrapper();
        appState = this.getAppState();

        this.keyCodes = {
            debugKeys: [84,79,71,71,76,69,68,69,66,85,71], // t,o,g,g,l,e,d,e,b,u,g
            commandKeyCodes: [224, 17, 91, 93],
            shiftKeyCodes: [16],
            altKeyCodes: [18],
            reloadKeyCodes: [82], // 'r'
            closeKeyCodes: [87, 81], // 'w', 'q'
            escKeyCodes: [27],
            reloadCssKeyCodes: [85], // 'u'
            reinitializeFeAppKeyCodes: [85], // 'u'
        };

        this.keyCodeNames = {
            'ctrl': 'commandKeyCodes',
            'shift': 'shiftKeyCodes',
            'alt': 'altKeyCodes'
        };

        this.globalKeyData = [];

        this.pressedKeys = [];

        this.boundMethods = {
            handleKeyDown: 'handleKeyDown'
        };

        return this;
    }

    /**
     * Initializes keyboardHelper, adding event listeners
     *
     * @async
     * @param {Object} options  Initialization options
     * @return {KeyboardHelper} Instance of KeyboardHelper class
     */
    async initialize (options) {
        await super.initialize(options);
        this.addEventListeners();
        return this;
    }

    /**
     * Adds keyboard helper event listeners
     *
     * @return {undefined}
     */
    addEventListeners (){
        window.addEventListener('keydown', this.boundMethods.handleKeyDown);
        window.addEventListener('keyup', this.boundMethods.handleKeyDown);
    }

    /**
     * Removes keyboard helper event listeners
     *
     * @return {undefined}
     */
    removeEventListeners (){
        window.removeEventListener('keydown', this.boundMethods.handleKeyDown);
        window.removeEventListener('keyup', this.boundMethods.handleKeyDown);
    }

    /**
     * Registers global shortcut from global keys configuration
     *
     * @param  {Object} keyHandler Shortcut configuration
     * @return {undefined}
     */
    registerGlobalShortcut (keyHandler){
        this.globalKeyData.push(keyHandler);
    }

    /**
     * Unregisters global shortcut from global keys configuration
     *
     * @param  {Object} keyHandler Shortcut configuration
     * @return {undefined}
     */
    unRegisterGlobalShortcut (keyHandler){
        this.globalKeyData = _.filter(this.globalKeyData, {
            keyCode: keyHandler.keyCode,
            handler: keyHandler.handler
        });
    }

    /**
     * Handles key down (and up) events
     *
     * @param  {Event} e Event that triggered the method
     * @return {undefined}
     */
    handleKeyDown (e){
        if (!this.handleAppKeyDown(e)){
            this.handleGlobalKeyDown(e);
        }
    }

    /**
     * Handles key down (and up) events for app shortcuts
     *
     * @param  {Event} e    Event that triggered the method
     * @return {Boolean}    True if event handler is found, false otherwise
     */
    handleAppKeyDown(e){
        var fulfilled = false;
        var keyCode = e.keyCode;
        if (_.includes(this.keyCodes.commandKeyCodes, keyCode)){
            e.stopImmediatePropagation();
            this.pressedKeys = [];
            if (e.type == 'keydown') {
                appState.status.ctrlPressed = true;
            } else if (e.type == 'keyup'){
                appState.status.ctrlPressed = false;
            }
            fulfilled = true;
        } else if (_.includes(this.keyCodes.shiftKeyCodes, keyCode)){
            e.stopImmediatePropagation();
            this.pressedKeys = [];
            if (e.type == 'keydown') {
                appState.status.shiftPressed = true;
            } else if (e.type == 'keyup'){
                appState.status.shiftPressed = false;
            }
            fulfilled = true;
        } else if (_.includes(this.keyCodes.altKeyCodes, keyCode)){
            e.stopImmediatePropagation();
            this.pressedKeys = [];
            if (e.type == 'keydown') {
                appState.status.altPressed = true;
            } else if (e.type == 'keyup'){
                appState.status.altPressed = false;
            }
            fulfilled = true;
        } else {
            if (e.type == 'keydown') {
                if (appState && appState.modalData.currentModal && !appState.modalData.currentModal.preventEscClose && appState.modalData.modalVisible && _.includes(this.keyCodes.escKeyCodes, keyCode)){
                    if (!this.checkNoHandlingKeys()){
                        if (_appWrapper.cancelModalAction && _.isFunction(_appWrapper.cancelModalAction)){
                            _appWrapper.cancelModalAction();
                        } else {
                            _appWrapper.helpers.modalHelper.closeCurrentModal();
                        }
                        fulfilled = true;
                    } else {
                        e.stopImmediatePropagation();
                    }
                } else if (appState && appState.status.ctrlPressed && _.includes(this.keyCodes.closeKeyCodes, keyCode)){
                    if (!this.checkNoHandlingKeys()){
                        _appWrapper.windowManager.closeWindow();
                        fulfilled = true;
                    } else {
                        e.stopImmediatePropagation();
                    }
                } else if (appState && appState.status.ctrlPressed && appState.status.shiftPressed && _.includes(this.keyCodes.reinitializeFeAppKeyCodes, keyCode)){
                    if (!this.checkNoHandlingKeys()){
                        _appWrapper.app.reinitializeFeApp();
                        fulfilled = true;
                    } else {
                        e.stopImmediatePropagation();
                    }
                } else if (appState && appState.status.ctrlPressed && _.includes(this.keyCodes.reloadCssKeyCodes, keyCode)){
                    this.getHelper('staticFiles').reloadCss();
                    fulfilled = true;
                } else if ( appState.status.ctrlPressed && appState.status.shiftPressed && appState && appState.config.debug.enabled && e.type == 'keydown' && _.includes(this.keyCodes.reloadKeyCodes, keyCode)){
                    if (!this.checkNoHandlingKeys()){
                        this.pressedKeys = [];
                        _appWrapper.windowManager.reloadWindow();
                        fulfilled = true;
                    } else {
                        e.stopImmediatePropagation();
                    }
                } else {
                    var nextDebugCode = this.keyCodes.debugKeys[this.pressedKeys.length];
                    if (keyCode == nextDebugCode){
                        this.pressedKeys.push(keyCode);
                    } else {
                        this.pressedKeys = [];
                    }

                    if (this.pressedKeys.length == this.keyCodes.debugKeys.length){
                        this.pressedKeys = [];
                        appState.config.debug.enabled = !appState.config.debug.enabled;
                        fulfilled = true;
                        _appWrapper.appConfig.setConfigVar('debug.enabled', appState.config.debug.enabled);
                        if (appState.config.debug.enabled){
                            this.addNotification('Debug mode enabled.', 'info');
                            this.addUserMessage('Debug mode enabled.', 'info', []);
                        } else {
                            this.addNotification('Debug mode disabled.', 'info');
                            this.addUserMessage('Debug mode disabled.', 'info', []);
                        }
                    }
                }
            }
        }
        return fulfilled;
    }

    /**
     * Handles key down (and up) events for global shortcuts
     *
     * @param  {Event} e    Event that triggered the method
     * @return {Boolean}    True if event handler is found, false otherwise
     */
    handleGlobalKeyDown (e) {
        var keyCode = e.keyCode;
        var key = e.key;
        var type = e.type;
        var globalKeys = _.flattenDeep(_.map(this.globalKeyData, function(item){
            return item.keyCodes;
        }));

        if (_.includes('*', globalKeys) || _.intersection(globalKeys, [keyCode]).length){
            var allHandlers = _.filter(this.globalKeyData, function(item){
                var found = false;
                if (item.key && item.key == key && item.event == type){
                    found = true;
                }
                if (item.event == type && (_.includes('*', globalKeys) || (item.keyCodes && _.includes(item.keyCodes, keyCode)))){
                    found = true;
                }
                return found;
            });
            var shortcutData = [];
            if (allHandlers && allHandlers.length){
                for(let i=0; i<allHandlers.length;i++){
                    var handler = allHandlers[i];
                    if (handler){
                        var handlerFound = true;
                        if (handler.modifiers) {
                            if (handler.modifiers.ctrl && !appState.status.ctrlPressed){
                                handlerFound = false;
                            }
                            if (handler.modifiers.shift && !appState.status.shiftPressed){
                                handlerFound = false;
                            }
                            if (handler.modifiers.alt && !appState.status.altPressed){
                                handlerFound = false;
                            }
                        }
                        if (handlerFound){
                            shortcutData.push(handler);
                        }
                    }
                }
            }
            for (let j=0; j<shortcutData.length; j++){
                var shortcut = shortcutData[j];
                if (shortcut.handler){
                    if (_.isFunction(shortcut.handler)){
                        if (!this.checkNoHandlingKeys()){
                            shortcut.handler(e);
                        }
                    } else if (_.isString(shortcut.handler)){
                        if (!this.checkNoHandlingKeys()){
                            _appWrapper.callObjMethod(shortcut.handler, [e]);
                        }
                    }
                }
            }
        }
    }

    /**
     * Destroys this KeyboardHelper instance, removing its event listeners
     *
     * @return {undefined}
     */
    destroy () {
        super.destroy();
        this.removeEventListeners();
    }

    /**
     * Checks whether global key handlers are enabled
     *
     * @return {Boolean} True if global key handlers are enabled, false otherwise
     */
    checkNoHandlingKeys () {
        if (appState.status.noHandlingKeys){
            if (appState.modalData.modalVisible){
                _appWrapper.addModalMessage('Action prevented because modal is open', 'warning', [], false, false, true, true);
            }
            return true;
        } else {
            return false;
        }
    }
}

exports.KeyboardHelper = KeyboardHelper;