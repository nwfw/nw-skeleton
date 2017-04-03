var path = require('path');

exports.config = {
	app : {
		appFile: '../../app/js/app',

		templateExtensionRegex: /\.html$/,
		templateRoot: './node_modules/nw-skeleton/app-wrapper/template/',
		componentTemplateRoot: './node_modules/nw-skeleton/app-wrapper/template/components/',
		modalTemplateRoot: './node_modules/nw-skeleton/app-wrapper/template/components/modal/',
		globalTemplateRoot: './node_modules/nw-skeleton/app-wrapper/template/components/global/',
		formTemplateRoot: './node_modules/nw-skeleton/app-wrapper/template/components/global/form/',

		componentCodeRoot: './node_modules/nw-skeleton/app-wrapper/js/components/',
		globalComponentCodeRoot: './node_modules/nw-skeleton/app-wrapper/js/components/global/',
		modalComponentCodeRoot: './node_modules/nw-skeleton/app-wrapper/js/components/modal/',
		componentCodeRegex: /\.js$/,

		mixinRoot: './node_modules/nw-skeleton/app-wrapper/js/mixins/',

		translationExtensionRegex: /\.i18n\.js$/,
		translationsRoot: './app/data/translations/',

		componentMapping: {
			'app-header': {
				name: 'app-header',
				components: [
					{
						name: 'language-select'
					},
					{
						name: 'live-info'
					},
					{
						name: 'window-controls'
					},
					{
						name: 'progress-bar'
					}
				]
			},
			'app-footer': {
				name: 'app-footer',
				components: [
					{
						name: 'user-messages',
						components: [
							{
								name: 'user-messages-controls'
							},
							{
								name: 'user-messages-list'
							}
						]

					}
				]
			}
		},
	},

	appConfig: {
		initCssFiles: [
			'/node_modules/nw-skeleton/app-wrapper/css/config.css',
		],
		cssFiles: [
			'/node_modules/nw-skeleton/app-wrapper/css/transitions.css',
			'/node_modules/nw-skeleton/app-wrapper/css/header.css',
			'/node_modules/nw-skeleton/app-wrapper/css/modals.css',
			'/node_modules/nw-skeleton/app-wrapper/css/components/user-messages.css',
			'/node_modules/nw-skeleton/app-wrapper/css/components/progress-bar.css',
			'/node_modules/nw-skeleton/app-wrapper/css/style.css'
		],
		initJsFiles: [],
		jsFiles: [
			'/node_modules/nw-skeleton/app-wrapper/js/lib/vue.js'
		],
		debugCssFiles: [
			'/node_modules/nw-skeleton/app-wrapper/css/debug.css'
		],
		debugJsFiles: [],

		appMixinRoot: './node_modules/nw-skeleton/app/js/mixins/',

		appTemplateExtensionRegex: /\.html$/,
		appTemplateRoot: './node_modules/nw-skeleton/app/template/',
		appComponentTemplateRoot: './node_modules/nw-skeleton/app/template/components/',
		appModalTemplateRoot: './node_modules/nw-skeleton/app/template/components/modal/',
		appGlobalTemplateRoot: './node_modules/nw-skeleton/app-wrapper/template/components/global/',
		appFormTemplateRoot: './node_modules/nw-skeleton/app-wrapper/template/components/global/form/',

		appComponentCodeRoot: './node_modules/nw-skeleton/app/js/components/',
		appGlobalComponentCodeRoot: './node_modules/nw-skeleton/app/js/components/global/',
		appModalComponentCodeRoot: './node_modules/nw-skeleton/app/js/components/modal/',
		appComponentCodeRegex: /\.js$/,
	},

	configData: {
		uneditableConfig: [],
		defaultVar: {
			editable: true,
			control: 'text'
		},
		vars: {
			app: {
				editable: false
			},
			appConfig: {
				editable: false
			},
			logDir: {
				editable: false
			},
			varDir: {
				editable: false
			},
			debugMessagesFilename: {
				editable: false
			},
			userMessagesFilename: {
				editable: false
			},
			debugLevels: {
				editable: false
			},
			componentMapping: {
				editable: false
			},
			currentLanguage: {
				editable: true,
				type: 'string',
				control: 'select',
				controlData: {
					items: {
						sr_RS: 'Srpski',
						en_US: 'English'
					}
				}
			},
			currentLocale: {
				editable: true,
				type: 'string',
				control: 'select',
				controlData: {
					items: {
						'sr-rs': 'Srpski',
						'en-us': 'English'
					}
				}
			},
			debugLevel: {
				editable: true,
				type: 'string',
				control: 'select',
				controlData: {
					items: {
						0: 'debug',
						1: 'info',
						2: 'warning',
						3: 'error'
					}
				}
			},
			userMessageLevel: {
				editable: true,
				type: 'string',
				control: 'select',
				controlData: {
					items: {
						0: 'debug',
						1: 'info',
						2: 'warning',
						3: 'error'
					}
				}
			},
		}
	},

	varDir: './app/var',
	logDir: './app/var/log',

	currentLanguage: 'sr_RS',
	currentLocale: 'sr-rs',
	allowLanguageChange: true,
	autoAddLabels: true,

	hideDebug: false,
	debug: true,
	debugToFile: true,
	debugMessagesFilename: './app/var/log/debug-messages.log',
	devTools: true,
	debugLevel: 2,
	debugLevels: {
		'debug': 0,
		'info': 1,
		'warning': 2,
		'error': 3
	},
	userMessageLevel: 2,
	maxUserMessages: 1000,
	userMessagesToFile: true,
	userMessagesFilename: './app/var/log/user-messages.log',

	windowCloseTimeoutDuration: 15000,
	windowReloadTimeoutDuration: 15000
};