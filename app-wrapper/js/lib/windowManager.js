/**
 * @fileOverview WindowManager class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

const _ = require('lodash');
const AppBaseClass = require('./appBase').AppBaseClass;

let _appWrapper;
var appState;

/**
 * WindowManager class - for managing windows in application
 *
 * @class
 * @extends {appWrapper.AppBaseClass}
 * @memberOf appWrapper
 *
 * @property {window}           win                 Reference to nwjs Window object
 * @property {window}           window              Reference to window object
 * @property {document}         document            Reference to document object
 * @property {Number}           screenWidth         Value to store screen width value
 * @property {Number}           screenHeight        Value to store screen height value
 */
class WindowManager extends AppBaseClass {

    /**
     * Creates WindowManager instance
     *
     * @constructor
     * @return {WindowManager}              Instance of WindowManager class
     */
    constructor(){
        super();

        _appWrapper = window.getAppWrapper();
        appState = _appWrapper.getAppState();

        this.win = nw.Window.get();
        this.window = this.win.window;
        this.document = this.win.window.document;

        this.screenWidth = null;
        this.screenHeight = null;

        this.boundMethods = {
            minimizeWindow: null,
            toggleMaximize: null,
            reloadWindow: null,
            toggleDevTools: null,
            closeWindow: null,
            toggleFullScreen: null,
            dragWindow: null,
            moveWindowMousedown: null,
            moveWindowMouseup: null,
            winStateChanged: null,
            windowRestored: null,
            windowResize: null,
            windowBlur: null,
            windowFocus: null,
            beforeUnload: null,
            mouseMoveHandler: null,
        };

        this.timeouts = {
            resize: null,
            showHeader: null,
        };

        this.headerTimer = null;

        this.ignoreResize = false;

        this.initializeScreen();
    }

    /**
     * Initializes WindowManager object
     *
     * @async
     *
     * @param {Object} stateOverrides Overrides for window state
     *
     * @return {WindowManager} Instance of WindowManager class
     */
    async initialize(stateOverrides = {}){
        await super.initialize();
        this.log('Initializing window manager', 'info', []);
        this.initWinState(stateOverrides);
        await this.initWindow();
        this.addEventListeners();
        return this;
    }

    /**
     * Adds event listeners for the WindowManager instance
     *
     * @return {undefined}
     */
    addEventListeners () {
        this.on('winStateChange', this.boundMethods.winStateChanged);
        this.win.on('restore', this.boundMethods.windowRestored);
        this.window.addEventListener('resize', this.boundMethods.windowResize);
        this.window.addEventListener('blur', this.boundMethods.windowBlur);
        this.window.addEventListener('focus', this.boundMethods.windowFocus);
        this.window.addEventListener('beforeunload', this.boundMethods.beforeUnload);
        this.window.addEventListener('mousemove', this.boundMethods.mouseMoveHandler);
    }

    /**
     * Removes event listeners for the WindowManager instance
     *
     * @return {undefined}
     */
    removeEventListeners () {
        this.removeListener('winStateChange', this.boundMethods.winStateChanged);
        this.win.removeListener('restore', this.boundMethods.windowRestored);
        this.window.removeEventListener('resize', this.boundMethods.windowResize);
        this.window.removeEventListener('blur', this.boundMethods.windowBlur);
        this.window.removeEventListener('focus', this.boundMethods.windowFocus);
        this.window.removeEventListener('beforeunload', this.boundMethods.beforeUnload);
        this.window.removeEventListener('mousemove', this.boundMethods.mouseMoveHandler);

        Object.keys(this.boundMethods).forEach((key) => {
            this.boundMethods[key] = null;
        });

        this.boundMethods = null;
    }

    /**
     * Gets winState object
     *
     * @return {Object} winState object
     */
    getWinState (){
        return this.winState;
    }

    /**
     * Sets winState object
     *
     * @param {Object} winState New winState object
     * @return {undefined}
     */
    setWinState (winState) {
        this.winState = winState;
    }

