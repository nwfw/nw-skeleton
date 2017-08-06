/**
 * @fileOverview AppState app wrapper file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.2.1
 */

/**
 * WindowState Object that contains current window state variables
 * @typedef  {Object}    WindowState
 *
 * @property {string}   title           Window title
 * @property {string}   position        Window position ('center')
 * @property {Integer}  x               Window x coordinate
 * @property {Integer}  y               Window y coordinate
 * @property {Integer}  width           Window width
 * @property {Integer}  height          Window height
 * @property {boolean}  maximized       Flag to indicate whether window is maximized
 * @property {boolean}  devTools        Flag to indicate whether window has devTools opened
 * @property {boolean}  showInTaskbar   Flag to indicate whether window should be shown in taskbar
 * @property {boolean}  resizable       Flag to indicate whether window is resizable
 * @property {boolean}  menu            Flag to indicate whether window has menu
 * @property {boolean}  icon            Flag to indicate whether window has icon
 * @property {boolean}  transparent     Flag to indicate whether window is transparent
 * @property {boolean}  show            Flag to indicate whether window is displayed by default
 * @property {boolean}  kiosk           Flag to indicate whether window is in kiosk mode
 * @property {boolean}  frame           Flag to indicate whether window has frame
 * @property {boolean}  fullscreen      Flag to indicate whether window is in fullscreen
 */

/**
 * StatusData Object that contains current app status variables
 * @typedef  {Object}   StatusData
 *
 * @property {boolean}  appLoaded           Flag to indicate whether app has been loaded
 * @property {boolean}  appReady            Flag to indicate whether app is ready
 * @property {boolean}  appInitialized      Flag to indicate whether app has been initialized
 * @property {boolean}  appShuttingDown     Flag to indicate whether app is shutting down
 * @property {boolean}  appBusy             Flag to indicate whether app is busy
 * @property {string}   appStatus           Current app indicator status (idle, busy, success, working, offline, error)
 * @property {boolean}  appStatusChanging   Flag to indicate whether app status is changing
 * @property {boolean}  languageInitialized Flag to indicate whether languages and translation system has been initialized
 * @property {boolean}  feAppInitialized    Flag to indicate whether frontend app is initalized
 * @property {boolean}  windowMaximized     Flag to indicate whether window is maximized
 * @property {boolean}  devToolsOpened      Flag to indicate whether dev tools are opened
 * @property {boolean}  movingWindow        Flag to indicate whether window is being moved
 * @property {boolean}  ctrlPressed         Flag to indicate whether ctrl/cmd button is pressed
 * @property {boolean}  shiftPressed        Flag to indicate whether shift button is pressed
 * @property {boolean}  altPressed          Flag to indicate whether alt button is pressed
 * @property {boolean}  noHandlingKeys      Flag to indicate whether to listen to key events for app shortcuts
 * @property {boolean}  windowFocused       Flag to indicate whether window is focused
 */

/**
 * ErrorData Object that contains app error data
 * @typedef  {Object}   ErrorData
 *
 * @property {boolean}  error           Flag to indicate whether app has error
 * @property {boolean}  userMessages    Flag to indicate whether app-error component should display user messages
 * @property {string}   defaultTitle    Default app-error component title
 * @property {string}   defaultText     Default app-error component text
 * @property {string}   title           Current app-error component title
 * @property {string}   text            Current app-error component text
 * @property {string}   component       Custom app-error component name
 */

/**
 * OperationData Object that contains app operation data
 * @typedef  {Object}   OperationData
 *
 * @property {boolean}  cancelable                  Flag to indicate whether operation is cancelable
 * @property {boolean}  cancelling                  Flag to indicate whether operation is being cancelled
 * @property {boolean}  cancelled                   Flag to indicate whether operation is cancelled
 * @property {boolean}  operationActive             Flag to indicate whether operation is active
 * @property {boolean}  operationVisible            Flag to indicate whether operation is visible
 * @property {boolean}  notify                      Flag to indicate whether user should be notified when operation finishes
 * @property {boolean}  appBusy                     Flag to indicate whether app status should be set to busy
 * @property {boolean}  useProgress                 Flag to indicate whether to use progress bar for operation
 * @property {Integer}  operationStartedTimestamp   Operation start timestamp
 * @property {string}   operationText               Operation text
 * @property {string}   progressText                Progress bar text
 * @property {string}   operationId                 Unique operation ID
 */

/**
 * LanguageData Object that contains languages data
 * @typedef  {Object}   LanguageData
 *
 * @property {string}   currentLanguage         Code of current language
 * @property {string}   currentLocale           Current locale
 * @property {array}    availableLanguages      An array containing available language objects
 * @property {Object}   translations            Object containing translations by language code
 */

