/**
 * @fileOverview FormatHelper class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.2.1
 */

const _ = require('lodash');
const AppBaseClass = require('../lib/appBase').AppBaseClass;

var _appWrapper;
var appState;

/**
 * FormatHelper class - handles and manages formatting tasks
 *
 * @class
 * @extends {appWrapper.AppBaseClass}
 * @memberof appWrapper.helpers
 */
class FormatHelper extends AppBaseClass {

    /**
     * Creates FormatHelper instance
     *
     * @constructor
     * @return {FormatHelper}              Instance of FormatHelper class
     */
    constructor() {
        super();

        _appWrapper = window.getAppWrapper();
        appState = _appWrapper.getAppState();

        return this;
    }

    /**
     * Formats duration to human-readable format
     *
     * @param  {Number}  duration        Duration in milliseconds
     * @param  {Boolean} omitEmpty       Flag to indicate whether to omit empty values
     * @param  {Boolean} omitZeros       Flag to indicate whether to omit zeros in one-digit values
     * @param  {Boolean} secondFractions Flag to indicate whether to display second fractions
     * @return {string}                  Formatted duration
     */
    formatDuration (duration, omitEmpty, omitZeros, secondFractions) {
        if (isNaN(duration)){
            duration = 0;
        }
        let sec_num;
        if (!secondFractions){
            sec_num = parseInt(duration, 10);
        } else {
            sec_num = duration;
        }
        let days   = Math.floor(sec_num / 86400);
        let hours   = Math.floor((sec_num - (days * 86400)) / 3600);
        let minutes = Math.floor((sec_num - (hours * 3600) - (days * 86400)) / 60);
        let seconds = Math.floor(sec_num - (days * 86400) - (hours * 3600) - (minutes * 60));
        let milliseconds = (sec_num - (days * 86400) - (hours * 3600) - (minutes * 60) - seconds) * 1000;

        if (!duration){
            // let num = parseInt(Math.random() * 100 / 33, 10);
            let val = '';
            // for (let i = 0; i<num; i++){
            //     val += '.';
            // }
            return val;
        }

        let hasDays = false;
        if (days){
            hasDays = true;
        }

        let hasHours = false;
        if (hours){
            hasHours = true;
        }

        let hasMinutes = false;
        if (minutes){
            hasMinutes = true;
        }

        if (!omitZeros && hours < 10) {
            hours = '0' + hours;
        }

        if (!omitZeros && minutes < 10) {
            minutes = '0' + minutes;
        }

        if (!omitZeros && seconds < 10) {
            seconds = '0' + seconds;
        }

        let formattedTime = '';
        if (hasDays){
            formattedTime = days + ' ' + _appWrapper.appTranslations.translate('days') + ' ' + hours + ':' + minutes + ':' + seconds;
        } else if (hasHours){
            formattedTime = hours + ':' + minutes + ':' + seconds;
        } else {
            if (hasMinutes || !omitEmpty){
                formattedTime = minutes + ':' + seconds;
            } else {
                formattedTime = seconds;
            }
        }


        if ((milliseconds + '').match(/\./)){
            milliseconds = parseInt((milliseconds + '').replace(/[^.]+/, ''), 10);
        }


        if (secondFractions && milliseconds){
            if ((milliseconds+'').length < 3){
                for (let i=0; i<(3 - (milliseconds+'').length); i++){
                    milliseconds = '0' + milliseconds;
                }
            }
            formattedTime += '.' + milliseconds;
        }


        return formattedTime;
    }

    /**
     * Formats date based on options
     *
     * @param  {Date}       date            Date value to format
     * @param  {Object}     options         Date format options
     * @param  {Boolean}    includeTime     Flag to indicate whether to include time
     * @return {string}                     Formatted date string
     */
    formatDate  (date, options, includeTime) {

        let defaultOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        };

        if (includeTime) {
            defaultOptions.hour = '2-digit';
            defaultOptions.minute = '2-digit';
            defaultOptions.second = '2-digit';
        }

        let dateOptions = defaultOptions;

