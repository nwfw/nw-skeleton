var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var BaseClass = require('../base').BaseClass;

var _appWrapper;
var appState;


class DebugHelper extends BaseClass {
    constructor() {
        super();

        if (window && window.getAppWrapper && _.isFunction(window.getAppWrapper)){
            _appWrapper = window.getAppWrapper();
            appState = _appWrapper.getAppState();
        }

        this.timeouts = {
            processDebugMessagesTimeout: null
        };

        return this;
    }

    async initialize () {
        return await super.initialize();
    }

    async finalize () {
        return true;
    }


    openDebugWindow (){
        this.log('Opening standalone debug window', 'info', []);
        appState.hasDebugWindow = true;
        _appWrapper.debugWindow = _appWrapper.windowManager.openNewWindow(this.getConfig('debug.debugWindowFile'), {
            id: 'debugWindow',
            frame: false
        });
        this.addUserMessage('Debug window opened', 'info', [], false,  false);
    }

    async prepareDebugWindow () {
        _appWrapper.debugWindow.appState = _.cloneDeep(appState);
        _appWrapper.debugWindow.appState.debugMessages = appState.debugMessages;
        _appWrapper.debugWindow.appState.allDebugMessages = appState.allDebugMessages;
        _appWrapper.debugWindow.appState.hasDebugWindow = false;
        _appWrapper.debugWindow.appState.config = appState.config;
        _appWrapper.debugWindow.document.body.className += ' nw-body-initialized';
        return _appWrapper.debugWindow;
    }

    toggleDebug () {
        _appWrapper.appConfig.setConfigVar('debug.hideDebug', !appState.config.debug.hideDebug);
    }

    changeDebugLevel(e){
        var level = e.target.value;
        this.addUserMessage('Changing debug level to "{1}".', 'info', [level], false, false);
        _appWrapper.appConfig.setConfigVar('debug.debugLevel', level);
        if (appState.isDebugWindow) {
            this.addUserMessage('Changing debug level in main window to "{1}".', 'info', [level], false, false);
            _appWrapper.mainWindow.appState.config.debug.debugLevel = level;
        }

    }

    clearDebugMessages () {
        console.clear();
        if (appState.isDebugWindow){
            _appWrapper.mainWindow.appState.allDebugMessages = [];
            _appWrapper.mainWindow.appState.debugMessages = [];
            appState.allDebugMessages = _appWrapper.mainWindow.appState.allDebugMessages;
            appState.debugMessages = _appWrapper.mainWindow.appState.debugMessages;
        } else {
            appState.allDebugMessages = [];
            appState.debugMessages = [];
        }
        this.addUserMessage('Debug messages cleared', 'debug', []);
    }

    async saveDebug (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        this.showSaveDebugModal();
    }

    async showSaveDebugModal () {
        let modalHelper = _appWrapper.getHelper('modal');
        appState.modalData.currentModal = modalHelper.getModalObject('saveDebugModal');
        appState.modalData.currentModal.title = _appWrapper.appTranslations.translate('Saving debug log to file');
        appState.modalData.currentModal.bodyComponent = 'save-debug';
        appState.modalData.currentModal.confirmButtonText = _appWrapper.appTranslations.translate('Save');
        appState.modalData.currentModal.cancelButtonText = _appWrapper.appTranslations.translate('Cancel');
        appState.modalData.currentModal.showCancelButton = false;
        appState.modalData.currentModal.confirmDisabled = true;
        appState.modalData.currentModal.saveDebugFileError = false;
        appState.modalData.currentModal.messages = [];
        modalHelper.modalBusy(_appWrapper.appTranslations.translate('Please wait...'));
        appState.modalData.currentModal.defaultFilename = 'debug-' + _appWrapper.getHelper('format').formatDateNormalize(new Date(), false, true) + '.txt';
        _appWrapper._confirmModalAction = this.confirmSaveDebugModalAction;
        _appWrapper.closeModalPromise = new Promise((resolve) => {
            appState.closeModalResolve = resolve;
        });
        modalHelper.openCurrentModal();
        return _appWrapper.closeModalPromise;
    }

