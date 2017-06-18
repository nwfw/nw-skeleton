var _ = require('lodash');
var BaseClass = require('../base').BaseClass;

var _appWrapper;
var appState;


class KeyboardHelper extends BaseClass {
    constructor() {
        super();

        _appWrapper = this.getAppWrapper();
        appState = this.getAppState();

        this.keyCodes = {
            debugKeys: [68,69,66,85,71], // d,e,b,u,g
            commandKeyCodes: [224, 17, 91, 93],
            shiftKeyCodes: [16],
            altKeyCodes: [18],
            reloadKeyCodes: [82], // 'r'
            closeKeyCodes: [87], // 'w'
            escKeyCodes: [27],
            reloadCssKeyCodes: [85] // 'u'
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

    async initialize () {
        await super.initialize();
        this.addEventListeners();
    }

    addEventListeners (){
        window.addEventListener('keydown', this.boundMethods.handleKeyDown);
        window.addEventListener('keyup', this.boundMethods.handleKeyDown);
    }

    removeEventListeners (){
        window.removeEventListener('keydown', this.boundMethods.handleKeyDown);
        window.removeEventListener('keyup', this.boundMethods.handleKeyDown);
    }

    registerGlobalShortcut (keyHandler){
        this.globalKeyData.push(keyHandler);
    }

    unRegisterGlobalShortcut (keyHandler){
        this.globalKeyData = _.filter(this.globalKeyData, {
            keyCode: keyHandler.keyCode,
            handler: keyHandler.handler
        });
    }

    handleKeyDown (e){
        if (!this.handleAppKeyDown(e)){
            this.handleGlobalKeyDown(e);
        }
    }

    handleAppKeyDown(e){
        var fulfilled = false;
        var keyCode = e.keyCode;
        if (appState.noHandlingKeys){
            e.stopImmediatePropagation();
            return false;
        }
        if (_.includes(this.keyCodes.commandKeyCodes, keyCode)){
            e.stopImmediatePropagation();
            this.pressedKeys = [];
            if (e.type == 'keydown') {
                appState.ctrlPressed = true;
            } else if (e.type == 'keyup'){
                appState.ctrlPressed = false;
            }
            fulfilled = true;
        } else if (_.includes(this.keyCodes.shiftKeyCodes, keyCode)){
            e.stopImmediatePropagation();
            this.pressedKeys = [];
            if (e.type == 'keydown') {
                appState.shiftPressed = true;
            } else if (e.type == 'keyup'){
                appState.shiftPressed = false;
            }
            fulfilled = true;
        } else if (_.includes(this.keyCodes.altKeyCodes, keyCode)){
            e.stopImmediatePropagation();
            this.pressedKeys = [];
            if (e.type == 'keydown') {
                appState.altPressed = true;
            } else if (e.type == 'keyup'){
                appState.altPressed = false;
            }
            fulfilled = true;
        } else {
            if (e.type == 'keydown') {
                if (appState && appState.modalData.currentModal && appState.modalData.modalVisible && _.includes(this.keyCodes.escKeyCodes, keyCode)){
                    _appWrapper.helpers.modalHelper.closeCurrentModal();
                    fulfilled = true;
                } else if (!appState.noHandlingKeys && appState && appState.ctrlPressed && _.includes(this.keyCodes.closeKeyCodes, keyCode)){
                    _appWrapper.windowManager.closeWindow();
                    fulfilled = true;
                } else if (appState && appState.ctrlPressed && _.includes(this.keyCodes.reloadCssKeyCodes, keyCode)){
                    this.getHelper('staticFiles').reloadCss();
                    fulfilled = true;
                } else if ( appState.ctrlPressed && !appState.noHandlingKeys && appState && appState.debug && e.type == 'keydown' && _.includes(this.keyCodes.reloadKeyCodes, keyCode)){
                    this.pressedKeys = [];
                    _appWrapper.windowManager.reloadWindow();
                    fulfilled = true;
                } else {
                    var nextDebugCode = this.keyCodes.debugKeys[this.pressedKeys.length];
                    if (keyCode == nextDebugCode){
                        this.pressedKeys.push(keyCode);
                    } else {
                        this.pressedKeys = [];
                    }

                    if (this.pressedKeys.length == this.keyCodes.debugKeys.length){
                        this.pressedKeys = [];
                        appState.debug = !appState.debug;
                        fulfilled = true;
                        _appWrapper.appConfig.setConfigVar('debug', appState.debug);
                        var message = 'Debug mode disabled.';
                        if (appState.debug){
                            message = 'Debug mode enabled.';
                        }
                        this.addUserMessage(message, 'info', [], false);
                    }
                }
            }
        }
        return fulfilled;
    }

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
                            if (handler.modifiers.ctrl && !appState.ctrlPressed){
                                handlerFound = false;
                            }
                            if (handler.modifiers.shift && !appState.shiftPressed){
                                handlerFound = false;
                            }
                            if (handler.modifiers.alt && !appState.altPressed){
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
                        shortcut.handler(e);
                    } else if (_.isString(shortcut.handler)){
                        _appWrapper.callObjMethod(shortcut.handler, [e]);

                    }
                }
            }
        }
    }

    destroy () {
        super.destroy();
        this.removeEventListeners();
    }

}

exports.KeyboardHelper = KeyboardHelper;