var _appWrapper = window.getAppWrapper();
var appUtil = _appWrapper.getAppUtil();
var appState = appUtil.getAppState();

exports.component = {
    name: 'app-debug',
    template: _appWrapper.appTemplates.getTemplateContents('app-debug'),
    data: function () {
        return {
            debugMessages: appState.debugMessages
        };
    },
    updated: function(){
        clearTimeout(appState.timeouts.debugMessageScroll);
        let ul = this.$el.querySelector('.app-debug-body ul');
        if (ul){
            appState.timeouts.debugMessageScroll = setTimeout( () => {
                _appWrapper.getHelper('html').scrollElementTo(ul, ul.scrollHeight, 0);
            }, 100);
        }
    },
    computed: {
        appState: function(){
            return appState;
        }
    },
    methods: {
        callViewHandler: _appWrapper.callViewHandler.bind(_appWrapper)
    }
};