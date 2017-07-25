const _ = require('lodash');
const nwSkeleton = require('nw-skeleton');
const MainScript = nwSkeleton.MainScript;
const appWrapperConfig = nwSkeleton.appWrapperConfig;
const appConfig = require('./config/config');

var config = _.extend(appWrapperConfig, appConfig);
var mainScript;

async function main(){
    try {
        mainScript = new MainScript();
        await mainScript.initialize(manifest, config);
        await mainScript.start();
    } catch (ex) {
        process.stdout.write('\n\nERROR: ' + ex.message + '\n\n');
        process.exit(1);
    }
}

main();