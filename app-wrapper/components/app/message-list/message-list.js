var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'message-list',
    template: '',
    props: ['messages', 'config'],
    updated: function () {
        let ul = this.$el.querySelector('ul');
        _appWrapper.getHelper('html').scrollElementTo(ul, ul.scrollHeight, 0);
    },
    data: function () {
        return {};
    },
    computed: {
        appState: function(){
            return appState;
        }
    }
};