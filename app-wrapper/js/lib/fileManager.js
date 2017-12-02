/**
 * @fileOverview FileManager class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const unzip = require('unzipper');
const AppBaseClass = require('./appBase').AppBaseClass;

/**
 * A class for file operations
 *
 * @class
 * @extends {appWrapper.AppBaseClass}
 * @memberOf appWrapper
 *
 * @property {array}            watchedFiles        An array with absolute watched file paths
 * @property {Object}           watched             Object that stores references to unwatch methods for watched files
 */
class FileManager extends AppBaseClass {

    /**
     * Creates FileManager instance
     *
     * @constructor
     * @return {FileManager}              Instance of FileManager class
     */
    constructor(){
        super();

        this.watchedFiles = [];
        this.watched = {};
    }

    /**
     * Shuts down file manager, unwatching all files and removing leftover references
     *
     * @async
     * @return {Boolean} Shutdown result
     */
    async shutdown () {
        return await this.unwatchAllFiles();
    }

    /**
     * Checks whether given file exists
     *
     * @param  {string} file Absolute file path
     * @return {Boolean}     True if file exists, false otherwise
     */
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

    /**
     * Checks whether given path is a file
     *
     * @async
     * @param  {string} file Absolute file path
     * @return {Boolean}     True if file is file, false otherwise
     */
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

    /**
     * Checks whether given path is a directory
     *
     * @param  {string} dir Absolute directory path
     * @return {Boolean}     True if file is a directory, false otherwise
     */
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

    /**
     * Checks whether given dir is writable by current user
     *
     * @param  {string} dir Absolute directory path
     * @return {Boolean}     True if directory is writable, false otherwise
     */
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

    /**
     * Checks whether given file is writable by current user
     *
     * @param  {string} file Absolute file path
     * @return {Boolean}     True if file is writable, false otherwise
     */
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

    /**
     * Returns absolute path to app root directory
     *
     * @return {string} App directory absolute path
     */
    getAppRoot () {
        var appRoot = path.dirname(process.execPath);
        if (!fs.existsSync(path.resolve(appRoot + '/package.json'))){
            appRoot = path.resolve('.');
        }
        return appRoot;
    }

