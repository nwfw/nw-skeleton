const _ = require('lodash');
var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'log-viewer',
    template: '',
    searchValue: '',
    data: function () {
        return {
            logViewerConfig: _.cloneDeep(appState.config.debug)
        };
    },
    methods: {
        performSearch: function(e){
            let searchValue = e.target.value;
            if (searchValue.length < 2){
                this.searchValue = '';
                return;
            } else {
                this.searchValue = searchValue;
            }
            this.typeChange();
        },
        toggleMessageStacks: function () {
            let messages = appState.modalData.currentModal.fileMessages;
            let currentState = !_appWrapper.getHelper('util').getMessageStacksState(messages);
            for(let i=0; i<messages.length; i++){
                if (messages[i].stack && messages[i].stack.length){
                    messages[i].stackVisible = currentState;
                }
            }
        },
        typeChange: function() {
            appState.modalData.currentModal.dataLoaded = false;
            appState.modalData.currentModal.dataLoaded = true;
        },
        getTypes: function() {
            let types = _.uniq(_.map(appState.modalData.currentModal.fileMessages, (msg) => {
                return msg.type;
            }));
            return types;
        },
        getMessages: function() {
            let allowedTypes = [];
            for (let name in appState.modalData.currentModal.displayTypes){
                if (appState.modalData.currentModal.displayTypes[name]){
                    allowedTypes.push(name);
                }
            }
            let messages = _.filter(appState.modalData.currentModal.fileMessages, (msg) => {
                return _.includes(allowedTypes, msg.type);
            });
            if (this.searchValue){
                messages = _.filter(appState.modalData.currentModal.fileMessages, (msg) => {
                    return msg.message.match(new RegExp(_appWrapper.getHelper('util').quoteRegex(this.searchValue), 'i'));
                });
            }
            return messages;
        }
    },
    computed: {
        appState: function(){
            return appState;
        },
        stacksState: function() {
            return _appWrapper.getHelper('util').getMessageStacksState(appState.modalData.currentModal.fileMessages);
        },
        stacksCount: function() {
            return _appWrapper.getHelper('util').getMessageStacksCount(appState.modalData.currentModal.fileMessages);
        },
        typeChangeMethod: function() {
            return this.typeChange.bind(this);
        }
    }
};