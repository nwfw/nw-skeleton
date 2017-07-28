/**
 * @fileOverview UserMessageHelper class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.2.0
 */

var _ = require('lodash');
var BaseClass = require('../../base').BaseClass;
const path = require('path');

var _appWrapper;
var appState;

/**
 * UserMessageHelper class - handles and manages user message operations
 *
 * @class
 * @extends BaseClass
 * @memberof appWrapper.helpers.systemHelpers
 */

class UserMessageHelper extends BaseClass {

    /**
     * Creates UserMessageHelper instance
     *
     * @constructor
     * @return {UserMessageHelper}              Instance of UserMessageHelper class
     */
    constructor() {
        super();

        if (window && window.getAppWrapper && _.isFunction(window.getAppWrapper)){
            _appWrapper = window.getAppWrapper();
            appState = _appWrapper.getAppState();
        }

        this.intervals = {
            userMessageQueue: null
        };

        this.boundMethods = {
            saveUserMessageConfig: null,
            closeUserMessageConfig: null,
        };

        return this;
    }

    /**
     * Processes user message queue, displaying any pending messages
     *
     * @return {undefined}
     */
    processUserMessageQueue (){
        let intervalDuration = 1;

        let queueCount = appState.userMessageQueue.length;
        let maxUserMessages = this.getConfig('userMessages.maxUserMessages', 30);
        let messageCount = this.getStateVar('userMessages.length', 30);

        if ((messageCount + queueCount) > maxUserMessages){
            let startIndex = (messageCount + queueCount) - (maxUserMessages + 1);
            if (appState && appState.userMessages && _.isArray(appState.userMessages)){
                appState.userMessages = appState.userMessages.slice(startIndex);
            }
            if (appState.userMessages.length == 0){
                messageCount = this.getStateVar('userMessages.length', 30);
                if ((messageCount + queueCount) > maxUserMessages){
                    let startIndex = (messageCount + queueCount) - (maxUserMessages + 1);
                    appState.userMessageQueue = appState.userMessageQueue.slice(startIndex);
                }
            }
        }

        clearInterval(this.intervals.userMessageQueue);
        if (queueCount && !appState.userMessagesData.selectFocused){
            this.intervals.userMessageQueue = setInterval(this.unQueueUserMessage.bind(this), intervalDuration);
        }
    }

