/**
 * @fileOverview main script file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.1.0
 */

const _ = require('lodash');
const nwSkeleton = require('nw-skeleton');
const MainScript = nwSkeleton.MainScript;
const appWrapperConfig = nwSkeleton.appWrapperConfig;
const appConfig = require('./config/config');

var config = _.extend(appWrapperConfig, appConfig);
var mainScript;

/**
 * Starts the application
 *
 * @async
 * @memberOf mainScript
 * @return {void}
 */
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