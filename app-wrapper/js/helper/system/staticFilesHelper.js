var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var postcss = require('postcss');

var BaseClass = require('../../base').BaseClass;

var _appWrapper;
var appUtil;
var appState;


class StaticFilesHelper extends BaseClass {
    constructor() {
        super();

        _appWrapper = this.getAppWrapper();
        appUtil = this.getAppUtil();
        appState = this.getAppState();

        this.forceDebug = appUtil.getConfig('forceDebug.staticFilesHelper');
        this.forceUserMessages = appUtil.getConfig('forceUserMessages.staticFilesHelper');

        this.jsFileLoadResolves = {};
        this.cssFileLoadResolves = {};

        return this;
    }

    async initialize () {
        _.noop(_appWrapper);
        _.noop(appState);
        return await super.initialize();
    }

    async loadCss (href) {

        var cssFilePath = path.resolve(path.join('.' + href));
        var fileContents = fs.readFileSync(cssFilePath);

        return postcss().process(fileContents, { from: href, to: appState.config.appConfig.cssCompiledFile });
    }

    async addCss (href) {

        var parentEl = document.getElementsByTagName('head')[0];

        var returnPromise = new Promise((resolve) => {
            this.cssFileLoadResolves[href] = resolve;
        });

        if (!parentEl){
            throw new Error('No <head> element!');
        } else {
            appUtil.log('Adding CSS file \'{1}\'...', 'debug', [href], false, this.forceDebug);
            var cssNode = document.createElement('link');

            cssNode.onload = () => {
                appUtil.log('Loaded CSS file \'{1}\'...', 'debug', [href], false, this.forceDebug);
                this.cssFileLoadResolves[href](true);
                this.cssFileLoadResolves[href] = null;
            };

            cssNode.setAttribute('rel', 'stylesheet');
            cssNode.setAttribute('type', 'text/css');
            cssNode.setAttribute('href', href);

            parentEl.appendChild(cssNode);
        }
        return returnPromise;
    }

