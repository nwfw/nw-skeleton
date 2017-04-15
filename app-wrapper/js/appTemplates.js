var _ = require('lodash');
var path = require('path');
var fs = require('fs');

var _appWrapper;
var appUtil;
var appState;


class AppTemplates {
	constructor() {

		_appWrapper = window.getAppWrapper();
		appUtil = _appWrapper.getAppUtil();
		appState = appUtil.getAppState();

		this.forceDebug = false;
		this.forceUserMessages = false;

	}

	async initializeTemplates () {
		appUtil.log("Initializing templates.", "group", [], false, this.forceDebug);
		return await this.loadTemplates();
		appUtil.log("Initializing templates.", "groupend", [], false, this.forceDebug);
	}

	async loadTemplates () {

		var templateDirs = appState.config.wrapper.templateDirectories.template;
		if (!(templateDirs && _.isArray(templateDirs) && templateDirs.length)){
			appUtil.log("No app wrapper template dirs defined", "error", [], false, this.forceDebug);
			templateDirs = [];
		}

		var componentTemplateDirs = appState.config.wrapper.templateDirectories.componentTemplate;
		if (!(componentTemplateDirs && _.isArray(componentTemplateDirs) && componentTemplateDirs.length)){
			appUtil.log("No app wrapper component template dirs defined", "error", [], false, this.forceDebug);
			componentTemplateDirs = [];
		}

		var appTemplateDirs = appState.config.appConfig.templateDirectories.template;
		var appComponentTemplateDirs = appState.config.appConfig.templateDirectories.componentTemplate;

		if (!(appTemplateDirs && _.isArray(appTemplateDirs) && appTemplateDirs.length)){
			appUtil.log("No app template dirs defined", "warning", [], false, this.forceDebug);
			appUtil.log("You should define this in ./config/config.js file under 'appConfig.templateDirectories.template' variable", "debug", [], false, this.forceDebug);
			appTemplateDirs = [];
		}

		if (!(appComponentTemplateDirs && _.isArray(appComponentTemplateDirs) && appComponentTemplateDirs.length)){
			appUtil.log("No app component template dirs defined", "warning", [], false, this.forceDebug);
			appUtil.log("You should define this in ./config/config.js file under 'appConfig.templateDirectories.componentTemplate' variable", "debug", [], false, this.forceDebug);
			appComponentTemplateDirs = [];
		}

		var templates = {};
		var componentTemplates = {};

		if (templateDirs.length){
			appUtil.log("Loading wrapper templates from {1} directories.", "group", [templateDirs.length], false, this.forceDebug);
			var newTemplates = await this.loadTemplateDirectories(templateDirs);
			if (newTemplates && _.isObject(newTemplates) && _.keys(newTemplates).length){
				templates = _.merge(templates, newTemplates);
			}
			appUtil.log("Loading wrapper templates from {1} directories.", "groupend", [templateDirs.length], false, this.forceDebug);
		}

		if (componentTemplateDirs.length){
			appUtil.log("Loading wrapper component templates from {1} directories.", "group", [componentTemplateDirs.length], false, this.forceDebug);
			var newTemplates = await this.loadTemplateDirectories(componentTemplateDirs);
			if (newTemplates && _.isObject(newTemplates) && _.keys(newTemplates).length){
				componentTemplates = _.merge(componentTemplates, newTemplates);
			}
			appUtil.log("Loading wrapper component templates from {1} directories.", "groupend", [componentTemplateDirs.length], false, this.forceDebug);
		}

		if (appTemplateDirs.length){
			appUtil.log("Loading app templates from {1} directories.", "group", [appTemplateDirs.length], false, this.forceDebug);
			var newTemplates = await this.loadTemplateDirectories(appTemplateDirs);
			if (newTemplates && _.isObject(newTemplates) && _.keys(newTemplates).length){
				templates = _.merge(templates, newTemplates);
			}
			appUtil.log("Loading app templates from {1} directories.", "groupend", [appTemplateDirs.length], false, this.forceDebug);
		}

		if (appComponentTemplateDirs.length){
			appUtil.log("Loading app component templates from {1} directories.", "group", [appComponentTemplateDirs.length], false, this.forceDebug);
			var newTemplates = await this.loadTemplateDirectories(appComponentTemplateDirs);
			if (newTemplates && _.isObject(newTemplates) && _.keys(newTemplates).length){
				componentTemplates = _.merge(componentTemplates, newTemplates);
			}
			appUtil.log("Loading app component templates from {1} directories.", "groupend", [appComponentTemplateDirs.length], false, this.forceDebug);
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
			appUtil.log("Loading templates from directory '{1}'.", "group", [templateDirs[i]], false, this.forceDebug);
			var currentPath = path.resolve(templateDirs[i]);
			if (fs.existsSync(currentPath)){
				var newTemplates = await this.loadTemplatesFromDir(currentPath, appState.config.wrapper.templateExtensionRegex);
				if (newTemplates){
					loadedTemplates = _.merge(loadedTemplates, newTemplates);
				}
			} else {
				appUtil.log("Template dir '{1}' not found.", "info", [currentPath], false, this.forceDebug);
			}
			appUtil.log("Loading templates from directory '{1}'.", "groupend", [templateDirs[i]], false, this.forceDebug);
		}
		return loadedTemplates;
	}

	async loadTemplatesFromDir (templatePath, templateExtensionRegex){
		var self = this;
		var templates = {};
		if (fs.existsSync(templatePath)){
			var stats = fs.statSync(templatePath);
			if (stats.isDirectory()){
				var files = fs.readdirSync(templatePath);
				_.each(files, function(filePath){
					var templateFilePath = path.join(templatePath, filePath);
					var fileStat = fs.statSync(templateFilePath);
					if (fileStat.isFile()){
						if (filePath.match(templateExtensionRegex)){
							var templateName = filePath.replace(templateExtensionRegex, '');
							appUtil.log("Loading template '{1}'...", "debug", [filePath], false, self.forceDebug);
							// appUtil.addUserMessage("Loading template '{1}'...", "debug", [filePath], false, false, self.forceUserMessages, self.forceDebug);
							templates[templateName] = fs.readFileSync(templateFilePath, {encoding: 'utf8'}).toString();
						} else {
							appUtil.log("Omitting template '{1}', extension invalid.", "info", [templateFilePath], false, self.forceDebug);
							// appUtil.addUserMessage("Omitting template '{1}', extension invalid.", "info", [templateFilePath], false, false, self.forceUserMessages, self.forceDebug);
						}
					} else {
						appUtil.log("Omitting '{1}', is a directory.", "debug", [templateFilePath], false, self.forceDebug);
						// appUtil.addUserMessage("Omitting '{1}', is a directory.", "debug", [templateFilePath], false, false, self.forceUserMessages, self.forceDebug);

					}
				});
				return templates;
			} else {
				appUtil.log("Template dir '{1}' is not a directory!", "error", [templatePath], false, self.forceDebug);
				// appUtil.addUserMessage("Template dir '{1}' is not a directory!", "error", [templatePath], false, false, self.forceUserMessages, self.forceDebug);
				return false;
			}
		} else {
			appUtil.log("Template dir '{1}' does not exist!", "error", [templatePath], false, self.forceDebug);
			// appUtil.addUserMessage("Template dir '{1}' does not exist!", "error", [templatePath], false, false, self.forceUserMessages, self.forceDebug);
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