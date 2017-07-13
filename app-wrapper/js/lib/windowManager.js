const _ = require('lodash');
const BaseClass = require('../base').BaseClass;

let _appWrapper;
var appState;

class WindowManager extends BaseClass {

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
            minimizeWindow: this.minimizeWindow.bind(this),
            toggleMaximize: this.toggleMaximize.bind(this),
            reloadWindow: this.reloadWindow.bind(this),
            toggleDevTools: this.toggleDevTools.bind(this),
            closeWindow: this.closeWindow.bind(this),
            toggleFullScreen: this.toggleFullScreen.bind(this),
            dragWindow: this.dragWindow.bind(this),
            moveWindowMousedown: this.moveWindowMousedown.bind(this),
            moveWindowMouseup: this.moveWindowMouseup.bind(this),
            winStateChanged: this.winStateChanged.bind(this),
            windowRestored: this.windowRestored.bind(this),
            windowResize: this.windowResize.bind(this),
            windowBlur: this.windowBlur.bind(this),
            windowFocus: this.windowFocus.bind(this),
            beforeUnload: this.beforeUnload.bind(this)
        };

        this.timeouts = {
            resize: null
        };

        this.initWinState();
    }

    async initialize(){
        await super.initialize();
        await this.initWindow();
        this.addEventListeners();
    }

    addEventListeners () {
        this.on('winStateChange', this.boundMethods.winStateChanged);
        this.win.on('restore', this.boundMethods.windowRestored);
        this.window.addEventListener('resize', this.boundMethods.windowResize);
        this.window.addEventListener('blur', this.boundMethods.windowBlur);
        this.window.addEventListener('focus', this.boundMethods.windowFocus);
        this.window.addEventListener('beforeunload', this.boundMethods.beforeUnload);
    }

    removeEventListeners () {
        this.removeListener('winStateChange', this.boundMethods.winStateChanged);
        this.win.removeListener('restore', this.boundMethods.windowRestored);
        this.window.removeEventListener('resize', this.boundMethods.windowResize);
        this.window.removeEventListener('blur', this.boundMethods.windowBlur);
        this.window.removeEventListener('focus', this.boundMethods.windowFocus);
        this.window.removeEventListener('beforeunload', this.boundMethods.beforeUnload);

        Object.keys(this.boundMethods).forEach((key) => {
            this.boundMethods[key] = null;
        });

        this.boundMethods = null;
    }

    getWinState (){
        return this.winState;
    }

    setWinState (winState) {
        this.winState = winState;
    }

    winStateChanged (data) {
        this.log('WindowManager: winState changed listener: "{1}" to "{2}"', 'debug', [data.name, data.value]);
        appState.windowState[data.name] = data.value;
    }

    windowRestored (){
        if (this.winState && this.winState.length && this.propagateChange && this.propagateChange.length){
            this.propagateChange.maximized = false;
            this.winState.maximized = false;
            this.propagateChange.maximized = true;
            this.propagateChange.minimized = false;
            this.winState.minimized = false;
            this.propagateChange.minimized = true;
        }
        if (appState && appState.length && appState.windowState && appState.windowState.length){
            appState.windowState.minimized = false;
            appState.windowState.maximized = false;
        }
    }

    async initWindow () {
        var returnPromise;
        var resolveReference;
        returnPromise = new Promise((resolve) => {
            resolveReference = resolve;
        });
        nw.Screen.Init();
        this.screenWidth = nw.Screen.screens[0].bounds.width;
        this.screenHeight = nw.Screen.screens[0].bounds.height;
        var appW = parseInt(this.screenWidth * 0.50, 10);
        var appH = parseInt(this.screenHeight * 0.66, 10);
        var windowPosition = 'center';
        var windowLeft;
        var windowTop;

        if (appState.isDebugWindow){
            appW = 550;
            appH = 400;
            windowPosition = '';
        } else {
            if (appState.config.appConfig.windowConfig){
                if (appState.config.appConfig.windowConfig.width){
                    appW = appState.config.appConfig.windowConfig.width;
                }
                if (appState.config.appConfig.windowConfig.height){
                    appH = appState.config.appConfig.windowConfig.height;
                }
                if (appState.config.appConfig.windowConfig.left){
                    windowLeft = appState.config.appConfig.windowConfig.left;
                }
                if (appState.config.appConfig.windowConfig.top){
                    windowTop = appState.config.appConfig.windowConfig.top;
                }
            }
        }

        if (appState.config.debug.enabled){
            this.document.body.className = this.document.body.className + ' nw-body-debug';
        }

        setTimeout(() => {
            this.winState.width = appW;
            this.winState.height = appH;
            if (appState.config.debug.enabled){
                // this.win.show();
                if (appState.isDebugWindow){
                    this.winState.x = 0;
                    this.winState.y = 0;
                } else {
                    if (windowLeft && windowTop){
                        this.winState.x = windowLeft;
                        this.winState.y = windowTop;
                    } else {
                        this.winState.x = this.screenWidth - (this.winState.width + 5);
                    }
                    // if (this.getConfig('appConfig.windowConfig.fullscreen') != this.winState.fullscreen){
                    //     this.win.toggleFullscreen();
                    // }
                }
                // this.document.body.className = this.document.body.className + ' nw-body-initialized';
                // this.win.focus();
                // this.window.focus();
            } else {
                if (appState.isDebugWindow){
                    this.winState.x = 0;
                    this.winState.y = 0;
                } else {
                    if (windowLeft && windowTop){
                        this.winState.x = windowLeft;
                        this.winState.y = windowTop;
                    } else {
                        if (windowPosition){
                            this.winState.position = windowPosition;
                        } else {
                            this.winState.x = this.screenWidth - (this.winState.width + 5);
                        }
                    }
                    // if (this.getConfig('appConfig.windowConfig.fullscreen') != this.winState.fullscreen){
                    //     this.win.toggleFullscreen();
                    // }
                }
            }
            this.win.show();
            this.document.body.className = this.document.body.className + ' nw-body-initialized';
            this.win.focus();
            this.window.focus();
            resolveReference(true);
        }, 200);
        return returnPromise;
    }

    initWinState () {
        var self = this;

        var propertiesEnumerable = true;
        var propertiesConfigurable = false;

        var localState = {
            title: '',
            position: '',
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
            width: 0,
            height: 0
        };

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
                        this.win.moveTo(localState.x, localState.y);
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
                        this.win.moveTo(localState.x, localState.y);
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

    minimizeWindow (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        this.propagateChange.maximized = false;
        this.winState.maximized = false;
        this.propagateChange.maximized = true;

        this.winState.minimized = !this.winState.minimized;
    }

    toggleMaximize (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        this.propagateChange.minimized = false;
        this.winState.minimized = false;
        this.propagateChange.minimized = true;
        this.winState.maximized = !this.winState.maximized;
    }

    maximizeWindow (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        if (!this.winState.maximized){
            this.toggleMaximize();
        }
    }

    restoreWindow (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        if (this.winState.maximized){
            this.toggleMaximize();
        }
    }

    reloadWindow (e, force, message) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        if (appState.preventReload){
            return false;
        }

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

    toggleDevTools (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        this.winState.devTools = !this.winState.devTools;
    }

    toggleFullScreen (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        this.winState.fullscreen =! this.winState.fullscreen;
        // _appWrapper.appConfig.setConfigVar('appConfig.windowConfig.fullscreen', this.winState.fullscreen);
    }

    closeWindow (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        if (!appState.preventClose){
            this.win.close();
        }
    }

    closeWindowForce (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        if (!appState.preventClose){
            this.win.close(true);
        }
    }

    closeNewWindow(newWindow){
        return nw.Window.get(newWindow).close();
    }

    moveWindowMousedown (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        appState.status.movingWindow = true;
        this.window.addEventListener('mousemove', this.boundMethods.dragWindow);
        this.window.addEventListener('mouseup', this.boundMethods.moveWindowMouseup);
    }

    moveWindowMouseup (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        appState.status.movingWindow = false;
        this.window.removeEventListener('mousemove', this.boundMethods.dragWindow);
        this.window.removeEventListener('mouseup', this.boundMethods.moveWindowMouseup);
        this.windowPositionSizeUpdated();
    }

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
        var windowX = screenX - offsetPosition.offsetLeft + widthAzimuth;
        var windowY = screenY - offsetPosition.offsetTop + heightAzimuth;
        this.win.moveTo(windowX, windowY);
    }

    beforeUnload (){
        this.document.body.className = this.document.body.className.replace(/nw-body-initialized/, '');
        this.removeEventListeners();

    }

    openNewWindow(url, options){
        window._newWindow = nw.Window.open(url, options);
        return window._newWindow;
    }

    setMenu (menu) {
        nw.Window.get().menu = menu;
    }

    windowResize () {
        clearTimeout(this.timeouts.resize);
        this.timeouts.resize = setTimeout( () => {
            this.windowPositionSizeUpdated();
        }, 500);
    }

    windowPositionSizeUpdated () {
        clearTimeout(this.timeouts.resize);
        let newWidth = window.outerWidth;
        let newHeight = window.outerHeight;
        let newLeft = window.screenLeft;
        let newTop = window.screenTop;
        if (appState.status.appInitialized && !this.winState.fullscreen && !this.winState.maximized){
            let config = _.cloneDeep(appState.config.appConfig.windowConfig);
            let configChanged = false;
            if (newWidth && newWidth > 100){
                config.width = newWidth;
                configChanged = true;
            }
            if (newHeight && newHeight > 100){
                config.height = newHeight;
                configChanged = true;
            }
            if (newLeft && newLeft > 0){
                config.left = newLeft;
                configChanged = true;
            }
            if (newTop && newTop > 0){
                config.top = newTop;
                configChanged = true;
            }
            if (configChanged){
                appState.config.appConfig.windowConfig = config;
            }
        }
    }

    windowBlur (){
        appState.status.windowFocused = false;
    }

    windowFocus (){
        appState.status.windowFocused = true;
    }
}

exports.WindowManager = WindowManager;