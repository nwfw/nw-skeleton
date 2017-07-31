/**
 * @fileOverview window-controls component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.2.0
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
    data: function () {
        return {
            timeouts: {}
        };
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
            if (submenuEl){
                submenuEl.removeEventListener('mouseout', this.closeSubmenuIntent);
                submenuEl.removeEventListener('mouseover', this.keepSubmenuIntent);
                menuEl.removeClass('menu-opened');
                if (this.timeouts[menuIdentifier]){
                    clearTimeout(this.timeouts[menuIdentifier]);
                    delete this.timeouts[menuIdentifier];
                }
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
            if (!appState.appError.error){
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
            let cleared = await _appWrapper.getHelper('userData').boundMethods.clearUserData();
            this.$forceUpdate();
            _appWrapper.getHelper('modal').closeCurrentModal();
        },
        userDataChanged: function(){
            return _appWrapper.getHelper('userData').userDataChanged({});
        }

    },
    watch: {},
    computed: {
        appState: function() {
            return appState;
        }
    }
};