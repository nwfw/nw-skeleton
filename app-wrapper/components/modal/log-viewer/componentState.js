exports.appState = {
    appModals: {
        logViewerModal: {
            title: '',
            body: '',
            name: 'log-viewer',
            bodyComponent: 'log-viewer',
            defaultBodyComponent: 'log-viewer',
            busyText: 'Please wait...',
            busy: true,
            file: '',
            displayTypes: [],
            fileMessages: [],
            displayMessages: [],
            dataLoaded: false,
            messages: [],
            autoCloseTime: 0,
            modalClassName: 'log-viewer-modal',
            showConfirmButton: false,
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
    }
};