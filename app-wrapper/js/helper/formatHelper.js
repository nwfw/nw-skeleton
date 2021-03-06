/**
 * @fileOverview FormatHelper class file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

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
     * @param  {Number}             duration        Duration in milliseconds
     * @param  {Boolean}            omitEmpty       Flag to indicate whether to omit empty values
     * @param  {Boolean}            omitZeros       Flag to indicate whether to omit zeros in one-digit values
     * @param  {(Boolean|Number)}   roundDecimals   Toggle (and set decimals) for value rounding (seconds only)
     * @param  {Boolean}            secondFractions Flag to indicate whether to display second fractions
     * @return {string}                  Formatted duration
     */
    formatDuration (duration, omitEmpty, omitZeros, roundDecimals, secondFractions) {
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
            if (omitZeros){
                milliseconds = (milliseconds + '').replace(/0+?$/, '');
            } else if (roundDecimals){
                milliseconds = (milliseconds + '').substring(0, roundDecimals);
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

        if (!_.isDate(date)){
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

        if (!_.isDate(date)){
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

        if (!_.isDate(date)){
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
     * @param  {Date}       date                Date value to format
     * @param  {Object}     options             Date format options
     * @param  {Boolean}    includeDate         Flag to indicate whether to include date
     * @param  {Boolean}    omitSeconds         Flag to indicate whether to omit seconds
     * @param  {Boolean}    omitMilliseconds    Flag to indicate whether to omit seconds
     * @return {string}                         Formatted time string
     */
    formatTimeNormalize (date, options = null, includeDate = false, omitSeconds = false, omitMilliseconds = true){

        if (!options) {
            options = {};
        }

        if (!_.isDate(date)){
            date = new Date(date);
        }

        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        let day = date.getDate();

        let hours = date.getHours();
        let minutes = date.getMinutes();
        let seconds = date.getSeconds();
        let milliseconds = date.getMilliseconds();

        // console.log({year, month, day, hours, minutes, seconds, milliseconds});

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

        if (milliseconds < 100){
            if (milliseconds < 10){
                milliseconds = '0' + milliseconds;
            }
            milliseconds = '0' + milliseconds;
        }

        let formattedTime = '';
        if (includeDate){
            formattedTime += year + '-' + month + '-' + day + ' ';
        }

        formattedTime += hours;
        formattedTime += ':' + minutes;
        if (!omitSeconds) {
            formattedTime += ':' + seconds;
        }
        if (!omitMilliseconds) {
            formattedTime += '.' + milliseconds;
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
        let milliseconds = _.round((remaining - seconds), 3) * 1000;

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
                minutes: +minutesString,
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
        let locale = appState.languageData.currentLocale;
        if (!locale) {
            locale = 'en';
        }
        let returnValue = Intl.NumberFormat(locale, {maximumFractionDigits: 2}).format(value);
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
        return value.replace(/\r?\n/g, '<br/>');
    }

    /**
     * Converts spaces into non-breaking space entities for html
     *
     * @param  {string} value Text for conversion
     * @return {string}       Text with replaced spaces
     */
    forceSpacing (value) {
        return value.replace(/'\t'/g, '&nbsp;&nbsp;&nbsp;&nbsp;').replace(/\s/g, '&nbsp;');
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
     * @param  {Integer} bytes          File size in bytes
     * @param  {Integer} lesserUnits    Downscale unit by n
     * @param  {Integer} minUnit        Min unit index
     * @param  {Integer} treshold       Treshold that indicates size unit should be one larger
     * @param  {Boolean} floatValue     Flag to indicate whether to leave size as float value or round it to integer
     * @param  {Boolean} formatNumber   Flag to indicate whether to format numeric value
     * @param  {Boolean} returnObject   Flag to indicate whether to return object with values or string
     *
     * @return {String}                 Human-readable file size representation
     */
    formatFileSize (bytes, lesserUnits = 0, minUnit = 0, treshold = 0, floatValue = false, formatNumber = false, returnObject = false) {
        let sizes = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        let value;
        let negative = false;
        let result;
        if (isNaN(bytes)){
            bytes = 0;
        }
        let unitIndex;
        if (!lesserUnits || isNaN(lesserUnits)){
            lesserUnits = 0;
        } else {
            lesserUnits = Math.abs(lesserUnits);
        }
        if (isNaN(parseInt(minUnit, 10))) {
            let minString = minUnit.toLowerCase();
            let minSizes = _.map(sizes, (size) => {
                return size.toLowerCase();
            });
            if (_.includes(minSizes, minString)) {
                minUnit = _.indexOf(minSizes, minString);
            } else {
                minUnit = 0;
            }
        }


        let resultString = '0 B';
        let resultObject = {
            bytes: bytes,
            unitSize: 0,
            negative: false,
            formattedUnitSize: '0',
            unit: 'B',
            formattedSize: '0 B',
        };


        if (bytes != 0) {
            // resultObject.bytes = bytes;
            if (bytes < 0){
                negative = true;
                resultObject.negative = true;
                bytes = Math.abs(bytes);
            }
            unitIndex = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
            if (lesserUnits) {
                if (unitIndex - lesserUnits > minUnit) {
                    unitIndex -= lesserUnits;
                } else {
                    unitIndex = minUnit;
                }
            }
            if (unitIndex < minUnit) {
                unitIndex = minUnit;
            }
            if (unitIndex >= sizes.length) {
                unitIndex = sizes.length - 1;
            }
            if (!floatValue) {
                value = Math.round(bytes / Math.pow(1024, unitIndex));
            } else {
                value = bytes / Math.pow(1024, unitIndex);
                if (value != parseInt(value, 10)) {
                    value = value.toFixed(2);
                }
            }
            if (treshold && value >= treshold) {
                unitIndex++;
                if (unitIndex >= sizes.length) {
                    unitIndex = sizes.length - 1;
                }
                if (!floatValue) {
                    value = Math.round(bytes / Math.pow(1024, unitIndex));
                } else {
                    value = bytes / Math.pow(1024, unitIndex);
                    if (value != parseInt(value, 10)) {
                        value = value.toFixed(2);
                    }
                }
            }

            resultObject.unitSize = value;
            resultObject.formattedUnitSize = this.formatCurrency(value);

            let formattedNumber = value + '';
            if (formatNumber) {
                formattedNumber = this.formatCurrency(value);
            }
            // value = Number(value).toLocaleString('en-US');
            if (negative){
                formattedNumber = '-' + formattedNumber;
            }
            let unit = sizes[unitIndex];
            if (!unit) {
                resultObject.unit = '';
                unit = '';
            } else {
                // unit = ' ' + _appWrapper.apptranslate('__unit__ ' + unit);
                resultObject.unit = unit;
                unit = ' ' + unit;
            }

            formattedNumber += unit;
            resultObject.formattedSize = formattedNumber;
            resultString = formattedNumber;
        }
        if (returnObject){
            result = resultObject;
        } else {
            result = resultString;
        }
        return result;
    }

    /**
     * Formats file size from bytes to human-readable format, returning one lesser unit if file size in default units is larger than minRest param
     *
     * @param  {Integer} bytes   File size in bytes
     * @param  {Boolean} format  Flag to indicate whether to format output (add commas)
     * @param  {Integer} minRest Minimum file size in default units
     * @return {string}          Formatted file size
     */
    formatLargeFileSize (bytes, format = true, minRest = 100){
        let formattedSize = '0 B';
        if (bytes && _.isNumber(bytes)){
            formattedSize = this.formatFileSize(bytes);
            let formattedSizeChunks = formattedSize.split(' ');
            let sizeNumber = +formattedSizeChunks[0];
            if (sizeNumber < minRest) {
                formattedSize = this.formatFileSize(bytes, 1);
            }
            if (format){
                formattedSizeChunks = formattedSize.split(' ');
                sizeNumber = +formattedSizeChunks[0];
                formattedSize = sizeNumber.toLocaleString() + ' ' + formattedSizeChunks[1];
            }
        }
        return formattedSize;
    }

    /**
     * Adds thousands and decimal separators to numeric value, returning formatted separated value
     *
     * @param {String} string            Initial value to format
     * @param {String} inputDecimalChar  Character that initial value uses as decimal delimiter
     * @param {String} outputDecimalChar New decimal delimiter
     * @param {String} separator         Thousand separator
     *
     * @return {String} Formatted value
     */
    addSeparators (string, inputDecimalChar, outputDecimalChar, separator) {
        string += '';
        let decimalPosition = string.indexOf(inputDecimalChar);
        let stringEnd = '';
        if (decimalPosition != -1) {
            stringEnd = outputDecimalChar + string.substring(decimalPosition + 1, string.length);
            string = string.substring(0, decimalPosition);
        }
        let separatorRegex = /(\d+)(\d{3})/;
        while (separatorRegex.test(string)) {
            string = string.replace(separatorRegex, '$1' + separator + '$2');
        }
        return string + stringEnd;
    }

    /**
     * Capitalizes first character in passed text argument
     *
     * @param  {String}     text    Text to capitalize
     * @return {String}             Capitalized text
     */
    capitalize (text) {
        let capitalized = '';
        if (_.isString(text) && text) {
            capitalized = text.substr(0, 1).toUpperCase() + text.substr(1);
        }
        return capitalized;
    }

    /**
     * Returns difference between two dates in (milli)seconds
     *
     * @param  {Date}       start           Start date
     * @param  {Date}       end             End date
     * @param  {Boolean}    milliseconds    Flag to indicate millisecond precision
     *
     * @return {Number}                     Difference between dates
     */
    diffDates(start, end, milliseconds = false) {
        let diff = 0;
        let endSeconds = end.getTime() / 1000;
        let startSeconds = start.getTime() / 1000;
        diff = endSeconds - startSeconds;
        if (!milliseconds){
            diff = parseInt(diff, 10);
        }
        return diff;
    }

    /**
     * Gets hash from passed value
     *
     * @param  {Mixed}  value       Value to hash
     *
     * @return {String}             Value hash
     */
    getHash(value) {
        let src = value;
        if (!_.isString(value)){
            try {
                src = JSON.stringify(value);
            } catch (ex) {
                src = new String(value);
                console.log(ex);
            }
        }
        return this.hashString(src);
    }

    /**
     * Gets hash for passsed string value
     *
     * @param  {String}  value      Value to hash
     *
     * @return {String}             Value hash
     */
    hashString(value) {
        let hash = 0;
        if (value.length === 0){
            return hash;
        }
        for (let i=0; i<value.length; i++) {
            let chr = value.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0;
        }
        return hash;
    }
}

exports.FormatHelper = FormatHelper;