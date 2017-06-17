const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

const BaseClass = require('./base').BaseClass;

// let _appWrapper;
// let appUtil;
// let appState;

class FileManager extends BaseClass {

    constructor(){
        super();

        // if (window && window.getAppWrapper && _.isFunction(window.getAppWrapper)){
        //     _appWrapper = window.getAppWrapper();
        //     appUtil = _appWrapper.getAppUtil();
        //     appState = appUtil.getAppState();
        // }
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
                    this.log('Can\'t open file "{1}" for testing permissions - {2} ', 'error', [filePath, e], false);
                }
                if (!fileHandle){
                    dirValid = false;
                } else {
                    fs.closeSync(fileHandle);
                    try {
                        fs.unlinkSync(filePath);
                    } catch (e){
                        this.log('Can\'t delete temporary file "{1}" - {2} ', 'error', [filePath, e], false);
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
                    this.log('Can\'t open file "{1}" for testing permissions - {2} ', 'error', [filePath, e], false);
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
                            this.log('Can\'t open file "{1}" in dir {2} for testing permissions - {3} ', 'error', [path.basename(filePath), dirPath, e], false);
                        }
                        if (!fileHandle){
                            fileValid = false;
                        } else {
                            fs.closeSync(fileHandle);
                            try {
                                fs.unlinkSync(filePath);
                            } catch (e){
                                this.log('Can\'t delete temporary file "{1}" - {2} ', 'error', [filePath, e], false);
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
            this.log('Error zipping data: "{1}"', 'error', [err], true, false);
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
                this.log('Can\'t create directory "{1}", already exists and it is a file.', 'error', [dirName], true, false);
                return false;
            }
        } else {
            dirPath = dirChunks[0];
            for(let i=1; i< dirChunks.length;i++){
                dirPath = path.join(dirPath, path.sep + dirChunks[i]);
                if (!fs.existsSync(dirPath)){
                    fs.mkdirSync(dirPath, mode);
                } else if (await this.isFile(dirPath)){
                    this.log('Can\'t create directory "{1}", already exists and it is a file.', 'error', [dirPath], true, false);
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
                this.log('Can\'t create file "{1}" - "{2}".', 'error', [filePath, ex && ex.message ? ex.message : ex], true, false);
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
}

exports.FileManager = FileManager;