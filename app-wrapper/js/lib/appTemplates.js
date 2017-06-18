var _ = require('lodash');
var path = require('path');
var fs = require('fs');

var BaseClass = require('../base').BaseClass;

var _appWrapper;
// var appState;


class AppTemplates extends BaseClass {
    constructor() {

        super();

        _appWrapper = window.getAppWrapper();
        // appState = _appWrapper.getAppState();

    }

    async initialize () {
        return await super.initialize();
    }

    async initializeTemplates () {
        this.log('Initializing templates.', 'group', [], false);
        let templates = await this.loadTemplates();
        this.log('Initializing templates.', 'groupend', [], false);
        return templates;
    }

    async loadTemplates () {

        var templateDirs = this.getConfig('wrapper.templateDirectories.template');
        if (!(templateDirs && _.isArray(templateDirs) && templateDirs.length)){
            this.log('No app wrapper template dirs defined', 'error', [], false);
            templateDirs = [];
        }

        var componentTemplateDirs = this.getConfig('wrapper.templateDirectories.componentTemplate');
        if (!(componentTemplateDirs && _.isArray(componentTemplateDirs) && componentTemplateDirs.length)){
            this.log('No app wrapper component template dirs defined', 'error', [], false);
            componentTemplateDirs = [];
        }

        var appTemplateDirs = this.getConfig('appConfig.templateDirectories.template');
        var appComponentTemplateDirs = this.getConfig('appConfig.templateDirectories.componentTemplate');

        if (!(appTemplateDirs && _.isArray(appTemplateDirs) && appTemplateDirs.length)){
            this.log('No app template dirs defined', 'warning', [], false);
            this.log('You should define this in ./config/config.js file under "appConfig.templateDirectories.template" variable', 'debug', [], false);
            appTemplateDirs = [];
        }

        if (!(appComponentTemplateDirs && _.isArray(appComponentTemplateDirs) && appComponentTemplateDirs.length)){
            this.log('No app component template dirs defined', 'warning', [], false);
            this.log('You should define this in ./config/config.js file under "appConfig.templateDirectories.componentTemplate" variable', 'debug', [], false);
            appComponentTemplateDirs = [];
        }

        var templates = {};
        var componentTemplates = {};

        if (templateDirs.length){
            this.log('Loading wrapper templates from {1} directories.', 'group', [templateDirs.length], false);
            let newTemplates = await this.loadTemplateDirectories(templateDirs);
            if (newTemplates && _.isObject(newTemplates) && _.keys(newTemplates).length){
                templates = _.merge(templates, newTemplates);
            }
            this.log('Loading wrapper templates from {1} directories.', 'groupend', [templateDirs.length], false);
        }

        if (componentTemplateDirs.length){
            this.log('Loading wrapper component templates from {1} directories.', 'group', [componentTemplateDirs.length], false);
            let newTemplates = await this.loadTemplateDirectories(componentTemplateDirs);
            if (newTemplates && _.isObject(newTemplates) && _.keys(newTemplates).length){
                componentTemplates = _.merge(componentTemplates, newTemplates);
            }
            this.log('Loading wrapper component templates from {1} directories.', 'groupend', [componentTemplateDirs.length], false);
        }

        if (appTemplateDirs.length){
            this.log('Loading app templates from {1} directories.', 'group', [appTemplateDirs.length], false);
            let newTemplates = await this.loadTemplateDirectories(appTemplateDirs);
            if (newTemplates && _.isObject(newTemplates) && _.keys(newTemplates).length){
                templates = _.merge(templates, newTemplates);
            }
            this.log('Loading app templates from {1} directories.', 'groupend', [appTemplateDirs.length], false);
        }

        if (appComponentTemplateDirs.length){
            this.log('Loading app component templates from {1} directories.', 'group', [appComponentTemplateDirs.length], false);
            let newTemplates = await this.loadTemplateDirectories(appComponentTemplateDirs);
            if (newTemplates && _.isObject(newTemplates) && _.keys(newTemplates).length){
                componentTemplates = _.merge(componentTemplates, newTemplates);
            }
            this.log('Loading app component templates from {1} directories.', 'groupend', [appComponentTemplateDirs.length], false);
        }

        var allTemplates = {
            templates: templates,
            componentTemplates: componentTemplates
        };
        return allTemplates;
    }

    async loadTemplateDirectories(templateDirs){
        var loadedTemplates = {};
        for(let i=0; i<templateDirs.length; i++){
            this.log('Loading templates from directory "{1}".', 'group', [templateDirs[i]], false);
            var currentPath = path.resolve(templateDirs[i]);
            if (fs.existsSync(currentPath)){
                var newTemplates = await this.loadTemplatesFromDir(currentPath, this.getConfig('wrapper.templateExtensionRegex'));
                if (newTemplates){
                    loadedTemplates = _.merge(loadedTemplates, newTemplates);
                }
            } else {
                this.log('Template dir "{1}" not found.', 'info', [currentPath], false);
            }
            this.log('Loading templates from directory "{1}".', 'groupend', [templateDirs[i]], false);
        }
        return loadedTemplates;
    }

    async loadTemplatesFromDir (templatePath, templateExtensionRegex){
        var templates = {};
        if (fs.existsSync(templatePath)){
            var stats = fs.statSync(templatePath);
            if (stats.isDirectory()){
                var files = fs.readdirSync(templatePath);
                _.each(files, (filePath) => {
                    var templateFilePath = path.join(templatePath, filePath);
                    var fileStat = fs.statSync(templateFilePath);
                    if (fileStat.isFile()){
                        if (filePath.match(templateExtensionRegex)){
                            var templateName = filePath.replace(templateExtensionRegex, '');
                            this.log('Loading template "{1}"...', 'debug', [filePath], false);
                            // this.addUserMessage('Loading template "{1}"...', 'debug', [filePath], false, false);
                            templates[templateName] = fs.readFileSync(templateFilePath, {encoding: 'utf8'}).toString();
                        } else {
                            this.log('Omitting template "{1}", extension invalid.', 'info', [templateFilePath], false);
                            // this.addUserMessage('Omitting template "{1}", extension invalid.', 'info', [templateFilePath], false, false);
                        }
                    } else {
                        this.log('Omitting "{1}", is a directory.', 'debug', [templateFilePath], false);
                        // this.addUserMessage('Omitting "{1}", is a directory.', 'debug', [templateFilePath], false, false);

                    }
                });
                return templates;
            } else {
                this.log('Template dir "{1}" is not a directory!', 'error', [templatePath], false);
                // this.addUserMessage('Template dir "{1}" is not a directory!', 'error', [templatePath], false, false);
                return false;
            }
        } else {
            this.log('Template dir "{1}" does not exist!', 'error', [templatePath], false);
            // this.addUserMessage('Template dir "{1}" does not exist!', 'error', [templatePath], false, false);
            return false;
        }
    }

    getTemplateContents(templateName){
        var template = false;
        if (_appWrapper.templateContents.componentTemplates[templateName]){
            template = _appWrapper.templateContents.componentTemplates[templateName];
        }
        if (_appWrapper.templateContents.templates[templateName]){
            template = _appWrapper.templateContents.templates[templateName];
        }
        return template;
    }
}
exports.AppTemplates = AppTemplates;