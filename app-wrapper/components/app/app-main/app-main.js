var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

exports.component = {
    name: 'app-main',
    template: '',
    props: ['state'],
    data: function () {
        return appState.mainData;
    },
    computed: {
        appState: function(){
            return appState;
        }
    },
    components: {}
};