        if (options){
            dateOptions = _.defaults(defaultOptions, options);
        }

        if (_.isString(date)){
            date = new Date(date);
        }

        let formattedDate = date.toLocaleString(appState.config.currentLocale, dateOptions);
        return formattedDate;
    }

    /**
     * Formats time based on options
     *
     * @param  {Date}       date            Date value to format
     * @param  {Object}     options         Date format options
     * @param  {Boolean}    includeDate     Flag to indicate whether to include date
     * @return {string}                     Formatted time string
     */
    formatTime  (date, options, includeDate) {

        if (_.isString(date)){
            date = new Date(date);
        }
        let time = + new Date(date);
        let currentTime = + new Date();
        let secondsPassed = (currentTime - time) / 1000;
        if (secondsPassed > 86400){
            includeDate = true;
        }

        let defaultOptions = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        };

        if (includeDate) {
            defaultOptions.year = 'numeric';
            defaultOptions.month = '2-digit';
            defaultOptions.day = '2-digit';
        }

        let dateOptions = defaultOptions;

        if (options){
            dateOptions = _.defaults(defaultOptions, options);
        }

        let formattedDate = date.toLocaleString(appState.config.currentLocale, dateOptions);
        return formattedDate;
    }

    /**
     * Format date normalized (Y-m-d H:i:s format)
     *
     * @param  {Date}       date            Date value to format
     * @param  {Object}     options         Date format options
     * @param  {Boolean}    includeTime     Flag to indicate whether to include time
     * @param  {Boolean}    omitSeconds     Flag to indicate whether to omit seconds
     * @return {string}                     Formatted date string
     */
    formatDateNormalize (date, options, includeTime, omitSeconds){

        if (_.isString(date)){
            date = new Date(date);
        }

        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        let day = date.getDate();

        let hours = date.getHours();
        let minutes = date.getMinutes();
        let seconds = date.getSeconds();

        if (month < 10){
            month = '0' + month;
        }

        if (day < 10){
            day = '0' + day;
        }

        if (hours < 10){
            hours = '0' + hours;
        }

        if (minutes < 10){
            minutes = '0' + minutes;
        }
        if (seconds < 10){
            seconds = '0' + seconds;
        }

        let formattedDate = year + '-' + month + '-' + day;

        if (includeTime) {
            formattedDate += ' ';
            formattedDate += hours;
            formattedDate += ':' + minutes;
            if (!omitSeconds) {
                formattedDate += ':' + seconds;
            }
        }

        return formattedDate;

    }

    /**
     * Format time normalized (Y-m-d H:i:s format)
     *
     * @param  {Date}       date            Date value to format
     * @param  {Object}     options         Date format options
     * @param  {Boolean}    includeDate     Flag to indicate whether to include date
     * @param  {Boolean}    omitSeconds     Flag to indicate whether to omit seconds
     * @return {string}                     Formatted time string
     */
    formatTimeNormalize (date, options, includeDate, omitSeconds){

        if (_.isString(date)){
            date = new Date(date);
        }

        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        let day = date.getDate();

        let hours = date.getHours();
        let minutes = date.getMinutes();
        let seconds = date.getSeconds();


        if (month < 10){
            month = '0' + month;
        }

        if (day < 10){
            day = '0' + day;
        }

        if (hours < 10){
            hours = '0' + hours;
        }

        if (minutes < 10){
            minutes = '0' + minutes;
        }
        if (seconds < 10){
            seconds = '0' + seconds;
        }

        let formattedTime = '';
        if (includeDate){
            formattedTime += year + '-' + month + '-' + day;
        }

        formattedTime += ' ';
        formattedTime += hours;
        formattedTime += ':' + minutes;
        if (!omitSeconds) {
            formattedTime += ':' + seconds;
        }

        return formattedTime;

    }

    /**
     * Formats duration to custom format based on 'format' argument
     *
     * @param  {(Date|Float)}       time      Date or number representing number of seconds
     * @param  {string}             format    String for formatting duration
     * @param  {Boolean}            returnObj Flag to indicate that method should return object with formatted values instead of formatted duration as string
     * @return {(string|Object)}    Formatted duration or object with formatted duration values
     */
    formatDurationCustom (time, format, returnObj) {
        if (isNaN(time)){
            time = 0;
        }
        if (!time){
            return '';
        }
        time = +time;
        let utilHelper = _appWrapper.getHelper('util');
        if (!format){
            format = 'y?.MM?.dd? hh?:mm?:ss';
        }

        let formattedTime = format;
        let formatChunks = format.split(/[^a-zA-Z?]/);
        let separatorChunks = _.uniq(_.filter(format.split(/[a-zA-Z?]+/), (item) => { return item.length ? true : false; }));

        let sec_num = +time;

        let oneYear = 365 * 86400;
        let oneMonth = 30 * 86400;
        let oneDay = 86400;
        let oneHour = 3600;
        let oneMinute = 60;
        let remaining = sec_num;

        let years   = Math.floor(sec_num / oneYear);
        remaining = remaining % oneYear;
        let months  = Math.floor(remaining / oneMonth);
        remaining = remaining % oneMonth;
        let days    = Math.floor(remaining / oneDay);
        remaining = remaining % oneDay;
        let hours   = Math.floor(remaining / oneHour);
        remaining = remaining % oneHour;
        let minutes = Math.floor(remaining / oneMinute);
        remaining = remaining % oneMinute;
        let seconds = Math.floor(remaining);
        let milliseconds = (remaining - seconds) * 1000;

        let yearsChunk = '';
        let monthsChunk = '';
        let daysChunk = '';
        let hoursChunk = '';
        let minutesChunk = '';
        let secondsChunk = '';
        let millisecondsChunk = '';

        let yearsString = '';
        let monthsString = '';
        let daysString = '';
        let hoursString = '';
        let minutesString = '';
        let secondsString = '';
        let millisecondsString = '';

        let separatorExpression = '[' + utilHelper.quoteRegex(separatorChunks.join('')) + ']?';

        let yearsExpression = new RegExp('^' + separatorExpression + 'y+?\\??' + separatorExpression + '$');
        let monthsExpression = new RegExp('^' + separatorExpression + 'M+?\\??' + separatorExpression + '$');
        let daysExpression = new RegExp('^' + separatorExpression + 'd+?\\??' + separatorExpression + '$');
        let hoursExpression = new RegExp('^' + separatorExpression + 'h+?\\??' + separatorExpression + '$');
        let minutesExpression = new RegExp('^' + separatorExpression + 'm+?\\??' + separatorExpression + '$');
        let secondsExpression = new RegExp('^' + separatorExpression + 's+?\\??' + separatorExpression + '$');
        let millisecondsExpression = new RegExp('^' + separatorExpression + 'c+?\\??' + separatorExpression + '$');

        let hasSomething = false;

        for (let i=0; i<formatChunks.length;i++){
            let chunk = formatChunks[i];

            if (chunk.match(yearsExpression)){
                yearsChunk = chunk;
                if (years || !yearsChunk.match(/\?$/)){
                    hasSomething = true;
                    yearsString = years + '';
                    let lengthDiff = yearsChunk.replace(/\?$/, '').length - yearsString.length;
                    if (lengthDiff > 0){
                        yearsString = new Array(lengthDiff+1).join('0') + years;
                    }
                } else {
                    yearsString = '';
                }
            }

            if (chunk.match(monthsExpression)){
                monthsChunk = chunk;
                if (months || !monthsChunk.match(/\?$/)){
                    hasSomething = true;
                    monthsString = months + '';
                    let lengthDiff = monthsChunk.replace(/\?$/, '').length - monthsString.length;
                    if (lengthDiff > 0){
                        monthsString = new Array(lengthDiff+1).join('0') + months;
                    }
                } else {
                    monthsString = '';
                }
            }

            if (chunk.match(daysExpression)){
                daysChunk = chunk;
                if (days || !daysChunk.match(/\?$/)){
                    hasSomething = true;
                    daysString = days + '';
                    let lengthDiff = daysChunk.replace(/\?$/, '').length - daysString.length;
                    if (lengthDiff > 0){
                        daysString = new Array(lengthDiff+1).join('0') + days;
                    }
                } else {
                    daysString = '';
                }
            } else if (chunk.match(hoursExpression)){
                hoursChunk = chunk;
                if (hasSomething || hours || !hoursChunk.match(/\?$/)){
                    hasSomething = true;
                    hoursString = hours + '';
                    let lengthDiff = hoursChunk.replace(/\?$/, '').length - hoursString.length;
                    if (lengthDiff > 0){
                        hoursString = new Array(lengthDiff+1).join('0') + hours;
                    }
                } else {
                    hoursString = '';
                }
            } else if (chunk.match(minutesExpression)){
                minutesChunk = chunk;
                if (hasSomething || minutes || !minutesChunk.match(/\?$/)){
                    hasSomething = true;
                    minutesString = minutes + '';
                    let lengthDiff = minutesChunk.replace(/\?$/, '').length - minutesString.length;
                    if (lengthDiff > 0){
                        minutesString = new Array(lengthDiff+1).join('0') + minutes;
                    }
                } else {
                    minutesString = '';
                }
            } else if (chunk.match(secondsExpression)){
                secondsChunk = chunk;
                if (hasSomething || seconds || !secondsChunk.match(/\?$/)){
                    hasSomething = true;
                    secondsString = seconds + '';
                    let lengthDiff = secondsChunk.replace(/\?$/, '').length - secondsString.length;
                    if (lengthDiff > 0){
                        secondsString = new Array(lengthDiff+1).join('0') + seconds;
                    }
                } else {
                    secondsString = '';
                }
            } else if (chunk.match(millisecondsExpression)){
                millisecondsChunk = chunk;
                if (hasSomething || milliseconds || !millisecondsChunk.match(/\?$/)){
                    hasSomething = true;
                    millisecondsString = milliseconds + '';
                    let lengthDiff = millisecondsChunk.replace(/\?$/, '').length - millisecondsString.length;
                    if (lengthDiff > 0){
                        millisecondsString = new Array(lengthDiff+1).join('0') + milliseconds;
                    }
                } else {
                    millisecondsString = '';
                }
            }
        }
        if (returnObj){
            formattedTime = {
                years: +yearsString,
                months: +monthsString,
                days: +daysString,
                hours: +hoursString,
                seconds: +secondsString,
                milliseconds: +millisecondsString
            };
        } else {

            formattedTime = formattedTime.replace(new RegExp(utilHelper.quoteRegex(yearsChunk)), yearsString);
            formattedTime = formattedTime.replace(new RegExp(utilHelper.quoteRegex(monthsChunk)), monthsString);
            formattedTime = formattedTime.replace(new RegExp(utilHelper.quoteRegex(daysChunk)), daysString);
            formattedTime = formattedTime.replace(new RegExp(utilHelper.quoteRegex(hoursChunk)), hoursString);
            formattedTime = formattedTime.replace(new RegExp(utilHelper.quoteRegex(minutesChunk)), minutesString);
            formattedTime = formattedTime.replace(new RegExp(utilHelper.quoteRegex(secondsChunk)), secondsString);
            formattedTime = formattedTime.replace(new RegExp(utilHelper.quoteRegex(millisecondsChunk)), millisecondsString);

            for (let j=0; j<formatChunks.length; j++){
                for (let i=0; i<separatorChunks.length; i++){
                    let expression = new RegExp('^' + utilHelper.quoteRegex(separatorChunks[i]));
                    formattedTime = formattedTime.replace(expression, '');            }
            }


            for (let j=0; j<formatChunks.length; j++){
                for (let i=0; i<separatorChunks.length; i++){
                    let expression = new RegExp(utilHelper.quoteRegex(separatorChunks[i]) + '$');
                    formattedTime = formattedTime.replace(expression, '');            }
            }

        }
        return formattedTime;
    }
    /**
     * Formats currency based on current language locale
     *
     * @param  {Number} value Numeric price
     * @return {string}       Formatted currency value
     */
    formatCurrency (value){
        let returnValue = Intl.NumberFormat(appState.languageData.currentLocale, {maximumFractionDigits: 2}).format(value);
        return returnValue;
    }

    /**
     * Adds zeros until value length is equal to maxLength
     *
     * @param {mixed}  value      Starting value
     * @param {string} maxLength  Value with added zeros
     * @return {undefined}
     */
    addZeros (value, maxLength){
        let _value = value + '';
        if (_value.length < maxLength){
            for (let i=0; i<maxLength - _value.length; i++){
                _value = '0' + _value;
            }
        }
        return _value;
    }

    /**
     * Converts newline characters (with line feeds) to HTML '<br />' tags
     *
     * @param  {string} value Text for conversion
     * @return {string}       Text with replaced line breaks
     */
    nl2br (value) {
        return value.replace(/\r?\n/g, '<br />');
    }

    /**
     * Converts decimal value to its hexadecimal representation
     *
     * @param  {Number} decimalValue    Decimal value
     * @return {string}                 Hexadecimal value representation
     */
    decToHex (decimalValue){
        return (+decimalValue).toString(16);
    }

    /**
     * Converts hexadecimal value to its decimal representation
     *
     * @param  {string} hexadecimalValue    Hexadecimal value
     * @return {Number}                     Converted decimal value
     */
    hexToDec (hexadecimalValue){
        return parseInt(hexadecimalValue, 16);
    }

    /**
     * Converts hexadecimal color values to their RGB representations
     *
     * @param  {string}     hexColor Hexadecimal color value
     * @return {Number[]}            Array with three members, corresponding to R, G and B color values
     */
    hexToDecColor (hexColor){
        let hexColorValue = hexColor.replace(/^#/, '');
        let hexColorChunks;
        let decColorChunks = [];
        if (hexColorValue.length == 6){
            hexColorChunks = hexColorValue.replace(/^#/, '').match(/.{1,2}/g);
        } else if (hexColorValue.length == 3){
            hexColorChunks = hexColorValue.replace(/^#/, '').match(/.{1}/g);
            for (let i=0; i<hexColorChunks.length; i++){
                hexColorChunks[i] += '' + hexColorChunks[i];
            }
        }

        for (let i=0; i<hexColorChunks.length; i++){
            decColorChunks.push(this.hexToDec(hexColorChunks[i]));
        }
        return decColorChunks;
    }

    /**
     * Converts decimal RGB color array to hexadecimal color representation
     *
     * @param  {Number[]} decColorArray Array with three members, corresponding to R, G and B color values
     * @return {string}                 Hexadecimal color value
     */
    decToHexColor (decColorArray){
        let hexColor = '';
        if (decColorArray.length < 3){
            for (let i=0; i<3 - decColorArray.length; i++){
                decColorArray.push(0);
            }
        }
        for (let i=0; i<decColorArray.length; i++){
            let hexColorChunk = this.decToHex(decColorArray[i]);
            if (hexColorChunk.length < 2){
                hexColorChunk = '0' + hexColorChunk;
            }
            hexColor += hexColorChunk;
        }
        if (hexColor){
            hexColor = '#' + hexColor.toUpperCase();
        }
        return hexColor;
    }

    /**
     * Formats raw file size in bytes to human-readable format
     *
     * @param  {Integer} bytes  File size in bytes
     * @return {string}         Human-readable file size representation
     */
    formatFileSize (bytes) {
        let sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        if (bytes == 0) {
            return '0 B';
        }
        let negative = false;
        if (bytes < 0){
            negative = true;
            bytes = Math.abs(bytes);
        }
        let size = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        if (size >= 3){
            size -= 1;
        }
        let value = Math.round(bytes / Math.pow(1024, size), 2) + ' ' + sizes[size];
        if (negative){
            value = '-' + value;
        }
        return value;
    }
}

exports.FormatHelper = FormatHelper;