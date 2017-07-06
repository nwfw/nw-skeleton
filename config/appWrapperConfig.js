exports.config = {
    wrapper : {
        appFile: '../../app/js/app',

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
                                    }
                                }
                            }
                        }
                    },
                    'app-header': {
                        name: 'app-header',
                        components: {
                            'window-controls': {
                                name: 'window-controls',
                                components: {
                                    'theme-select': {
                                        name: 'theme-select'
                                    },
                                    'language-select': {
                                        name: 'language-select'
                                    }
                                }
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
                                            }
                                        }
                                    }
                                }
                            },
                            'app-debug': {
                                componentCssFiles: ['app-debug.css'],
                                name: 'app-debug',
                                components: {
                                    'app-debug-controls': {
                                        name: 'app-debug-controls'
                                    }
                                }
                            }
                        }
                    },
                    'app-debug': {
                        componentCssFiles: ['app-debug.css'],
                        name: 'app-debug',
                        components: {
                            'app-debug-controls': {
                                name: 'app-debug-controls'
                            }
                        }
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

    cancelOperationTimeout: 30000,

    appConfig: {
        tmpDataDir: './app/var',
        showInitializationStatus: true,
        showInitializationProgress: true,
        initCssFiles: [
            '/node_modules/nw-skeleton/app-wrapper/css/config.css',
        ],
        cssCompiledFile: '/app/var/css/dist.css',
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

        disableRightClick: true,

        hasAppMenu: false,
        menuData: {},
        hasTrayIcon: false,
        trayData: {},
        windowConfig: {
            left: null,
            top: null,
            width: null,
            height: null,
            fullscreen: false,
        },
    },

    configData: {
        uneditableConfig: [],
        editableConfig: [],
        noReloadConfig: [],
        reloadConfig: [],
        ignoreUserConfig: ['appConfig.menuData'],
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
                reload: false
            },
            logDir: {
                editable: false,
                reload: true
            },
            varDir: {
                editable: false,
                reload: true
            },
            'debug.debugMessagesFilename': {
                editable: false,
                reload: true
            },
            'userMessages.userMessagesFilename': {
                editable: false,
                reload: true
            },
            'debug.enabled': {
                editable: true,
                reload: false
            },
            'debug.hideDebug': {
                editable: true,
                reload: false
            },
            'logger.messageLevels': {
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
            'debug.messagesExpanded': {
                editable: true,
                reload: false
            },
            'userMessages.messagesExpanded': {
                editable: true,
                reload: false
            },
            'debug.displayTimestamps': {
                editable: true,
                reload: false
            },
            'userMessages.displayTimestamps': {
                editable: true,
                reload: false
            },
            'debug.forceDebug': {
                editable: false,
                reload: true
            },
            'userMessages.forceUserMessages': {
                editable: false,
                reload: false
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

    theme: 'dark',
    allowThemeChange: true,

    liveCss: false,
    compileCss: false,

    logger: {
        messageLevels: {
            'debug': 1,
            'info': 2,
            'warning': 3,
            'error': 4
        },
    },
    debug: {
        animateMessages: true,
        hideDebug: false,
        enabled: true,
        debugToFile: true,
        saveStacksToFile: true,
        debugToFileAppend: false,
        debugMessagesFilename: './app/var/log/debug-messages.log',
        messagesExpanded: false,
        displayTimestamps: true,
        devTools: true,
        alwaysTrace: false,
        debugLevel: 3,
        maxDebugMessages: 200,
        debugGroupsCollapsed: true,
        debugWindowFile: './node_modules/nw-skeleton/app-wrapper/template/debug.html',
        forceDebug: {
            AppWrapper: false,
            AppConfig: false,
            AppTemplates: false,
            AppTranslations: false,
            ComponentHelper: false,
            KeyboardHelper: false,
            DebugHelper: false,
            HtmlHelper: false,
            StyleHelper: false,
            ModalHelper: false,
            StorageHelper: false,
            StaticFilesHelper: false,
            UserMessageHelper: false,
            UserDataHelper: false,
            AppOperationHelper: false,
            UtilHelper: false,
            MenuHelper: false,
            FormatHelper: false,
            WindowManager: false,
            FileManager: false
        },
    },

    userMessages: {
        animateMessages: true,
        userMessageLevel: 3,
        maxUserMessages: 200,
        userMessagesToFile: true,
        saveStacksToFile: true,
        userMessagesToFileAppend: false,
        userMessagesFilename: './app/var/log/user-messages.log',
        messagesExpanded: false,
        displayTimestamps: true,
        forceUserMessages: {
            AppWrapper: false,
            AppConfig: false,
            AppTemplates: false,
            AppTranslations: false,
            ComponentHelper: false,
            KeyboardHelper: false,
            DebugHelper: false,
            HtmlHelper: false,
            StyleHelper: false,
            ModalHelper: false,
            StorageHelper: false,
            StaticFilesHelper: false,
            UserMessageHelper: false,
            UserDataHelper: false,
            AppOperationHelper: false,
            UtilHelper: false,
            MenuHelper: false,
            FormatHelper: false,
            WindowManager: false,
            FileManager: false
        }
    },

    windowCloseTimeoutDuration: 15000,
    windowReloadTimeoutDuration: 15000,

    windowWidth: null,
    windowHeight: null,

};