/**
 * ProgressData Object that contains app error data
 * @typedef  {Object}   ProgressData
 *
 * @property {boolean}  animated            Flag to indicate whether progress bar is animated
 * @property {boolean}  inProgress          Flag to indicate whether progress has started
 * @property {string}   percentComplete     Current progress text displayed in progress-bar component
 * @property {Float}    percentNumber       Current progress in percents
 * @property {string}   operationText       Operation text displayed in progress-bar component
 * @property {string}   detailText          Detail text displayed in progress-bar component
 * @property {string}   progressBarClass    Additional progress-bar component CSS class
 * @property {Object}   styleObject         Style object for progress-bar component (has only 'width' property, representing CSS width for progress bar)
 */

/**
 * AppState Object that contains appState (store) for current app instance
 * @typedef  {Object}           AppState
 *
 * @property {Object}           platformData                Object for storing platform data variables
 * @property {Object}           appData                     Object for storing app data variables
 * @property {Object}           userData                    Object for storing user data variables
 * @property {Object}           config                      Object for storing config variables
 * @property {Object}           userConfig                  Object for storing user config variables
 * @property {Object}           componentCssFiles           Object with css data on files added by Vue components
 * @property {WindowState}      windowState                 Object holding current window state variables
 * @property {StatusData}       status                      Object holding current app status variables
 * @property {ErrorData}        appError                    Object holding current app error variables
 * @property {OperationData}    appOperation                Object holding current app operation variables
 * @property {string}           mainLoaderTitle             App main loader title
 * @property {boolean}          preventClose                Flag to indicate whether closing app window is permitted
 * @property {boolean}          preventReload               Flag to indicate whether reloading app window is permitted
 * @property {boolean}          hasUserConfig               Flag to indicate whether app has saved user config
 * @property {array}            allDebugMessages            An array holding all debug messages
 * @property {array}            debugMessages               An array holding displayed debug messages
 * @property {boolean}          hasDebugWindow              Flag to indicate whether current window has debug window
 * @property {boolean}          isDebugWindow               Flag to indicate whether current window is debug window
 * @property {boolean}          debugToFileStarted          Flag to indicate whether debugging to file has already started
 * @property {array}            allUserMessages             An array holding all user messages
 * @property {array}            userMessages                An array holding displayed user messages
 * @property {array}            userMessageQueue            An array holding pending user messages
 * @property {boolean}          userMessagesToFileStarted   Flag to indicate whether
 * @property {LanguageData}     languageData                Object containing language data and translations
 * @property {array}            availableThemes             An array holding available theme names
 * @property {Object}           appInfo                     Object containing app info variables
 * @property {ProgressData}     progressData                Object containing progress bar data
 * @property {Object}           headerData                  Object for app-header component data
 * @property {Object}           debugData                   Object for app-debug component data
 * @property {Object}           footerData                  Object for app-footer component data
 * @property {Object}           mainData                    Object for app-main component data
 * @property {Object}           userMessagesData            Object for user-messages component data
 * @property {Object}           appNotificationsData        Object for app-notifications component data
 * @property {Object}           modalStatus                 Object for storing modal status data
 * @property {Object}           modalData                   Object for modal-dialog component data
 * @property {Object}           appModals                   Object containing modal dialog definitions
 */

/**
 * @type {AppState}
 * @memberOf appWrapper
 * @name appState-wrapper
 *
 * @todo Complete typedefs
 */