    /**
     * Listener for winState changes
     *
     * @param  {Object} data Changeds in winState object ( properties: name and value )
     * @return {undefined}
     */
    winStateChanged (data) {
        let winState = this.getWindowState();
        this.log('WindowManager: winState changed listener: "{1}" from "{2}" to "{3}"', 'debug', [data.name, winState[data.name], data.value]);
        if (winState[data.name] != data.value) {
            winState[data.name] = data.value;
            let userDataHelper = _appWrapper.getHelper('userData');
            if (userDataHelper && userDataHelper.saveUserData) {
                userDataHelper.saveUserData(appState.userData);
            }
            this.saveWindowConfig();
            this.saveWinState();
        }
    }

    /**
     * Handler for window restored event
     *
     * @return {undefined}
     */
    windowRestored (){
        if (this.winState && this.winState.length && this.propagateChange && this.propagateChange.length){
            this.propagateChange.maximized = false;
            this.winState.maximized = false;
            this.propagateChange.maximized = true;
            this.propagateChange.minimized = false;
            this.winState.minimized = false;
            this.propagateChange.minimized = true;
        }
        let winState = this.getWindowState();
        if (winState && _.isObject(winState)){
            winState.minimized = false;
            winState.maximized = false;
        }
    }

    /**
     * Initializes window for the application
     *
     * @async
     * @return {boolean} Window initialization result
     */
    async initWindow () {
        this.log('Initializing window', 'info', []);
        var returnPromise;
        var resolveReference;
        returnPromise = new Promise((resolve) => {
            resolveReference = resolve;
        });
        let winState = this.getWinState();

        if (!winState.devTools){
            this.win.closeDevTools();
            appState.status.devToolsOpened = false;
        } else {
            this.win.showDevTools();
            appState.status.devToolsOpened = true;
        }
        this.win.moveTo(Math.round(winState.x), Math.round(winState.y));
        this.win.resizeTo(winState.width, winState.height);

        if (appState.config.debug.enabled){
            this.document.body.className = this.document.body.className + ' nw-body-debug';
        }

        setTimeout(() => {
            this.document.body.className = this.document.body.className + ' nw-body-initialized';
            this.log('Window initialized', 'info', []);
            resolveReference(true);
        }, 200);
        return returnPromise;
    }

    /**
     * Initializes nw.screen
     *
     * @return {undefined}
     */
    initializeScreen() {
        this.log('Initializing screen', 'debug', []);
        if (this.screenWidth == null) {
            nw.Screen.Init();
            this.screenWidth = nw.Screen.screens[0].bounds.width;
            this.screenHeight = nw.Screen.screens[0].bounds.height;
        }
    }

    /**
     * Returns initial state for window (loaded from user data or default if no saved state present)
     *
     * @return {Object} Window inital state object with width, height, x and y properties
     */
    getWindowInitialState(){
        let initialState = {
            width: parseInt(this.screenWidth * 0.50, 10),
            height: parseInt(this.screenHeight * 0.66, 10),
            x: 0,
            y: 0
        };

        let windowConfig;

        if (window.subWindowId){
            if (appState.config.appConfig.subWindowConfigs && appState.config.appConfig.subWindowConfigs[window.subWindowId]){
                windowConfig = appState.config.appConfig.subWindowConfigs[window.subWindowId];
            }
        } else {
            windowConfig = appState.config.appConfig.windowConfig;
        }

        if (windowConfig) {
            if (windowConfig.width){
                initialState.width = windowConfig.width;
            }
            if (windowConfig.height){
                initialState.height = windowConfig.height;
            }
            if (windowConfig.left){
                initialState.x = windowConfig.left;
            }
            if (windowConfig.top){
                initialState.y = windowConfig.top;
            }
        }
        return initialState;
    }

