var fs = require('fs');
var path = require('path');
var admZip = require('adm-zip');

var dataPath = path.resolve('./app-wrapper/data/app-skeleton');

var funcArguments = process.argv;
var appPath = funcArguments[2];
if (!appPath){
    console.log('please specify appPath as parameter');
    process.exit(1);
} else {
    appPath = path.resolve(appPath);
    if (fs.existsSync(appPath)){
        console.log('path exists');
        process.exit(1);
    } else {
        fs.mkdirSync(appPath);
        var created = fs.existsSync(appPath);
        if (!created){
            console.log('Can\'t create dir');
            process.exit(1);
        } else {
            var appZip = path.join(dataPath, 'app.zip');
            var zip = new admZip(appZip);
            zip.extractAllTo(appPath, true);
        }
    }
}