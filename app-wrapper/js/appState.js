exports.appState = {
    platformData: {},
    appData: {},
    userData: {},
    config: {},
    userConfig: {},
    componentCssFiles: [],
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
        feAppInitialized: false, // ?
        windowMaximized: false, // ?
        devToolsOpened: false,
        movingWindow: false,
        ctrlPressed: false,
        shiftPressed: false,
        altPressed: false,
        noHandlingKeys: false,
    },
    appError: {
        error: false,
        title: '',
        text: '',
        component: '',
        userMessages: true,
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
        operationId: null
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

    appInfo: {

    },
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
    windowData: {

    },
    headerData: {

    },

    debugData: {

    },
    footerData: {

    },
    mainData: {

    },
    userMessagesData: {
        selectFocused: false
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

    currentModalClosePromise: null,
    closeModalResolve: null,
    closeModalReject: null,

    modalData: {
        modalVisible: false,
        modalContentVisible: false,
        modalElement: null,
        fadeModal: 'fade-slow',
        currentModal: {
            title: '',
            body: '',
            name: 'default-modal',
            bodyComponent: 'modal-body',
            defaultBodyComponent: 'modal-body',
            busyText: 'Please wait...',
            busy: true,
            messages: [],
            currentMessageIndex: -1,
            autoCloseTime: 0,
            modalClassName: '',
            showConfirmButton: true,
            showCancelButton: true,
            confirmButtonText: 'confirm',
            cancelButtonText: 'cancel',
            confirmDisabled: false,
            cancelDisabled: false,
            confirmSelected: true,
            cancelSelected: false,
            modalAction: null,
            animating: false,
            animateSize: false
        }
    },
    defaultModal: {
        title: '',
        body: '',
        name: 'default-modal',
        bodyComponent: 'modal-body',
        defaultBodyComponent: 'modal-body',
        busyText: 'Please wait...',
        busy: true,
        messages: [],
        currentMessageIndex: -1,
        autoCloseTime: 0,
        modalClassName: '',
        showConfirmButton: true,
        showCancelButton: true,
        confirmButtonText: 'confirm',
        cancelButtonText: 'cancel',
        confirmDisabled: false,
        cancelDisabled: false,
        confirmSelected: true,
        cancelSelected: false,
        modalAction: null,
        animating: false,
        animateSize: false
    },
    translationModal: {
        name: 'translation-modal',
        bodyComponent: 'translation-editor',
        defaultBodyComponent: 'translation-editor',
        hasSearch: false,
        searchResults: null,
        modalClassName: 'translation-editor-modal',
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
        fileExists: false,
    },

    saveUserMessagesModal: {
        name: 'save-user-messages',
        bodyComponent: 'save-user-messages',
        defaultBodyComponent: 'save-user-messages',
        modalClassName: 'save-user-messages-modal',
        saveFileError: false,
        fileExists: false,
    },

};