    /**
     * Initializes winState object
     *
     * @param {Object} stateOverrides Overrides for window state
     *
     * @return {undefined}
     */
    initWinState (stateOverrides = {}) {
        this.log('Initializing window state', 'info', []);
        let initialState = this.getWindowInitialState();
        var self = this;
        if (!(stateOverrides && _.isObject(stateOverrides))){
            stateOverrides = {};
        }

        var propertiesEnumerable = true;
        var propertiesConfigurable = false;

        var localState = {
            title: '',
            position: null,
            x: 0,
            y: 0,
            maximized: false,
            minimized: false,
            devTools: false,
            showInTaskbar: false,
            resizable: false,
            menu: false,
            icon: false,
            transparent: false,
            show: true,
            kiosk: false,
            frame: false,
            fullscreen: false,
            width: 550,
            height: 900
        };

        _.extend(localState, initialState, stateOverrides);

        this.listeningStatus = {};
        this.propagateChange = {};
        Object.keys(localState).forEach((item) => {
            this.listeningStatus[item] = true;
            this.propagateChange[item] = true;
        });

        var properties =  {
            title: {
                enumerable: propertiesEnumerable,
                configurable: propertiesConfigurable,
                get: () => {
                    return localState.title;
                },
                set: (value) => {
                    localState.title = value;
                    if (this.listeningStatus.title){
                        this.emit('winStateChange', { name: 'title', value: value});
                    }
                    if (this.propagateChange.title){
                        this.win.title = localState.title;
                    }
                }
            },
            position: {
                enumerable: propertiesEnumerable,
                configurable: propertiesConfigurable,
                get: () => {
                    return localState.position;
                },
                set: (value) => {
                    localState.position = value;
                    if (this.listeningStatus.position){
                        this.emit('winStateChange', { name: 'position', value: value});
                    }
                    if (this.propagateChange.position){
                        this.win.setPosition(localState.position);
                    }
                }
            },
            x: {
                enumerable: propertiesEnumerable,
                configurable: propertiesConfigurable,
                get: () => {
                    return localState.x;
                },
                set: (value) => {
                    localState.x = value;
                    if (this.listeningStatus.x){
                        this.emit('winStateChange', { name: 'x', value: value});
                    }
                    if (this.propagateChange.x){
                        this.win.moveTo(Math.round(localState.x), Math.round(localState.y));
                    }
                }
            },
            y: {
                enumerable: propertiesEnumerable,
                configurable: propertiesConfigurable,
                get: () => {
                    return localState.y;
                },
                set: (value) => {
                    localState.y = value;
                    if (this.listeningStatus.y){
                        this.emit('winStateChange', { name: 'y', value: value});
                    }
                    if (this.propagateChange.y){
                        this.win.moveTo(Math.round(localState.x), Math.round(localState.y));
                    }
                }
            },
            minimized: {
                enumerable: propertiesEnumerable,
                configurable: propertiesConfigurable,
                get: () => {
                    return localState.minimized;
                },
                set: (value) => {
                    localState.minimized = value;
                    if (this.listeningStatus.minimized){
                        this.emit('winStateChange', { name: 'minimized', value: value});
                    }
                    if (this.propagateChange.minimized){
                        if (value){
                            self.win.minimize();
                        } else {
                            self.win.restore();
                        }
                    }
                }
            },
            maximized: {
                enumerable: propertiesEnumerable,
                configurable: propertiesConfigurable,
                get: () => {
                    return localState.maximized;
                },
                set: (value) => {
                    localState.maximized = value;
                    if (this.listeningStatus.maximized){
                        this.emit('winStateChange', { name: 'maximized', value: value});
                    }
                    if (this.propagateChange.maximized){
                        if (value){
                            self.win.maximize();
                        } else {
                            self.win.restore();
                        }
                    }
                }
            },
            devTools: {
                enumerable: propertiesEnumerable,
                configurable: propertiesConfigurable,
                get: () => {
                    return localState.devTools;
                },
                set: (value) => {
                    localState.devTools = value;
                    if (this.listeningStatus.devTools){
                        this.emit('winStateChange', { name: 'devTools', value: value});
                    }
                    if (this.propagateChange.devTools){
                        if (!value){
                            this.win.closeDevTools();
                            appState.status.devToolsOpened = false;
                        } else {
                            this.win.showDevTools();
                            appState.status.devToolsOpened = true;
                        }
                    }
                }
            },
            showInTaskbar: {
                enumerable: propertiesEnumerable,
                configurable: propertiesConfigurable,
                get: () => {
                    return localState.showInTaskbar;
                },
                set: (value) => {
                    localState.showInTaskbar = value;
                    if (this.listeningStatus.showInTaskbar){
                        this.emit('winStateChange', { name: 'showInTaskbar', value: value});
                    }
                    if (this.propagateChange.showInTaskbar) {
                        _.noop();
                    }
                }
            },
            resizable: {
                enumerable: propertiesEnumerable,
                configurable: propertiesConfigurable,
                get: () => {
                    return localState.resizable;
                },
                set: (value) => {
                    localState.resizable = value;
                    if (this.listeningStatus.resizable){
                        this.emit('winStateChange', { name: 'resizable', value: value});
                    }
                    if (this.propagateChange.resizable){
                        _.noop();
                    }
                }
            },
            menu: {
                enumerable: propertiesEnumerable,
                configurable: propertiesConfigurable,
                get: () => {
                    return localState.menu;
                },
                set: (value) => {
                    localState.menu = value;
                    if (this.listeningStatus.menu){
                        this.emit('winStateChange', { name: 'menu', value: value});
                    }
                    if (this.propagateChange.menu){
                        _.noop();
                    }
                }
            },
            icon: {
                enumerable: propertiesEnumerable,
                configurable: propertiesConfigurable,
                get: () => {
                    return localState.icon;
                },
                set: (value) => {
                    localState.icon = value;
                    if (this.listeningStatus.icon){
                        this.emit('winStateChange', { name: 'icon', value: value});
                    }
                    if (this.propagateChange.icon){
                        _.noop();
                    }
                }
            },
            transparent: {
                enumerable: propertiesEnumerable,
                configurable: propertiesConfigurable,
                get: () => {
                    return localState.transparent;
                },
                set: (value) => {
                    localState.transparent = value;
                    if (this.listeningStatus.transparent){
                        this.emit('winStateChange', { name: 'transparent', value: value});
                    }
                    if (this.propagateChange.transparent){
                        _.noop();
                    }
                }
            },
            show: {
                enumerable: propertiesEnumerable,
                configurable: propertiesConfigurable,
                get: () => {
                    return localState.show;
                },
                set: (value) => {
                    localState.show = value;
                    if (this.listeningStatus.show){
                        this.emit('winStateChange', { name: 'show', value: value});
                    }
                    if (this.propagateChange.show){
                        this.win.show(localState.show);
                    }
                }
            },
            kiosk: {
                enumerable: propertiesEnumerable,
                configurable: propertiesConfigurable,
                get: () => {
                    return localState.kiosk;
                },
                set: (value) => {
                    localState.kiosk = value;
                    if (this.listeningStatus.kiosk){
                        this.emit('winStateChange', { name: 'kiosk', value: value});
                    }
                    if (this.propagateChange.kiosk){
                        _.noop();
                    }
                }
            },
            frame: {
                enumerable: propertiesEnumerable,
                configurable: propertiesConfigurable,
                get: () => {
                    return localState.frame;
                },
                set: (value) => {
                    localState.frame = value;
                    if (this.listeningStatus.frame){
                        this.emit('winStateChange', { name: 'frame', value: value});
                    }
                    if (this.propagateChange.frame){
                        _.noop();
                    }
                }
            },
            fullscreen: {
                enumerable: propertiesEnumerable,
                configurable: propertiesConfigurable,
                get: () => {
                    return localState.fullscreen;
                },
                set: (value) => {
                    localState.fullscreen = value;
                    if (this.listeningStatus.fullscreen){
                        this.emit('winStateChange', { name: 'fullscreen', value: value});
                    }
                    if (this.propagateChange.fullscreen){
                        // if (this.winState.maximized){
                        //     this.toggleMaximize();
                        // }
                        self.win.toggleFullscreen();
                    }
                }
            },
            width: {
                enumerable: propertiesEnumerable,
                configurable: propertiesConfigurable,
                get: () => {
                    return localState.width;
                },
                set: (value) => {
                    localState.width = value;
                    if (this.listeningStatus.width){
                        this.emit('winStateChange', { name: 'width', value: value});
                    }
                    if (this.propagateChange.width){
                        this.win.resizeTo(localState.width, localState.height);
                    }
                }
            },
            height: {
                enumerable: propertiesEnumerable,
                configurable: propertiesConfigurable,
                get: () => {
                    return localState.height;
                },
                set: (value) => {
                    localState.height = value;
                    if (this.listeningStatus.height){
                        this.emit('winStateChange', { name: 'height', value: value});
                    }
                    if (this.propagateChange.height){
                        this.win.resizeTo(localState.width, localState.height);
                    }
                }
            }
        };
        this.winState = Object.create(Object, properties);
    }

