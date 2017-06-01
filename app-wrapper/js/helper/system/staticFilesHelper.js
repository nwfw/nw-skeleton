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

        this.boundMethods = {
            cssFileChanged: null
        };

        return this;
    }

    async initialize () {
        _.noop(_appWrapper);
        _.noop(appState);

        return await super.initialize();
    }

    async loadCss (href, noWatch, resolvePath) {

        let cssFilePath = href;
        if (!resolvePath){
            cssFilePath  = path.resolve(path.join('.' + href));
        }
        let fileContents = fs.readFileSync(cssFilePath);

        if (!noWatch && appUtil.getConfig('liveCss')){
            _appWrapper.fileManager.watch(cssFilePath, {}, this.boundMethods.cssFileChanged);
        }

        return postcss().process(fileContents, { from: href, to: appUtil.getConfig('appConfig.cssCompiledFile') });
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

    async refreshCss () {
        var links = window.document.querySelectorAll('link');
        _.each(links, function(link){
            if (link.type && link.type == 'text/css'){
                link.href = link.href.replace(/\?rand=.*$/, '') + '?rand=' + (Math.random() * 100);
            }
        });
        appUtil.log('CSS styles reloaded.', 'info', [], false, this.forceDebug);
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
        await this.generateCss();
        this.addCss(appUtil.getConfig('appConfig.cssCompiledFile'));
    }

    async generateCss(noWatch) {
        let compiledCss = await this.compileCss(noWatch);
        if (compiledCss) {
            let compiledCssPath = path.resolve(path.join('.', appUtil.getConfig('appConfig.cssCompiledFile')));
            await this.writeCss(compiledCssPath, compiledCss);
        }
    }

    async writeCss(filePath, cssContents){
        await _appWrapper.fileManager.createDirRecursive(path.dirname(filePath));
        fs.writeFileSync(filePath, cssContents, {flag: 'w'});
    }

    async getCssFiles () {
        var cssFiles = appUtil.getConfig('appConfig.initCssFiles');
        var appCssFiles = appUtil.getConfig('appConfig.cssFiles');
        var debugCssFiles = appUtil.getConfig('appConfig.debugCssFiles');
        var appDebugCssFiles = appUtil.getConfig('appConfig.appDebugCssFiles');

        var totalCssFileCount = 0;
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

        totalCssFileCount = cssFileCount + appCssFileCount;

        if (appState.isDebugWindow){
            totalCssFileCount += debugCssFileCount + appDebugCssFileCount;
        }

        return {
            files: {
                cssFiles,
                appCssFiles,
                debugCssFiles,
                appDebugCssFiles
            },
            counts: {
                cssFileCount,
                appCssFileCount,
                debugCssFileCount,
                appDebugCssFileCount,
                totalCssFileCount
            }
        };
    }

    async compileCss (noWatch) {
        var compiledCss = '';
        var cssFileData = await this.getCssFiles();

        var loadTheme = true;
        var themeFiles = {
            config: false,
            theme: false,
            style: false
        };
        var themeName = appUtil.getConfig('appConfig.theme');
        if (themeName){
            var themePath = path.resolve(path.join('.', '/app/css/theme', themeName));
            if (!_appWrapper.fileManager.isDir(themePath)){
                themePath = path.resolve(path.join('.', '/node_modules/nw-skeleton/app-wrapper/css/themes', themeName));
                if (!_appWrapper.fileManager.isDir(themePath)){
                    loadTheme = false;
                }
            }
        } else {
            loadTheme = false;
        }

        if (loadTheme){
            var themeConfig = path.join(themePath, 'config.css');
            if (_appWrapper.fileManager.isFile(themeConfig)){
                themeFiles.config = themeConfig;
                cssFileData.counts.totalCssFileCount++;
            }
            var themeFile = path.join(themePath, 'theme.css');
            if (_appWrapper.fileManager.isFile(themeFile)){
                themeFiles.theme = themeFile;
                cssFileData.counts.totalCssFileCount++;
            }
            var themeStyle = path.join(themePath, 'theme.css');
            if (_appWrapper.fileManager.isFile(themeStyle)){
                themeFiles.style = themeStyle;
                cssFileData.counts.totalCssFileCount++;
            }
        }

        if (cssFileData.counts.totalCssFileCount){
            appUtil.log('Compiling {1} CSS files', 'group', [cssFileData.counts.totalCssFileCount], false, this.forceDebug);

            if (themeFiles.config){
                appUtil.log('Compiling {1} theme CSS files', 'group', [1], false, this.forceDebug);
                let cssResult = await this.loadCss(themeFiles.config, noWatch, true);
                let cssContents = cssResult.css;
                compiledCss += cssContents;
                appUtil.log('Compiling {1} theme CSS files', 'groupend', [1], false, this.forceDebug);
            }

            if (cssFileData.counts.cssFileCount){
                appUtil.log('Compiling {1} wrapper CSS files', 'group', [cssFileData.counts.cssFileCount], false, this.forceDebug);
                for (let i=0; i<cssFileData.files.cssFiles.length; i++){
                    let cssResult = await this.loadCss(cssFileData.files.cssFiles[i], noWatch);
                    let cssContents = cssResult.css;
                    compiledCss += cssContents;
                }
                appUtil.log('Compiling {1} wrapper CSS files', 'groupend', [cssFileData.counts.cssFileCount], false, this.forceDebug);
            }

            if (themeFiles.theme){
                appUtil.log('Compiling {1} theme CSS files', 'group', [1], false, this.forceDebug);
                let cssResult = await this.loadCss(themeFiles.theme, noWatch, true);
                let cssContents = cssResult.css;
                compiledCss += cssContents;
                appUtil.log('Compiling {1} theme CSS files', 'groupend', [1], false, this.forceDebug);
            }

            if (cssFileData.counts.appCssFileCount){
                appUtil.log('Compiling {1} app CSS files', 'group', [cssFileData.counts.appCssFileCount], false, this.forceDebug);
                for (let i=0; i<cssFileData.files.appCssFiles.length; i++){
                    let cssResult = await this.loadCss(cssFileData.files.appCssFiles[i], noWatch);
                    let cssContents = cssResult.css;
                    compiledCss += cssContents;
                }
                appUtil.log('Compiling {1} app CSS files', 'groupend', [cssFileData.counts.appCssFileCount], false, this.forceDebug);
            }
            if (appState.isDebugWindow){
                if (cssFileData.counts.debugCssFileCount){
                    appUtil.log('Compiling {1} debug window wrapper CSS files', 'group', [cssFileData.counts.debugCssFileCount], false, this.forceDebug);
                    for (let i=0; i<cssFileData.files.debugCssFiles.length; i++){
                        let cssResult = await this.loadCss(cssFileData.files.debugCssFiles[i], noWatch);
                        let cssContents = cssResult.css;
                        compiledCss += cssContents;
                    }
                    appUtil.log('Compiling {1} debug window wrapper CSS files', 'groupend', [cssFileData.counts.debugCssFileCount], false, this.forceDebug);
                }
                if (cssFileData.counts.appDebugCssFileCount){
                    appUtil.log('Compiling {1} debug window app CSS files', 'group', [cssFileData.counts.appDebugCssFileCount], false, this.forceDebug);
                    for (let i=0; i<cssFileData.files.appDebugCssFiles.length; i++){
                        let cssResult = await this.loadCss(cssFileData.files.appDebugCssFiles[i], noWatch);
                        let cssContents = cssResult.css;
                        compiledCss += cssContents;
                    }
                    appUtil.log('Compiling {1} debug window app CSS files', 'groupend', [cssFileData.counts.appDebugCssFileCount], false, this.forceDebug);
                }
            }

            if (themeFiles.style){
                appUtil.log('Compiling {1} theme CSS files', 'group', [1], false, this.forceDebug);
                let cssResult = await this.loadCss(themeFiles.style, noWatch, true);
                let cssContents = cssResult.css;
                compiledCss += cssContents;
                appUtil.log('Compiling {1} theme CSS files', 'groupend', [1], false, this.forceDebug);
            }

            appUtil.log('Compiling {1} CSS files', 'groupend', [cssFileData.counts.totalCssFileCount], false, this.forceDebug);
        }
        return compiledCss;
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

    async cssFileChanged (e, fileName) {
        appUtil.log('Css file \'{1}\' fired event \'{2}\'', 'info', [fileName, e], false, this.forceDebug);
        await this.reloadCss();
    }

    async reloadCss (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        await this.generateCss(true);
        await this.refreshCss();
    }
}

exports.StaticFilesHelper = StaticFilesHelper;