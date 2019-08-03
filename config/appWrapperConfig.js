/**
 * @fileOverview config for app wrapper file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.2.0
 */

/**
 * MainConfigDebug Object that contains main config debug data
 * @typedef  {Object}    MainConfigDebug
 *
 * @property {Boolean}   enabled            Flag to enable or disable debug for main script
 * @property {Boolean}   debugToWindow      Flag to enable or disable passing debug messages to main window
 * @property {Integer}   debugLevel         Minimum debug level for logging
 * @property {Boolean}   displayTimestamps  Flag to enable or disable timestamps with log messages
 * @property {Boolean}   debugToFile        Flag to enable or disable writing log to file
 * @property {Boolean}   saveStacksToFile   Flag to enable or disable writing stacks to log file
 * @property {Boolean}   debugToFileAppend  Flag to indicate whether to append or overwrite log file
 * @property {String}    debugLogFilename   Path to main debug log file
 */

/**
 * MainConfig Object that contains current window state variables
 * @typedef  {Object}    MainConfig
 *
 * @property {MainConfigDebug}   debug      Main config debug data
 */

/**
 * AppStorageConfig Object that contains app storage configuration
 * @typedef  {Object}    AppStorageConfig
 *
 * @property {string}   type      Storage type ('localStorage' or 'filesystem')
 * @property {string}   root      Filesystem storage root dir name (under appConfig.tmpDataDir)
 * @property {Boolean}  minify    Force minified json saving
 */


/**
 * AppWrapperConfig Object that contains base app config
 * @typedef  {Object}    AppWrapperConfig
 *
 * @property {MainConfig}   main           Main script config variables
 */

/**
 * @type {AppWrapperConfig}
 * @memberOf appWrapper
 * @name appWrapperConfig
 *
 * @todo Complete typedefs
 */