    /**
     * Handler for minimize window event
     *
     * @param  {Event} e Event that triggered the method
     * @return {undefined}
     */
    minimizeWindow (e) {
        this.log('Toggling window minimized', 'info', []);
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        this.winState.minimized = !this.winState.minimized;
    }

    /**
     * Toggles window maximized state on or off
     *
     * @param  {Event} e Event that triggered the method
     * @return {undefined}
     */
    toggleMaximize (e) {
        this.log('Toggling window maximized', 'info', []);
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        this.ignoreResize = true;
        this.propagateChange.minimized = false;
        this.winState.minimized = false;
        this.propagateChange.minimized = true;
        this.winState.maximized = !this.winState.maximized;
    }

    /**
     * Handler for maximize window event
     *
     * @param  {Event} e Event that triggered the method
     * @return {undefined}
     */
    maximizeWindow (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        if (!this.winState.maximized){
            this.toggleMaximize();
        }
    }

    /**
     * Handler for restore window event
     *
     * @param  {Event} e Event that triggered the method
     * @return {undefined}
     */
    restoreWindow (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        if (this.winState.maximized){
            this.toggleMaximize();
        }
    }

    /**
     * Reloads application window
     *
     * @param  {Event} e            Event that triggered the method
     * @param  {boolean} force      Flag to indicate whether to force reload
     * @param  {string} message     Message to display to user
     * @return {undefined}
     */
    reloadWindow (e, force, message) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        if (appState.preventReload){
            this.log('Window reload prevented due to appState.preventReload', 'warning', []);
            return false;
        }
        this.log('Reloading window', 'info', []);

