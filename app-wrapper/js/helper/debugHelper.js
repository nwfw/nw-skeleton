var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var BaseClass = require('../base').BaseClass;

var _appWrapper;
var appUtil;
var appState;


class DebugHelper extends BaseClass {
    constructor() {
        super();

        _appWrapper = this.getAppWrapper();
        appUtil = this.getAppUtil();
        appState = this.getAppState();

        this.forceDebug = false;
        this.forceUserMessages = false;
        this.boundMethods = {
            onDebugWindowUnload: null,
            onDebugWindowClose: null
        };

        this.timeouts = {
            processDebugMessagesTimeout: null
        };

        return this;
    }

    async initialize () {
        return await super.initialize();
    }

    openDebugWindow (){
        appUtil.log('Opening standalone debug window', 'info', [], false, this.forceDebug);
        appState.hasDebugWindow = true;
        _appWrapper.debugWindow = _appWrapper.windowManager.openNewWindow(appUtil.getConfig('debugWindowFile'), {
            id: 'debugWindow',
            frame: false
        });
        appUtil.addUserMessage('Debug window opened', 'info', [], false,  false, this.forceUserMessages, this.forceDebug);
    }

    async initializeDebugWindow () {
        var _debugAppWrapper = _appWrapper.debugWindow.getAppWrapper();
        _debugAppWrapper.windowManager.win.on('close', this.boundMethods.onDebugWindowClose);
        return _appWrapper.debugWindow;
    }

    async prepareDebugWindow () {
        _appWrapper.debugWindow.appState = _.cloneDeep(appState);
        _appWrapper.debugWindow.appState.debugMessages = appState.debugMessages;
        _appWrapper.debugWindow.appState.allDebugMessages = appState.allDebugMessages;
        _appWrapper.debugWindow.appState.config = appState.config;

        _appWrapper.debugWindow.appState.isDebugWindow = true;
        _appWrapper.debugWindow.isDebugWindow = true;

        _appWrapper.debugWindow.document.body.className += ' nw-body-initialized';
        return _appWrapper.debugWindow;
    }

    async onDebugWindowUnload (){
        var _debugAppWrapper = _appWrapper.debugWindow.getAppWrapper();
        _debugAppWrapper.windowManager.win.removeListener('close', this.boundMethods.onDebugWindowClose);
    }

    async onDebugWindowClose (){
        appUtil.log('Closing standalone debug window', 'info', [], false, this.forceDebug);
        appState.debugMessages = _.cloneDeep(_appWrapper.debugWindow.appState.debugMessages);
        appState.hasDebugWindow = false;
        _appWrapper.debugWindow.getAppWrapper().windowManager.closeWindowForce();
        appUtil.addUserMessage('Debug window closed', 'info', [], false,  false, this.forceUserMessages, this.forceDebug);
    }

    toggleDebug () {
        appState.hideDebug = !appState.hideDebug;
        _appWrapper.appConfig.setConfigVar('hideDebug', appState.hideDebug);
    }

    changeDebugLevel(e){
        var level = e.target.value;
        appUtil.addUserMessage('Changing debug level to \'{1}\'.', 'info', [level], false, false, this.forceUserMessages, this.forceDebug);
        appState.debugLevel = level;
        _appWrapper.appConfig.setConfigVar('debugLevel', level);
        if (window.isDebugWindow) {
            appUtil.addUserMessage('Changing debug level in main window to \'{1}\'.', 'info', [level], false, false, this.forceUserMessages, this.forceDebug);
            _appWrapper.mainWindow.appState.debugLevel = level;
        }

    }

    clearDebugMessages () {
        console.clear();
        var messageCount = appState.debugMessages.length;
        for (var i =0; i < messageCount; i++){
            appState.debugMessages.shift();
        }
    }

    processDebugMessages (el){
        clearTimeout(this.timeouts.processDebugMessagesTimeout);
        this.timeouts.processDebugMessagesTimeout = setTimeout(() => {
            var ul = el.querySelector('ul');
            ul.scrollTop = ul.scrollHeight + 100;
            clearTimeout(this.timeouts.processDebugMessagesTimeout);
        }, 100);
    }

    async saveDebug (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        this.showSaveDebugModal();
    }

    async showSaveDebugModal () {
        appState.modalData.currentModal = _.cloneDeep(appState.saveDebugModal);
        appState.modalData.currentModal.title = _appWrapper.appTranslations.translate('Saving debug log to file');
        appState.modalData.currentModal.bodyComponent = 'save-debug';
        appState.modalData.currentModal.confirmButtonText = _appWrapper.appTranslations.translate('Save');
        appState.modalData.currentModal.cancelButtonText = _appWrapper.appTranslations.translate('Cancel');
        appState.modalData.currentModal.showCancelButton = false;
        appState.modalData.currentModal.confirmDisabled = true;
        appState.modalData.currentModal.saveDebugFileError = false;
        appState.modalData.currentModal.messages = [];
        _appWrapper.helpers.modalHelper.modalBusy(_appWrapper.appTranslations.translate('Please wait...'));
        appState.modalData.currentModal.defaultFilename = 'debug-' + _appWrapper.helpers.htmlHelper.formatDateNormalize(new Date(), false, true) + '.txt';
        _appWrapper._confirmModalAction = this.confirmSaveDebugModalAction;
        _appWrapper.closeModalPromise = new Promise((resolve) => {
            appState.closeModalResolve = resolve;
        });
        _appWrapper.helpers.modalHelper.openCurrentModal();
        return _appWrapper.closeModalPromise;
    }

