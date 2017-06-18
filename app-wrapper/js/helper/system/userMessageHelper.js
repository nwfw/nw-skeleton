var _ = require('lodash');
var BaseClass = require('../../base').BaseClass;

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
                appState.animateMessages = false;
            } else {
                appState.animateMessages = true;
            }
            var userMessage = appState.userMessageQueue.shift();
            if (userMessage){
                appState.userMessages.push(userMessage);
            }
        } else {
            clearInterval(appState.intervals.userMessageQueue);
        }
    }
}

exports.UserMessageHelper = UserMessageHelper;