        if (!force){
            this.win.window.getAppWrapper().beforeUnload();
        } else {
            if (!message){
                message = _appWrapper.appTranslations.translate('Please wait while application restarts...');
            }
            appState.mainLoaderTitle = message;
            appState.status.appShuttingDown = true;
            this.win.reload();
        }
    }

    /**
     * Handler for toggleDevTools window event
     *
     * @param  {Event} e Event that triggered the method
     * @return {undefined}
     */
    toggleDevTools (e) {
        this.log('Toggling window devtools', 'info', []);
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        this.winState.devTools = !this.winState.devTools;
    }

    /**
     * Handler for toggleFullscreen window event
     *
     * @param  {Event} e Event that triggered the method
     * @return {undefined}
     */
    toggleFullScreen (e) {
        this.log('Toggling window fullscreen', 'info', []);
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        this.ignoreResize = true;
        this.winState.fullscreen =! this.winState.fullscreen;
    }

    /**
     * Handler for window closing links
     *
     * @param  {Event} e Event that triggered the method
     * @return {undefined}
     */
    closeWindow (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        if (!appState.preventClose){
            this.log('Closing window', 'info', []);
            this.win.close();
        } else {
            this.log('Not closing window due to appState.preventClose flag', 'warning', []);
        }
    }

    /**
     * Handler for forced window closing links
     *
     * @param  {Event} e Event that triggered the method
     * @return {undefined}
     */
    closeWindowForce (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        if (!appState.preventClose){
            this.log('Closing window (forced)', 'info', []);
            this.win.close(true);
        } else {
            this.log('Not (force) closing window due to appState.preventClose flag', 'warning', []);
        }
    }

    /**
     * Closes window by window reference
     *
     * @param  {window} newWindow Window reference
     * @return {undefined}
     */
    closeNewWindow(newWindow){
        return nw.Window.get(newWindow).close();
    }

    /**
     * Handler for mousedown event on 'move' window control link
     *
     * @param  {Event} e Event that triggered the method
     * @return {undefined}
     */
    moveWindowMousedown (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        appState.status.movingWindow = true;
        this.log('Entering window move mode', 'info', []);
        this.window.addEventListener('mousemove', this.boundMethods.dragWindow);
        this.window.addEventListener('mouseup', this.boundMethods.moveWindowMouseup);
    }

    /**
     * Handler for mouseup event on 'move' window control link
     *
     * @param  {Event} e Event that triggered the method
     * @return {undefined}
     */
    moveWindowMouseup (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        appState.status.movingWindow = false;
        this.log('Exiting window move mode', 'info', []);
        this.window.removeEventListener('mousemove', this.boundMethods.dragWindow);
        this.window.removeEventListener('mouseup', this.boundMethods.moveWindowMouseup);
        this.windowPositionSizeUpdated();
    }

    /**
     * Handler for mousemove event on 'move' window control link
     *
     * @param  {Event} e Event that triggered the method
     * @return {undefined}
     */
    dragWindow (e) {
        var link = this.window.document.querySelector('.window-control-move');
        /* link offset position to body */
        var offsetPosition = link.getAbsolutePosition();
        /* azimuths are half of link widths/heights */
        var widthAzimuth = -parseInt(link.parentNode.offsetWidth/2, 10);
        var heightAzimuth = -parseInt(link.parentNode.offsetHeight/2, 10);
        /* mouse pointer position */
        var screenX = e.screenX;
        var screenY = e.screenY;
        /* mouse pointer position */
        var windowX = Math.round(screenX - offsetPosition.offsetLeft + widthAzimuth);
        var windowY = Math.round(screenY - offsetPosition.offsetTop + heightAzimuth);
        this.win.moveTo(windowX, windowY);
    }

    /**
     * Beforeunload method called before window unloads
     *
     * @return {undefined}
     */
    beforeUnload (){
        this.document.body.className = this.document.body.className.replace(/nw-body-initialized/, '');
        this.removeEventListeners();

    }

    /**
     * Opens new window - see {@link http://docs.nwjs.io/en/latest/References/Window/#windowopenurl-options-callback}
     *
     * @param  {string}     url         Url to open
     * @param  {Object}     options     New window options
     * @param  {Function}   callback    Callback called with 'win' param
     * @return {window}                 Reference to new window
     */
    openNewWindow(url, options, callback){
        let newWindow = nw.Window.open(url, options, callback);
        return newWindow;
    }

    /**
     * Sets window menu
     *
     * @param {Object} menu Menu definition - see {@link http://docs.nwjs.io/en/latest/References/Menu/}
     * @return {undefined}
     */
    setMenu (menu) {
        nw.Window.get().menu = menu;
    }

    /**
     * Handler for resize window event
     *
     * @return {undefined}
     */
    windowResize () {
        this.log('Handling window resize', 'info', []);
        clearTimeout(this.timeouts.resize);
        this.timeouts.resize = setTimeout( () => {
            if (!this.ignoreResize){
                if (this.winState.maximized){
                    this.winState.maximized = false;
                }
                this.windowPositionSizeUpdated();
            } else {
                this.ignoreResize = false;
            }
        }, this.getConfig('longPauseDuration'));
    }

    /**
     * Handler called when window position or size are updated. Saves current position and/or size to userConfig
     *
     * @param {Boolean} clearResize Clear resize timeout flag
     * @return {undefined}
     */
    windowPositionSizeUpdated (clearResize = false) {
        if (clearResize) {
            clearTimeout(this.timeouts.resize);
        }
        let newWidth = window.outerWidth;
        let newHeight = window.outerHeight;
        let newLeft = window.screenLeft;
        let newTop = window.screenTop;
        if (appState.status.appInitialized && !this.winState.fullscreen && !this.winState.maximized){
            let config;
            if (window.subWindowId) {
                if (appState.config.appConfig.subWindowConfigs[window.subWindowId]) {
                    config = _.cloneDeep(appState.config.appConfig.subWindowConfigs[window.subWindowId]);
                } else {
                    config = {
                        left: null,
                        top: null,
                        width: null,
                        height: null,
                        fullscreen: false,
                    };
                }
            } else {
                config = _.cloneDeep(appState.config.appConfig.windowConfig);
            }
            let configChanged = false;
            if (newWidth && newWidth > 100){
                config.width = newWidth;
                configChanged = true;
            }
            if (newHeight && newHeight > 100){
                config.height = newHeight;
                configChanged = true;
            }
            if ((newLeft && newLeft > 0) || newLeft == 0) {
                config.left = newLeft;
                configChanged = true;
            }
            if ((newTop && newTop > 0) || newTop == 0) {
                config.top = newTop;
                configChanged = true;
            }
            if (configChanged){
                if (!window.subWindowId) {
                    appState.config.appConfig.windowConfig = config;
                } else {
                    appState.config.appConfig.subWindowConfigs[window.subWindowId] = config;
                }
                this.saveWindowConfig();
            }

        }
    }

    /**
     * Handler called when window position or size are updated. Saves current position and/or size to userConfig
     *
     * @return {undefined}
     */
    saveWindowConfig () {
        this.log('Saving window configuration', 'info', []);
        let newWidth = window.outerWidth;
        let newHeight = window.outerHeight;
        let newLeft = window.screenLeft;
        let newTop = window.screenTop;
        if (appState.status.appInitialized && !this.winState.fullscreen && !this.winState.maximized){
            let config = this.getWindowConfig();
            let configChanged = false;
            if (newWidth && newWidth > 100){
                config.width = newWidth;
                configChanged = true;
            }
            if (newHeight && newHeight > 100){
                config.height = newHeight;
                configChanged = true;
            }
            if ((newLeft && newLeft > 0) || newLeft == 0) {
                config.left = newLeft;
                configChanged = true;
            }
            if ((newTop && newTop > 0) || newTop == 0) {
                config.top = newTop;
                configChanged = true;
            }
            if (configChanged){
                this.setWindowConfig(config);
            }
            _appWrapper.appConfig.saveUserConfig();

        }
    }

    /**
     * Returns current window configuration if saved or default values if not
     *
     * @return {Object} Window config object with left, top, width, height and fullscreen properties
     */
    getWindowConfig () {
        let config;
        if (window.subWindowId) {
            if (appState.config.appConfig.subWindowConfigs[window.subWindowId]) {
                config = _.cloneDeep(appState.config.appConfig.subWindowConfigs[window.subWindowId]);
            } else {
                config = {
                    left: null,
                    top: null,
                    width: null,
                    height: null,
                    fullscreen: false,
                };
            }
        } else {
            config = _.cloneDeep(appState.config.appConfig.windowConfig);
        }
        return config;
    }

    /**
     * Sets window configuration for current window
     *
     * @param {Object}  config   Window config object with left, top, width, height and fullscreen properties
     *
     * @return {undefined}
     */
    setWindowConfig (config) {
        if (!window.subWindowId) {
            appState.config.appConfig.windowConfig = config;
        } else {
            appState.config.appConfig.subWindowConfigs[window.subWindowId] = config;
        }
    }

    /**
     * Handler called when window position or size are updated. Saves current position and/or size to userConfig
     *
     * @return {undefined}
     */
    saveWinState () {
        this.log('Saving window state', 'info', []);
        let newWidth = window.outerWidth;
        let newHeight = window.outerHeight;
        let newLeft = window.screenLeft;
        let newTop = window.screenTop;
        if (appState.status.appInitialized && !this.winState.fullscreen && !this.winState.maximized){
            let winState = this.getWinState();
            let winStateChanged = false;
            if (winState.width != newWidth) {
                winState.width = newWidth;
                winStateChanged = true;
            }
            if (winState.height != newHeight) {
                winState.height = newHeight;
                winStateChanged = true;
            }
            if (winState.y != newTop) {
                winState.y = newTop;
                winStateChanged = true;
            }
            if (winState.x != newLeft) {
                winState.x = newLeft;
                winStateChanged = true;
            }
            if (winStateChanged) {
                this.setWinState(winState);
            }
        }
    }

    /**
     * Handler for window blur event
     *
     * @return {undefined}
     */
    windowBlur (){
        this.log('Window lost focus', 'debug', []);
        appState.status.windowFocused = false;
        appState.lastWindowBlurTimestamp = this.getHelper('util').getUnixTimestamp();
        _appWrapper.emit('window:blur');
    }

    /**
     * Handler for window focus event
     *
     * @return {undefined}
     */
    windowFocus (){
        this.log('Window got focus', 'debug', []);
        appState.status.windowFocused = true;
        appState.lastWindowFocusTimestamp = this.getHelper('util').getUnixTimestamp();
        _appWrapper.emit('window:focus');
    }

    /**
     * Returns duration of app inactivity (app not focused) in seconds
     *
     * @return {Number} Inactivity duration in seconds
     */
    getInactiveDuration() {
        return this.getHelper('util').getUnixTimestamp() - appState.lastWindowBlurTimestamp;
    }

    /**
     * Shows main window
     *
     * @return {undefined}
     */
    showWindow () {
        this.log('Showing window', 'debug', []);
        this.win.show();
        this.focusWindow();
    }

    /**
     * Hides main window
     *
     * @return {undefined}
     */
    hideWindow () {
        this.log('Hiding window', 'debug', []);
        this.win.hide();
    }

    /**
     * Handles mouseMove event and shows or hides header based on config
     *
     * @param  {Event} e Event that triggered the handler
     * @return {undefined}
     */
    mouseMoveHandler (e) {
        if (this.getConfig('appConfig.hideFullscreenHeader') && this.getStateVar('windowState.fullscreen')){
            clearTimeout(this.timeouts.showHeader);
            let yPosition = e.clientY;
            if (!this.headerTimer){
                this.headerTimer = +new Date();
            }
            let headerDelay = + new Date() - this.headerTimer;
            if (yPosition <= 30){
                if (headerDelay > 1000) {
                    clearTimeout(this.timeouts.showHeader);
                    this.headerTimer = null;
                    if (appState.appBodyClasses.indexOf('show-header') == -1){
                        appState.appBodyClasses.push('show-header');
                    }
                }
                this.timeouts.showHeader = setTimeout( () => {
                    this.headerTimer = null;
                    if (appState.appBodyClasses.indexOf('show-header') == -1){
                        appState.appBodyClasses.push('show-header');
                    }
                }, 1000);
            } else {
                if (headerDelay > 2000) {
                    if (!document.querySelectorAll('.window-controls-wrapper .menu-opened').length){
                        clearTimeout(this.timeouts.showHeader);
                        this.headerTimer = null;
                        appState.appBodyClasses = _.without(appState.appBodyClasses, 'show-header');
                    }
                }
                this.timeouts.showHeader = setTimeout( () => {
                    if (!document.querySelectorAll('.window-controls-wrapper .menu-opened').length){
                        this.headerTimer = null;
                        appState.appBodyClasses = _.without(appState.appBodyClasses, 'show-header');
                    }
                }, 2000);
            }
        }
    }

    /**
     * Focuses current window
     *
     * @return {undefined}
     */
    focusWindow () {
        this.log('Focusing window', 'debug', []);
        this.win.focus();
        this.window.focus();
    }

    /**
     * Returns window appState object for current window
     *
     * @return {Object} AppState object
     */
    getWindowState () {
        let windowState;
        if (window.subWindowId) {
            if (!appState.userData.subWindowStates) {
                appState.userData.subWindowStates = {};
            }
            if (appState.userData.subWindowStates[window.subWindowId]) {
                windowState = appState.userData.subWindowStates[window.subWindowId];
            } else {
                windowState = _.cloneDeep(appState.windowStateProto);
                appState.userData.subWindowStates[window.subWindowId] = windowState;
            }
        } else {
            windowState = appState.windowState;
        }
        return windowState;
    }

}

exports.WindowManager = WindowManager;