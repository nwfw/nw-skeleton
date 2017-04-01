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
		appState = appUtil.getAppState()

		this.forceDebug = false;
		this.forceUserMessages = false;

	}

	async loadTemplates () {

		var templates = await this.loadTemplatesFromDir(path.resolve(appState.config.app.templateRoot), appState.config.app.templateExtensionRegex);
		var appTemplates = await this.loadTemplatesFromDir(path.resolve(appState.config.appConfig.appTemplateRoot), appState.config.appConfig.appTemplateExtensionRegex);
		var allTemplates = _.merge(templates, appTemplates);

		var componentTemplates = {};
		var componentModalTemplates = {};
		var appComponentTemplates = {};
		var appComponentModalTemplates = {};

		if (fs.existsSync(path.resolve(appState.config.app.componentTemplateRoot))){
			// var globalTemplates = await this.loadTemplatesFromDir(path.resolve(appState.config.appConfig.appGlobalTemplateRoot), appState.config.appConfig.appTemplateExtensionRegex);
			componentTemplates = await this.loadTemplatesFromDir(path.resolve(appState.config.app.componentTemplateRoot), appState.config.app.templateExtensionRegex);

		}
		if (fs.existsSync(path.resolve(appState.config.app.modalTemplateRoot))){
			componentModalTemplates = await this.loadTemplatesFromDir(path.resolve(appState.config.app.modalTemplateRoot), appState.config.app.templateExtensionRegex);
		}

		if (fs.existsSync(path.resolve(appState.config.appConfig.appComponentTemplateRoot))){
			var formTemplates = await this.loadTemplatesFromDir(path.resolve(appState.config.appConfig.appFormTemplateRoot), appState.config.appConfig.appTemplateExtensionRegex);
			appComponentTemplates = await this.loadTemplatesFromDir(path.resolve(appState.config.appConfig.appComponentTemplateRoot), appState.config.appConfig.appTemplateExtensionRegex);
			appComponentTemplates = _.merge(appComponentTemplates, formTemplates);
		}
		if (fs.existsSync(path.resolve(appState.config.appConfig.appModalTemplateRoot))){
			appComponentModalTemplates = await this.loadTemplatesFromDir(path.resolve(appState.config.appConfig.appModalTemplateRoot), appState.config.app.templateExtensionRegex);
		}

		var allComponentTemplates = _.merge(componentTemplates, appComponentTemplates, componentModalTemplates);
		return {
			templates: allTemplates,
			componentTemplates: allComponentTemplates
		};
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
}
exports.AppTemplates = AppTemplates;