var _appWrapper = window.getAppWrapper();
var appUtil = _appWrapper.getAppUtil();
var appState = appUtil.getAppState();

var TranslateMixin  = {
	created: function(){

	},

	methods: {
		translate: function (label, currentLanguage) {
			return _appWrapper.appTranslations.translate(label, currentLanguage);
		}
	}
}
exports.mixin = TranslateMixin;