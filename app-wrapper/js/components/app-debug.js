var _appWrapper = window.getAppWrapper();
var appUtil = _appWrapper.getAppUtil();
var appState = appUtil.getAppState();

exports.component = {
    name: 'app-debug',
    template: _appWrapper.appTemplates.getTemplateContents('app-debug'),
    data: function () {
        return {

        };
    },
    updated: function(){
        clearTimeout(appState.timeouts.scrollTo);
        let ul = this.$el.querySelector('.app-debug-body ul');
        if (ul){
            appState.timeouts.scrollTo = setTimeout( () => {
                _appWrapper.getHelper('html').scrollElementTo(ul, ul.scrollHeight, 0);
            }, 100);
        }
    },
    computed: {
        appState: function(){
            return appState;
        },
        debugMessages: function () {
            return appState.debugMessages
        }
    },
    methods: {
        callViewHandler: _appWrapper.callViewHandler.bind(_appWrapper)
    }
};