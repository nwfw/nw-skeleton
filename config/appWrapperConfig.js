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
                components: [
                    {
                        name: 'app-loader',
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
                    },
                    {
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
                            },
                        ]
                    },
                    {
                        name: 'app-main',
                        components: [
                            {
                                name: 'app-error'
                            },
                            {
                                name: 'app-loader',
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
                        ]
                    },
                    {
                        name: 'app-debug'
                    },
                    {
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
                ]
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
            '/node_modules/nw-skeleton/app-wrapper/css/components/user-messages.css',
            '/node_modules/nw-skeleton/app-wrapper/css/components/progress-bar.css',
            '/node_modules/nw-skeleton/app-wrapper/css/components/translation-editor.css',
            '/node_modules/nw-skeleton/app-wrapper/css/components/inspector-json.css',
            '/node_modules/nw-skeleton/app-wrapper/css/components/config-editor.css',
            '/node_modules/nw-skeleton/app-wrapper/css/components/app-debug.css',
            '/node_modules/nw-skeleton/app-wrapper/css/components/app-loader.css',
            '/node_modules/nw-skeleton/app-wrapper/css/components/app-error.css',
            '/node_modules/nw-skeleton/app-wrapper/css/style.css',
            '/node_modules/nw-skeleton/app-wrapper/css/transitions.css'
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
            userMessagesExpanded: {
                editable: true,
                reload: false
            },
            userMessagesToolbarVisible: {
                editable: true,
                reload: false
            }
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
    debugToFileAppend: false,
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
    userMessagesToFileAppend: false,
    userMessagesFilename: './app/var/log/user-messages.log',
    userMessagesExpanded: false,
    userMessagesToolbarVisible: false,

    windowCloseTimeoutDuration: 15000,
    windowReloadTimeoutDuration: 15000,

    windowWidth: null,
    windowHeight: null,

    forceDebug: {
        appWrapper: false,
        appUtil: false,
        appConfig: false,
        appTemplates: false,
        appTranslations: false,
        componentHelper: false,
        keyboardHelper: false,
        debugHelper: false,
        htmlHelper: false,
        modalHelper: false,
        storageHelper: false,
        staticFilesHelper: false,
        utilHelper: false,
        windowManager: false
    },
    forceUserMessages: {
        appWrapper: false,
        appUtil: false,
        appConfig: false,
        appTemplates: false,
        appTranslations: false,
        componentHelper: false,
        keyboardHelper: false,
        debugHelper: false,
        htmlHelper: false,
        modalHelper: false,
        storageHelper: false,
        staticFilesHelper: false,
        utilHelper: false,
        windowManager: false
    }

};