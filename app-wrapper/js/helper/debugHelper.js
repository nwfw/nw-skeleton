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
        let modalOptions = {
            title: _appWrapper.appTranslations.translate('Saving debug log to file'),
            bodyComponent: 'save-debug',
            confirmButtonText: _appWrapper.appTranslations.translate('Save'),
            cancelButtonText: _appWrapper.appTranslations.translate('Cancel'),
            showCancelButton: false,
            confirmDisabled: true,
            hasHiddenMessages: appState.allDebugMessages.length - appState.debugMessages.length,
            saveFileError: false,
            defaultFilename: 'debug-' + _appWrapper.getHelper('format').formatDateNormalize(new Date(), false, true) + '.txt',
            busy: true,
            busyText: _appWrapper.appTranslations.translate('Please wait...'),
            onOpen: function() {
                let buttonEl = appState.modalData.modalElement.querySelector('.file-picker-button');
                if (buttonEl){
                    buttonEl.focus();
                }
            },
        };
        _appWrapper._confirmModalAction = _appWrapper.getHelper('util').confirmSaveLogAction;
        modalHelper.openModal('saveDebugModal', modalOptions);
    }

    saveDebugFileClick (e){
        let fileEl = e.target.parentNode.querySelector('.file-picker');
        fileEl.setAttribute('nwsaveas', 'debug-' + _appWrapper.getHelper('format').formatDateNormalize(new Date(), false, true) + '.json');
        fileEl.click();
    }

    saveDebugFileChange () {
        let modalHelper = _appWrapper.getHelper('modal');
        modalHelper.setModalVar('saveFileError', false);
        var modalElement = window.document.querySelector('.modal-dialog');
        var fileNameElement = modalElement.querySelector('input[type=file]');
        var debugFileName = fileNameElement.value;
        var fileValid = true;
        modalHelper.clearModalMessages();
        modalHelper.modalBusy();
        if (!debugFileName){
            appState.modalData.currentModal.saveFileError = true;
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
            modalHelper.modalNotBusy();
        } else {
            modalHelper.setModalVar('file', debugFileName);
            modalHelper.setModalVar('confirmDisabled', false);
            modalHelper.modalNotBusy();
            setTimeout(() => {
                let buttonEl = appState.modalData.modalElement.querySelector('.modal-button-confirm');
                if (buttonEl){
                    buttonEl.focus();
                }
            }, this.getConfig('shortPauseDuration'));
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
        let modalOptions = {
            title: _appWrapper.appTranslations.translate('Debug config editor'),
            confirmButtonText: _appWrapper.appTranslations.translate('Save'),
            cancelButtonText: _appWrapper.appTranslations.translate('Cancel'),
        };
        appState.modalData.currentModal = modalHelper.getModalObject('debugConfigEditorModal', modalOptions);
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
        let utilHelper = _appWrapper.getHelper('util');
        var form = e.target;
        let finalConfig = await utilHelper.setObjectValuesFromForm(form, appState.config);
        await _appWrapper.appConfig.setConfig(finalConfig);
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