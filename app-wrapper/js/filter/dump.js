/**
 * @fileOverview dump filter file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

var _appWrapper = window.getAppWrapper();

/**
 * Dump filter
 *
 * @memberOf filters
 * @param {mixed}   value       Value to dump
 * @param {Boolean} minified    Flag to force JSON minified output
 * @return {string} JSON formatted value
 */
var Filter = function (value, minified) {
    return _appWrapper.getHelper('util').toJson(value, minified);
};
exports.filter = Filter;