    async loadJs (href) {

        var parentEl = document.getElementsByTagName('head')[0];
        if (!href.match(/^\//)){
            href = '../js/' + href;
        }

        var returnPromise = new Promise((resolve) => {
            this.jsFileLoadResolves[href] = resolve;
        });

        if (!parentEl){
            throw new Error('No <head> element!');
        } else {
            appUtil.log('Adding JS file \'{1}\'...', 'debug', [href], false, this.forceDebug);
            var jsNode = document.createElement('script');

            jsNode.setAttribute('type', 'text/javascript');
            jsNode.setAttribute('src', href);

            jsNode.onload = () => {
                appUtil.log('Loaded JS file \'{1}\'...', 'debug', [href], false, this.forceDebug);
                this.jsFileLoadResolves[href](true);
                this.jsFileLoadResolves[href] = null;
            };

            parentEl.appendChild(jsNode);
        }
        return returnPromise;
    }


    async loadCssFiles() {

        var compiledCssPath = path.resolve(path.join('.', appState.config.appConfig.cssCompiledFile));
        fs.writeFileSync(compiledCssPath, '', {flag: 'w'});

        var cssFiles = appUtil.getConfig('appConfig.initCssFiles');
        var appCssFiles = appUtil.getConfig('appConfig.cssFiles');
        var debugCssFiles = appUtil.getConfig('appConfig.debugCssFiles');
        var appDebugCssFiles = appUtil.getConfig('appConfig.appDebugCssFiles');

        var totalCssFiles = 0;
        var cssFileCount = 0;
        var appCssFileCount = 0;
        var debugCssFileCount = 0;
        var appDebugCssFileCount = 0;

        if (cssFiles && cssFiles.length){
            cssFileCount = cssFiles.length;
        }
        if (appCssFiles && appCssFiles.length){
            appCssFileCount = appCssFiles.length;
        }

        if (debugCssFiles && debugCssFiles.length){
            debugCssFileCount = debugCssFiles.length;
        }

        if (appDebugCssFiles && appDebugCssFiles.length){
            appDebugCssFileCount = appDebugCssFiles.length;
        }

        totalCssFiles = cssFileCount + appCssFileCount;

        if (window.isDebugWindow){
            totalCssFiles += debugCssFileCount + appDebugCssFileCount;
        }

        if (totalCssFiles){
            appUtil.log('Loading {1} CSS files', 'group', [totalCssFiles], false, this.forceDebug);
            if (cssFileCount){
                appUtil.log('Loading {1} wrapper CSS files', 'group', [cssFileCount], false, this.forceDebug);
                for (let i=0; i<cssFiles.length; i++){
                    let cssResult = await this.loadCss(cssFiles[i]);
                    let cssContents = cssResult.css;
                    fs.writeFileSync(compiledCssPath, cssContents, {flag: 'a'});
                }
                appUtil.log('Loading {1} wrapper CSS files', 'groupend', [cssFileCount], false, this.forceDebug);
            }
            if (appCssFileCount){
                appUtil.log('Loading {1} app CSS files', 'group', [appCssFileCount], false, this.forceDebug);
                for (let i=0; i<appCssFiles.length; i++){
                    let cssResult = await this.loadCss(appCssFiles[i]);
                    let cssContents = cssResult.css;
                    fs.writeFileSync(compiledCssPath, cssContents, {flag: 'a'});
                }
                appUtil.log('Loading {1} app CSS files', 'groupend', [appCssFileCount], false, this.forceDebug);
            }
            if (window.isDebugWindow){
                if (debugCssFileCount){
                    appUtil.log('Loading {1} debug window wrapper CSS files', 'group', [debugCssFileCount], false, this.forceDebug);
                    for (let i=0; i<debugCssFiles.length; i++){
                        let cssResult = await this.loadCss(debugCssFiles[i]);
                        let cssContents = cssResult.css;
                        fs.writeFileSync(compiledCssPath, cssContents, {flag: 'a'});
                    }
                    appUtil.log('Loading {1} debug window wrapper CSS files', 'groupend', [debugCssFileCount], false, this.forceDebug);
                }
                if (appDebugCssFileCount){
                    appUtil.log('Loading {1} debug window app CSS files', 'group', [appDebugCssFileCount], false, this.forceDebug);
                    for (let i=0; i<appDebugCssFiles.length; i++){
                        let cssResult = await this.loadCss(appDebugCssFiles[i]);
                        let cssContents = cssResult.css;
                        fs.writeFileSync(compiledCssPath, cssContents, {flag: 'a'});
                    }
                    appUtil.log('Loading {1} debug window app CSS files', 'groupend', [appDebugCssFileCount], false, this.forceDebug);
                }
            }
            appUtil.log('Loading {1} CSS files', 'groupend', [totalCssFiles], false, this.forceDebug);
        }
        this.addCss(appState.config.appConfig.cssCompiledFile);
    }

    async loadJsFiles() {
        var jsFiles = appUtil.getConfig('appConfig.initJsFiles');
        var appJsFiles = appUtil.getConfig('appConfig.jsFiles');

        var jsFileCount = 0;
        var appJsFileCount = 0;
        var totalJsFileCount = 0;

        if (jsFiles && jsFiles.length){
            jsFileCount = jsFiles.length;
        }

        if (appJsFiles && appJsFiles.length){
            appJsFileCount = appJsFiles.length;
        }

        totalJsFileCount = jsFileCount + appJsFileCount;

        if (totalJsFileCount){
            appUtil.log('Loading {1} JS files', 'group', [totalJsFileCount], false, this.forceDebug);
            if (jsFileCount){
                appUtil.log('Loading {1} wrapper JS files', 'group', [jsFileCount], false, this.forceDebug);
                for (let i=0; i<jsFiles.length; i++){
                    await this.loadJs(jsFiles[i]);
                }
                appUtil.log('Loading {1} wrapper JS files', 'groupend', [jsFileCount], false, this.forceDebug);
            }
            if (appJsFileCount){
                appUtil.log('Loading {1} app JS files', 'group', [appJsFileCount], false, this.forceDebug);
                for (let i=0; i<appJsFiles.length; i++){
                    await this.loadJs(appJsFiles[i]);
                }
                appUtil.log('Loading {1} app JS files', 'groupend', [appJsFileCount], false, this.forceDebug);
            }
            appUtil.log('Loading {1} JS files', 'groupend', [totalJsFileCount], false, this.forceDebug);
        }
    }
}

exports.StaticFilesHelper = StaticFilesHelper;