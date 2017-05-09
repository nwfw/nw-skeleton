var eventEmitter = require('events');
var path = require('path');
var fs = require('fs');
var archiver = require('archiver');

var _ = require('lodash');

var appUtil = require('./appUtil').appUtil;

class FileManager extends eventEmitter {

    constructor(){
        super();
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
                    appUtil.log('Can\'t open file \'{1}\' for testing permissions - {2} ', 'error', [filePath, e], false, this.forceDebug);
                }
                if (!fileHandle){
                    dirValid = false;
                } else {
                    fs.closeSync(fileHandle);
                    try {
                        fs.unlinkSync(filePath);
                    } catch (e){
                        appUtil.log('Can\'t delete temporary file \'{1}\' - {2} ', 'error', [filePath, e], false, this.forceDebug);
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
                    appUtil.log('Can\'t open file \'{1}\' for testing permissions - {2} ', 'error', [filePath, e], false, this.forceDebug);
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
                            appUtil.log('Can\'t open file \'{1}\' in dir {2} for testing permissions - {3} ', 'error', [path.basename(filePath), dirPath, e], false, this.forceDebug);
                        }
                        if (!fileHandle){
                            fileValid = false;
                        } else {
                            fs.closeSync(fileHandle);
                            try {
                                fs.unlinkSync(filePath);
                            } catch (e){
                                appUtil.log('Can\'t delete temporary file \'{1}\' - {2} ', 'error', [filePath, e], false, this.forceDebug);
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
            appUtil.log('Error zipping data: \'{1}\'', 'error', [err], true, false, this.forceDebug);
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
        for(let i=0; i< dirChunks.length;i++){
            dirPath = path.join(dirPath, path.sep + dirChunks[i]);
            if (!fs.existsSync(dirPath)){
                fs.mkdirSync(dirPath, mode);
            } else if (await this.isFile(dirPath)){
                appUtil.log('Can\'t create directory \'{1}\', already exists and it is a file.', 'error', [dirPath], true, false, this.forceDebug);
                return false;
            }
        }
        return fs.existsSync(dirName);
    }

    async createDirFileRecursive(fileName, mode, flags){
        if (!flags){
            flags = {flag: 'w'};
        }
        var filePath = path.resolve(fileName);
        var dirName = path.dirname(filePath);
        var dirCreated = await this.createDirRecursive(dirName, mode);
        if (!dirCreated){
            return false;
        } else {
            return fs.writeFileSync(filePath, '', flags);
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
}

exports.FileManager = FileManager;