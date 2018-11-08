/**
 * @fileOverview ThemeHelper class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */


/**
 * Object that contains theme definition values
 * @typedef  {Object}   ThemeDefinition
 *
 * @property {string}       name                Name of the theme
 * @property {string}       path                Absolute path to theme directory
 * @property {string}       extends             Name of base theme that current theme extends
 * @property {string[]}     initCssFiles        Array of initial theme css files
 * @property {string[]}     cssFiles            Array of theme css files
 * @property {string[]}     overrideCssFiles    Array of theme css override files
 * @property {string[]}     initJsFiles         Array of initial theme js files
 * @property {string[]}     jsFiles             Array of theme js files
 */

const fs = require('fs');
const path = require('path');
const AppBaseClass = require('../../lib/appBase').AppBaseClass;

var _appWrapper;
var appState;

/**
 * ThemeHelper class - handles and manages themes and theme operations
 *
 * @class
 * @extends {appWrapper.AppBaseClass}
 * @memberof appWrapper.helpers.systemHelpers
 */
class ThemeHelper extends AppBaseClass {

    /**
     * Creates ThemeHelper instance
     *
     * @constructor
     * @return {ThemeHelper}              Instance of ThemeHelper class
     */
    constructor() {
        super();

        _appWrapper = window.getAppWrapper();
        appState = _appWrapper.getAppState();

        return this;
    }

    /**
     * Reads and initializes theme files based on configuration.
     *
     * @async
     * @return {undefined}
     */
    async initializeThemes () {
        appState.availableThemes = [];
        let themeCount = 0;

        this.log('Initializing themes...', 'group', []);

        let appWrapperBaseThemeDir = this.getConfig('wrapper.themeBaseDir');
        if (appWrapperBaseThemeDir){
            appWrapperBaseThemeDir = path.resolve(appWrapperBaseThemeDir);
        }

        let appThemeBaseDir = this.getConfig('appConfig.themeBaseDir');
        if (appThemeBaseDir){
            appThemeBaseDir = path.resolve(appThemeBaseDir);
        }

        if(appWrapperBaseThemeDir){
            themeCount += await this.initializeTypeThemes(appWrapperBaseThemeDir, 'wrapper');
        }
        if(appThemeBaseDir){
            themeCount += await this.initializeTypeThemes(appThemeBaseDir, 'app');
        }
        themeCount += await this.initializeModuleThemes();

        if (themeCount == appState.availableThemes.length){
            this.log('Initialized {1} themes.', 'info', [themeCount]);
        } else {
            this.log('Initialized {1} themes of {2} total ({3} overrides).', 'info', [appState.availableThemes.length, themeCount, (themeCount - appState.availableThemes.length)]);
        }

        appState.availableThemes = _.sortBy(appState.availableThemes, 'name');

        this.log('Initializing themes...', 'groupend', []);
    }

    /**
     * Initializes themes group from directory passed as argument
     *
     * @async
     * @param  {string} baseThemeDir Base theme group dir
     * @param  {string} type         Type of theme ('wrapper' or 'app')
     * @return {Number}              Number of initialized themes from the group
     */
    async initializeTypeThemes(baseThemeDir, type){
        let themeCount = 0;
        if (!type){
            type = '';
        }
        if (_appWrapper.fileManager.isDir(baseThemeDir)){
            let themeDirs = fs.readdirSync(baseThemeDir);
            if (themeDirs && themeDirs.length){
                this.log('Initializing {1} themes from {2} directories...', 'group', [type, themeDirs.length]);
                for(let i=0; i<themeDirs.length; i++){
                    let themePath = path.join(baseThemeDir, themeDirs[i]);
                    if (_appWrapper.fileManager.isDir(themePath)){
                        let themeConfig = await _appWrapper.fileManager.loadFile(path.join(themePath, 'theme.js'), true);
                        if (themeConfig){
                            if (themeConfig.name){
                                if (!themeConfig.path){
                                    themeConfig.path = themePath;
                                }
                                if (await this.registerTheme(themeConfig)){
                                    themeCount++;
                                }
                            } else {
                                this.log('Theme definition from "{1}" has no "name" property!', 'error', [themePath]);
                            }
                        } else {
                            this.log('Problem loading theme definition from "{1}"!', 'error', [themePath]);
                        }
                    } else {
                        this.log('Omitting path "{1}", not a directory', 'debug', [themePath]);
                    }
                }
                this.log('Initializing {1} themes from {2} directories...', 'groupend', [type, themeDirs.length]);
            }
        } else {
            this.log('Directory for {1} themes not found.', 'info', [type]);
        }
        return themeCount;
    }

