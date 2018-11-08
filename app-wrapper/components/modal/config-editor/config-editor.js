/**
 * @fileOverview config-editor component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();
/**
 * Config editor component
 *
 * @name config-editor
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
    name: 'config-editor',
    template: '',
    data: function () {
        let utilHelper = _appWrapper.getHelper('util');
        var appConfig = _.cloneDeep(appState.configEditorData);
        var config = _.map(appConfig, function(value, name){
            return utilHelper.getControlObject(value, name, 'config');
        });
        console.log(config.slice(0, 10));
        var data = {
            searchQuery: '',
            config: config
        };

        return data;
    },
    methods: {
        clearSearch: function() {
            this.searchQuery = '';
        },
        getConfigObjects(){
            let objects = this.config;
            if (this.searchQuery && this.searchQuery.length >= 3) {
                objects = this.matchConfigObjects(_.cloneDeep(this.config), this.searchQuery);
            }
            return objects;
        },
        matchConfigObjects(objects, searchQuery) {
            let utilHelper = _appWrapper.getHelper('util');
            let searchRegex = new RegExp(utilHelper.quoteRegex(searchQuery), 'i');
            let isMatch = false;
            for (let i=0; i<objects.length; i++) {
                let object = objects[i];
                if (object.type == 'array') {
                    let childObjects = this.matchConfigObjects(object.value, searchQuery);
                    if (childObjects && childObjects.length && _.filter(childObjects, (item) => !item.hide).length) {
                        isMatch = true;
                    }
                } else if (object.type == 'object') {
                    if (object.name == 'appComponentCodeRegex' || object.name == 'componentMapping') {
                        console.dir(object.hide);
                        console.dir(JSON.parse(JSON.stringify(object.value)));
                    }
                    let childObjects = this.matchConfigObjects(object.value, searchQuery);
                    if (object.name == 'appComponentCodeRegex' || object.name == 'componentMapping') {
                        console.dir(object);
                        console.dir(childObjects);
                        console.dir( _.filter(childObjects, (item) => !item.hide));
                        console.dir('\n\n');
                    }
                    if (childObjects && childObjects.length && _.filter(childObjects, (item) => !item.hide).length) {
                        isMatch = true;
                    }
                } else if (object.name.match(searchRegex) || (object.type === 'string' && object.value && object.value.match && object.value.match(searchRegex))) {
                    isMatch = true;
                }
                if (!isMatch) {
                    object.hide = true;
                } else {
                    object.hide = false;
                }
            }
            return objects;
        },
        getTree(){
            let item = this.getConfigObjects()[2];
            item.children = item.value;
            return item;
        }
    },
    computed: {
        appState: function(){
            return appState;
        },
        configEditorData: function(){
            return appState.configEditorData;
        }
    },
    components: []
};