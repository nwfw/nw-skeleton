/**
 * @fileOverview StaticFilesHelper class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.0
 */

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const postcssUrl = require('postcss-url');
const AppBaseClass = require('../../lib/appBase').AppBaseClass;

var _appWrapper;
var appState;

/**
 * StaticFilesHelper class - handles and manages static (js and css) file operations
 *
 * @class
 * @extends {appWrapper.AppBaseClass}
 * @memberof appWrapper.helpers.systemHelpers
 * @property {Object}   jsFileLoadResolves    Object containing promises for added js files (each file resolves promise on load)
 * @property {Object}   cssFileLoadResolves   Object containing promises for added css files (each file resolves promise on load)
 * @property {string[]} watchedFiles          Array of watched file paths
 */
class StaticFilesHelper extends AppBaseClass {

    /**
     * Creates StaticFilesHelper instance
     *
     * @constructor
     * @return {StaticFilesHelper}              Instance of StaticFilesHelper class
     */
    constructor() {
        super();

        _appWrapper = window.getAppWrapper();
        appState = _appWrapper.getAppState();

        this.jsFileLoadResolves = {};
        this.cssFileLoadResolves = {};

        this.boundMethods = {
            cssFileChanged: null,
            doReloadCss: null,
        };

        this.timeouts = {
            reloadCss: null
        };

        this.watchedFiles = [];

        return this;
    }

