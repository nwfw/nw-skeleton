/**
 * @fileOverview file-viewer component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

const path = require('path');

let CodeMirror;
try {
    // used for linked lib (npm link)
    CodeMirror = require(path.resolve('./node_modules/nw-skeleton/node_modules/codemirror/lib/codemirror.js'));
} catch (ex) {
    CodeMirror = require(path.resolve('./node_modules/codemirror/lib/codemirror.js'));
}
// require(path.resolve('./node_modules/nw-skeleton/node_modules/codemirror/addon/mode/loadmode.js'));


var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

/**
 * App debug component
 *
 * @name file-viewer
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
    name: 'file-viewer',
    template: '',
    props: [
        'options'
    ],
    uuid: '',
    data: function () {
        let data = _.cloneDeep(appState.fileViewerProtoData);
        let instanceKeys = Object.keys(appState.fileViewerInstances);
        if (instanceKeys.length == 0){
            this.uuid = 1;
        } else {
            this.uuid = parseInt(_.last(instanceKeys.sort()), 10) + 1;
        }

        if (this.options && _.isObject(this.options)){
            data.data = _.merge(data.data, this.options);
        }
        data.uuid = this.uuid;
        appState.fileViewerInstances[this.uuid] = data;
        return appState.fileViewerInstances[this.uuid];
    },
    created: function(){
        let cssFiles = this.config.cssFiles;
        let darkCssFiles = this.config.darkCssFiles;
        let needReload = false;
        for (let i=0; i<cssFiles.length; i++){
            if (!_.includes(appState.componentCssFiles, cssFiles[i])){
                appState.componentCssFiles.push(cssFiles[i]);
                needReload = true;
            }
        }
        if (_appWrapper.getConfig('theme').match(/dark/)){
            for (let i=0; i<darkCssFiles.length; i++){
                if (!_.includes(appState.componentCssFiles, darkCssFiles[i])){
                    appState.componentCssFiles.push(darkCssFiles[i]);
                    needReload = true;
                }
            }
        }
        if (needReload){
            _appWrapper.getHelper('staticFiles').doReloadCss();
        }
        let jsFiles = this.config.jsFiles;
        for (let i=0; i<jsFiles.length; i++){
            require(path.resolve(jsFiles[i]));
        }
    },
    destroyed: function(){
        delete appState.fileViewerInstances[this.uuid];
    },
    mounted: async function(){
        if (this.data.file){
            this.data.code = await _appWrapper.fileManager.loadFile(this.data.file, false);
        }
        CodeMirror.modeURL = path.resolve(this.config.modeUrl);
        let options = _.cloneDeep(this.data.cmOptions);
        if (_.isUndefined(options.mode)){
            options.mode = this.data.mode;
        }
        if (_.isUndefined(options.readOnly)){
            options.readOnly = true;
        }
        if (_.isUndefined(options.theme) && _appWrapper.getConfig('theme').match(/dark/)){
            options.theme = 'blackboard';
        }
        if (this.data.mode){
            CodeMirror.requireMode(this.data.mode, async () => {
                this.$nextTick(async () => {
                    await _appWrapper.wait(1000);
                    this.editorInstance = CodeMirror.fromTextArea(this.$el.querySelector('.file-viewer-textarea'), options);
                });
            });
        } else {
            this.editorInstance = CodeMirror.fromTextArea(this.$el.querySelector('.file-viewer-textarea'), options);
        }
    },
    methods: {
    },
    computed: {}
};