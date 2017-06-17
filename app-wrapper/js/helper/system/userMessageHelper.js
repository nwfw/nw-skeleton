var _ = require('lodash');
var BaseClass = require('../../base').BaseClass;

var _appWrapper;
var appUtil;
var appState;


class UserMessageHelper extends BaseClass {
    constructor() {
        super();

        if (window && window.getAppWrapper && _.isFunction(window.getAppWrapper)){
            _appWrapper = window.getAppWrapper();
            appUtil = _appWrapper.getAppUtil();
            appState = appUtil.getAppState();
        }

        return this;
    }

    async initialize () {
        return await super.initialize();
    }

    processUserMessageQueue (){
        var messageCount = appState.userMessageQueue.length;
        clearInterval(appState.intervals.userMessageQueue);
        if (messageCount && !appState.userMessagesData.selectFocused){
            appState.intervals.userMessageQueue = setInterval(this.unQueueUserMessage.bind(this), 1);
        }
    }

    unQueueUserMessage (){
        if (appState && appState.userMessageQueue && appState.userMessageQueue.length){
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