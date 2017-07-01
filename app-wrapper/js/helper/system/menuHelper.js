const _ = require('lodash');

const BaseClass = require('../../base').BaseClass;

var _appWrapper;
var appState;

class MenuHelper extends BaseClass {
    constructor() {
        super();

        _appWrapper = window.getAppWrapper();
        appState = _appWrapper.getAppState();

        _.noop(_appWrapper);
        _.noop(appState);

        this.boundMethods = {

        };

        this.tray = null;
        this.trayMenu = null;
        this.menu = null;
        this.menuMethodMap = [];
        this.menuShortcutMap = [];
        this.usedShortcuts = [];

        return this;
    }

    async initialize () {
        return await super.initialize();
    }

    initializeAppMenu() {
        let utilHelper = _appWrapper.getHelper('util');
        if (!(!_.isUndefined(this.menu) && this.menu)){
            let menuData = this.getConfig('appConfig.menuData');
            let hasAppMenu = this.getConfig('appConfig.hasAppMenu');
            if (hasAppMenu){
                if (menuData && menuData.mainItemName && menuData.options){
                    this.menu = new nw.Menu({type: 'menubar'});
                    if (!(menuData.menus && menuData.menus.length) && utilHelper.isMac()){
                        this.menu.createMacBuiltin(menuData.mainItemName, menuData.options);
                    }
                }
            } else {
                if (utilHelper.isMac()){
                    if (menuData && menuData.mainItemName && menuData.options){
                        this.menu = new nw.Menu({type: 'menubar'});
                        this.menu.createMacBuiltin(menuData.mainItemName, menuData.options);
                    }
                }
            }
        }
    }

    async setupAppMenu() {
        let utilHelper = _appWrapper.getHelper('util');
        let hasAppMenu = this.getConfig('appConfig.hasAppMenu');
        if (hasAppMenu){
            if (!utilHelper.isMac() && !appState.windowState.frame){
                this.log('You should not be using frameless window with app menus.', 'warning', []);
            }
            let menuData = this.getConfig('appConfig.menuData');
            this.menuMethodMap = [];
            if (menuData && menuData.menus && _.isArray(menuData.menus) && menuData.menus.length){
                for(let i=0; i<menuData.menus.length; i++){
                    let menuMethodData = await this.initializeAppMenuItemData(menuData.menus[i], i);
                    this.menuMethodMap = _.union(this.menuMethodMap, menuMethodData);
                    this.menu.append(await this.initializeAppMenuItem(menuData.menus[i], i));
                }
            }
            _appWrapper.windowManager.setMenu(this.menu);
        } else if (utilHelper.isMac()){
            _appWrapper.windowManager.setMenu(this.menu);
        }
    }

    async initializeAppMenuItem (menuItemData, menuIndex) {
        var menuItem;
        var menuItemObj = _.extend(menuItemData.menuItem, {
            click: this.handleMenuClick.bind(this, menuIndex)
        });
        if (menuItemData.menuItem.shortcut){
            var modifiers = [];
            if (menuItemData.menuItem.shortcut.key){
                menuItemObj.key = menuItemData.menuItem.shortcut.key;
            }
            if (menuItemData.menuItem.shortcut.modifiers){
                if (menuItemData.menuItem.shortcut.modifiers.ctrl){
                    if (_appWrapper.getHelper('util').isMac()){
                        modifiers.push('cmd');
                    } else {
                        modifiers.push('ctrl');
                    }
                }
                if (menuItemData.menuItem.shortcut.modifiers.alt){
                    modifiers.push('alt');
                }
                if (menuItemData.menuItem.shortcut.modifiers.shift){
                    modifiers.push('shift');
                }
            }
            menuItemObj.modifiers = modifiers.join('+');
            let shortcutIdentifier = modifiers.join('+') + '+' + (menuItemObj.key + '').toLowerCase();
            if (_.includes(this.usedShortcuts, shortcutIdentifier)){
                this.log('Double shortcut "{1}" found for menuItem "{2}", ignoring!', 'warning', [shortcutIdentifier, menuItemObj.label]);
                menuItemObj.modifiers = [];
                menuItemObj.key = null;
            } else {
                this.usedShortcuts.push(shortcutIdentifier);
            }
        }
        if (menuItemData.children && menuItemData.children.length){
            let submenu = new nw.Menu();
            for(let i=0; i<menuItemData.children.length; i++){
                submenu.append(await this.initializeAppMenuItem(menuItemData.children[i], menuIndex + '_' + i));
            }

            menuItem = new nw.MenuItem(_.extend(menuItemObj, {submenu: submenu, click: this.handleMenuClick.bind(this, menuIndex)}));
        } else {
            menuItem = new nw.MenuItem(_.extend(menuItemObj));
        }
        return menuItem;
    }

