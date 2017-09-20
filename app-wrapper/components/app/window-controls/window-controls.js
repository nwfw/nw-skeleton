/**
 * @fileOverview window-controls component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * Window controls component
 *
 * @name window-controls
 * @memberOf components
 * @property {string}   name        Name of the component
 * @property {string}   template    Component template contents
 * @property {string[]} props       Component properties
 * @property {Function} data        Data function
 * @property {Object}   methods     Component methods
 * @property {Object}   watch       Component watchers
 * @property {Object}   computed    Computed properties
 * @property {Object}   components  Child components
 */
exports.component = {
    name: 'window-controls',
    template: '',
    props: [],
    timeouts: {
        checkSubmenuSizes: null,
    },
    data: function () {
        return {
            timeouts: {}
        };
    },
    updated: function(){
        let duration = parseInt(parseFloat(_appWrapper.getHelper('style').getCssVarValue('--medium-animation-duration'), 10) * 1000, 10);
        clearTimeout(this.timeouts.checkSubmenuSizes);
        this.timeouts.checkSubmenuSizes = setTimeout(() => {
            this.checkSubmenuSizes();
        }, duration);
    },
    methods: {
        openSubmenu: function(e){
            let menuEl = e.target.parentQuerySelector('.window-control-menu-wrapper');
            if (menuEl){
                let menuIdentifier = menuEl.getAttribute('data-submenu');
                let submenuSelector = '.window-control-submenu[data-submenu="' + menuIdentifier + '"]';
                let submenuEl = menuEl.querySelector(submenuSelector);
                if (submenuEl){
                    this.closeAllSubmenus();
                    menuEl.addClass('menu-opened');
                    submenuEl.addEventListener('mouseout', this.closeSubmenuIntent);
                    submenuEl.addEventListener('mouseover', this.keepSubmenuIntent);
                    clearTimeout(this.timeouts[menuIdentifier]);
                    clearTimeout(this.timeouts[menuIdentifier + '_removeMargin']);
                    clearTimeout(this.timeouts[menuIdentifier + '_size']);
                    this.timeouts[menuIdentifier + '_size'] = setTimeout(() => {
                        this.checkSubmenuSize(submenuEl);
                    }, 100);
                }
            }
        },
        keepSubmenuIntent: function(e) {
            let menuEl = e.target.parentQuerySelector('.window-control-menu-wrapper');
            if (menuEl){
                let menuIdentifier = menuEl.getAttribute('data-submenu');
                clearTimeout(this.timeouts[menuIdentifier]);
            }
        },
        closeSubmenuIntent: function(e) {
            let menuEl = e.target.parentQuerySelector('.window-control-menu-wrapper');
            if (menuEl){
                let menuIdentifier = menuEl.getAttribute('data-submenu');
                clearTimeout(this.timeouts[menuIdentifier]);
                this.timeouts[menuIdentifier] = setTimeout(() => {
                    this.closeSubmenu(menuEl);
                }, 800);
            }
        },
        closeSubmenu: function(menuEl) {
            let menuIdentifier = menuEl.getAttribute('data-submenu');
            let submenuSelector = '.window-control-submenu[data-submenu="' + menuIdentifier + '"]';
            let submenuEl = menuEl.querySelector(submenuSelector);
            let duration = parseInt(parseFloat(_appWrapper.getHelper('style').getCssVarValue('--medium-animation-duration'), 10) * 1000, 10);
            if (submenuEl){
                submenuEl.removeEventListener('mouseout', this.closeSubmenuIntent);
                submenuEl.removeEventListener('mouseover', this.keepSubmenuIntent);
                menuEl.removeClass('menu-opened');
                if (this.timeouts[menuIdentifier]){
                    clearTimeout(this.timeouts[menuIdentifier]);
                    delete this.timeouts[menuIdentifier];
                }
                clearTimeout(this.timeouts[menuIdentifier + '_removeMargin']);
                this.timeouts[menuIdentifier + '_removeMargin'] = setTimeout(() => {
                    submenuEl.removeElementStyles(['margin-left']);
                    submenuEl.querySelector('.window-control-submenu-arrow').removeElementStyles(['padding-left']);
                }, duration);
            }
        },
        closeAllSubmenus: function(){
            let openMenus = this.$el.querySelectorAll('.menu-opened');
            if (openMenus && openMenus.length){
                for (let i=0; i<openMenus.length;i++){
                    this.closeSubmenu(openMenus[i]);
                }
            }
        },
        openConfigEditorHandler: function() {
            if (!appState.appError.error && appState.config.debug.enabled){
                _appWrapper.appConfig.openConfigEditor();
                this.closeAllSubmenus();
            }
        },
        toggleAppError: function(){
            appState.appError.error = !appState.appError.error;
        },
        toggleAppInitialized: function(){
            appState.status.appInitialized = !appState.status.appInitialized;
        },
        toggleAppShuttingDown: function(){
            appState.status.appShuttingDown = !appState.status.appShuttingDown;
        },
        clearUserDataHandler: function() {
            _appWrapper.getHelper('modal').confirm(_appWrapper.appTranslations.translate('Are you sure?'), _appWrapper.appTranslations.translate('This will delete your saved data.'), '', '', this.clearUserData.bind(this));
        },
        clearUserData: async function(){
            await _appWrapper.getHelper('userData').boundMethods.clearUserData();
            this.$forceUpdate();
            _appWrapper.getHelper('modal').closeCurrentModal();
        },
        userDataChanged: function(){
            return _appWrapper.getHelper('userData').userDataChanged({});
        },
        checkSubmenuSize: function(submenuEl) {
            let submenuLeft = submenuEl.getAbsolutePosition().offsetLeft;
            let submenuWidth = submenuEl.offsetWidth / 2;
            let windowWidth = window.outerWidth;
            if (submenuLeft + submenuWidth > windowWidth){
                let marginLeft = '-' + Math.abs(windowWidth - (submenuLeft + submenuWidth)) + 'px';
                let paddingLeft = (2 * Math.abs(windowWidth - (submenuLeft + submenuWidth))) + 'px';
                submenuEl.setElementStyles({'margin-left': marginLeft});
                submenuEl.querySelector('.window-control-submenu-arrow').setElementStyles({'padding-left': paddingLeft});
            }
        },
        checkSubmenuSizes: function(){
            let openMenus = this.$el.querySelectorAll('.menu-opened');
            if (openMenus && openMenus.length){
                let submenuSelector = '.window-control-submenu';
                for (let i=0; i<openMenus.length;i++){
                    let submenuEl = openMenus[i].querySelector(submenuSelector);
                    if (submenuEl){
                        this.checkSubmenuSize(submenuEl);
                    }
                }
            }
        },
        messageInfo: function(){
            _appWrapper.messageInfo({}, true);
        },
        asyncMessageInfo: function(){
            _appWrapper.asyncMessageInfo({}, true);
        }

    },
    watch: {},
    computed: {
        appState: function() {
            return appState;
        }
    }
};