    /**
     * Loads and initializes themes configured as node modules
     *
     * @async
     * @return {Number} Number of initialized theme modules
     */
    async initializeModuleThemes () {
        let themeModules = this.getConfig('themeModules');
        let modulesInitialized = 0;
        if (themeModules && themeModules.length){
            this.log('Initializing {1} theme modules...', 'group', [themeModules.length]);
            for (let i=0; i<themeModules.length; i++){
                let themeModuleData;
                let themeDefs;
                try {
                    themeModuleData = _appWrapper.app.localRequire(themeModules[i]);
                    if (themeModuleData){
                        if (themeModuleData.themes){
                            themeDefs = themeModuleData.themes;
                            if (themeDefs && themeDefs.length){
                                this.log('Loading theme module "{1}".', 'group', [themeModules[i]]);
                                for (let i=0; i<themeDefs.length; i++){
                                    if (themeDefs[i] && themeDefs[i].theme){
                                        let themeDef = themeDefs[i].theme;
                                        if (themeDef.name && themeDef.path){
                                            if (await this.registerTheme(themeDef)){
                                                modulesInitialized++;
                                            }
                                        }
                                    }
                                }
                                this.log('Loading theme module "{1}".', 'groupend', [themeModules[i]]);
                            } else {
                                this.addUserMessage('Theme module "{1}" "themes" key does not contain any themes.', 'warning', [themeModules[i]]);
                            }
                        } else {
                            this.log('Problem loading theme module "{1}" - "themes" key not found in exported value', 'error', [themeModules[i]]);
                            this.setAppError('Problem loading theme', 'Problem loading theme module "{1}" - "themes" key not found in exported value.', 'Check whether module "{1}" exports value under name "themes".', [themeModules[i]]);
                        }
                    } else {
                        this.log('Problem loading theme module "{1}" - module not found', 'error', [themeModules[i]]);
                        this.setAppError('Problem loading theme', 'Problem loading theme module "{1}" - module not found.', 'Verify config variable "themeModules" to fix this problem.', [themeModules[i]]);
                    }
                } catch (ex){
                    this.log('Problem loading theme module "{1}" - "{2}"', 'error', [themeModules[i], ex.message]);
                    this.setAppError('Problem loading theme', 'Problem loading theme module "{1}" - module not found.', 'Verify config variable "themeModules" to fix this problem.', [themeModules[i]]);
                }
            }
            this.log('Initializing {1} theme modules...', 'groupend', [themeModules.length]);
        }
        return modulesInitialized;
    }

    /**
     * Registers theme in the system, adding it to appState
     *
     * @async
     * @param  {ThemeDefinition}    themeDefinition     Theme definition
     * @return {Boolean}                                Result of theme initialization
     */
    async registerTheme(themeDefinition){
        let result = false;
        if (themeDefinition.name && themeDefinition.path){
            let oldThemesFound = _.filter(appState.availableThemes, { name: themeDefinition.name }).length;
            if (oldThemesFound){
                this.log('Registering theme override "{1}"...', 'debug', [themeDefinition.name]);
                _.remove(appState.availableThemes, { name: themeDefinition.name });
            } else {
                this.log('Registering theme "{1}"...', 'debug', [themeDefinition.name]);
            }
            appState.availableThemes.push(themeDefinition);
            result = true;
        }
        return result;
    }

    /**
     * Gets theme config for given theme
     *
     * @async
     * @param  {string} themeName           Name of the theme
     * @return {ThemeDefinition}            Theme definition
     */
    async getThemeConfig (themeName) {
        let themeConfig;
        if (themeName){
            themeConfig = _.find(appState.availableThemes, {name: themeName});
        }
        return themeConfig;
    }