    /**
     * Postcss-url [custom rebase function]{@link https://github.com/postcss/postcss-url#url-function}
     *
     * @param  {Object} asset Asset data
     * @param  {Object} dir   Directories data
     * @return {string}       Absolute path to asset
     */
    rebaseAsset(asset, dir){
        _.noop(dir);
        if (asset.url && asset.url.match(/^#/)){
            return asset.url;
        } else {
            return 'file://' + asset.absolutePath.replace(/\\/g, '/');
        }
    }

    /**
     * Loads css file, returning its contents
     *
     * @async
     * @param  {string}     href    Relative or absolute path to css file
     * @param  {Boolean}    noWatch Flag that prevents file watching
     * @return {string}             Css file contents
     */
    async loadCss (href, noWatch) {
        let cssFilePath = href;
        let cssContents = '';
        let compiledCssFile = this.getConfig('appConfig.cssCompiledFile');
        let compiledCssPath = path.resolve(path.join('.', compiledCssFile));

        if (!await _appWrapper.fileManager.isFile(cssFilePath)){
            cssFilePath  = path.resolve(path.join('.' + href));
        }
        if (await _appWrapper.fileManager.isFile(cssFilePath)){

            cssContents = await _appWrapper.fileManager.loadFile(cssFilePath);

            if (cssContents){
                cssContents = await postcss().use(postcssUrl({url: this.rebaseAsset})).process(cssContents, { from: cssFilePath, to: compiledCssPath });
            }

            if (!noWatch && this.getConfig('liveCss') && this.getConfig('debug.enabled')){
                this.watchedFiles.push(cssFilePath);
                _appWrapper.fileManager.watch(cssFilePath, {persistent: false}, this.boundMethods.cssFileChanged);
            }
        } else {
            this.log('Problem loading CSS file "{1}" - file does not exist', 'error', [cssFilePath]);
        }
        return cssContents;
    }

    /**
     * Add css files to current page head tag
     *
     * @async
     * @param {string}  href    Path to css file
     * @param {Boolean} noWatch Flag that prevents file watching
     * @param {Boolean} silent  Flag that prevents logging
     * @return {undefined}
     */
    async addCss (href, noWatch, silent) {
        let utilHelper = _appWrapper.getHelper('util');
        let headEl = document.querySelector('head');
        let linkHref = href;

        let processDir = process.cwd();
        let processDirRegex = new RegExp('^' + utilHelper.quoteRegex(processDir));
        if (href.match(processDirRegex)){
            linkHref = href.replace(processDirRegex, '');
        } else if (href.match(/^\./)){
            href = path.resolve(href);
            linkHref = href.replace(processDirRegex, '');
        } else {
            if (await _appWrapper.fileManager.isFile(href)){
                linkHref = 'file://' + href;
            } else if (await _appWrapper.fileManager.isFile(path.join(processDir, href))){
                href = path.join(processDir, href);
            } else {
                this.log('Possible CSS file problem for "{1}"', 'warning', href);
            }
        }

        if (!noWatch && this.getConfig('liveCss') && this.getConfig('debug.enabled')){
            this.watchedFiles.push(href);
            _appWrapper.fileManager.watch(href, {persistent: false}, this.boundMethods.cssFileChanged);
        }

        if (!headEl){
            this.log('No <head> element found for adding css file!', 'error');
            return false;
        } else {
            if (!silent){
                this.log('Adding CSS file "{1}"...', 'debug', [href]);
            }
            var returnPromise = new Promise((resolve) => {
                this.cssFileLoadResolves[href] = resolve;
            });
            let cssNode = document.createElement('link');

            cssNode.onload = () => {
                cssNode.onload = null;
                this.cssFileLoadResolves[href](true);

                // this.cssFileLoadResolves[href] = null;
            };

            cssNode.setAttribute('rel', 'stylesheet');
            cssNode.setAttribute('type', 'text/css');
            cssNode.setAttribute('href', linkHref);

            headEl.appendChild(cssNode);
        }
        return returnPromise;
    }

    /**
     * Refreshes css loaded on page by adding random query selector to file url
     *
     * @async
     * @return {undefined}
     */
    async refreshCss () {
        var links = window.document.querySelectorAll('link');
        if (links && links.length){
            this.refreshLinkTags(links);
        } else {
            this.log('No CSS files to reload.', 'warning', []);
        }
    }

    /**
     * Refreshses css files upon css file change on disk
     *
     * @async
     * @param  {string[]}   changedFiles  Array of changed css file paths
     * @return {undefined}
     */
    async refreshCssFiles (changedFiles) {
        let processDir = process.cwd();
        let processDirRegex = new RegExp('^' + processDir);
        let changedHrefs = _.map(changedFiles, (filePath) => {
            return filePath.replace(processDirRegex, '');
        });

        let linkSelectors = [];
        for(let i=0;i<changedHrefs.length;i++){
            linkSelectors.push('link[href*="' + changedHrefs[i] + '"]');
        }

        let links = window.document.querySelectorAll(linkSelectors.join(', '));

        if (links && links.length){
            this.refreshLinkTags(links);
        } else {
            this.log('No CSS files to reload (1).', 'warning', []);
        }
    }

    /**
     * Refreshes selected <link> tags on page by adding (or replacing) random query string to their urls
     *
     * @param  {DOMElement[]} links Array of <link> elements to refresh
     * @return {undefined}
     */
    refreshLinkTags(links){
        if (_.isUndefined(links)){
            links = document.querySelectorAll('link');
        }
        this.log('Reloading {1} CSS files.', 'group', [links.length]);
        let headEl = document.querySelector('head');
        let linkCount = links.length;
        let loadedLinks = 0;
        let newLinks = [];
        for (let i=0; i<links.length; i++) {
            if (links[i].type && links[i].type == 'text/css'){
                this.log('Reloading CSS file "{1}"', 'info', [links[i].href.replace(/^[^/]+\/\/[^/]+/, '').replace(/\?.*$/, '')]);
                let newHref = links[i].href + '';
                newLinks[i] = document.createElement('link');

                newLinks[i].onload = async (e) => {
                    let newLink = e.target;
                    newLink.onload = null;
                    loadedLinks++;
                    this.log('Reloaded CSS file "{1}"', 'info', [newLink.href.replace(/^[^/]+\/\/[^/]+/, '').replace(/\?.*$/, '')]);
                    if (loadedLinks >= linkCount){
                        await this.removeOldCssTags(links);
                        this.log('Reloading {1} CSS files.', 'groupend', [links.length]);
                    }
                };

                newLinks[i].setAttribute('rel', 'stylesheet');
                newLinks[i].setAttribute('type', 'text/css');
                newLinks[i].setAttribute('href', newHref);
                // newLinks[i].setAttribute('data-new', 'true');
                headEl.appendChild(newLinks[i]);
            }
        }
    }

    /**
     * Removes old CSS tags from head element
     *
     * @async
     * @param  {DOMElement[]} links Array of <link> elements to remove
     * @return {undefined}
     */
    async removeOldCssTags (links) {
        await _appWrapper.wait(1);
        this.log('Removing old CSS tags', 'group', []);
        if (_.isUndefined(links)){
            links = document.querySelectorAll('link');
        }
        for (let i=0; i<links.length;i++){
            this.log('Removing old CSS file "{1}" tag', 'info', [links[i].href]);
            links[i].parentNode.removeChild(links[i]);
        }
        this.detectMissingVariables();
        this.log('Removing old CSS tags', 'groupend', []);

    }

    /**
     * Prepares and loads css files using appState and config data
     *
     * @async
     * @param  {Boolean} silent Flag that prevents logging
     * @return {undefined}
     */
    async loadCssFiles(silent) {
        this.log('Preparing css files...', 'group', []);
        await this.generateCss(false, silent);
        let cssFile = this.getConfig('appConfig.cssCompiledFile');
        if (this.getConfig('compileCss')){
            let result = await this.addCss(cssFile, true, silent);
            if (!result){
                this.log('Problem preparing css file "{1}"', 'error', [cssFile]);
            }
            this.cssFileLoadResolves[cssFile] = null;
            delete this.cssFileLoadResolves[cssFile];
        }
        this.detectMissingVariables();
        this.log('Preparing css files...', 'groupend', []);
    }

    /**
     * Generates css by compiling all files or adding all files to head tag based on configuration
     *
     * @async
     * @param {Boolean} noWatch Flag that prevents file watching
     * @param {Boolean} silent  Flag that prevents logging
     * @return {undefined}
     */
    async generateCss(noWatch, silent) {
        if (this.getConfig('compileCss')){
            let compiledCss = await this.compileCss(noWatch, silent);
            if (compiledCss) {
                let compiledCssPath = path.resolve(path.join('.', this.getConfig('appConfig.cssCompiledFile')));
                await this.writeCss(compiledCssPath, compiledCss);
            }
        } else {
            var cssFileData = await this.getCssFileData();
            if (cssFileData.counts.totalCssFileCount){
                if (!silent){
                    this.log('Adding {1} CSS files', 'group', [cssFileData.counts.totalCssFileCount]);
                }

                let basicTypes = [
                    'initCssFiles',
                    'themeInitCssFiles',
                    'appCssFiles',
                    'themeCssFiles',
                ];

                let debugTypes = [
                    'debugCssFiles',
                    'appDebugCssFiles',
                ];

                let overrideTypes = [
                    'componentCssFiles',
                    'themeOverrideCssFiles',
                ];

                for (let j=0;j<basicTypes.length;j++){
                    await this.addCssFiles(cssFileData.files[basicTypes[j]], noWatch, silent);
                }

                if (appState.isDebugWindow){
                    for (let j=0;j<debugTypes.length;j++){
                        await this.addCssFiles(cssFileData.files[debugTypes[j]], noWatch, silent);
                    }
                }

                for (let j=0;j<overrideTypes.length;j++){
                    await this.addCssFiles(cssFileData.files[overrideTypes[j]], noWatch, silent);
                }

                if (!silent){
                    this.log('Adding {1} CSS files', 'groupend', [cssFileData.counts.totalCssFileCount]);
                }
            }
        }
    }

    /**
     * Adds css files to head
     *
     * @async
     * @param {string[]}    cssFiles An array of css files to add
     * @param {Boolean}     noWatch  Flag to prevent filesystem watching of compiled files
     * @param {Boolean}     silent   Flag to prevent logging output
     * @return {undefined}
     */
    async addCssFiles(cssFiles, noWatch, silent){
        if (cssFiles && cssFiles.length){
            for (let i=0; i<cssFiles.length; i++){
                await this.addCss(cssFiles[i], noWatch, silent);
            }
        }
    }

    /**
     * Writes css contents to file from argument
     *
     * @async
     * @param  {string} filePath    Absolute css file path
     * @param  {string} cssContents CSS contents to write
     * @return {undefined}
     */
    async writeCss(filePath, cssContents){
        await _appWrapper.fileManager.createDirRecursive(path.dirname(filePath));
        fs.writeFileSync(filePath, cssContents, {flag: 'w'});
    }

    /**
     * Returns prepared css data object, getting info from appState and configuration
     *
     * @async
     * @return {Object} Css files data object
     */
    async getCssFileData () {
        let themeHelper = _appWrapper.getHelper('theme');

        let initCssFiles = this.getConfig('appConfig.initCssFiles') || [];
        let appCssFiles = this.getConfig('appConfig.cssFiles') || [];
        let debugCssFiles = this.getConfig('appConfig.debugCssFiles') || [];
        let appDebugCssFiles = this.getConfig('appConfig.appDebugCssFiles') || [];
        let componentCssFiles = appState.componentCssFiles || [];

        initCssFiles = _.uniq(_.compact(initCssFiles));
        appCssFiles = _.uniq(_.compact(appCssFiles));
        debugCssFiles = _.uniq(_.compact(debugCssFiles));
        appDebugCssFiles = _.uniq(_.compact(appDebugCssFiles));
        componentCssFiles = _.uniq(_.compact(componentCssFiles));

        let themeInitCssFiles = [];
        let themeCssFiles = [];
        let themeOverrideCssFiles = [];

        let totalCssFileCount = 0;

        let initCssFileCount = 0;
        let appCssFileCount = 0;
        let debugCssFileCount = 0;
        let appDebugCssFileCount = 0;
        let componentCssFileCount = 0;

        let themeInitCssFileCount = 0;
        let themeCssFileCount = 0;
        let themeOverrideCssFileCount = 0;

        let themeName = this.getConfig('theme');
        let themeConfig;
        if (themeName){
            themeConfig = await themeHelper.getThemeConfig(themeName);
            if (!(themeConfig && themeConfig.name)){
                this.addUserMessage('Problem loading theme "{1}", resorting to "basic" theme!', 'error', [themeName]);
                themeName = 'basic';
                appState.config.theme = themeName;
                themeConfig = await themeHelper.getThemeConfig(themeName);
            }
            if (themeConfig && themeConfig.name){
                themeInitCssFiles = await themeHelper.getThemeTypeCssFiles(themeConfig, 'initCssFiles');
                themeInitCssFileCount += themeInitCssFiles.length;
                totalCssFileCount += themeInitCssFiles.length;

                themeCssFiles = await themeHelper.getThemeTypeCssFiles(themeConfig, 'cssFiles');
                themeCssFileCount += themeCssFiles.length;
                totalCssFileCount += themeCssFiles.length;

                themeOverrideCssFiles = await themeHelper.getThemeTypeCssFiles(themeConfig, 'overrideCssFiles');
                themeOverrideCssFileCount += themeOverrideCssFiles.length;
                totalCssFileCount += themeOverrideCssFiles.length;
            }
        }


        if (initCssFiles && initCssFiles.length){
            initCssFileCount = initCssFiles.length;
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

        if (componentCssFiles && componentCssFiles.length){
            componentCssFileCount = componentCssFiles.length;
        }

        totalCssFileCount += initCssFileCount + appCssFileCount + componentCssFileCount;

        if (appState.isDebugWindow){
            totalCssFileCount += debugCssFileCount + appDebugCssFileCount;
        }

        let cssFileData = {
            files: {
                initCssFiles,
                appCssFiles,
                debugCssFiles,
                appDebugCssFiles,
                componentCssFiles,
                themeInitCssFiles,
                themeCssFiles,
                themeOverrideCssFiles
            },
            counts: {
                initCssFileCount,
                appCssFileCount,
                debugCssFileCount,
                appDebugCssFileCount,
                componentCssFileCount,
                themeInitCssFileCount,
                themeCssFileCount,
                themeOverrideCssFileCount,
                totalCssFileCount
            }
        };

        return cssFileData;
    }

    /**
     * Returns list of css files to be loaded, using appState and configuration
     *
     * @async
     * @return {string[]} An array of CSS file paths
     */
    async getCssFiles () {
        let cssFiles = [];
        let fileData = await this.getCssFileData();
        if (fileData && fileData.files){
            for(let fileGroup in fileData.files){
                for (let i=0; i<fileData.files[fileGroup].length; i++){
                    cssFiles.push(fileData.files[fileGroup][i]);
                }
            }
        }
        return cssFiles;
    }

    /**
     * Loads css from all files in group and returns compiled css value
     *
     * @async
     * @param  {string[]}   cssFiles An array of css file paths to load
     * @param  {string}     type     Type of css file paths to load
     * @param  {Boolean}    noWatch  Flag to prevent filesystem watching of compiled files
     * @param  {Boolean}    silent   Flag to prevent logging output
     * @return {string}              Compiled css contents of all files
     */
    async compileCssTypeGroup (cssFiles, type, noWatch, silent){
        if (!type){
            this.log('No type passed for CSS group compilation.', 'error', []);
            return false;
        }
        let compiledCss = '';
        let cssFileCount = cssFiles.length;

        if (cssFileCount){
            if (!silent){
                this.log('Compiling {1} {2} CSS files', 'group', [cssFileCount, type]);
            }
            for (let i=0; i<cssFileCount; i++){
                let cssResult = await this.loadCss(cssFiles[i], noWatch);
                if (cssResult && cssResult.css){
                    let cssContents = cssResult.css;
                    compiledCss += cssContents;
                }
            }
            if (!silent){
                this.log('Compiling {1} {2} CSS files', 'groupend', [cssFileCount, type]);
            }
        }
        return compiledCss;
    }

    /**
     * Compiles all css file contents to minified css, based on configuration
     *
     * @async
     * @param {Boolean} noWatch Flag that prevents file watching
     * @param {Boolean} silent  Flag that prevents logging
     * @return {string}         Minified and compiled CSS contents
     */
    async compileCss (noWatch, silent) {
        let compiledCss = '';
        let cssFileData = await this.getCssFileData();

        if (cssFileData.counts.totalCssFileCount){
            if (!silent){
                this.log('Compiling {1} CSS files', 'group', [cssFileData.counts.totalCssFileCount]);
            }

            compiledCss += await this.compileCssTypeGroup(cssFileData.files.initCssFiles, 'init', noWatch, silent);
            compiledCss += await this.compileCssTypeGroup(cssFileData.files.themeInitCssFiles, 'theme init', noWatch, silent);
            compiledCss += await this.compileCssTypeGroup(cssFileData.files.appCssFiles, 'app', noWatch, silent);
            compiledCss += await this.compileCssTypeGroup(cssFileData.files.themeCssFiles, 'theme', noWatch, silent);

            if (appState.isDebugWindow){
                compiledCss += await this.compileCssTypeGroup(cssFileData.files.debugCssFiles, 'app-debug', noWatch, silent);
                compiledCss += await this.compileCssTypeGroup(cssFileData.files.appDebugCssFiles, 'debug', noWatch, silent);
            }

            compiledCss += await this.compileCssTypeGroup(cssFileData.files.componentCssFiles, 'component', noWatch, silent);
            compiledCss += await this.compileCssTypeGroup(cssFileData.files.themeOverrideCssFiles, 'theme override', noWatch, silent);

            if (!silent){
                this.log('{1} CSS files compiled, total size: {2}', 'info', [cssFileData.counts.totalCssFileCount, _appWrapper.getHelper('format').formatFileSize(compiledCss.length)]);
                this.log('Compiling {1} CSS files', 'groupend', [cssFileData.counts.totalCssFileCount]);
            }
        }
        return compiledCss;
    }

    /**
     * Adds js file script tag to document head element
     *
     * @async
     * @param  {string} jsFile Path to js file
     * @return {Boolean}     Js file loading result
     */
    async loadJs (jsFile) {
        let headEl = document.querySelector('head');
        let fileUrl = jsFile;
        if (!(jsFile.match(/^\//) || jsFile.match(/^file:\/\//))){
            fileUrl = '../js/' + jsFile;
        }
        if (!headEl){
            this.log('No <head> element found for adding js file!', 'error');
            return false;
        } else {
            var returnPromise = new Promise((resolve) => {
                this.jsFileLoadResolves[jsFile] = resolve;
            });
            this.log('Adding JS file "{1}"...', 'debug', [jsFile]);
            let jsNode = document.createElement('script');
            jsNode.setAttribute('type', 'text/javascript');
            jsNode.setAttribute('src', fileUrl);
            jsNode.onload = () => {
                jsNode.onload = null;
                this.jsFileLoadResolves[jsFile](true);
            };
            headEl.appendChild(jsNode);
            return returnPromise;
        }
    }

    /**
     * Loads group of js files of given type
     *
     * @async
     * @param  {string[]} jsFiles   An array of js files to load
     * @param  {string} type        Type of js files to load
     * @return {undefined}
     */
    async loadJsTypeGroup (jsFiles, type){
        if (!type){
            this.log('No type passed for JS group loading.', 'error', []);
            return false;
        }
        let jsFileCount = jsFiles.length;
        if (jsFileCount){
            this.log('Loading {1} {2} JS files', 'group', [jsFileCount, type]);
            for (let i=0; i<jsFileCount; i++){
                let result = await this.loadJs(jsFiles[i]);
                if (!result){
                    this.log('Problem loading JS file "{1}"', 'error', [jsFiles[i]]);
                }
                this.jsFileLoadResolves[jsFiles[i]] = null;
                delete this.jsFileLoadResolves[jsFiles[i]];
            }
            this.log('Loading {1} {2} JS files', 'groupend', [jsFileCount, type]);
        }
    }

    /**
     * Loads all js files using configuration
     *
     * @async
     * @return {undefined}
     */
    async loadJsFiles() {
        let themeHelper = _appWrapper.getHelper('theme');
        let jsFiles = this.getConfig('appConfig.initJsFiles');
        let appJsFiles = this.getConfig('appConfig.jsFiles');
        let themeInitJsFiles = [];
        let themeJsFiles = [];

        let totalJsFileCount = 0;

        let themeName = this.getConfig('theme');
        if (themeName){
            let themeConfig = await _appWrapper.getHelper('theme').getThemeConfig(themeName);
            if (themeConfig && themeConfig.name){
                themeInitJsFiles = await themeHelper.getThemeTypeJsFiles(themeConfig, 'initJsFiles');
                themeJsFiles = await themeHelper.getThemeTypeJsFiles(themeConfig, 'jsFiles');
            }
        }

        if (jsFiles && jsFiles.length){
            totalJsFileCount += jsFiles.length;
        }

        if (appJsFiles && appJsFiles.length){
            totalJsFileCount += appJsFiles.length;
        }

        if (themeInitJsFiles && themeInitJsFiles.length){
            totalJsFileCount += themeInitJsFiles.length;
        }

        if (themeJsFiles && themeJsFiles.length){
            totalJsFileCount += themeJsFiles.length;
        }

        if (totalJsFileCount){
            this.log('Loading {1} JS files', 'group', [totalJsFileCount]);
            await this.loadJsTypeGroup(jsFiles, 'wrapper');
            await this.loadJsTypeGroup(themeInitJsFiles, 'theme init');
            await this.loadJsTypeGroup(appJsFiles, 'app');
            await this.loadJsTypeGroup(themeJsFiles, 'theme');
            this.log('Loading {1} JS files', 'groupend', [totalJsFileCount]);
        }
    }

    /**
     * Handler that gets triggered when css file is changed on disk
     *
     * @async
     * @param  {Event}  e           Event that triggered the method
     * @param  {string} filename    Path to changed file
     * @return {undefined}
     */
    async cssFileChanged (e, filename) {
        this.log('Css file "{1}" fired event "{2}"', 'debug', [filename, e]);
        if (this.getConfig('compileCss')){
            await this.doReloadCss();
        } else {
            let filenameRegex = new RegExp(filename);
            let cssFiles = await this.getCssFiles();
            let changedFiles = [];
            for(let i=0; i<cssFiles.length;i++){
                if (cssFiles[i].match(filenameRegex)){
                    changedFiles.push(cssFiles[i]);
                }
            }
            if (changedFiles && changedFiles.length){
                await this.refreshCssFiles(changedFiles);
            }
        }
    }

    /**
     * Handler that reloads all css on page
     *
     * @param  {Event}  e           Event that triggered the method
     * @return {undefined}
     */
    reloadCss (e) {
        if (e && e.preventDefault && _.isFunction(e.preventDefault)){
            e.preventDefault();
        }
        clearTimeout(this.timeouts.reloadCss);
        this.timeouts.reloadCss = setTimeout(this.boundMethods.doReloadCss, 100);
    }

    /**
     * Handler that reloads all css on page
     *
     * @async
     * @return {undefined}
     */
    async doReloadCss () {
        clearTimeout(this.timeouts.reloadCss);
        try {
            await this.generateCss(true, true);
            await this.refreshCss();
        } catch (ex){
            this.log('Problem reloading CSS - "{1}"', 'error', [ex.message]);
        }
    }


    /**
     * Removes watchers from all watched files
     *
     * @async
     * @return {undefined}
     */
    async unwatchFiles () {
        for (let i=0; i<this.watchedFiles.length; i++){
            await _appWrapper.fileManager.unwatch(this.watchedFiles[i], this.boundMethods.cssFileChanged);
        }
        this.watchedFiles = [];
    }

    /**
     * Detects eventual missing css variables
     *
     * @param  {Boolean} silent Flag to prevent logging
     * @return {string[]}       All missing css variable names
     */
    async detectMissingVariables (silent){
        let missingVariables = [];
        if (!this.getConfig('compileCss')){
            this.log('Missing css variables detection only works with compiled css', 'info');
        } else {
            let styleHelper = _appWrapper.getHelper('style');
            let allVariables = [];
            let cssString = await this.compileCss(true, true);
            let matches = cssString.match(/var\((--[^)]+)/g);
            if (matches){
                let fixedMatches = _.map(matches, (item) => {
                    return item.replace(/var\(/gm, '');
                });
                allVariables = _.concat(allVariables, fixedMatches);
            }
            allVariables = _.uniq(allVariables);
            allVariables = allVariables.sort();
            for (let i=0; i<allVariables.length; i++){
                let value = styleHelper.getCssVarValue(allVariables[i]);
                if (!value){
                    missingVariables.push(allVariables[i]);
                }
            }
            if (!silent){
                if (missingVariables && missingVariables.length){
                    this.log('Missing css variables found - "{1}"', 'warning', [missingVariables.join('", "')]);
                } else {
                    this.log('No missing css variables found', 'info', []);
                }
            }
        }
        return missingVariables;
    }
}

exports.StaticFilesHelper = StaticFilesHelper;