var _ = require('lodash');
var BaseClass = require('../../base').BaseClass;
const fs = require('fs');
const path = require('path');

var _appWrapper;
var appState;


class UserMessageHelper extends BaseClass {
    constructor() {
        super();

        if (window && window.getAppWrapper && _.isFunction(window.getAppWrapper)){
            _appWrapper = window.getAppWrapper();
            appState = _appWrapper.getAppState();
        }

        return this;
    }

    async initialize () {
        return await super.initialize();
    }

    processUserMessageQueue (){
        var messageCount = appState.userMessageQueue.length;
        let intervalDuration = 1;

        clearInterval(appState.intervals.userMessageQueue);
        if (messageCount && !appState.userMessagesData.selectFocused){
            appState.intervals.userMessageQueue = setInterval(this.unQueueUserMessage.bind(this), intervalDuration);
        }
    }

    unQueueUserMessage (){
        if (appState && appState.userMessageQueue && appState.userMessageQueue.length){
            if (appState.userMessageQueue.length > 10){
                appState.config.userMessages.animateMessages = false;
            } else {
                appState.config.userMessages.animateMessages = true;
            }
            let userMessage = appState.userMessageQueue.shift();
            let addMessage = true;
            if (userMessage){
                let lastMessage;
                if (appState.userMessages && appState.userMessages.length){
                    lastMessage = appState.userMessages[appState.userMessages.length-1];
                }
                if (lastMessage && lastMessage.message == userMessage.message && lastMessage.type == userMessage.type){
                    lastMessage.count++;
                    lastMessage.timestamps.push(userMessage.timestamp);
                    lastMessage.timestamp = userMessage.timestamp;
                    addMessage = false;
                }
                if (addMessage){
                    appState.userMessages.push(userMessage);
                }
            }
        } else {
            clearInterval(appState.intervals.userMessageQueue);
        }
    }

    toggleUserMessages (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        _appWrapper.appConfig.setConfigVar('userMessages.messagesExpanded', !this.getConfig('userMessages.messagesExpanded'));
    }

    userMessageLevelSelectFocus () {
        appState.userMessagesData.selectFocused = true;
    }

    userMessageLevelSelectBlur () {
        appState.userMessagesData.selectFocused = false;
    }

    getUserMessageStacksCount () {
        let stackCount = 0;
        for(let i=0; i<appState.userMessages.length; i++){
            if (appState.userMessages[i].stack && appState.userMessages[i].stack.length){
                stackCount++;
            }
        }
        return stackCount;
    }

    getUserMessageStacksState () {
        let stacksCount = this.getUserMessageStacksCount();
        let stacksOpen = 0;
        for(let i=0; i<appState.userMessages.length; i++){
            if (appState.userMessages[i].stack && appState.userMessages[i].stack.length){
                if (appState.userMessages[i].stackVisible){
                    stacksOpen++;
                }
            }
        }
        return stacksOpen >= stacksCount;
    }

    toggleUserMessageStacks () {
        let currentState = !this.getUserMessageStacksState();
        for(let i=0; i<appState.userMessages.length; i++){
            if (appState.userMessages[i].stack && appState.userMessages[i].stack.length){
                appState.userMessages[i].stackVisible = currentState;
            }
        }
    }

    async saveMessages (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        this.showSaveMessagesModal();
    }

    async showSaveMessagesModal () {
        let modalHelper = _appWrapper.getHelper('modal');
        appState.modalData.currentModal = _.cloneDeep(appState.saveUserMessagesModal);
        appState.modalData.currentModal.title = _appWrapper.appTranslations.translate('Saving user messages to file');
        appState.modalData.currentModal.bodyComponent = 'save-user-messages';
        appState.modalData.currentModal.confirmButtonText = _appWrapper.appTranslations.translate('Save');
        appState.modalData.currentModal.cancelButtonText = _appWrapper.appTranslations.translate('Cancel');
        appState.modalData.currentModal.showCancelButton = false;
        appState.modalData.currentModal.confirmDisabled = true;
        appState.modalData.currentModal.saveFileError = false;
        modalHelper.modalBusy(_appWrapper.appTranslations.translate('Please wait...'));
        appState.modalData.currentModal.defaultFilename = 'user-messages-' + _appWrapper.getHelper('format').formatDateNormalize(new Date(), false, true) + '.json';
        _appWrapper._confirmModalAction = this.confirmSaveUserMessagesModalAction;
        _appWrapper.closeModalPromise = new Promise((resolve) => {
            appState.closeModalResolve = resolve;
        });
        modalHelper.openCurrentModal();
        return _appWrapper.closeModalPromise;
    }

