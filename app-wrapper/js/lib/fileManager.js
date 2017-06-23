const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

const BaseClass = require('../base').BaseClass;

class FileManager extends BaseClass {

    constructor(){
        super();
    }

    async initialize () {
        await super.initialize();

        this.watchedFiles = [];
        this.watched = {};
        return this;
    }

    async shutdown () {
        await this.unwatchAllFiles();
    }

    fileExists(file){
        var fileExists = true;
        var filePath = path.resolve(file);
        if (fs.existsSync(filePath)){
            fileExists = true;
        } else {
            fileExists = false;
        }
        return fileExists;
    }

    async isFile(file){
        if (!file){
            return false;
        }
        var filePath = path.resolve(file);
        var isFile = true;
        var exists = this.fileExists(filePath);
        if (exists){
            var fileStat = fs.statSync(filePath);
            if (!fileStat.isFile()){
                isFile = false;
            }
        } else {
            isFile = false;
        }
        return isFile;
    }

    isDir(dir){
        var dirPath = path.resolve(dir);
        var isDir = true;
        var exists = this.fileExists(dirPath);
        if (exists){
            var fileStat = fs.statSync(dirPath);
            if (!fileStat.isDirectory()){
                isDir = false;
            }
        } else {
            isDir = false;
        }
        return isDir;
    }

    isDirWritable(dir){
        var dirValid = true;
        var dirPath = path.resolve(dir);
        if (fs.existsSync(dirPath)){
            var dirStat = fs.statSync(dirPath);
            if (!dirStat.isDirectory()){
                dirValid = false;
            } else {
                var fileName = (Math.random() + '').replace(/[^\d]+/g, '') + '.tmp';
                var filePath = path.join(dirPath, fileName);
                var fileHandle = false;
                try {
                    fileHandle = fs.openSync(filePath, 'a', 0x775);
                } catch (e) {
                    this.log('Can\'t open file "{1}" for testing permissions - {2} ', 'error', [filePath, e]);
                }
                if (!fileHandle){
                    dirValid = false;
                } else {
                    fs.closeSync(fileHandle);
                    try {
                        fs.unlinkSync(filePath);
                    } catch (e){
                        this.log('Can\'t delete temporary file "{1}" - {2} ', 'error', [filePath, e]);
                    }
                }
            }
        } else {
            dirValid = false;
        }
        return dirValid;
    }

    isFileWritable (file){
        var fileValid = true;
        if (!file){
            fileValid = false;
        } else {
            var filePath = path.resolve(file);
            var dirPath = path.dirname(filePath);
            if (fs.existsSync(filePath)){
                let fileHandle = false;
                try {
                    fileHandle = fs.openSync(filePath, 'a', 0x775);
                } catch (e) {
                    fileValid = false;
                    this.log('Can\'t open file "{1}" for testing permissions - {2} ', 'error', [filePath, e]);
                }
                if (!fileHandle){
                    fileValid = false;
                } else {
                    fs.closeSync(fileHandle);
                }
            } else {
                if (fs.existsSync(dirPath)){
                    var dirStat = fs.statSync(dirPath);
                    if (!dirStat.isDirectory()){
                        fileValid = false;
                    } else {
                        let fileHandle = false;
                        try {
                            fileHandle = fs.openSync(filePath, 'a', 0x775);
                        } catch (e) {
                            fileValid = false;
                            this.log('Can\'t open file "{1}" in dir {2} for testing permissions - {3} ', 'error', [path.basename(filePath), dirPath, e]);
                        }
                        if (!fileHandle){
                            fileValid = false;
                        } else {
                            fs.closeSync(fileHandle);
                            try {
                                fs.unlinkSync(filePath);
                            } catch (e){
                                this.log('Can\'t delete temporary file "{1}" - {2} ', 'error', [filePath, e]);
                            }
                        }
                    }
                } else {
                    fileValid = false;
                }
            }
        }
        return fileValid;
    }

    getAppRoot () {
        var appRoot = path.dirname(process.execPath);
        if (!fs.existsSync(path.resolve(appRoot + '/package.json'))){
            appRoot = path.resolve('.');
        }
        return appRoot;
    }

