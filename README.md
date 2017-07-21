# nw-skeleton #
Node-webkit (nwjs.io) app framework with integrated Vue.js support

Features
  * ES2016 ready (async, arrow functions, classes etc.)
  * Frontend application structure completely configurable
  * CSS compiling (postcss)
  * Live CSS reloading
  * Desktop notifications
  * Modal dialogs
  * User data saving in localStorage
  * Debug messages (4 message levels w/grouping in console)
  * Per-class configurable debug output
  * User messages  (4 message levels)
  * Per-class configurable user message output
  * Permanent window position/width/height through userData
  * Application notifications
  * Desktop notifications w/callbacks
  * Application operations with or without cancelling with progress bar
  * Exporting debug/user messages to JSON files
  * Log viewer for saved user/debug logs
  * Theme support (with or without npm) with live theme switching
  * Integrated window controls and menus
  * Configurable tray icons and menus
  * Configurable application menus
  * Transparent / frameless window support
  * I18N with integrated translating system
  * Configurable keyboard shortcuts
  * Easy, configurable app extending with npm modules
  * System and app helper classes support
  * Support for Vue.js mixins, filters, directives etc.
  * Configurable Vue.js component structure
  * Support for global Vue.js components
  * Custom icons/app info w/nwbuild
  * Configurable css/js frontend includes
  * Separate debug window support
  * Transition/animation support


## Configuration file ##
Almost all application aspects can be controlled through configuration. Example configuration file looks like:
```javascript
{
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

        directiveRoot: './node_modules/nw-skeleton/app-wrapper/js/directive/',
        directiveExtensionRegex: /\.js$/,

        filterRoot: './node_modules/nw-skeleton/app-wrapper/js/filter/',
        filterExtensionRegex: /\.js$/,

        translationExtensionRegex: /\.i18n\.js$/,
        translationsRoot: './app/data/translations/',

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

    shortPauseDuration: 100,
    mediumPauseDuration: 250,
    longPauseDuration: 1000,

    cancelOperationTimeout: 30000,

    appConfig: {
        appSubFiles: [],
        mainComponent: 'app-main',
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

        componentMapping: {},
        componentModules: {
            component: [
                // {
                //     moduleName: 'canvas-playground',
                //     parentComponent: 'app-window'
                // }
            ],
            globalComponent: [],
            modalComponent: []
        },

        mixinRoot: './app/js/mixin/',

        directiveRoot: './app/js/directive/',
        directiveExtensionRegex: /\.js$/,

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
        ignoreUserConfig: [
            'appConfig.menuData',
            'appConfig.componentMapping',
            'appConfig.appSubFiles',
            'userMessages.forceUserMessages',
            'debug.forceDebug',
            'appInfo',
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

    themeModules: [],
    theme: 'dark',
    allowThemeChange: true,

    liveCss: false,
    compileCss: false,

    appNotifications: {
        duration: 5000
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
            ClipboardHelper: false,
            AppOperationHelper: false,
            UtilHelper: false,
            AppNotificationsHelper: false,
            MenuHelper: false,
            FormatHelper: false,
            WindowManager: false,
            FileManager: false
        }
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
        debugGroupsCollapsed: false,
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
            ClipboardHelper: false,
            AppOperationHelper: false,
            UtilHelper: false,
            AppNotificationsHelper: false,
            MenuHelper: false,
            FormatHelper: false,
            WindowManager: false,
            FileManager: false
        },
    },

    windowCloseTimeoutDuration: 15000,
    windowReloadTimeoutDuration: 15000,

    windowWidth: null,
    windowHeight: null,

};
```

Configuration is easily extendable and you can control which configuration values will be saved in localStorage and which ones won't.

## Components ##
Vue.js components are organized in directories:
  * global - for global components
  * app - for "regular" components
  * modal - for modal-dialog components

Components can also be loaded as external npm modules. Each component can have its state file that gets merged with app state data. System will also automatically load css files with same name as the component. If necessary, component configuration can include any number of custom css files.

## App state ##
All data for the app is stored under single appState object so components and other code can easily share data. Separate file for application data is provided since that data structure varies from app to app.

## App data ##
Stored in separate file, this object is to be used as temporary current app instance storage.

## User data ##
This object can easily be saved or loaded via localStorage helper in order to preserve data for next sessions

## Mixed context ##
Using nwjs.io mixed node/browser context, you can easily work with filesystem, network, websockets or DOM from single Vue component or javascript class.

## Clipboard ##
Clipboard helper makes it easy to cut/copy/paste text without having to rely on OS support - works same on all platforms (Win, Mac, Linux)

## Base class ##
Base class (all system objects extend it) contains all necessary methods and properties for easy coding such as translations, easy helper access, logging and notifying user whether through application or desktop notifications (enabled in nwjs.io by default)

## CSS config files ##
All themes as well as system itself contain config CSS files that declare CSS variables that can be used in all CSS files - changing appearance and UX is wasy as setting the CSS variable to desired value

## Easy extending ##
Using configuration variable mainComponent, you can easily configure what will be base view for your app. Since components themselves can extend configuration through their componentState file (or using separate config file for npm-module components) you can even override main component from component configuration itself.

## Internationalization ##
Using simple JS objects for language definitions and internationalization, it is easy to adapt the app for all user needs. With auto-scan and auto-clear (auto-trim) functionality, adding new or removing unneeded translations is easy.

## Logging ##
With four message levels (debug, info, warning and error) debugging and filtering debug logs is easy. Logs can be saved in JSON format for later analysis, and each log message can contain stack trace for easier bug fixing.
Both user messages and debug log can be configured to be saved in files for later analysis as well.

## Themes ##
Each theme can contain config css file that overrides system css config. In addition, you can define custom number of additional css files, override css files that will be loaded last, or even js files that will be included into application <head> tag. Also, by setting flag in configuration, you can enable live CSS reloading to make styling easier. Live CSS reload works with or without CSS compiling.

## Controlled initalization / shutdown ##
Application will wait for certain flags to be set before it presents its window to the user. In addition, each JS class can have async shutdown method for cleaning up before application closes.

## Menus / Tray ##
You can easily configure application menus using just config file. Tray support w/icons is also available and configurable if needed.

## Modal dialogs ##
Easily extendable and highly configurable, modal dialog components can be used for all types of tasks - from loading/saving files to displaying warnings / queries on app closing. Modal dialogs can display app notifications and progress bar if needed, since modal mask can obscure those important UI elements.