    confirmSaveDebugModalAction (e){
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
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
            var overwriteElement = _.find(overwriteElements, function(el){
                return el.checked;
            });
            fileExists = true;
            var overwriteAction = overwriteElement.value;
        }

        if (debugFilePath){
            _appWrapper.helpers.modalHelper.modalBusy();
            var saved = true;
            var writeMode = 'w';
            if (fileExists && overwriteAction == 'append'){
                writeMode = 'a';
            }

            var messages = appState.debugMessages;
            if (saveAll){
                messages = appState.allDebugMessages;
            }

            var data = _.map(messages, function mapAllDebugMessages(debugMessage){
                return debugMessage.fullTimestamp + ' ' + debugMessage.type.toUpperCase() + ': ' + debugMessage.message;
            }).join('\n');

            try {
                fs.writeFileSync(debugFilePath, data, {
                    encoding: 'utf8',
                    mode: 0x775,
                    flag: writeMode
                });
                _appWrapper.helpers.modalHelper.modalNotBusy();
            } catch (e) {
                saved = false;
                appUtil.log('Problem saving debug log file \'{1}\' - {2}', 'error', [debugFilePath, e], false, this.forceDebug);
                _appWrapper.helpers.modalHelper.modalNotBusy();
            }
            _appWrapper.helpers.modalHelper.closeCurrentModal();
            if (saved){
                if (_appWrapper.isDebugWindow){
                    appUtil.log('Debug log saved successfully', 'info', [], false, true);
                } else {
                    appUtil.addUserMessage('Debug log saved successfully', 'info', [], true,  false, true, this.forceDebug);
                }
            } else {
                if (_appWrapper.isDebugWindow){
                    appUtil.log('Debug log saving failed', 'error', [], false, true);
                } else {
                    appUtil.addUserMessage('Debug log saving failed', 'error', [], false,  false, this.forceUserMessages, this.forceDebug);
                }
            }
        }
    }

    saveDebugFileClick (e){
        var el = e.target;
        el.setAttribute('nwsaveas', 'debug-' + _appWrapper.helpers.htmlHelper.formatDateNormalize(new Date(), false, true) + '.txt');
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
                    appState.modalData.currentModal.messages.push({
                        message: _appWrapper.appTranslations.translate('Chosen file directory is not a directory!'),
                        type: 'error'
                    });
                } else {
                    if (!_appWrapper.fileManager.isFileWritable(debugFileName)){
                        fileValid = false;
                        appState.modalData.currentModal.messages.push({
                            message: _appWrapper.appTranslations.translate('Chosen file is not writable!'),
                            type: 'error'
                        });
                    }
                }
            } else {
                appState.modalData.currentModal.fileExists = true;
                var filePath = path.resolve(debugFileName);
                let dirPath = path.dirname(filePath);

                if (!_appWrapper.fileManager.isFile(filePath)){
                    fileValid = false;
                    appState.modalData.currentModal.messages.push({
                        message: _appWrapper.appTranslations.translate('Chosen file is not a file!'),
                        type: 'error'
                    });
                } else {
                    if (!_appWrapper.fileManager.fileExists(dirPath)){
                        fileValid = false;
                        appState.modalData.currentModal.messages.push({
                            message: _appWrapper.appTranslations.translate('Chosen directory does not exist!'),
                            type: 'error'
                        });
                    } else {
                        if (_appWrapper.fileManager.isDir(dirPath)){
                            if (!_appWrapper.fileManager.isFileWritable(filePath)){
                                fileValid = false;
                                appState.modalData.currentModal.messages.push({
                                    message: _appWrapper.appTranslations.translate('Chosen file is not writable!'),
                                    type: 'error'
                                });
                            }
                        } else {
                            fileValid = false;
                            appState.modalData.currentModal.messages.push({
                                message: _appWrapper.appTranslations.translate('Chosen direcory it not a directory!'),
                                type: 'error'
                            });
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
        appUtil.addUserMessage('User messages cleared', 'info', [], false, false, true, this.forceDebug);
    }
    changeUserMessageLevel (e) {
        var level = e.target.value;
        appState.userMessageLevel = level;
        _appWrapper.appConfig.setConfigVar('userMessageLevel', level);
        appState.userMessagesData.selectFocused = false;
    }
}

exports.DebugHelper = DebugHelper;