    async confirmSaveUserMessagesModalAction (e){
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        let modalHelper = _appWrapper.getHelper('modal');
        appState.modalData.currentModal.saveFileError = false;
        appState.modalData.currentModal.messages = [];

        var fileExists = false;

        var modalElement = window.document.querySelector('.modal-dialog');

        var fileNameElement = modalElement.querySelector('input[type=file]');
        var messageFilePath = fileNameElement.value;

        var saveAll = false;

        var saveAllElement = modalElement.querySelector('input[name=save_hidden_messages]');
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

        if (messageFilePath){
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
                let fileContents = await _appWrapper.fileManager.readFileSync(messageFilePath, {encoding:'utf8'});
                if (fileContents){
                    try {
                        previousMessages = JSON.parse(fileContents);
                    } catch (ex) {
                        this.log('Can not parse file contents for appending!', 'error', []);
                    }
                }
            }

            var messages = _.cloneDeep(appState.userMessages);
            if (saveAll){
                messages = _.cloneDeep(appState.allUserMessages);
            }

            let saveStacks = this.getConfig('userMessages.saveStacksToFile', false);

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
                fs.writeFileSync(messageFilePath, data, {
                    encoding: 'utf8',
                    mode: 0o775,
                    flag: writeMode
                });
                modalHelper.modalNotBusy();
            } catch (e) {
                saved = false;
                this.log('Problem saving user messages file "{1}" - {2}', 'error', [messageFilePath, e]);
                modalHelper.modalNotBusy();
            }
            modalHelper.closeCurrentModal();
            if (saved){
                if (appState.isDebugWindow){
                    this.log('User messages saved successfully', 'info', [], true);
                } else {
                    this.addUserMessage('User messages saved successfully', 'info', [], true,  false, true);
                }
            } else {
                if (appState.isDebugWindow){
                    this.log('User messages saving failed', 'error', [], true);
                } else {
                    this.addUserMessage('User messages saving failed', 'error', [], false,  false);
                }
            }
        }
    }

    saveUserMessagesFileClick (e){
        let fileEl = e.target.parentNode.querySelector('.user-messages-file-picker');
        fileEl.setAttribute('nwsaveas', 'user-messages-' + _appWrapper.getHelper('format').formatDateNormalize(new Date(), false, true) + '.json');
        fileEl.click();
    }

    saveUserMessagesFileChange (e) {
        e.target.parentNode.focus();
        appState.modalData.currentModal.saveFileError = false;
        var modalElement = window.document.querySelector('.modal-dialog');
        var fileNameElement = modalElement.querySelector('input[type=file]');
        var messagesFileName = fileNameElement.value;
        var fileValid = true;
        appState.modalData.currentModal.messages = [];

        if (!messagesFileName){
            appState.modalData.currentModal.saveFileError = true;
            fileValid = false;
        } else {
            if (!_appWrapper.fileManager.fileExists(messagesFileName)){
                appState.modalData.currentModal.fileExists = false;
                let dirPath = path.dirname(messagesFileName);
                if (!_appWrapper.fileManager.isDir(dirPath)){
                    fileValid = false;
                    this.addModalMessage(_appWrapper.appTranslations.translate('Chosen file directory is not a directory!'), 'error', []);
                } else {
                    if (!_appWrapper.fileManager.isFileWritable(messagesFileName)){
                        fileValid = false;
                        this.addModalMessage(_appWrapper.appTranslations.translate('Chosen file is not writable!'), 'error', []);
                    }
                }
            } else {
                appState.modalData.currentModal.fileExists = true;
                var filePath = path.resolve(messagesFileName);
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
}

exports.UserMessageHelper = UserMessageHelper;