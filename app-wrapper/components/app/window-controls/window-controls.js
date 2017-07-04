// const _ = require('lodash');

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'window-controls',
    template: '',
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
        }
    },
    computed: {
        appState: function() {
            return appState;
        }
    }
};