    async confirmSaveDebugModalAction (e){
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        let modalHelper = _appWrapper.getHelper('modal');
        appState.modalData.currentModal.saveDebugFileError = false;
        appState.modalData.currentModal.messages = [];

        var fileExists = false;

        var modalElement = window.document.querySelector('.modal-dialog');

        var fileNameElement = modalElement.querySelector('input[type=file]');
        var debugFilePath = fileNameElement.value;

        var saveAll = false;

        var saveAllElement = modalElement.querySelector('input[name=save_hidden_debug]');
        if (saveAllElement){
            saveAll = saveAllElement.value ? true : false;
        }

        var overwriteElements = modalElement.querySelectorAll('input[name=overwrite_file]');
        if (overwriteElements && overwriteElements.length){
            var overwriteElement = _.find(overwriteElements, (el) => {
                return el.checked;
            });
            fileExists = true;
            var overwriteAction = overwriteElement.value;
        }

        if (debugFilePath){
            modalHelper.modalBusy();
            var saved = true;
            var writeMode = 'w';
            let append = overwriteAction == 'append';

            // if (fileExists && overwriteAction == 'append'){
            //     writeMode = 'a';
            // }
            //
            let previousMessages = [];
            if (append && fileExists){
                let fileContents = await _appWrapper.fileManager.readFileSync(debugFilePath, {encoding:'utf8'});
                if (fileContents){
                    try {
                        previousMessages = JSON.parse(fileContents);
                    } catch (ex) {
                        this.log('Can not parse file contents for appending!', 'error', []);
                    }
                }
            }

            var messages = _.cloneDeep(appState.debugMessages);
            if (saveAll){
                messages = _.cloneDeep(appState.allDebugMessages);
            }

            let saveStacks = this.getConfig('debug.saveStacksToFile', false);

            let processedMessages = _.map(messages, (message) => {
                if (message.stackVisible){
                    message.stackVisible = false;
                }
                delete message.force;
                delete message.active;
                if (!saveStacks){
                    delete message.stackVisible;
                    delete message.stack;
                }
                return message;
            });

            processedMessages = _.union(previousMessages, processedMessages);

            var data = JSON.stringify(processedMessages, ' ', 4);

            try {
                fs.writeFileSync(debugFilePath, data, {
                    encoding: 'utf8',
                    mode: 0o775,
                    flag: writeMode
                });
                modalHelper.modalNotBusy();
            } catch (e) {
                saved = false;
                this.log('Problem saving debug log file "{1}" - {2}', 'error', [debugFilePath, e]);
                modalHelper.modalNotBusy();
            }
            modalHelper.closeCurrentModal();
            if (saved){
                if (appState.isDebugWindow){
                    this.log('Debug log saved successfully', 'info', [], true);
                } else {
                    this.addUserMessage('Debug log saved successfully', 'info', [], true,  false, true);
                }
            } else {
                if (appState.isDebugWindow){
                    this.log('Debug log saving failed', 'error', [], true);
                } else {
                    this.addUserMessage('Debug log saving failed', 'error', [], false,  false);
                }
            }
        }
    }

    saveDebugFileClick (e){
        let fileEl = e.target.parentNode.querySelector('.debug-file-picker');
        fileEl.setAttribute('nwsaveas', 'debug-' + _appWrapper.getHelper('format').formatDateNormalize(new Date(), false, true) + '.json');
        fileEl.click();
    }

    saveDebugFileChange (e) {
        e.target.parentNode.focus();
        appState.modalData.currentModal.saveDebugFileError = false;
        var modalElement = window.document.querySelector('.modal-dialog');
        var fileNameElement = modalElement.querySelector('input[type=file]');
        var debugFileName = fileNameElement.value;
        var fileValid = true;
        appState.modalData.currentModal.messages = [];

        if (!debugFileName){
            appState.modalData.currentModal.saveDebugFileError = true;
            fileValid = false;
        } else {
            if (!_appWrapper.fileManager.fileExists(debugFileName)){
                appState.modalData.currentModal.fileExists = false;
                let dirPath = path.dirname(debugFileName);
                if (!_appWrapper.fileManager.isDir(dirPath)){
                    fileValid = false;
                    this.addModalMessage(_appWrapper.appTranslations.translate('Chosen file directory is not a directory!'), 'error', []);
                } else {
                    if (!_appWrapper.fileManager.isFileWritable(debugFileName)){
                        fileValid = false;
                        this.addModalMessage(_appWrapper.appTranslations.translate('Chosen file is not writable!'), 'error', []);
                    }
                }
            } else {
                appState.modalData.currentModal.fileExists = true;
                var filePath = path.resolve(debugFileName);
                let dirPath = path.dirname(filePath);

                if (!_appWrapper.fileManager.isFile(filePath)){
                    fileValid = false;
                    this.addModalMessage(_appWrapper.appTranslations.translate('Chosen file is not a file!'), 'error', []);
                } else {
                    if (!_appWrapper.fileManager.fileExists(dirPath)){
                        fileValid = false;
                        this.addModalMessage(_appWrapper.appTranslations.translate('Chosen directory does not exist!'), 'error', []);
                    } else {
                        if (_appWrapper.fileManager.isDir(dirPath)){
                            if (!_appWrapper.fileManager.isFileWritable(filePath)){
                                fileValid = false;
                                this.addModalMessage(_appWrapper.appTranslations.translate('Chosen file is not writable!'), 'error', []);
                            }
                        } else {
                            fileValid = false;
                            this.addModalMessage(_appWrapper.appTranslations.translate('Chosen direcory it not a directory!'), 'error', []);
                        }
                    }
                }
            }
        }
        if (!fileValid){
            appState.modalData.currentModal.fileExists = false;
            appState.modalData.currentModal.confirmDisabled = true;
        } else {
            appState.modalData.currentModal.confirmDisabled = false;
        }
    }