exports.config = {
    main : {
        debug: {
            enabled: false,
            rotateLogs: true,
            debugToWindow: false,
            debugLevel: 2,
            displayTimestamps: true,
            debugToFile: true,
            saveStacksToFile: true,
            debugToFileAppend: false,
            debugLogFilename: 'main-debug',
        },
        mainTemplate: 'node_modules/nw-skeleton/app-wrapper/template/index.html',
    },
    wrapper : {
        appFile: './node_modules/nw-skeleton/app-wrapper/js/app',

        appErrorTemplatePartial: 'node_modules/nw-skeleton/app-wrapper/template/partial/error.html',

        commandParamsMap: [
            {
                name: '--reset',
                method: 'dataReset',
                value: true,
                description: 'Resets app data with "data", config with "config" or both with "all"'
            },
            {
                name: '--help',
                method: 'showCommandParamsHelp',
                value: false,
                description: 'Displays this help text'
            }
        ],

        themeBaseDir: './node_modules/nw-skeleton/app-wrapper/css/themes',

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

        directiveRoot: './node_modules/nw-skeleton/app-wrapper/js/directive/',
        directiveExtensionRegex: /\.js$/,

        filterRoot: './node_modules/nw-skeleton/app-wrapper/js/filter/',
        filterExtensionRegex: /\.js$/,

        translationExtensionRegex: /\.i18n\.js$/,
        translationsRoot: 'translations',

        componentMapping: {
            'app-window' : {
                name: 'app-window',
                components: {
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
                        name: 'app-main'
                    },
                    'app-footer': {
                        name: 'app-footer',
                    }
                }
            }
        },
    },

    minPauseDuration: 10,
    shortPauseDuration: 100,
    mediumPauseDuration: 250,
    longPauseDuration: 700,
    longerPauseDuration: 1000,

    mindOsUsers: true,

    cancelOperationTimeout: 30000,

    appStorage: {
        type: 'localStorage',
        root: 'storageData',
        minify: false,
    },

    appConfig: {
        appFile: null,
        appSubFiles: [],
        commandParamsMap: [
            {
                name: '--dev',
                method: 'app.setDevMode',
                value: true,
                description: 'Sets dev mode to "true" or "false"'
            }
        ],
        mainComponent: 'app-main',
        tmpDataDir: './var/data',
        logDir: './var/log',
        dataDir: './data',

        allowFullscreen: true,
        hideFullscreenHeader: true,
        hideFullscreenFooter: true,
        windowConfig: {
            left: null,
            top: null,
            width: null,
            height: null,
            fullscreen: false,
        },
        subWindowConfigs: {},

        themeBaseDir: './app/css/themes',

        cssCompiledFile: 'css/dist.css',

        initCssFiles: [
            '/node_modules/nw-skeleton/app-wrapper/css/config.css',
        ],
        cssFiles: [
            '/node_modules/nw-skeleton/app-wrapper/css/fonts.css',
            '/node_modules/nw-skeleton/app-wrapper/css/layout.css',
            '/node_modules/nw-skeleton/app-wrapper/css/style.css',
            '/node_modules/nw-skeleton/app-wrapper/css/transitions.css'
        ],
        overrideCssFiles: [],
        debugCssFiles: [
            '/node_modules/nw-skeleton/app-wrapper/css/debug.css'
        ],

        initJsFiles: [],
        jsFiles: [
            '/node_modules/nw-skeleton/app-wrapper/js/lib/ext/vue.js'
        ],
        debugJsFiles: [],

        componentMapping: {},
        componentModules: {
            component: [],
            globalComponent: [],
            modalComponent: []
        },

        mixinRoot: './app/js/mixin/',

        directiveRoot: './app/js/directive/',
        directiveExtensionRegex: /\.js$/,

        windowControls: {
            display: true,
            controls: {
                appInfo: true,
                debugMenu: true,
                configurationMenu: true,
                moveWindow: true,
                toggleFullscreen: true,
                minimizeWindow: true,
                maximizeWindow: true,
                closeWindow: true,
            }
        },

        disableRightClick: true,

        hasAppMenu: false,
        menuData: {
            editMenu: {
                menuItem: {
                    label: 'Edit',
                    method: 'noop'
                },
                children: [
                    // {
                    //     menuItem: {
                    //         label: 'Undo',
                    //         method: 'helpers.clipboardHelper.undo',
                    //         shortcut: {
                    //             key: 'z',
                    //             modifiers: {
                    //                 ctrl: true
                    //             }
                    //         }
                    //     }
                    // },
                    // {
                    //     menuItem: {
                    //         label: 'Redo',
                    //         method: 'helpers.clipboardHelper.redo',
                    //         shortcut: {
                    //             key: 'z',
                    //             modifiers: {
                    //                 ctrl: true,
                    //                 shift: true
                    //             }
                    //         }
                    //     }
                    // },
                    {
                        menuItem: {
                            type: 'separator'
                        },
                        children: []
                    },
                    {
                        menuItem: {
                            label: 'Cut',
                            method: 'helpers.clipboardHelper.cut',
                            shortcut: {
                                key: 'x',
                                modifiers: {
                                    ctrl: true
                                }
                            }
                        }
                    },
                    {
                        menuItem: {
                            label: 'Copy',
                            method: 'helpers.clipboardHelper.copy',
                            shortcut: {
                                key: 'c',
                                modifiers: {
                                    ctrl: true
                                }
                            }
                        }
                    },
                    {
                        menuItem: {
                            label: 'Paste',
                            method: 'helpers.clipboardHelper.paste',
                            shortcut: {
                                key: 'v',
                                modifiers: {
                                    ctrl: true
                                }
                            }
                        }
                    },
                    {
                        menuItem: {
                            label: 'Select all',
                            method: 'helpers.clipboardHelper.selectAll',
                            shortcut: {
                                key: 'a',
                                modifiers: {
                                    ctrl: true
                                }
                            }
                        }
                    }
                ]
            }
        },
        hasTrayIcon: false,
        trayData: {},
        tooltipDelay: 400,
        tooltipTTL: 200
    },

    configData: {
        uneditableConfig: [],
        editableConfig: [],
        noReloadConfig: [],
        reloadConfig: [],
        ignoreUserConfig: [
            'appConfig.menuData',
            'appConfig.componentMapping',
            'appConfig.appSubFiles',
            'userMessages.forceUserMessages',
            'debug.forceDebug',
            'debug.devTools',
            'debug.devMode',
            'appInfo',
            'stdoutColors'
        ],
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
                editable: true,
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
            'userMessages.userMessageLevel': {
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
            'debug.debugLevel': {
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
                        'en-US': 'English',
                        'sr-Latn-RS': 'Srpski',
                        'sr-Cyrl-RS': 'Српски',
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
                        'en-US': 'English',
                        'sr-Latn-RS': 'Srpski',
                        'sr-Cyrl-RS': 'Српски',
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
            liveCss: {
                editable: true,
                reload: false
            },
        }
    },

    varDir: './var',
    logDir: './var/log',

    currentLanguageName: 'English',
    currentLanguage: 'en-US',
    currentLocale: 'en',
    allowLanguageChange: true,
    autoAddLabels: true,

    themeModules: [],
    theme: 'dark',
    allowThemeChange: true,

    liveCss: false,
    compileCss: false,

    appNotifications: {
        userMessageDuration: 3000,
        duration: 5000,
        defaultIcon: 'node_modules/nw-skeleton/app-wrapper/images/tray-icon.png',
        defaultBadge: 'node_modules/nw-skeleton/app-wrapper/images/logo.png',
        defaultImage: 'node_modules/nw-skeleton/app-wrapper/images/logo.png'
    },
    logger: {
        messageLevels: {
            'debug': 1,
            'info': 2,
            'warning': 3,
            'error': 4
        },
    },
    userMessages: {
        rotateLogs: true,
        animateMessages: true,
        hideUserMessages: false,
        notifyWhenHidden: false,
        userMessageLevel: 3,
        maxVisibleUserMessages: 200,
        maxUserMessages: 5000,
        userMessagesToFile: true,
        saveStacksToFile: true,
        userMessagesToFileAppend: false,
        userMessagesFilename: 'user-messages',
        messagesExpanded: false,
        displayTimestamps: true,
        forceUserMessages: {
            AppConfig: false,
            AppNotificationsHelper: false,
            AppOperationHelper: false,
            AppTemplates: false,
            AppTranslations: false,
            AppWrapper: false,
            ClipboardHelper: false,
            ComponentHelper: false,
            DebugHelper: false,
            FileManager: false,
            FormatHelper: false,
            HtmlHelper: false,
            KeyboardHelper: false,
            MenuHelper: false,
            ModalHelper: false,
            StaticFilesHelper: false,
            StorageHelper: false,
            StyleHelper: false,
            ThemeHelper: false,
            UserDataHelper: false,
            UserMessageHelper: false,
            UtilHelper: false,
            WindowManager: false,
            WrapperApp: false
        }
    },
    debug: {
        animateMessages: true,
        hideDebug: false,
        enabled: true,
        rotateLogs: true,
        usage: false,
        usageInterval: 500,
        usageGraphs: false,
        usageHistoryCount: 1000,
        debugToFile: true,
        saveStacksToFile: true,
        debugToFileAppend: false,
        debugMessagesFilename: 'debug-messages',
        messagesExpanded: false,
        displayTimestamps: true,
        devMode: false,
        devTools: false,
        alwaysTrace: false,
        debugLevel: 3,
        maxVisibleDebugMessages: 200,
        maxDebugMessages: 5000,
        debugGroupsCollapsed: false,
        passToMain: false,
        debugWindowFile: './node_modules/nw-skeleton/app-wrapper/template/debug.html',
        forceDebug: {
            AppConfig: false,
            AppNotificationsHelper: false,
            AppOperationHelper: false,
            AppTemplates: false,
            AppTranslations: false,
            AppWrapper: false,
            ClipboardHelper: false,
            ComponentHelper: false,
            DebugHelper: false,
            FileManager: false,
            FormatHelper: false,
            HtmlHelper: false,
            KeyboardHelper: false,
            MenuHelper: false,
            ModalHelper: false,
            StaticFilesHelper: false,
            StorageHelper: false,
            StyleHelper: false,
            ThemeHelper: false,
            UserDataHelper: false,
            UserMessageHelper: false,
            UtilHelper: false,
            WindowManager: false,
            WrapperApp: false
        },
    },

    stdoutColors: {
        red: '\x1B[1;31m',
        green: '\x1B[1;32m',
        yellow: '\x1B[1;33m',
        gray: '\x1B[0;37m',
        reset: '\x1B[0m'
    },

    newWindowInitTimeoutDuration: 30000,

    windowCloseTimeoutDuration: 15000,
    windowReloadTimeoutDuration: 15000,

    windowWidth: null,
    windowHeight: null,

};