    /**
     * Compresses files into zip archive
     *
     * @async
     * @param  {string} archivePath Absolute path to zip archive
     * @param  {string[]} files     An array of file paths to compress
     * @return {(string|Boolean)}     Zip archive path or false if compression failed
     */
    async zipFiles(archivePath, files){

        let resolveReference;

        let returnPromise = new Promise((resolve) => {
            resolveReference = resolve;
        });

        let output = fs.createWriteStream(archivePath);
        let archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });

        output.on('close', () => {
            resolveReference(archivePath);
        });

        archive.on('error', (err) => {
            resolveReference(false);
            this.log('Error zipping data: "{1}"', 'error', [err]);
        });

        archive.pipe(output);

        _.each(files, function(file){
            let filePath = file;
            let fileName = path.basename(file);
            archive.append(fs.createReadStream(filePath), { name: fileName });
        });

        archive.finalize();

        return returnPromise;
    }

    /**
     * Compresses file into zip archive
     *
     * @async
     * @param  {string} file        Absolute path to file to zip
     * @param  {string} archive     Absolute path to zip archive
     * @return {(string|Boolean)}   Zip archive path or false if compression failed
     */
    async compressFile(file, archive){
        let result = false;
        if (!await this.isFile(file)){
            this.log('Error zipping file "{1}" - not a file', 'error', [file]);
        } else {
            if (!archive){
                archive = file.replace(/\.[^.]+$/, '') + '.zip';
            }

            result = await this.zipFiles(archive, [file]);
        }
        return result;
    }

    /**
     * Uncompresses (unzips) archive
     *
     * @async
     * @param  {string} archive     Absolute path to zip archive
     * @param  {string} targetDir   Absolute path to target directory. If omitted, archive directory is used
     * @return {Boolean}            Operation result
     */
    async uncompressFile(archive, targetDir){
        if (!await this.isFile(archive)){
            this.log('Error unzipping file "{1}" - not a file', 'error', [archive]);
            return false;
        }

        if (!targetDir){
            targetDir = path.dirname(archive);
        }

        if (!await this.isDir(targetDir)){
            this.log('Error unzipping file "{1}" - target dir "{2}" is not a directory', 'error', [archive, targetDir]);
            return false;
        }

        let resolveReference;

        let returnPromise = new Promise((resolve) => {
            resolveReference = resolve;
        });

        let unzipper = unzip.Extract({
            path: targetDir
        });

        unzipper.on('close', function() {
            resolveReference(true);
        });

        unzipper.on('error', (err) => {
            let msg = err.message ? err.message : err;
            this.log('Error unzipping data: "{1}"', 'error', [msg]);
            resolveReference(false);
        });

        fs.createReadStream(archive).pipe(unzipper);

        return returnPromise;
    }

    /**
     * Compresses directory into zip archive
     *
     * @async
     * @param  {string} dir         Absolute path to directory
     * @param  {string} archive     Absolute path to zip archive
     * @return {(string|Boolean)}   Zip archive path or false if compression failed
     */
    async compressDir(dir, archive){
        if (!await this.isDir(dir)){
            this.log('Error zipping dir "{1}" - not a directory', 'error', [dir]);
            return false;
        }

        if (!archive){
            archive = dir.replace(/\.[^.]+$/, '').replace(/\/$/, '') + '.zip';
        }

        let cwd = process.cwd();
        let baseDir = path.dirname(dir);
        process.chdir(baseDir);

        let resolveReference;

        let returnPromise = new Promise((resolve) => {
            resolveReference = resolve;
        });

        let output = fs.createWriteStream(archive);
        let archiveFile = archiver('zip', {
            zlib: {
                level: 9
            }
        });

        output.on('close', function() {
            process.chdir(cwd);
            resolveReference(archive);
        });

        archiveFile.on('error', (err) => {
            process.chdir(cwd);
            this.log('Error zipping dir: "{1}"', 'error', [err]);
            resolveReference(false);
        });

        archiveFile.pipe(output);
        let archiveDirName = path.basename(dir).replace(/\/?$/, '/');

        archiveFile.directory(archiveDirName, {
            name: archiveDirName
        });

        archiveFile.finalize();

        return returnPromise;
    }

    /**
     * Compresses files into zip archive
     *
     * @async
     * @param  {string}     archivePath Absolute path to zip archive
     * @param  {string[]}   files       An array of file paths to compress
     * @param  {string}     baseDir     Base common dir path for all files
     * @return {(string|Boolean)}       Zip archive path or false if compression failed
     */
    async compressFiles(archivePath, files, baseDir){

        if (await this.fileExists(archivePath)){
            this.log('Error zipping archive "{1}" - file exists', 'error', [archivePath]);
            return false;
        }

        if (!baseDir){
            baseDir = path.resolve('/');
        }

        let cwd = process.cwd();
        process.chdir(baseDir);

        let resolveReference;

        let returnPromise = new Promise((resolve) => {
            resolveReference = resolve;
        });

        let output = fs.createWriteStream(archivePath);
        let archive = archiver('zip', {
            zlib: {
                level: 9
            }
        });

        output.on('close', () => {
            process.chdir(cwd);
            resolveReference(archivePath);
        });

        archive.on('error', (err) => {
            process.chdir(cwd);
            resolveReference(false);
            this.log('Error zipping data: "{1}"', 'error', [err]);
        });

        archive.pipe(output);

        for (let i=0; i<files.length; i++) {
            let file = files[i];
            let filePath = file;
            let fileName = path.basename(file);
            if (await this.isFile(path.join(baseDir, filePath))){
                archive.append(fs.createReadStream(filePath), {
                    name: fileName
                });
            } else if (await this.isDir(path.join(baseDir, filePath))){
                let archiveDirName = filePath.replace(/\/?$/, '/');
                archive.directory(archiveDirName, {
                    name: archiveDirName
                });
            }
        }

        archive.finalize();

        return returnPromise;
    }

    /**
     * Deletes directory recursively
     *
     * @async
     * @param  {String}     directory   Absolute path of directory that should be deleted
     * @return {Boolean}                Operation result
     */
    async deleteDir (directory) {
        let result = true;
        if(await this.isDir(directory)) {
            let files = await this.readDir(directory);
            for (let i=0; i<files.length; i++){
                let currentFile = path.join(directory, files[i]);
                if (await this.isDir(currentFile)) {
                    result = result && await this.deleteDir(currentFile);
                } else {
                    result = result && await this.deleteFile(currentFile);
                }
            }
            fs.rmdirSync(directory);
            result = result && !await this.isDir(directory);
        } else {
            result = false;
        }
        return result;
    }

    /**
     * Creates directory recursively
     *
     * @async
     * @param  {string} directory Absolute directory path
     * @param  {Number} mode      Octal mode definition (i.e. 0o775)
     * @return {Boolean}          Result of directory creation
     */
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
        return await this.isDir(dirName);
    }

    /**
     * Creates directory (recursive) and writes file to it
     *
     * @async
     * @param  {string} fileName Absolute path to file
     * @param  {Number} mode     Octal mode definition (i.e. 0o775)
     * @param  {Object} options  Options object for fs.writeFileSync
     * @param  {string} data     Data to write to file
     * @return {Boolean}         True if operation succeeded, false otherwise
     */
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

    /**
     * Writes file to disk
     *
     * @async
     * @param  {string} file  Absolute path to file
     * @param  {string} data  Data to write
     * @param  {Object} options  Options object for fs.writeFileSync
     * @return {Boolean}         True if operation succeeded, false otherwise
     */
    async writeFileSync(file, data, options){
        try {
            fs.writeFileSync(file, data, options);
        } catch (ex) {
            console.log(ex);
        }
        return await this.isFile(file);
    }

    /**
     * Reads file from disk
     *
     * @param  {string} file  Absolute path to file
     * @param  {Object} options  Options object for fs.writeFileSync
     * @return {(string|null)}   File contents if operation succeeded, null otherwise
     */
    readFileSync(file, options){
        var data = null;
        try {
            data = fs.readFileSync(file, options) + '';
        } catch (ex) {
            console.log(ex);
        }
        return data;
    }

    /**
     * Add listener that gets called when file changes on disk
     *
     * @async
     * @param  {string}     filePath Absolute path to file
     * @param  {Object}     options  Options object for fs.watchFile
     * @param  {Function}   listener Method to call when file changes
     * @return {undefined}
     */
    async watchFile(filePath, options, listener){
        if (await this.isFile(filePath)){
            this.watchedFiles.push(filePath);
            fs.watchFile(filePath, options, listener);
        }
    }

    /**
     * Removes listener that is bound to be called when file changes on disk
     *
     * @async
     * @param  {string}     filePath Absolute path to file
     * @param  {Function}   listener Method to call when file changes
     * @return {undefined}
     */
    async unWatchFile(filePath, listener){
        var watchIndex = _.indexOf(this.watchedFiles, filePath);
        if (watchIndex != -1){
            fs.unwatchFile(filePath, listener);
            _.pullAt(this.watchedFiles, watchIndex);
        }
    }

    /**
     * Removes listeners for all watched files
     *
     * @async
     * @return {undefined}
     */
    async unwatchAllFiles () {
        let watchedFiles = _.clone(this.watchedFiles);
        for (let i=0; i<watchedFiles.length; i++){
            await this.unwatchFile(watchedFiles[i]);
        }
        this.watchedFiles = [];
    }

    /**
     * Add listener that gets called when file changes on disk
     *
     * @async
     * @param  {string}     filePath Absolute path to file
     * @param  {Object}     options  Options object for fs.watchFile
     * @param  {Function}   listener Method to call when file changes
     * @return {undefined}
     */
    async watch(filePath, options, listener){
        if (await this.isFile(filePath)){
            var listenerName = listener.name ? listener.name : listener;
            this.watched[filePath + ':' + listenerName] = fs.watch(filePath, options, listener);
        }
    }

    /**
     * Removes listener that is bound to be called when file changes on disk
     *
     * @async
     * @param  {string}     filePath Absolute path to file
     * @param  {Function}   listener Method to call when file changes
     * @return {undefined}
     */
    async unwatch(filePath, listener){
        var listenerName = listener.name ? listener.name : listener;
        if (this.watched && this.watched[filePath + ':' + listenerName] && this.watched[filePath + ':' + listenerName].close && _.isFunction(this.watched[filePath + ':' + listenerName].close)){
            this.watched[filePath + ':' + listenerName].close();
            delete this.watched[filePath + ':' + listenerName];
        }
    }

    /**
     * Removes listeners for all watched files
     *
     * @async
     * @return {undefined}
     */
    async unwatchAll () {
        for (let name in this.watched){
            this.watched[name].close();
            delete this.watched[name];
        }
        this.watched = [];
    }

    /**
     * Loads all files from given directory that match extension regex from argument
     *
     * @async
     * @param  {string}     directory      Absolute path to directory
     * @param  {string}     extensionMatch Regex string for extension matching
     * @param  {Boolean}    requireFiles   Flag to indicate whether to require() files or return their contents as strings
     * @param  {Boolean}    notSilent       Flag to indicate whether to log outout
     * @return {Object}                    File contents (or required object) by file name
     */
    async loadFilesFromDir (directory, extensionMatch, requireFiles, notSilent) {
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
                        filesData[fileIdentifier] = await this.loadFile(fullPath, requireFiles, notSilent);
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

    /**
     * Loads file from argument
     *
     * @async
     * @param  {string}     filePath    Absolute path to file
     * @param  {Boolean}    requireFile Flag to indicate whether to require() file or return its contents as string
     * @param  {Boolean}    notSilent   Flag to force logging output
     * @return {(string|Object)}        File contents, exported object or null on failure.
     */
    async loadFile (filePath, requireFile, notSilent){
        var fileData = null;
        var fileName = path.basename(filePath);
        var directory = path.dirname(filePath);
        if (notSilent) {
            this.log('Loading file "{1}" from "{2}"...', 'group', [fileName, directory]);
        }
        if (!requireFile){
            if (fs.existsSync(filePath)){
                let fStats = fs.statSync(filePath);
                if (fStats.isFile()){
                    fileData = fs.readFileSync(filePath, {encoding: 'utf8', flag: 'rs+'}).toString();
                } else {
                    if (notSilent) {
                        this.log('Problem loading file (not a file) "{1}" from "{2}".', 'error', [fileName, directory]);
                    }
                    throw new Error('Problem loading file (not a file).');
                }
            } else {
                if (notSilent) {
                    this.log('Problem loading file (does not exist) "{1}" from "{2}".', 'error', [fileName, directory]);
                }
                throw new Error('Problem loading file (does not exist).');
            }
        } else {
            try {
                delete require.cache[require.resolve(path.resolve(filePath))];
                fileData = require(path.resolve(filePath));
                if (fileData.exported){
                    fileData = require(filePath).exported;
                } else {
                    var fileKeys = _.keys(fileData);
                    if (fileKeys && fileKeys.length && fileKeys[0] && fileData[fileKeys[0]]){
                        if (notSilent) {
                            this.log('While requiring file "{1}" from "{2}", "exported" key was not found, using "{3}" key instead.', 'warning', [fileName, directory, fileKeys[0]]);
                        }
                        fileData = fileData[fileKeys[0]];
                    } else {
                        fileData = null;
                        if (notSilent) {
                            this.log('Problem Loading file "{1}" from "{2}", in order to require file, it has to export value "exported"!', 'error', [fileName, directory]);
                        }
                    }
                }
            } catch (ex) {
                if (notSilent) {
                    this.log('Problem requiring file "{1}" - "{2}"', 'error', [filePath, ex.message]);
                }
                throw ex;
            }
        }
        if (fileData){
            if (notSilent) {
                this.log('Successfully loaded file "{1}" from "{2}"...', 'info', [fileName, directory]);
            }
        } else {
            if (notSilent) {
                this.log('Failed loading file "{1}" from "{2}"...', 'error', [fileName, directory]);
            }
            throw new Error('Failed loading file ' + filePath);
        }
        if (notSilent){
            this.log('Loading file "{1}" from "{2}"...', 'groupend', [fileName, directory]);
        }
        return fileData;
    }

    /**
     * Scans given dirs for file and returns first file found
     *
     * @async
     * @param  {string}     fileName        File name (basename)
     * @param  {string[]}   dirs            An array of absolute directory paths to search
     * @param  {Boolean}    requireFile     Flag to indicate whether to require() file or return its contents as string
     * @param  {Boolean}    notSilent       Flag to force logging output
     * @return {(string|Object|Boolean)}    File contents, exported object or false on failure.
     */
    async loadFileFromDirs (fileName, dirs, requireFile, notSilent){
        let currentFile = await this.getFirstFileFromDirs(fileName, dirs);
        if (await this.isFile(currentFile)){
            let fileData = await this.loadFile(currentFile, requireFile, notSilent);
            if (fileData){
                return fileData;
            }
        }
        return false;
    }

    /**
     * Reads file list from dir and returns it, excluding '.' and '..'
     *
     * @async
     * @param  {string} path Absolute directory path
     * @return {string[]}  An array of entries from directory
     */
    async readDir(path){
        let files = [];
        if (await this.isDir(path)){
            files = fs.readdirSync(path);
        }
        return files;
    }

    /**
     * Reads recursive file list from dir and returns it, excluding all '.' and '..' entries
     *
     * @async
     * @param  {string} dirPath         Absolute directory path
     * @param  {string} extensionRegex  Regex for extension matching
     * @return {string[]}  An array of entries from directory and its subdirectories
     */
    async readDirRecursive(dirPath, extensionRegex){
        let files = [];
        let rootFiles = await this.readDir(dirPath);
        for (let i=0; i < rootFiles.length; i++){
            let filePath = path.join(dirPath, rootFiles[i]);
            if (await this.isDir(filePath)){
                files = _.union(files, await this.readDirRecursive(filePath, extensionRegex));
            } else {
                if (extensionRegex) {
                    if (filePath.match(extensionRegex)){
                        files.push(filePath);
                    }
                } else {
                    files.push(filePath);
                }
            }
        }
        return files;
    }

    /**
     * Scans given directories for file, returning path to first one found
     *
     * @async
     * @param  {string} fileName File name (basename)
     * @param  {string[]} dirs   An array of absolute directory paths
     * @return {(string|null)}          Path to found file or null if no file was found
     */
    async getFirstFileFromDirs(fileName, dirs){
        for(let i=0; i<dirs.length; i++){
            let currentFile = path.join(dirs[i], fileName);
            if (await this.isFile(currentFile)){
                return currentFile;
            }
        }
        return null;
    }

    /**
     * Deletes file from the file system
     *
     * @async
     * @param  {string}     filePath Absolute path to file
     * @return {Boolean}             Operation result
     */
    async deleteFile(filePath) {
        let deleted = false;
        if (await this.isFile(filePath)){
            fs.unlinkSync(filePath);
        }
        deleted = !await this.isFile(filePath);
        return deleted;
    }

    /**
     * Copies single file from source to destination
     *
     * @async
     * @param  {string} sourceFile      Source file path
     * @param  {string} destinationFile Destination file path
     * @return {Boolean}                Operation result
     */
    async copyFile(sourceFile, destinationFile){
        let canCopy = true;
        sourceFile = path.resolve(sourceFile);
        destinationFile = path.resolve(destinationFile);
        if (sourceFile !== destinationFile && this.isFile(sourceFile)){
            if (!this.fileExists(destinationFile)){
                let destinationFileDir = path.dirname(destinationFile);
                if (!this.isDir(destinationFileDir)){
                    await this.createDirRecursive(destinationFileDir);
                }
                canCopy = true;
            } else {
                if (this.isFile(destinationFile) && this.isFileWritable(destinationFile)){
                    canCopy = true;
                }
            }
            if (canCopy){
                let sourceStream = fs.createReadStream(sourceFile);
                let destinationStream = fs.createWriteStream(destinationFile);
                return new Promise((resolve, reject) => {
                    sourceStream.on('error', copyFailed);
                    destinationStream.on('error', copyFailed);
                    function copyFailed(err) {
                        sourceStream.destroy();
                        destinationStream.end();
                        reject(err);
                    }
                    destinationStream.on('finish', () => {
                        resolve(true);
                    });
                    sourceStream.pipe(destinationStream);
                });
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    /**
     * Copies source directory (with subdirs and files) to destination directory
     *
     * @async
     * @param  {string} sourceDir      Source directory
     * @param  {string} destinationDir Destination directory
     * @return {Boolean}               Operation result
     */
    async copyDirRecursive(sourceDir, destinationDir){
        let copied = false;
        let canCopy = true;

        sourceDir = path.resolve(sourceDir);
        destinationDir = path.resolve(destinationDir);

        if (sourceDir == destinationDir){
            canCopy = false;
        }

        if (!await this.fileExists(destinationDir)){
            await this.createDirRecursive(destinationDir);
        } else {
            if (!this.isDir(destinationDir)){
                canCopy = false;
            }
        }
        let totalFiles = 0;
        let copiedFiles = 0;
        if (canCopy && this.isDir(sourceDir)){
            let relativePath = path.relative(sourceDir, destinationDir);
            let fileList = await this.readDirRecursive(sourceDir);
            totalFiles = fileList.length;
            for (let i=0; i<totalFiles;i++){
                let sourceFile = fileList[i];
                let destinationFile = path.resolve(path.join(path.dirname(sourceFile), relativePath, path.basename(sourceFile)));
                if (await this.copyFile(sourceFile, destinationFile)){
                    copiedFiles++;
                }
            }
            if (totalFiles == 0 || copiedFiles > 0){
                copied = true;
            }
        }
        return copied;
    }

    /**
     * Renames file or directory
     *
     * @async
     * @param  {string}     oldPath Old path
     * @param  {string}     newPath New path
     * @return {Boolean}            Operation result
     */
    async rename(oldPath, newPath){
        return new Promise((resolve) => {
            fs.rename(oldPath, newPath, (err) => {
                if (err){
                    let msg = err;
                    if (err.message){
                        msg = err.message;
                    }
                    this.log('Error renaming file "{1}" - "{2}"', 'error', [oldPath, msg]);
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }

    /**
     * Gets file info (stat) object for given file or dir
     *
     * @param  {String} file Absolute path to file or dir
     * @return {Stats}       Stats object with file or dir info
     */
    getFileInfo (file){
        if (!file){
            return false;
        }
        let filePath = path.resolve(file);
        let exists = this.fileExists(filePath);
        let fileStat;
        if (exists){
            fileStat = fs.statSync(filePath);
        }
        return fileStat;
    }

    /**
     * Checks whether given file or directory is writable
     *
     * @param  {string}     filePath Path to file or directory to check
     * @return {Boolean}             True if writable, false otherwise
     */
    isWritable(filePath) {
        let result = false;
        try {
            fs.accessSync(filePath, fs.constants.F_OK);
        } catch (ex) {
            result = true;
            try {
                fs.accessSync(path.dirname(filePath), fs.constants.W_OK);
            } catch (ex) {
                result = false;
            }
        }
        if (!result){
            try {
                fs.accessSync(filePath, fs.constants.W_OK);
                result = true;
            } catch (ex) {
                result = false;
            }
        }
        return result;
    }

    /**
     * Checks whether given file or directory is readable
     *
     * @param  {string}     filePath Path to file or directory to check
     * @return {Boolean}             True if readable, false otherwise
     */
    isReadable(filePath) {
        let result = true;
        try {
            fs.accessSync(filePath, fs.constants.R_OK);
        } catch (ex) {
            result = false;
        }
        return result;
    }

    /**
     * Checks whether given file or directory is executable
     *
     * @param  {string}     filePath Path to file or directory to check
     * @return {Boolean}             True if executable, false otherwise
     */
    isExecutable(filePath) {
        let result = true;
        try {
            fs.accessSync(filePath, fs.constants.X_OK);
        } catch (ex) {
            result = false;
        }
        return result;
    }
}

exports.FileManager = FileManager;