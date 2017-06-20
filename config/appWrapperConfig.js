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
                './node_modules/nw-skeleton/app-wrapper/components/',
                './node_modules/nw-skeleton/app-wrapper/components/modal/',
                './node_modules/nw-skeleton/app-wrapper/components/global/',
                './node_modules/nw-skeleton/app-wrapper/components/form/'
            ]
        },

        componentCodeRegex: /\.js$/,
        componentDirectories: {
            component: ['./node_modules/nw-skeleton/app-wrapper/components/app/'],
            globalComponent: ['./node_modules/nw-skeleton/app-wrapper/components/global/', './node_modules/nw-skeleton/app-wrapper/components/form'],
            modalComponent: ['./node_modules/nw-skeleton/app-wrapper/components/modal/']
        },

        systemHelperDirectories: ['./node_modules/nw-skeleton/app-wrapper/js/helper/system/'],
        helperDirectories: ['./node_modules/nw-skeleton/app-wrapper/js/helper/'],

        mixinRoot: './node_modules/nw-skeleton/app-wrapper/js/mixin/',
        mixinExtensionRegex: /\.js$/,

        filterRoot: './node_modules/nw-skeleton/app-wrapper/js/filter/',
        filterExtensionRegex: /\.js$/,

        translationExtensionRegex: /\.i18n\.js$/,
        translationsRoot: './app/data/translations/',

        componentMapping: {
            'app-window' : {
                name: 'app-window',
                components: {
                    'app-loader': {
                        name: 'app-loader',
                        componentCssFiles: ['app-loader.css'],
                        components: {
                            'app-loader-spinner': {
                                name: 'app-loader-spinner'
                            },
                            'user-messages': {
                                name: 'user-messages',
                                components: {
                                    'user-messages-controls': {
                                        name: 'user-messages-controls'
                                    },
                                    'user-messages-list': {
                                        name: 'user-messages-list'
                                    }
                                }
                            }
                        }
                    },
                    'app-header': {
                        name: 'app-header',
                        components: {
                            'language-select': {
                                name: 'language-select'
                            },
                            'theme-select': {
                                name: 'theme-select'
                            },
                            'live-info': {
                                name: 'live-info'
                            },
                            'window-controls': {
                                name: 'window-controls'
                            },
                            'progress-bar': {
                                componentCssFiles: ['progress-bar.css'],
                                name: 'progress-bar'
                            },
                        }
                    },
                    'app-main': {
                        name: 'app-main',
                        components: {
                            'app-error': {
                                name: 'app-error',
                                componentCssFiles: ['app-error.css'],
                            },
                            'app-loader': {
                                name: 'app-loader',
                                componentCssFiles: ['app-loader.css'],
                                components: {
                                    'app-loader-spinner': {
                                        name: 'app-loader-spinner'
                                    },
                                    'user-messages': {
                                        name: 'user-messages',
                                        components: {
                                            'user-messages-controls': {
                                                name: 'user-messages-controls'
                                            },
                                            'user-messages-list': {
                                                name: 'user-messages-list'
                                            }
                                        }
                                    }
                                }
                            },
                            'app-debug': {
                                componentCssFiles: ['app-debug.css'],
                                name: 'app-debug'
                            }
                        }
                    },
                    'app-debug': {
                        componentCssFiles: ['app-debug.css'],
                        name: 'app-debug'
                    },
                    'app-footer': {
                        name: 'app-footer',
                        components: {
                            'user-messages': {
                                name: 'user-messages',
                                componentCssFiles: ['user-messages.css'],
                                components: {
                                    'user-messages-controls': {
                                        name: 'user-messages-controls'
                                    },
                                    'user-messages-list': {
                                        name: 'user-messages-list'
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
    },

    shortPauseDuration: 100,
    mediumPauseDuration: 250,
    longPauseDuration: 1000,

    appConfig: {
        tmpDataDir: './app/var',
        showInitializationStatus: true,
        showInitializationProgress: true,
        initCssFiles: [
            '/node_modules/nw-skeleton/app-wrapper/css/config.css',
        ],
        cssCompiledFile: '/app/var/css/style.css',
        cssFiles: [
            '/node_modules/nw-skeleton/app-wrapper/css/layout.css',
            '/node_modules/nw-skeleton/app-wrapper/css/header.css',
            '/node_modules/nw-skeleton/app-wrapper/css/footer.css',
            '/node_modules/nw-skeleton/app-wrapper/css/modals.css',
            '/node_modules/nw-skeleton/app-wrapper/css/style.css',
            '/node_modules/nw-skeleton/app-wrapper/css/transitions.css'
        ],
        overrideCssFiles: [],

        initJsFiles: [],
        jsFiles: [
            '/node_modules/nw-skeleton/app-wrapper/js/lib/ext/vue.js'
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

        menuData: {}
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
            debug: {
                editable: true,
                reload: false
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
            theme: {
                editable: true,
                reload: false
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
                        1: 'debug',
                        2: 'info',
                        3: 'warning',
                        4: 'error'
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
                        1: 'debug',
                        2: 'info',
                        3: 'warning',
                        4: 'error'
                    }
                }
            },
            userMessagesExpanded: {
                editable: true,
                reload: false
            },
            userMessagesTimestamp: {
                editable: true,
                reload: false
            },
            userMessagesToolbarVisible: {
                editable: true,
                reload: false
            },
            forceDebug: {
                editable: false,
                reload: true
            },
            forceUserMessages: {
                editable: false,
                reload: true
            },
            compileCss: {
                editable: true,
                reload: false
            },
        }
    },

    varDir: './app/var',
    logDir: './app/var/log',

    currentLanguage: 'sr_RS',
    currentLocale: 'sr-rs',
    allowLanguageChange: true,
    autoAddLabels: true,

    theme: 'basic',
    allowThemeChange: true,

    compileCss: false,
    liveCss: false,

    hideDebug: false,
    debug: true,
    debugToFile: true,
    debugToFileAppend: false,
    debugMessagesFilename: './app/var/log/debug-messages.log',
    devTools: true,
    alwaysTrace: false,
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
    userMessagesToFileAppend: false,
    userMessagesFilename: './app/var/log/user-messages.log',
    userMessagesExpanded: false,
    userMessagesTimestamp: true,
    userMessagesToolbarVisible: false,

    windowCloseTimeoutDuration: 15000,
    windowReloadTimeoutDuration: 15000,

    windowWidth: null,
    windowHeight: null,

    forceDebug: {
        AppWrapper: false,
        AppConfig: false,
        AppTemplates: false,
        AppTranslations: false,
        ComponentHelper: false,
        KeyboardHelper: false,
        DebugHelper: false,
        HtmlHelper: false,
        ModalHelper: false,
        StorageHelper: false,
        StaticFilesHelper: false,
        UserMessageHelper: false,
        UserDataHelper: false,
        UtilHelper: false,
        WindowManager: false,
        FileManager: false
    },
    forceUserMessages: {
        AppWrapper: false,
        AppConfig: false,
        AppTemplates: false,
        AppTranslations: false,
        ComponentHelper: false,
        KeyboardHelper: false,
        DebugHelper: false,
        HtmlHelper: false,
        ModalHelper: false,
        StorageHelper: false,
        StaticFilesHelper: false,
        UserMessageHelper: false,
        UserDataHelper: false,
        UtilHelper: false,
        WindowManager: false,
        FileManager: false
    }

};