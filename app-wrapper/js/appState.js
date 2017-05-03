exports.appState = {
    config: {},
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
    timeouts: {
        userMessageScroll: null
    },
    intervals: {
        userMessageQueue: null,
        scrollTo: {}
    },
    appLoaded: false,
    appReady: false,
    appInitialized: false,
    appShuttingDown: false,
    appBusy: true,
    appStatus: 'idle',
    appStatusChanging: false,
    feAppInitialized: false,
    mainLoaderTitle: '',
    appError: false,
    appErrorTitle: '',
    appErrorText: '',
    appErrorUserMessages: true,
    windowMaximized: false,
    devToolsOpened: false,
    movingWindow: false,
    ctrlPressed: false,
    shiftPressed: false,
    altPressed: false,

    appOperation: {
        cancelable: false,
        operationText: null,
        useProgress: null,
        progressText: null,
        appBusy: null
    },
    cancelAppOperation: false,

    hasUserConfig: false,

    hideDebug: true,
    debug: false,
    devTools: false,
    allDebugMessages: [],
    debugMessages: [],
    maxDebugMessages: 200,
    hasDebugWindow: false,
    isDebugWindow: false,
    debugToFileStarted: false,

    allUserMessages: [],
    userMessages: [],
    userMessageQueue: [],
    userMessageLevel: 0,
    maxUserMessages: 30,
    userMessagesToFileStarted: false,

    autoAddLabels: false,
    languageData: {
        currentLanguage: null,
        currentLocale: null,
        availableLanguages: [],
        translations: {}
    },
    appInfo: {

    },
    progressData: {
        inProgress: false,
        percentComplete: 0,
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
    currentModalClosePromise: null,
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
        currentModal: {
            title: '',
            body: '',
            name: 'default-modal',
            bodyComponent: 'modal-body',
            defaultBodyComponent: 'modal-body',
            busyText: 'Please wait...',
            busy: true,
            messages: [],
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
        title: '',
        body: '',
        name: 'translation-modal',
        bodyComponent: 'translation-editor',
        defaultBodyComponent: 'translation-editor',
        busyText: 'Please wait...',
        busy: true,
        messages: [],
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
    configEditorModal: {
        title: '',
        body: '',
        name: 'config-modal',
        bodyComponent: 'config-editor',
        defaultBodyComponent: 'config-editor',
        busyText: 'Please wait...',
        busy: true,
        messages: [],
        autoCloseTime: 0,
        modalClassName: 'config-editor-modal',
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

    closeModal: {
        title: '',
        body: '',
        name: 'close-modal',
        bodyComponent: 'modal-body',
        defaultBodyComponent: 'modal-body',
        busyText: 'Please wait...',
        busy: true,
        messages: [],
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

    closeModalResolve: null,
    closeModalReject: null,

    saveDebugModal: {
        title: '',
        body: '',
        name: 'save-debug',
        bodyComponent: 'save-debug',
        defaultBodyComponent: 'save-debug',
        busyText: 'Please wait...',
        busy: true,
        messages: [],
        autoCloseTime: 0,
        modalClassName: '',
        saveDebugFileError: false,
        fileExists: false,
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

    saveUserMessagesModal: {
        title: '',
        body: '',
        name: 'save-messages',
        bodyComponent: 'save-messages',
        defaultBodyComponent: 'save-messages',
        busyText: 'Please wait...',
        busy: true,
        messages: [],
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
};