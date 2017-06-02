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
        let cssContents = '';
        let compiledCssPath = appUtil.getConfig('appConfig.cssCompiledFile');

        if (!resolvePath){
            cssFilePath  = path.resolve(path.join('.' + href));
        }

        cssContents = await appUtil.loadFile(cssFilePath);
        if (cssContents){
            cssContents = postcss().process(cssContents, { from: href, to: compiledCssPath });
        }

        if (!noWatch && appUtil.getConfig('liveCss')){
            _appWrapper.fileManager.watch(cssFilePath, {}, this.boundMethods.cssFileChanged);
        }


        return cssContents;
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
                // appUtil.log('Loaded CSS file \'{1}\'...', 'debug', [href], false, this.forceDebug);
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
                // appUtil.log('Loaded JS file \'{1}\'...', 'debug', [href], false, this.forceDebug);
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
        let cssFiles = appUtil.getConfig('appConfig.initCssFiles') || [];
        let appCssFiles = appUtil.getConfig('appConfig.cssFiles') || [];
        let debugCssFiles = appUtil.getConfig('appConfig.debugCssFiles') || [];
        let appDebugCssFiles = appUtil.getConfig('appConfig.appDebugCssFiles') || [];

        let themeInitCssFiles = [];
        let themeCssFiles = [];
        let themeOverrideCssFiles = [];

        let totalCssFileCount = 0;

        let cssFileCount = 0;
        let appCssFileCount = 0;
        let debugCssFileCount = 0;
        let appDebugCssFileCount = 0;

        let themeInitCssFileCount = 0;
        let themeCssFileCount = 0;
        let themeOverrideCssFileCount = 0;

        let themeName = appUtil.getConfig('theme');
        let themeConfig;
        if (themeName){
            themeConfig = await this.getThemeConfig(themeName);
            if (themeConfig && themeConfig.name){
                if (themeConfig.initCssFiles && themeConfig.initCssFiles.length){
                    themeInitCssFiles = _.map(themeConfig.initCssFiles, (file) => {
                        return path.resolve(path.join(themeConfig.path, file));
                    });
                    themeInitCssFileCount += themeConfig.initCssFiles.length;
                    totalCssFileCount += themeConfig.initCssFiles.length;
                }

                if (themeConfig.cssFiles && themeConfig.cssFiles.length){
                    themeCssFiles = _.map(themeConfig.cssFiles, (file) => {
                        return path.resolve(path.join(themeConfig.path, file));
                    });
                    themeCssFileCount += themeConfig.cssFiles.length;
                    totalCssFileCount += themeConfig.cssFiles.length;
                }

                if (themeConfig.overrideCssFiles && themeConfig.overrideCssFiles.length){
                    themeOverrideCssFiles = _.map(themeConfig.overrideCssFiles, (file) => {
                        return path.resolve(path.join(themeConfig.path, file));
                    });
                    themeOverrideCssFileCount += themeConfig.overrideCssFiles.length;
                    totalCssFileCount += themeConfig.overrideCssFiles.length;
                }
            }
        }


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

        totalCssFileCount += cssFileCount + appCssFileCount;

        if (appState.isDebugWindow){
            totalCssFileCount += debugCssFileCount + appDebugCssFileCount;
        }

        return {
            files: {
                cssFiles,
                appCssFiles,
                debugCssFiles,
                appDebugCssFiles,
                themeInitCssFiles,
                themeCssFiles,
                themeOverrideCssFiles
            },
            counts: {
                cssFileCount,
                appCssFileCount,
                debugCssFileCount,
                appDebugCssFileCount,
                themeInitCssFileCount,
                themeCssFileCount,
                themeOverrideCssFileCount,
                totalCssFileCount
            }
        };
    }

    async getThemeConfig (themeName) {
        let foundThemeDir = true;
        let themeConfigFile = 'theme';
        let themeConfigPath = '';
        let themeConfig;
        let themeData;
        if (themeName){
            themeData = _.find(appState.availableThemes, {name: themeName});
            if (themeData && themeData.path){
                if (!_appWrapper.fileManager.isDir(themeData.path)){
                    if (!_appWrapper.fileManager.isDir(themeData.path)){
                        foundThemeDir = false;
                    }
                }
            } else {
                foundThemeDir = false;
            }
        } else {
            foundThemeDir = false;
        }

        if (foundThemeDir){
            themeConfigPath = path.join(themeData.path , themeConfigFile);
            themeConfig = await appUtil.loadFile(themeConfigPath, true);
            if (themeConfig && themeConfig.name){
                themeConfig.path = themeData.path;
            }
        }
        return themeConfig;
    }

    async compileCss (noWatch) {
        var compiledCss = '';
        var cssFileData = await this.getCssFiles();

        if (cssFileData.counts.totalCssFileCount){
            appUtil.log('Compiling {1} CSS files', 'group', [cssFileData.counts.totalCssFileCount], false, this.forceDebug);

            if (cssFileData.counts.themeInitCssFileCount){
                appUtil.log('Compiling {1} theme init CSS files', 'group', [cssFileData.counts.themeInitCssFileCount], false, this.forceDebug);
                for (let i=0; i<cssFileData.files.themeInitCssFiles.length; i++){
                    let cssResult = await this.loadCss(cssFileData.files.themeInitCssFiles[i], noWatch, true);
                    let cssContents = cssResult.css;
                    compiledCss += cssContents;
                }
                appUtil.log('Compiling {1} wrapper CSS files', 'groupend', [cssFileData.counts.cssFileCount], false, this.forceDebug);
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

            if (cssFileData.counts.themeCssFileCount){
                appUtil.log('Compiling {1} theme CSS files', 'group', [cssFileData.counts.themeCssFileCount], false, this.forceDebug);
                for (let i=0; i<cssFileData.files.themeCssFiles.length; i++){
                    let cssResult = await this.loadCss(cssFileData.files.themeCssFiles[i], noWatch, true);
                    let cssContents = cssResult.css;
                    compiledCss += cssContents;
                }
                appUtil.log('Compiling {1} wrapper CSS files', 'groupend', [cssFileData.counts.cssFileCount], false, this.forceDebug);
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

            if (cssFileData.counts.themeOverrideCssFileCount){
                appUtil.log('Compiling {1} theme override CSS files', 'group', [cssFileData.counts.themeOverrideCssFileCount], false, this.forceDebug);
                for (let i=0; i<cssFileData.files.themeOverrideCssFiles.length; i++){
                    let cssResult = await this.loadCss(cssFileData.files.themeOverrideCssFiles[i], noWatch, true);
                    let cssContents = cssResult.css;
                    compiledCss += cssContents;
                }
                appUtil.log('Compiling {1} wrapper CSS files', 'groupend', [cssFileData.counts.cssFileCount], false, this.forceDebug);
            }

            appUtil.log('Compiling {1} CSS files', 'groupend', [cssFileData.counts.totalCssFileCount], false, this.forceDebug);
        }
        return compiledCss;
    }

    async loadJsFiles() {
        let jsFiles = appUtil.getConfig('appConfig.initJsFiles');
        let appJsFiles = appUtil.getConfig('appConfig.jsFiles');
        let themeInitJsFiles = [];
        let themeJsFiles = [];

        let jsFileCount = 0;
        let appJsFileCount = 0;
        let themeInitJsFileCount = 0;
        let themeJsFileCount = 0;
        let totalJsFileCount = 0;

        let themeName = appUtil.getConfig('theme');
        if (themeName){
            let themeConfig = await this.getThemeConfig(themeName);
            if (themeConfig && themeConfig.name){
                if (themeConfig.initJsFiles && themeConfig.initJsFiles.length){
                    for (let i=0; i<themeConfig.initJsFiles.length; i++){
                        let jsFile = themeConfig.initJsFiles[i];
                        let jsFilePath = path.resolve(path.join(themeConfig.path, jsFile));
                        if (fs.existsSync(jsFilePath)){
                            let jsHref = '/' + path.relative(path.resolve('.'), jsFilePath);
                            themeInitJsFiles.push(jsHref);
                        } else {
                            appUtil.log('Can\'t find theme JS file \'{1}\'', 'error', [jsFile], false, this.forceDebug);
                        }
                    }
                }
                if (themeConfig.jsFiles && themeConfig.jsFiles.length){
                    for (let i=0; i<themeConfig.jsFiles.length; i++){
                        let jsFile = themeConfig.jsFiles[i];
                        let jsFilePath = path.resolve(path.join(themeConfig.path, jsFile));
                        if (fs.existsSync(jsFilePath)){
                            let jsHref = '/' + path.relative(path.resolve('.'), jsFilePath);
                            themeJsFiles.push(jsHref);
                        } else {
                            appUtil.log('Can\'t find theme JS file \'{1}\'', 'error', [jsFile], false, this.forceDebug);
                        }
                    }
                }
            }
        }

        if (jsFiles && jsFiles.length){
            jsFileCount = jsFiles.length;
            totalJsFileCount += jsFiles.length;
        }

        if (appJsFiles && appJsFiles.length){
            appJsFileCount = appJsFiles.length;
            totalJsFileCount += appJsFiles.length;
        }

        if (themeInitJsFiles && themeInitJsFiles.length){
            themeInitJsFileCount = themeInitJsFiles.length;
            totalJsFileCount += themeInitJsFiles.length;
        }

        if (themeJsFiles && themeJsFiles.length){
            themeJsFileCount = themeJsFiles.length;
            totalJsFileCount += themeJsFiles.length;
        }

        if (totalJsFileCount){
            appUtil.log('Loading {1} JS files', 'group', [totalJsFileCount], false, this.forceDebug);
            if (jsFileCount){
                appUtil.log('Loading {1} wrapper JS files', 'group', [jsFileCount], false, this.forceDebug);
                for (let i=0; i<jsFiles.length; i++){
                    await this.loadJs(jsFiles[i]);
                }
                appUtil.log('Loading {1} wrapper JS files', 'groupend', [jsFileCount], false, this.forceDebug);
            }

            if (themeInitJsFileCount){
                appUtil.log('Loading {1} theme init JS files', 'group', [themeInitJsFileCount], false, this.forceDebug);
                for (let i=0; i<themeInitJsFiles.length; i++){
                    await this.loadJs(themeInitJsFiles[i]);
                }
                appUtil.log('Loading {1} theme init JS files', 'groupend', [themeInitJsFileCount], false, this.forceDebug);
            }

            if (appJsFileCount){
                appUtil.log('Loading {1} app JS files', 'group', [appJsFileCount], false, this.forceDebug);
                for (let i=0; i<appJsFiles.length; i++){
                    await this.loadJs(appJsFiles[i]);
                }
                appUtil.log('Loading {1} app JS files', 'groupend', [appJsFileCount], false, this.forceDebug);
            }

            if (themeJsFileCount){
                appUtil.log('Loading {1} theme JS files', 'group', [themeJsFileCount], false, this.forceDebug);
                for (let i=0; i<themeJsFiles.length; i++){
                    await this.loadJs(themeJsFiles[i]);
                }
                appUtil.log('Loading {1} theme JS files', 'groupend', [themeJsFileCount], false, this.forceDebug);
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

    async initializeThemes () {
        appState.availableThemes = [];
        let appWrapperBaseThemeDir = path.resolve('./node_modules/nw-skeleton/app-wrapper/css/themes');
        let appThemeBaseDir = path.resolve('./app/css/themes');

        appUtil.log('Initializing themes...', 'group', [], false, this.forceDebug);

        if (_appWrapper.fileManager.isDir(appWrapperBaseThemeDir)){
            let wrapperThemeDirs = fs.readdirSync(appWrapperBaseThemeDir);
            if (wrapperThemeDirs && wrapperThemeDirs.length){
                appUtil.log('Initializing {1} wrapper themes...', 'info', [wrapperThemeDirs.length], false, this.forceDebug);
                for(let i=0; i<wrapperThemeDirs.length; i++){
                    await this.registerTheme(wrapperThemeDirs[i], path.join(appWrapperBaseThemeDir, wrapperThemeDirs[i]));
                }
            }
        }
        if (_appWrapper.fileManager.isDir(appThemeBaseDir)){
            let appThemeDirs = fs.readdirSync(appThemeBaseDir);
            if (appThemeDirs && appThemeDirs.length){
                appUtil.log('Initializing {1} app themes...', 'info', [appThemeDirs.length], false, this.forceDebug);
                for(let i=0; i<appThemeDirs.length; i++){
                    await this.registerTheme(appThemeDirs[i], path.join(appThemeBaseDir, appThemeDirs[i]));
                }
            }
        }

        appUtil.log('Initializing themes...', 'groupend', [], false, this.forceDebug);
    }

    async registerTheme(themeName, themeDir){
        if (themeName && themeDir){
            appUtil.log('Registering theme \'{1}\'...', 'info', [themeName], false, this.forceDebug);
            _.remove(appState.availableThemes, { name: themeName });
            appState.availableThemes.push({
                name: themeName,
                path: themeDir
            });
        }
    }

    async changeTheme () {
        await this.reloadCss();
        await _appWrapper.appConfig.saveUserConfig();
    }
}

exports.StaticFilesHelper = StaticFilesHelper;