    async initializeAppMenuItemData (menuItemData, menuIndex) {
        var menuData = [];
        menuIndex = menuIndex + '';
        if (menuItemData.menuItem.type != 'separator'){
            let menuMethod;
            if (menuItemData.menuItem && menuItemData.menuItem.method) {
                menuMethod = await _appWrapper.getObjMethod(menuItemData.menuItem.method, [], _appWrapper, true);
            }
            if (!menuMethod){
                this.log('Can not find method "{1}" for menu item with label "{2}"!', 'error', [menuItemData.menuItem.method, menuItemData.menuItem.label]);
            }

            menuData.push({
                menuIndex: menuIndex,
                label: menuItemData.menuItem.label,
                shortcut: menuItemData.menuItem.shortcut,
                method: menuItemData.menuItem.method
            });
            if (menuItemData.children && menuItemData.children.length){
                for(let i=0; i<menuItemData.children.length; i++){
                    menuData = _.union(menuData, await this.initializeAppMenuItemData(menuItemData.children[i], menuIndex + '_' + i));
                }
            }
        } else {
            menuData.push({
                menuIndex: menuIndex,
                label: '__separator__',
                shortcut: null,
                method: 'noop'
            });
        }
        return menuData;
    }

    getMenuItem (menuItemIndex){
        menuItemIndex = menuItemIndex + '';
        let menuItem = _.find(this.menuMethodMap, {menuIndex: menuItemIndex});
        if (!menuItem){
            this.log('Can not find menu item {1}', 'warning', [menuItemIndex]);
        }
        return menuItem;
    }


    getMenuItemChain (menuItemIndex, parentIndex){
        menuItemIndex = menuItemIndex + '';
        let menuItemIndices = menuItemIndex.split('_');
        let currentIndex = menuItemIndices[0] + '';
        if (parentIndex){
            currentIndex = parentIndex + '_' + menuItemIndices[0];
        }

        let currentItem = _.find(this.menuMethodMap, {menuIndex: currentIndex});

        if (menuItemIndices.length > 1){
            parentIndex = currentIndex;
            currentIndex = _.tail(menuItemIndices).join('_');
            currentItem.child = this.getMenuItemChain(currentIndex, parentIndex);
        }
        return currentItem;
    }

    getMenuItemLabelPaths (menuItemIndex){
        let itemChain = this.getMenuItemChain(menuItemIndex);
        return this.getChainLabelPath(itemChain);
    }

    getChainLabelPath (itemChain, labelPaths) {
        if (!labelPaths){
            labelPaths = [];
        }
        if (itemChain && itemChain.label){
            labelPaths.push(itemChain.label);
            if (itemChain && itemChain.child){
                labelPaths = _.union(labelPaths, this.getChainLabelPath(itemChain.child, labelPaths));
            }
        }
        return labelPaths;
    }

    getMenuItemMethodName (menuItemIndex){
        menuItemIndex = menuItemIndex + '';
        let method;
        let menuMethod = _.find(this.menuMethodMap, {menuIndex: menuItemIndex});
        if (menuMethod && menuMethod.method) {
            method = menuMethod.method;
        } else {
            this.log('Can not find method for menu item {1}', 'warning', [menuItemIndex]);
        }
        return method;
    }

    removeAppMenu (){
        if (this.menu && this.menu.items){
            for(let i=1; i<this.menu.items.length;i++){
                this.menu.removeAt(i);
            }
        }
    }

