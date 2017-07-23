/**
 * @fileOverview FileManager class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.1.0
 */

const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

const BaseClass = require('../base').BaseClass;

/**
 * A class for file operations
 *
 * @class
 * @extends BaseClass
 * @memberOf appWrapper
 *
 * @property {array}            watchedFiles        An array with absolute watched file paths
 * @property {Object}           watched             Object that stores references to unwatch methods for watched files
 */
class FileManager extends BaseClass {

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
     * @return {boolean} Shutdown result
     */
    async shutdown () {
        return await this.unwatchAllFiles();
    }

    /**
     * Checks whether given file exists
     *
     * @param  {string} file Absolute file path
     * @return {boolean}     True if file exists, false otherwise
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
     * @return {boolean}     True if file is file, false otherwise
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
     * @return {boolean}     True if file is a directory, false otherwise
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
     * @return {boolean}     True if directory is writable, false otherwise
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
     * @return {boolean}     True if file is writable, false otherwise
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
     * @return {(string|boolean)}     Zip archive path or false if compression failed
     */
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

    /**
     * Creates directory recursively
     *
     * @async
     * @param  {string} directory Absolute directory path
     * @param  {Number} mode      Octal mode definition (i.e. 0o775)
     * @return {boolean}          Result of directory creation
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
        return fs.existsSync(dirName);
    }

    /**
     * Creates directory (recursive) and writes file to it
     *
     * @async
     * @param  {string} fileName Absolute path to file
     * @param  {Number} mode     Octal mode definition (i.e. 0o775)
     * @param  {Object} options  Options object for fs.writeFileSync
     * @param  {string} data     Data to write to file
     * @return {boolean}         True if operation succeeded, false otherwise
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
     * @return {boolean}         True if operation succeeded, false otherwise
     */
    async writeFileSync(file, data, options){
        var saved = false;
        try {
            saved = fs.writeFileSync(file, data, options);
        } catch (ex) {
            console.log(ex);
        }
        return saved;
    }

    /**
     * Reads file from disk
     *
     * @async
     * @param  {string} file  Absolute path to file
     * @param  {Object} options  Options object for fs.writeFileSync
     * @return {(string|null)}   File contents if operation succeeded, null otherwise
     */
    async readFileSync(file, options){
        var data = null;
        try {
            data = fs.readFileSync(file, options);
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
     * @param  {boolean}    requireFiles   Flag to indicate whether to require() files or return their contents as strings
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
     * @param  {boolean}    requireFile Flag to indicate whether to require() file or return its contents as string
     * @param  {boolean}    notSilent   Flag to force logging output
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
                    fileData = fs.readFileSync(filePath, {encoding: 'utf8'}).toString();
                } else {
                    if (notSilent) {
                        this.log('Problem loading file (not a file) "{1}" from "{2}".', 'error', [fileName, directory]);
                    }
                }
            } else {
                if (notSilent) {
                    this.log('Problem loading file (does not exist) "{1}" from "{2}".', 'error', [fileName, directory]);
                }
            }
        } else {
            try {
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
     * @param  {boolean}    requireFile     Flag to indicate whether to require() file or return its contents as string
     * @param  {boolean}    notSilent       Flag to force logging output
     * @return {(string|Object|boolean)}    File contents, exported object or false on failure.
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
     * @param  {string} dirPath Absolute directory path
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
}

exports.FileManager = FileManager;