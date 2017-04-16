var path = require('path');

exports.config = {
	wrapper : {
		appFile: '../../app/js/app',

		templateExtensionRegex: /\.html$/,
		templateDirectories: {
			template: [
				'./node_modules/nw-skeleton/app-wrapper/template/',
				'./node_modules/nw-skeleton/app-wrapper/template/components/global/'
			],
			componentTemplate: [
				'./node_modules/nw-skeleton/app-wrapper/template/components/',
				'./node_modules/nw-skeleton/app-wrapper/template/components/modal/',
				'./node_modules/nw-skeleton/app-wrapper/template/components/global/form/'
			]
		},

		componentCodeRegex: /\.js$/,
		componentDirectories: {
			component: ['./node_modules/nw-skeleton/app-wrapper/js/components/'],
			globalComponent: ['./node_modules/nw-skeleton/app-wrapper/js/components/global/', './node_modules/nw-skeleton/app-wrapper/js/components/global/form'],
			modalComponent: ['./node_modules/nw-skeleton/app-wrapper/js/components/modal/']
		},

		helperDirectories: ['./node_modules/nw-skeleton/app-wrapper/js/helper/'],

		mixinRoot: './node_modules/nw-skeleton/app-wrapper/js/mixin/',

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
			'/node_modules/nw-skeleton/app-wrapper/css/components/translation-editor.css',
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

		mixinRoot: './app/js/mixin/',

		appTemplateExtensionRegex: /\.html$/,
		templateDirectories: {
			template: [
				'./app/template/',
				'./app/template/components/global/'
			],
			componentTemplate: [
				'./app/template/components/',
				'./app/template/components/modal/',
			]
		},

		appComponentCodeRoot: './node_modules/nw-skeleton/app/js/components/',
		appGlobalComponentCodeRoot: './node_modules/nw-skeleton/app/js/components/global/',
		appModalComponentCodeRoot: './node_modules/nw-skeleton/app/js/components/modal/',
		appComponentCodeRegex: /\.js$/,
	},

	configData: {
		uneditableConfig: [],
		noReloadConfig: [],
		defaultVar: {
			editable: true,
			reload: true,
			control: 'text'
		},
		vars: {
			app: {
				editable: false,
				reload: true
			},
			appConfig: {
				editable: false,
				reload: true
			},
			logDir: {
				editable: false,
				reload: true
			},
			varDir: {
				editable: false,
				reload: true
			},
			debugMessagesFilename: {
				editable: false,
				reload: true
			},
			userMessagesFilename: {
				editable: false,
				reload: true
			},
			hideDebug: {
				editable: true,
				reload: false
			},
			debugLevels: {
				editable: false,
				reload: true
			},
			windowWidth: {
				editable: false,
				reload: false
			},
			windowHeight: {
				editable: false,
				reload: false
			},
			componentMapping: {
				editable: false,
				reload: true
			},
			currentLanguage: {
				editable: true,
				reload: false,
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
				reload: false,
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
				reload: false,
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
				reload: false,
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
	debugLevel: 3,
	debugLevels: {
		'debug': 1,
		'info': 2,
		'warning': 3,
		'error': 4
	},
	debugGroupsCollapsed: true,
	debugWindowFile: './node_modules/nw-skeleton/app-wrapper/template/debug.html',

	userMessageLevel: 2,
	maxUserMessages: 1000,
	userMessagesToFile: true,
	userMessagesFilename: './app/var/log/user-messages.log',

	windowCloseTimeoutDuration: 15000,
	windowReloadTimeoutDuration: 15000,

	windowWidth: null,
	windowHeight: null

};