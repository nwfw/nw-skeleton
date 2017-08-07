/**
 * @fileOverview app-debug component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.2.1
 */

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * App debug component
 *
 * @name app-debug
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
    name: 'app-debug',
    template: '',
    data: function () {
        return {
            usageData: appState.usageData,
            debugMessages: appState.debugMessages,
            debugMessageCount: appState.debugMessages.length
        };
    },
    beforeCreate: function(){
        if (appState.config.debug.usage){
            _appWrapper.getHelper('debug').startUsageMonitor();
        }
    },
    destroyed: function(){
        if (appState.config.debug.usage){
            _appWrapper.getHelper('debug').stopUsageMonitor();
        }
    },
    methods: {

    },
    computed: {
        appState: function(){
            return appState;
        },
        cpuInnerBarStyle: function() {
            let maxValue = appState.usageData.maxCpu;
            let currentValue = appState.usageData.current.cpu;
            let width = parseInt(currentValue / (maxValue / 100), 10);
            let style = {
                width: width + '%',
            };
            return style;
        },
        memoryInnerBarStyle: function() {
            let maxValue = appState.usageData.maxMemory;
            let currentValue = appState.usageData.current.memory;
            let width = parseInt(currentValue / (maxValue / 100), 10);
            let style = {
                width: width + '%',
            };
            return style;
        },
    }
};