    /**
     * Removes first user message from the queue and displays it
     *
     * @return {undefined}
     */
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
            clearInterval(this.intervals.userMessageQueue);
        }
    }

    /**
     * Handler for expanding/contracting user-messages conponent
     *
     * @param  {Event} e Event that triggered the method
     * @return {undefined}
     */
    toggleUserMessages (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        _appWrapper.appConfig.setConfigVar('userMessages.messagesExpanded', !this.getConfig('userMessages.messagesExpanded'));
    }

    /**
     * Handler for user message level select 'focus' event
     *
     * @return {undefined}
     */
    userMessageLevelSelectFocus () {
        appState.userMessagesData.selectFocused = true;
    }

    /**
     * Handler for user message level select 'blur' event
     *
     * @return {undefined}
     */
    userMessageLevelSelectBlur () {
        appState.userMessagesData.selectFocused = false;
    }

    /**
     * Gets stack counts for visible user messages
     *
     * @return {Number} Number of visible messages with stack data
     */
    getUserMessageStacksCount () {
        let stackCount = 0;
        for(let i=0; i<appState.userMessages.length; i++){
            if (appState.userMessages[i].stack && appState.userMessages[i].stack.length){
                stackCount++;
            }
        }
        return stackCount;
    }

    /**
     * Gets current stack state for user-messages component (expanded/contracted)
     *
     * @return {Number} Number of unopened stack messages in user-messages message-list component
     */
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

    /**
     * Toggles all user message stacks in user-messages message-list component
     *
     * @return {undefined}
     */
    toggleUserMessageStacks () {
        let currentState = !this.getUserMessageStacksState();
        for(let i=0; i<appState.userMessages.length; i++){
            if (appState.userMessages[i].stack && appState.userMessages[i].stack.length){
                appState.userMessages[i].stackVisible = currentState;
            }
        }
    }

    /**
     * Handler that triggers opening message saving modal dialog
     *
     * @async
     * @param  {Event} e Event that triggered the method
     * @return {undefined}
     */
    async saveMessages (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        this.showSaveMessagesModal();
    }

    /**
     * Opens message saving modal dialog
     *
     * @async
     * @return {undefined}
     */
    async showSaveMessagesModal () {
        let modalHelper = _appWrapper.getHelper('modal');
        let modalOptions = {
            title: _appWrapper.appTranslations.translate('Saving user messages to file'),
            bodyComponent: 'save-user-messages',
            confirmButtonText: _appWrapper.appTranslations.translate('Save'),
            cancelButtonText: _appWrapper.appTranslations.translate('Cancel'),
            showCancelButton: false,
            confirmDisabled: true,
            hasHiddenMessages: appState.allUserMessages.length - appState.userMessages.length,
            saveFileError: false,
            defaultFilename: 'user-messages-' + _appWrapper.getHelper('format').formatDateNormalize(new Date(), false, true) + '.json',
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
        modalHelper.openModal('saveUserMessagesModal', modalOptions);
    }

    /**
     * Handler for file input click event for saving user messages
     *
     * @param  {Event} e Event that triggered the method
     * @return {undefined}
     */
    saveUserMessagesFileClick (e){
        let fileEl = e.target.parentNode.querySelector('.file-picker');
        fileEl.setAttribute('nwsaveas', 'user-messages-' + _appWrapper.getHelper('format').formatDateNormalize(new Date(), false, true) + '.json');
        fileEl.click();
    }

    /**
     * Handler for file input change event for saving user messages - saves user messages to selected file
     *
     * @return {undefined}
     */
    saveUserMessagesFileChange () {
        let modalHelper = _appWrapper.getHelper('modal');
        modalHelper.setModalVar('saveFileError', false);
        var modalElement = window.document.querySelector('.modal-dialog');
        var fileNameElement = modalElement.querySelector('input[type=file]');
        var messagesFileName = fileNameElement.value;
        var fileValid = true;
        modalHelper.clearModalMessages();
        modalHelper.modalBusy();

        if (!messagesFileName){
            modalHelper.setModalVar('saveFileError', true);
            fileValid = false;
        } else {
            if (!_appWrapper.fileManager.fileExists(messagesFileName)){
                modalHelper.setModalVar('fileExists', false);
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
                modalHelper.setModalVar('fileExists', true);
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
            modalHelper.setModalVar('fileExists', false);
            modalHelper.setModalVar('confirmDisabled', true);
            modalHelper.modalNotBusy();
        } else {
            modalHelper.setModalVar('file', messagesFileName);
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

    /**
     * Opens user message config editor modal
     *
     * @return {undefined}
     */
    openUserMessageConfigEditor () {
        let modalHelper = _appWrapper.getHelper('modal');
        let modalOptions = {
            title: _appWrapper.appTranslations.translate('User message config editor'),
            confirmButtonText: _appWrapper.appTranslations.translate('Save'),
            cancelButtonText: _appWrapper.appTranslations.translate('Cancel'),
            busy: true,
            busyText: _appWrapper.appTranslations.translate('Please wait...'),
        };
        _appWrapper._confirmModalAction = this.boundMethods.saveUserMessageConfig;
        _appWrapper._cancelModalAction = this.boundMethods.closeUserMessageConfig;
        modalHelper.openModal('userMessagesConfigEditorModal', modalOptions);
    }

    /**
     * Save user message config link click handler
     *
     * @async
     * @param  {Event} e Event that triggered the method
     * @return {undefined}
     */
    async saveUserMessageConfig (e) {
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

    /**
     * Closes user messages config editor modal
     *
     * @async
     * @param  {Event} e Event that triggered the method
     * @return {undefined}
     */
    async closeUserMessageConfig (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        let modalHelper = _appWrapper.getHelper('modal');
        modalHelper.modalNotBusy();
        _appWrapper._cancelModalAction = _appWrapper.__cancelModalAction;
        return _appWrapper.__cancelModalAction();
    }
}

exports.UserMessageHelper = UserMessageHelper;