    clearUserMessages (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        appState.userMessageQueue = [];
        appState.userMessages = [];
        this.log('User messages cleared', 'info', []);
    }
    changeUserMessageLevel (e) {
        var level = e.target.value;
        _appWrapper.appConfig.setConfigVar('userMessages.userMessageLevel', level);
        appState.userMessagesData.selectFocused = false;
    }

    openDebugConfigEditor () {
        let modalHelper = _appWrapper.getHelper('modal');
        appState.modalData.currentModal = modalHelper.getModalObject('debugConfigEditorModal');
        appState.modalData.currentModal.title = _appWrapper.appTranslations.translate('Debug config editor');
        appState.modalData.currentModal.confirmButtonText = _appWrapper.appTranslations.translate('Save');
        appState.modalData.currentModal.cancelButtonText = _appWrapper.appTranslations.translate('Cancel');
        modalHelper.modalBusy(_appWrapper.appTranslations.translate('Please wait...'));
        _appWrapper._confirmModalAction = this.saveDebugConfig.bind(this);
        _appWrapper._cancelModalAction = (evt) => {
            if (evt && evt.preventDefault && _.isFunction(evt.preventDefault)){
                evt.preventDefault();
            }
            // appState.status.noHandlingKeys = false;
            modalHelper.modalNotBusy();
            _appWrapper._cancelModalAction = _appWrapper.__cancelModalAction;
            return _appWrapper.__cancelModalAction();
        };
        modalHelper.openCurrentModal();
    }

    async saveDebugConfig (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        let modalHelper = _appWrapper.getHelper('modal');
        var form = e.target;
        let newConfig = {};
        _.each(form, (input) => {
            if (input.getAttribute('type') == 'checkbox'){
                let path = input.getAttribute('data-path');
                var currentConfig = newConfig;
                var appConfig = _.cloneDeep(appState.config);
                var dataPath = path;
                if (dataPath && dataPath.split){
                    var pathChunks = _.drop(dataPath.split('.'), 1);
                    var chunkCount = pathChunks.length - 1;
                    _.each(pathChunks, (pathChunk, i) => {
                        if (i == chunkCount){
                            currentConfig[pathChunk] = input.checked;
                        } else {
                            if (_.isUndefined(currentConfig[pathChunk])){
                                currentConfig[pathChunk] = {};
                            }
                        }
                        currentConfig = currentConfig[pathChunk];
                        appConfig = appConfig[pathChunk];
                    });
                }
            }
        });
        var oldConfig = _.cloneDeep(appState.config);
        var difference = _appWrapper.getHelper('util').difference(oldConfig, newConfig);

        if (difference && _.isObject(difference) && _.keys(difference).length){
            var finalConfig = _appWrapper.mergeDeep({}, appState.config, difference);
            await _appWrapper.appConfig.setConfig(finalConfig);
            modalHelper.closeCurrentModal();
        } else {
            modalHelper.closeCurrentModal();
        }

        modalHelper.closeCurrentModal();

    }

    getDebugMessageStacksCount () {
        let stackCount = 0;
        for(let i=0; i<appState.debugMessages.length; i++){
            if (appState.debugMessages[i].stack && appState.debugMessages[i].stack.length){
                stackCount++;
            }
        }
        return stackCount;
    }

    getDebugMessageStacksState () {
        let stacksCount = this.getDebugMessageStacksCount();
        let stacksOpen = 0;
        for(let i=0; i<appState.debugMessages.length; i++){
            if (appState.debugMessages[i].stack && appState.debugMessages[i].stack.length){
                if (appState.debugMessages[i].stackVisible){
                    stacksOpen++;
                }
            }
        }
        return stacksOpen >= stacksCount;
    }

    toggleDebugMessageStacks () {
        let currentState = !this.getDebugMessageStacksState();
        for(let i=0; i<appState.debugMessages.length; i++){
            if (appState.debugMessages[i].stack && appState.debugMessages[i].stack.length){
                appState.debugMessages[i].stackVisible = currentState;
            }
        }
    }

    toggleDebugMessages () {
        _appWrapper.appConfig.setConfigVar('debug.messagesExpanded', !this.getConfig('debug.messagesExpanded'));
    }

}

exports.DebugHelper = DebugHelper;