/**
 * @fileOverview app-performance-bar component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

const SmoothieChart = require('smoothie').SmoothieChart;
const TimeSeries = require('smoothie').TimeSeries;

/**
 * App performance bar component
 *
 * @name app-performance-bar
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
    name: 'app-performance-bar',
    template: '',
    cpuGraph: null,
    cpuTimeSeries: null,
    memoryGraph: null,
    memoryTimeSeries: null,
    data: function () {
        return appState.usageData;
    },
    beforeCreate: function(){
        if (appState.config.debug.usage){
            _appWrapper.getHelper('debug').startUsageMonitor();
        }
    },
    mounted: function(){
        if (appState.config.debug.usageGraphs){
            this.initGraphs();
        }
    },
    updated: function(){
        if (appState.config.debug.usageGraphs){
            if (this.cpuTimeSeries){
                this.cpuTimeSeries.append(new Date().getTime(), this.current.cpu);
            }
            if (this.memoryTimeSeries){
                this.memoryTimeSeries.append(new Date().getTime(), this.current.memory);
            }
        }
    },
    beforeDestroy: function(){
        _appWrapper.getHelper('debug').stopUsageMonitor();
        if (appState.config.debug.usageGraphs){
            this.destroyGraphs();
        }
    },
    methods: {
        usageIntervalChange: function(){
            _appWrapper.getHelper('debug').usageIntervalChange();
            if (appState.config.debug.usageGraphs){
                this.reinitGraphs();
            }
        },
        initGraphs: function(){
            this.initGraph('cpu');
            this.initGraph('memory');
        },
        initGraph(type){
            if (!(type == 'cpu' || type == 'memory')){
                return;
            }
            this.destroyGraph(type);
            let graphObject;
            let timeSeriesObject;
            let usageInterval = appState.config.debug.usageInterval;
            let graphWraperElement = this.$el.querySelector('.usage-data-item-change-graph-' + type);
            let graphElement = graphWraperElement.querySelector('canvas');

            let chartOptions = this.getGraphOptions(graphWraperElement);
            let timelineOptions = this.getTimelineOptions(graphWraperElement);

            graphObject = new SmoothieChart(chartOptions);
            timeSeriesObject = new TimeSeries();
            graphObject.streamTo(graphElement, usageInterval);
            graphObject.addTimeSeries(timeSeriesObject, timelineOptions);
            _.set(this, type + 'Graph', graphObject);
            _.set(this, type + 'TimeSeries', timeSeriesObject);
        },
        destroyGraph(type){
            if (!(type == 'cpu' || type == 'memory')){
                return;
            }
            let graphObject = _.get(this, type + 'Graph');
            let timeSeriesObject = _.get(this, type + 'TimeSeries');
            if (graphObject && timeSeriesObject){
                graphObject.stop();
                timeSeriesObject.clear();
                timeSeriesObject = null;
                graphObject = null;
                _.set(this, type + 'Graph', graphObject);
                _.set(this, type + 'TimeSeries', timeSeriesObject);
            }
        },
        graphStarted(type){
            let started = false;
            if (!(type == 'cpu' || type == 'memory')){
                return;
            }
            let graphObject = _.get(this, type + 'Graph');
            if (graphObject && graphObject.frame){
                started = true;
            }
            return started;
        },
        pauseGraph: function(type){
            if (!(type == 'cpu' || type == 'memory')){
                return;
            }
            let graphObject = _.get(this, type + 'Graph');
            if (graphObject){
                graphObject.stop();
            }
        },
        resumeGraph: function(type){
            if (!(type == 'cpu' || type == 'memory')){
                return;
            }
            let graphObject = _.get(this, type + 'Graph');
            if (graphObject){
                graphObject.start();
            }
        },
        reinitGraphs: function(){
            this.initGraphs();
        },
        destroyGraphs: function(){
            this.destroyGraph('cpu');
            this.destroyGraph('memory');
        },
        getGraphOptions(graphWraperElement){
            let usageInterval = appState.config.debug.usageInterval;
            let styles = graphWraperElement.getComputedStyles();
            let gridColor = 'transparent';
            let gridLineWidth = 1;

            if (styles){
                if (styles['border-top-color']){
                    gridColor = styles['border-top-color'];
                }
                if (styles['line-height']){
                    gridLineWidth = styles['line-height'];
                }
            }

            let chartOptions = {
                maxValue: undefined,
                minValue: undefined,
                maxValueScale: 1.2,
                minValueScale: 1.2,
                millisPerPixel: usageInterval/10,
                grid: {
                    fillStyle: 'transparent',
                    strokeStyle: gridColor,
                    lineWidth: gridLineWidth,
                    verticalSections: 0,
                    millisPerLine: usageInterval,
                    borderVisible: false
                },
                labels: {
                    disabled: true
                },
                responsive: true
            };
            return chartOptions;
        },
        getTimelineOptions: function(graphWraperElement){
            let styles = graphWraperElement.getComputedStyles();
            let color = '#CCCCCC';
            let chartLineWidth = 1;

            if (styles){
                if (styles['border-bottom-color']){
                    color = styles['border-bottom-color'];
                }
                if (styles['letter-spacing']){
                    chartLineWidth = styles['letter-spacing'];
                }
            }
            let timelineOptions = {
                lineWidth: chartLineWidth,
                strokeStyle: color
            };
            return timelineOptions;
        },
        itemChangeAfterEnter: function(element){
            if (element.hasClass('usage-data-item-change-graph-cpu')){
                this.initGraph('cpu');
            } else if (element.hasClass('usage-data-item-change-graph-memory')){
                this.initGraph('memory');
            }
        },
        itemChangeAfterLeave: function(element){
            if (element.hasClass('usage-data-item-change-graph-cpu')){
                this.destroyGraph('cpu');
            } else if (element.hasClass('usage-data-item-change-graph-memory')){
                this.destroyGraph('memory');
            }
        }
    },
    computed: {
        appState: function(){
            return appState;
        },
        cpuInnerBarStyle: function() {
            let maxValue = appState.usageData.maxCpu * 1.1;
            let currentValue = appState.usageData.current.cpu;
            let width = parseInt(currentValue / (maxValue / 100), 10);
            let style = {
                width: width + '%',
            };
            return style;
        },
        memoryInnerBarStyle: function() {
            let maxValue = appState.usageData.maxMemory * 1.1;
            let currentValue = appState.usageData.current.memory;
            let width = parseInt(currentValue / (maxValue / 100), 10);
            let style = {
                width: width + '%',
            };
            return style;
        },
        cpuExtremesBarStyle: function(){
            let maxValue = appState.usageData.maxCpu;
            let maxLimit = appState.usageData.maxCpu * 1.1;
            let minValue = appState.usageData.minCpu;
            let difference = maxValue - minValue;
            let left = parseInt(minValue / (maxLimit / 100), 10);
            let width = parseInt(difference / (maxLimit / 100), 10);
            let style = {
                left: 'calc(' + left + '% - 1px)',
                width: 'calc(' + width + '% + 2px)',
            };
            return style;
        },
        memoryExtremesBarStyle: function(){
            let maxValue = appState.usageData.maxMemory;
            let maxLimit = appState.usageData.maxMemory * 1.1;
            let minValue = appState.usageData.minMemory;
            let difference = maxValue - minValue;
            let left = parseInt(minValue / (maxLimit / 100), 10);
            let width = parseInt(difference / (maxLimit / 100), 10);
            let style = {
                left: 'calc(' + left + '% - 1px)',
                width: 'calc(' + width + '% + 2px)',
            };
            return style;
        }
    }
};