    /**
     * Returns an array of theme css files for given type, with applied base (extend) theme files
     *
     * @async
     * @param  {ThemeDefinition} themeConfig    Theme config definition
     * @param  {string} type                    Type of css files ('initCssFiles', 'cssFiles' or 'overrideCssFiles')
     * @return {string[]}                       Array of css file paths
     */
    async getThemeTypeCssFiles(themeConfig, type) {
        let cssFiles = [];

        if (type){
            if (themeConfig && themeConfig.name){
                if (themeConfig[type]){
                    let baseThemeConfig;
                    if (themeConfig.extends){
                        baseThemeConfig = await this.getThemeConfig(themeConfig.extends);
                        if (!(baseThemeConfig && baseThemeConfig.name)){
                            this.log('Can not find theme "{1}" that is base theme for "{2}"', 'error', [themeConfig.extends, themeConfig.name]);
                        }
                    }

                    if (_.isArray(themeConfig[type]) && themeConfig[type].length){
                        cssFiles = _.map(themeConfig[type], (file) => {
                            return path.resolve(path.join(themeConfig.path, file));
                        });

                        if (baseThemeConfig && baseThemeConfig[type] && _.isArray(baseThemeConfig[type]) && baseThemeConfig[type].length){
                            let baseCssFiles = _.map(baseThemeConfig[type], (file) => {
                                return path.resolve(path.join(baseThemeConfig.path, file));
                            });
                            if (baseCssFiles && baseCssFiles.length){
                                cssFiles = _.union(baseCssFiles, cssFiles);
                            }
                        }
                    }
                } else {
                    this.log('Can not find type "{1}" for theme "{2}"!', 'error', [type, themeConfig.name]);
                }
            }
        } else {
            this.log('No type argument passed for theme css files!', 'error', []);
        }
        return cssFiles;
    }

    /**
     * Returns an array of theme js files for given type, with applied base (extend) theme files
     *
     * @async
     * @param  {ThemeDefinition} themeConfig    Theme config definition
     * @param  {string} type                    Type of js files
     * @return {string[]}                       Array of js file paths
     */
    async getThemeTypeJsFiles (themeConfig, type){
        let jsFiles = [];
        if (type){
            if (themeConfig && themeConfig.name){
                if (themeConfig[type]){
                    let baseThemeConfig;
                    if (themeConfig.extends){
                        baseThemeConfig = await this.getThemeConfig(themeConfig.extends);
                        if (!(baseThemeConfig && baseThemeConfig.name)){
                            this.log('Can not find theme "{1}" that is base theme for "{2}"', 'error', [themeConfig.extends, themeConfig.name]);
                        }
                    }
                    if (_.isArray(themeConfig[type]) && themeConfig[type].length){
                        let themeJsFiles = _.map(themeConfig[type], (file) => {
                            return path.resolve(path.join(themeConfig.path, file));
                        });
                        for (let i=0; i<themeJsFiles.length; i++){
                            let jsFilePath = themeJsFiles[i];
                            if (fs.existsSync(jsFilePath)){
                                jsFiles.push('file://' + jsFilePath);
                            } else {
                                this.log('Problem loading theme JS file "{1}" - file does not exist!', 'error', [jsFilePath]);
                            }
                        }
                    }
                    if (baseThemeConfig && baseThemeConfig[type] && _.isArray(baseThemeConfig[type]) && baseThemeConfig[type].length){
                        let baseThemeJsFiles = _.map(baseThemeConfig[type], (file) => {
                            return path.resolve(path.join(baseThemeConfig.path, file));
                        });
                        let baseJsFiles = [];
                        for (let i=0; i<baseThemeJsFiles.length; i++){
                            let jsFilePath = baseThemeJsFiles[i];
                            if (fs.existsSync(jsFilePath)){
                                baseJsFiles.push('file://' + jsFilePath);
                            } else {
                                this.log('Problem loading base theme JS file "{1}" - file does not exist!', 'error', [jsFilePath]);
                            }
                        }
                        jsFiles = _.union(baseJsFiles, jsFiles);
                    }
                } else {
                    this.log('Can not find type "{1}" for theme "{2}"!', 'error', [type, themeConfig.name]);
                }
            }
        } else {
            this.log('No type argument passed for theme js files!', 'error', []);
        }
        return jsFiles;
    }

    /**
     * Handler that reloads css files after appState.theme has been changed
     *
     * @return {undefined}
     */
    changeTheme () {
        _appWrapper.getHelper('staticFiles').reloadCss();
    }
}

exports.ThemeHelper = ThemeHelper;