    handleMenuClick (menuIndex) {
        let originalMenuIndex = menuIndex;
        let methodIdentifier = this.getMenuItemMethodName(menuIndex);
        var objectIdentifier;
        var method;
        var object = _appWrapper;
        if (methodIdentifier && _.isFunction(methodIdentifier.match) && methodIdentifier.match(/\./)){
            objectIdentifier = methodIdentifier.replace(/\.[^.]+$/, '');
        }

        if (methodIdentifier){
            method = _.get(_appWrapper, methodIdentifier);
        }

        if (objectIdentifier){
            object = _.get(_appWrapper, objectIdentifier);
        }

        let label = this.getMenuItemLabelPaths(originalMenuIndex).join(' > ');
        if (!methodIdentifier){
            methodIdentifier = 'unknown';
        } else {
            methodIdentifier = 'appWrapper.' + methodIdentifier;
        }

        if (object && method && _.isFunction(method)){
            this.log('Calling menu click handler "{1}" for menuItem "{2}", menuIndex "{3}"!', 'info', [methodIdentifier, label, menuIndex]);
            return method.call(object);
        } else {
            this.log('Can\'t call menu click handler "{1}" for menuItem "{2}", menuIndex "{3}"!', 'error', [methodIdentifier, label, menuIndex]);
            return false;
        }
    }

    handleTrayClick (trayMenuItem) {
        let methodIdentifier = trayMenuItem.method;
        let objectIdentifier;
        let method;
        if (methodIdentifier){
            var object = _appWrapper;
            if (methodIdentifier && _.isFunction(methodIdentifier.match) && methodIdentifier.match(/\./)){
                objectIdentifier = methodIdentifier.replace(/\.[^.]+$/, '');
            }

            if (methodIdentifier){
                method = _.get(_appWrapper, methodIdentifier);
            }

            if (objectIdentifier){
                object = _.get(_appWrapper, objectIdentifier);
            }

            if (!methodIdentifier){
                methodIdentifier = 'unknown';
            } else {
                methodIdentifier = 'appWrapper.' + methodIdentifier;
            }

            if (object && method && _.isFunction(method)){
                this.log('Calling tray menu click handler "{1}" for menuItem "{2}"', 'info', [methodIdentifier, trayMenuItem.label]);
                return method.call(object);
            } else {
                this.log('Can\'t call tray menu click handler "{1}" for menuItem "{2}"!', 'error', [methodIdentifier, trayMenuItem.label]);
                return false;
            }
        }
    }

    async initializeTrayMenuItem (menuItemData) {
        var menuItem;
        if (menuItemData.type != 'separator'){
            if (menuItemData.label){
                menuItemData.label = _appWrapper.appTranslations.translate(menuItemData.label);
            }
            if (menuItemData.tooltip){
                menuItemData.tooltip = _appWrapper.appTranslations.translate(menuItemData.tooltip);
            }
        }
        var menuItemObj = _.extend(menuItemData, {
            click: this.handleTrayClick.bind(this, menuItemData)
        });
        if (menuItemData.children && menuItemData.children.length){
            let submenu = new nw.Menu();
            for(let i=0; i<menuItemData.children.length; i++){
                submenu.append(await this.initializeTrayMenuItem(menuItemData.children[i]));
            }
            menuItem = new nw.MenuItem(_.extend(menuItemObj, {submenu: submenu}));
        } else {
            menuItem = new nw.MenuItem(menuItemObj);
        }
        return menuItem;
    }

    async initializeTrayIcon(){
        let hasTrayIcon = this.getConfig('appConfig.hasTrayIcon');
        if (hasTrayIcon){
            let trayData = _.cloneDeep(this.getConfig('appConfig.trayData'));
            let trayOptions = {
                title: trayData.title,
                icon: trayData.icon
            };
            if (trayData.alticon){
                trayOptions.alticon = trayData.alticon;
            }
            this.tray = new nw.Tray(trayOptions);
            if (trayData.menus && trayData.menus.length){
                this.trayMenu = new nw.Menu();
                for (let i=0; i<trayData.menus.length; i++){
                    let menuItem = await this.initializeTrayMenuItem(trayData.menus[i]);
                    this.trayMenu.append(menuItem);
                }
                this.tray.menu = this.trayMenu;
            }
        }
    }

    async removeTrayIcon(){
        if (this.tray && this.tray.remove && _.isFunction(this.tray.remove)){
            this.tray.remove();
            this.tray = null;
        }
    }
}

exports.MenuHelper = MenuHelper;