    async zipFiles(archivePath, files){

        var resolveReference;

        var returnPromise = new Promise((resolve) => {
            resolveReference = resolve;
        });

        var output = fs.createWriteStream(archivePath);
        var archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });

        output.on('close', function() {
            resolveReference(archivePath);
        });

        archive.on('error', function(err) {
            resolveReference(false);
            this.log('Error zipping data: "{1}"', 'error', [err]);
        });

        archive.pipe(output);

        _.each(files, function(file){
            var filePath = file;
            var fileName = path.basename(file);
            archive.append(fs.createReadStream(filePath), { name: fileName });
        });

        archive.finalize();

        return returnPromise;
    }

    async createDirRecursive(directory, mode){
        var dirName = path.resolve(directory);
        var dirChunks = dirName.split(path.sep);
        var dirPath = '';
        if (fs.existsSync(dirName)){
            if (await this.isFile(dirName)){
                this.log('Can\'t create directory "{1}", already exists and it is a file.', 'error', [dirName]);
                return false;
            }
        } else {
            dirPath = dirChunks[0];
            for(let i=1; i< dirChunks.length;i++){
                dirPath = path.join(dirPath, path.sep + dirChunks[i]);
                if (!fs.existsSync(dirPath)){
                    fs.mkdirSync(dirPath, mode);
                } else if (await this.isFile(dirPath)){
                    this.log('Can\'t create directory "{1}", already exists and it is a file.', 'error', [dirPath]);
                    return false;
                }
            }
        }
        return fs.existsSync(dirName);
    }

    async createDirFileRecursive(fileName, mode, options, data){
        if (!options){
            options = {flag: 'w'};
        }
        if (!data){
            data = '';
        }
        if (!mode){
            mode = 0o755;
        }

        var filePath = path.resolve(fileName);
        var dirName = path.dirname(filePath);
        var dirCreated = await this.createDirRecursive(dirName, mode);
        if (!dirCreated){
            return false;
        } else {
            try {
                fs.writeFileSync(filePath, data, options);
                return await this.isFile(filePath);
            } catch (ex) {
                this.log('Can\'t create file "{1}" - "{2}".', 'error', [filePath, ex && ex.message ? ex.message : ex]);
                return false;
            }
        }
    }

    async writeFileSync(file, data, flags){
        var saved = false;
        try {
            saved = fs.writeFileSync(file, data, flags);
        } catch (ex) {
            console.log(ex);
        }
        return saved;
    }

    async readFileSync(file, options){
        var data = null;
        try {
            data = fs.readFileSync(file, options);
        } catch (ex) {
            console.log(ex);
        }
        return data;
    }


    async watchFile(filePath, options, listener){
        this.watchedFiles.push(filePath);
        fs.watchFile(filePath, options, listener);
    }

    async unWatchFile(filePath, listener){
        var watchIndex = _.indexOf(this.watchedFiles, filePath);
        if (watchIndex != -1){
            fs.unwatchFile(filePath, listener);
            _.pullAt(this.watchedFiles, watchIndex);
        }
    }

    async unwatchAllFiles () {
        let watchedFiles = _.clone(this.watchedFiles);
        for (let i=0; i<watchedFiles.length; i++){
            await this.unwatchFile(watchedFiles[i]);
        }
        this.watchedFiles = [];
    }

    async watch(filePath, options, listener){
        var listenerName = listener.name ? listener.name : listener;
        this.watched[filePath + ':' + listenerName] = fs.watch(filePath, options, listener);
    }

    async unwatch(filePath, listener){
        var listenerName = listener.name ? listener.name : listener;
        if (this.watched && this.watched[filePath + ':' + listenerName] && this.watched[filePath + ':' + listenerName].close && _.isFunction(this.watched[filePath + ':' + listenerName].close)){
            this.watched[filePath + ':' + listenerName].close();
            delete this.watched[filePath + ':' + listenerName];
        }
    }

    async unwatchAll () {
        for (let name in this.watched){
            this.watched[name].close();
            delete this.watched[name];
        }
        this.watched = [];
    }

    async loadFilesFromDir (directory, extensionMatch, requireFiles) {
        var filesData = {};
        var extRegex;

        if (!extensionMatch){
            extRegex = /.*/;
        } else if (_.isString(extensionMatch)){
            extensionMatch = extensionMatch.replace(/^\//, '').replace(/\/$/, '').replace(/[^\\]$/, '').replace(/[^\\]\./, '');
            extRegex = new RegExp(extensionMatch);
        } else {
            extRegex = extensionMatch;
            extensionMatch = (extensionMatch + '').replace(/^\//, '').replace(/\/$/, '');
        }

        // directory = path.resolve(directory);

        if (fs.existsSync(directory)){
            var stats = fs.statSync(directory);
            if (stats.isDirectory()){
                // this.log('Loading files from "{1}"...', 'debug', [directory]);
                var files = fs.readdirSync(directory);

                var eligibleFiles = _.filter(files, (file) => {
                    var fileStats = fs.statSync(path.join(directory, file));
                    if (fileStats.isFile()){
                        return true;
                    } else {
                        // this.log('Omitting file "{1}" - file is a directory.', 'debug', [file]);
                    }
                });

                eligibleFiles = _.filter(eligibleFiles, (file) => {
                    if (file.match(extRegex)){
                        return true;
                    } else {
                        // this.log('Omitting file "{1}", extension invalid.', 'debug', [file]);
                    }
                });

                eligibleFiles = _.map(eligibleFiles, (file) => {
                    return path.join(directory, file);
                });


                var filesToLoad = _.filter(eligibleFiles, (file) => {
                    var fileStat = fs.statSync(file);
                    if (fileStat.isFile()){
                        return true;
                    } else {
                        // this.log('Omitting file "{1}", not a file.', 'warning', [path.basename(file)]);
                    }
                });

                if (filesToLoad && filesToLoad.length){
                    // this.log('Found {1} eligible files of {2} total files in "{3}"...', 'debug', [filesToLoad.length, files.length, directory]);

                    for (var i =0 ; i < filesToLoad.length; i++){
                        var fullPath = filesToLoad[i];
                        var fileName = path.basename(fullPath);
                        var fileIdentifier = fileName;
                        if (extensionMatch){
                            fileIdentifier = fileIdentifier.replace(new RegExp(extensionMatch), '');
                        }
                        filesData[fileIdentifier] = await this.loadFile(fullPath, requireFiles);
                    }
                } else {
                    // this.log('No eligible files found in "{1}"...', 'debug', [directory]);
                }
            } else {
                // this.log('Directory "{1}" is not a directory!', 'error', [directory]);
                filesData = false;
            }
        } else {
            // this.log('Directory "{1}" does not exist!', 'error', [directory]);
            filesData = false;
        }
        return filesData;
    }

    async loadFile (filePath, requireFile){
        var fileData = null;
        // var fileName = path.basename(filePath);
        // var directory = path.dirname(filePath);

        // this.log('* Loading file "{1}" from "{2}"...', 'debug', [fileName, directory]);
        if (!requireFile){
            if (fs.existsSync(filePath)){
                let fStats = fs.statSync(filePath);
                if (fStats.isFile()){
                    fileData = fs.readFileSync(filePath, {encoding: 'utf8'}).toString();
                } else {
                    // this.log('Can\'t load file (not a file) "{1}" from "{2}".', 'error', [fileName, directory]);
                }
            } else {
                // this.log('Can\'t load file (doesn\'t exist) "{1}" from "{2}".', 'error', [fileName, directory]);
            }
        } else {
            fileData = require(path.resolve(filePath));
            if (fileData.exported){
                fileData = require(filePath).exported;
            } else {
                var fileKeys = _.keys(fileData);
                if (fileKeys && fileKeys.length && fileKeys[0] && fileData[fileKeys[0]]){
                    // this.log('* While requiring file "{1}" from "{2}", \'exported\' key was not found, using "{3}" instead.', 'debug', [fileName, directory, fileKeys[0]]);
                    fileData = fileData[fileKeys[0]];
                } else {
                    fileData = null;
                    // this.log('* Problem Loading file "{1}" from "{2}", in order to require file, it has to export value \'exported\'!', 'error', [fileName, directory]);
                }
            }
        }
        if (fileData){
            // this.log('* Successfully loaded file "{1}" from "{2}"...', 'debug', [fileName, directory]);
        } else {
            // this.log('* Failed loading file "{1}" from "{2}"...', 'error', [fileName, directory]);
        }
        return fileData;
    }

    async loadFileFromDirs (fileName, dirs, requireFile){
        let currentFile = await this.getFirstFileFromDirs(fileName, dirs);
        if (await this.isFile(currentFile)){
            let fileData = await this.loadFile(currentFile, requireFile);
            if (fileData){
                return fileData;
            }
        }
        return false;
    }

    async readDir(path){
        let files = [];
        if (await this.isDir(path)){
            files = fs.readdirSync(path);
        }
        return files;
    }

    async getFirstFileFromDirs(fileName, dirs){
        for(let i=0; i<dirs.length; i++){
            let currentFile = path.join(dirs[i], fileName);
            if (await this.isFile(currentFile)){
                return currentFile;
            }
        }
        return null;
    }
}

exports.FileManager = FileManager;