exports.appState = {
    platformData: {},
    appData: {},
    userData: {},
    config: {},
    userConfig: {},
    componentCssFiles: [],
    appBodyClasses: [],
    windowState: {
        title: '',
        position: '',
        x: 0,
        y: 0,
        maximized: false,
        devTools: false,
        showInTaskbar: false,
        resizable: true,
        menu: false,
        icon: false,
        transparent: false,
        show: true,
        kiosk: false,
        frame: false,
        fullscreen: false,
        width: 0,
        height: 0
    },
    status: {
        appLoaded: false,
        appReady: false,
        appInitialized: false,
        appShuttingDown: false,
        appBusy: true,
        appStatus: 'idle',
        appStatusChanging: false,
        languageInitialized: false,
        feAppInitialized: false, // ?
        windowMaximized: false, // ?
        devToolsOpened: false,
        movingWindow: false,
        ctrlPressed: false,
        shiftPressed: false,
        altPressed: false,
        noHandlingKeys: false,
        windowFocused: false,
    },
    appError: {
        error: false,
        defaultTitle: 'Application error',
        defaultText: 'An unknown error occured.',
        title: '',
        text: '',
        debugText: '',
        component: '',
        icon: true,
        messages: 'user'
    },
    mainLoaderTitle: '',
    preventReload: false,
    preventClose: false,

    appOperation: {
        cancelable: false,
        cancelling: false,
        cancelled: false,
        operationText: null,
        useProgress: null,
        progressText: null,
        appBusy: null,
        operationActive: false,
        operationVisible: false,
        operationStartedTimestamp: false,
        operationId: null,
        notify: false
    },

    hasUserConfig: false,

    allDebugMessages: [],
    debugMessages: [],
    hasDebugWindow: false,
    isDebugWindow: false,
    debugToFileStarted: false,

    allUserMessages: [],
    userMessages: [],
    userMessageQueue: [],
    userMessagesToFileStarted: false,

    languageData: {
        currentLanguage: null,
        currentLocale: null,
        availableLanguages: [],
        translations: {}
    },

    availableThemes: [],

    appInfo: {},
    progressData: {
        animated: true,
        inProgress: false,
        percentComplete: 0,
        percentNumber: 0,
        operationText: '',
        detailText: '',
        progressBarClass: '',
        styleObject: {
            width: '0%'
        }
    },
    headerData: {
        hideLiveInfo: false,
        hideProgressBar: false,
    },

    debugData: {},
    footerData: {},
    mainData: {},
    userMessagesData: {
        selectFocused: false
    },
    appNotificationsData: {
        notificationExpired: true,
        timeouts: {},
        newNotifications: [],
        currentNotification: null,
        oldNotifications: []
    },
    modalStatus: {
        animating: false,
        timeouts: {
            setBodyComponentTimeout: null,
            updateResize: null,
            updateUnsetSize: null
        },
        timeoutDurations: {
            setBodyComponentTimeout: 300,
            updateResize: 100,
            updateUnsetSize: 100
        }
    },

    modalData: {
        modalVisible: false,
        modalContentVisible: false,
        modalElement: null,
        fadeModal: 'fade-slow',
        currentModal: false
    },
    appModals: {
        defaultModal: {
            name: 'default-modal',

            bodyComponent: 'modal-body',
            defaultBodyComponent: 'modal-body',

            title: '',
            body: '',

            ready: false,

            busyText: 'Please wait...',
            busy: false,

            opening: false,
            closing: false,

            messages: [],
            currentMessageIndex: -1,

            showContentImmediately: false,

            noHandlingKeys: false,

            autoClosing: false,
            autoCloseTime: 0,
            autoCloseTimeIntervalDuration: 1000,
            autoCloseTimeNotify: 6000,
            autoCloseTimeExpireNotify: 3000,
            autoCloseTimeText: '',

            modalClassName: '',
            preventEscClose: false,

            showCloseLink: true,
            closeLinkText: null,
            cancelOnClose: true,

            showConfirmButton: true,
            confirmButtonText: 'Confirm',
            confirmDisabled: false,
            confirmSelected: true,

            showCancelButton: true,
            cancelButtonText: 'Cancel',
            cancelDisabled: false,
            cancelSelected: false,

            modalAction: null,

            animating: false,
            animateSize: false,

            onBeforeOpen: null,
            onOpen: null,
            onBeforeClose: null,
            onClose: null,
            onConfirm: null,
            onCancel: null
        },
        translationModal: {
            name: 'translation-modal',
            bodyComponent: 'translation-editor',
            defaultBodyComponent: 'translation-editor',
            noHandlingKeys: true,
            hasGoogleTranslate: false,
            hasSearch: false,
            searchResults: null,
            modalClassName: 'translation-editor-modal',
            preventEscClose: true,
        },
        configEditorModal: {
            name: 'config-modal',
            bodyComponent: 'config-editor',
            defaultBodyComponent: 'config-editor',
            modalClassName: 'config-editor-modal',
        },

        debugConfigEditorModal: {
            name: 'debug-config-modal',
            bodyComponent: 'debug-config-editor',
            defaultBodyComponent: 'debug-config-editor',
            modalClassName: 'debug-config-editor-modal',
        },

        userMessagesConfigEditorModal: {
            name: 'user-messages-config-modal',
            bodyComponent: 'user-messages-config-editor',
            defaultBodyComponent: 'user-messages-config-editor',
            modalClassName: 'user-messages-config-editor-modal',
        },

        closeModal: {
            name: 'close-modal',
            bodyComponent: 'modal-body',
            defaultBodyComponent: 'modal-body',
        },

        saveDebugModal: {
            name: 'save-debug',
            bodyComponent: 'save-debug',
            defaultBodyComponent: 'save-debug',
            modalClassName: 'save-debug-log-modal',
            saveDebugFileError: false,
            hasHiddenMessages: false,
            file: '',
            fileExists: false,
            saveAll: false,
            overwriteAction: 'overwrite',
        },

        saveUserMessagesModal: {
            name: 'save-user-messages',
            bodyComponent: 'save-user-messages',
            defaultBodyComponent: 'save-user-messages',
            modalClassName: 'save-user-messages-modal',
            hasHiddenMessages: false,
            saveFileError: false,
            file: '',
            fileExists: false,
            saveAll: false,
            overwriteAction: 'overwrite',
        },

        cancelAndExitModal: {
            name: 'cancel-and-exit',
            bodyComponent: 'cancel-and-exit',
            defaultBodyComponent: 'cancel-and-exit',
            modalClassName: 'cancel-and-exit-modal',
            preventEscClose: true,
            hideProgress: false,
            remainingTime: 0,
            success: false,
            fail: false,
            closing: false,
            reloading: false,
            cancelable: false,
        },

        appInfoModal: {
            name: 'app-info',
            bodyComponent: 'app-info',
            defaultBodyComponent: 'app-info',
            modalClassName: 'app-info-modal',
            busy: true,
        },
    },
};