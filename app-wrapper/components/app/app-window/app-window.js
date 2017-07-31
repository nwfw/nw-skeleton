/**
 * @fileOverview app-window component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.2.0
 */

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * App window component
 *
 * @name app-window
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
    name: 'app-window',
    template: '',
    props: ['state','isDebug'],
    data: function () {
        return appState.appData;
    },
    methods: {},
    watch: {},
    computed: {
        appState: function(){
            return appState;
        },
        appBodyClassObject: function() {
            let classes = [];
            if (appState){
                if (appState.config) {
                    if (appState.config.theme) {
                        classes.push('theme-' + appState.config.theme);
                    }
                    if (appState.config.debug.enabled){
                        classes.push('debug-enabled');
                        if (!appState.config.debug.hideDebug){
                            classes.push('debug-visible');
                        }
                    }
                    if (appState.config.userMessages && !appState.config.userMessages.hideUserMessages){
                        classes.push('user-messages-visible');
                    }
                }
                if (appState.status){
                    if (appState.status.movingWindow){
                        classes.push('moving-window');
                    }
                    if (appState.status.appLoaded){
                        classes.push('app-loaded');
                    }
                }
                if (appState.appOperation){
                    if (appState.appOperation.operationVisible){
                        classes.push('has-app-operation');
                        if (appState.appOperation.operationActive && appState.appOperation.useProgress){
                            classes.push('has-active-app-operation');
                        }
                    }
                }
                if (!appState.isDebugWindow && appState.hasDebugWindow){
                    classes.push('has-debug-window');
                }
                if (appState.modalData && appState.modalData.modalVisible) {
                    classes.push('modal-visible');
                }
                if (appState.windowState){
                    if (appState.windowState.minimized){
                        classes.push('is-minimized');
                    } else if (appState.windowState.fullscreen){
                        classes.push('is-fulscreen');
                    } else if (appState.windowState.maximized){
                        classes.push('is-maximized');
                    }
                }
            }
            return classes;
        }
    },
    components: {}
};