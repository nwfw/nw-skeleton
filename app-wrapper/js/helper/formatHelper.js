var _ = require('lodash');
var BaseClass = require('../base').BaseClass;

var _appWrapper;
var appState;


class FormatHelper extends BaseClass {
    constructor() {
        super();

        _appWrapper = window.getAppWrapper();
        appState = _appWrapper.getAppState();

        return this;
    }

    async initialize () {
        await super.initialize();
        return this;
    }

    async finalize () {
        return true;
    }

    formatDuration (time, omitEmpty, omitZeros, secondFractions) {
        if (isNaN(time)){
            time = 0;
        }
        var sec_num;
        if (!secondFractions){
            sec_num = parseInt(time, 10);
        } else {
            sec_num = time;
        }
        var days   = Math.floor(sec_num / 86400);
        var hours   = Math.floor((sec_num - (days * 86400)) / 3600);
        var minutes = Math.floor((sec_num - (hours * 3600) - (days * 86400)) / 60);
        var seconds = Math.floor(sec_num - (days * 86400) - (hours * 3600) - (minutes * 60));
        var milliseconds = (sec_num - (days * 86400) - (hours * 3600) - (minutes * 60) - seconds) * 1000;

        if (!time){
            // var num = parseInt(Math.random() * 100 / 33, 10);
            var val = '';
            // for (var i = 0; i<num; i++){
            //     val += '.';
            // }
            return val;
        }

        var hasDays = false;
        if (days){
            hasDays = true;
        }

        var hasHours = false;
        if (hours){
            hasHours = true;
        }

        var hasMinutes = false;
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

        var formattedTime = '';
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

    formatDate  (date, options, includeTime) {

        var defaultOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        };

        if (includeTime) {
            defaultOptions.hour = '2-digit';
            defaultOptions.minute = '2-digit';
            defaultOptions.second = '2-digit';
        }

        var dateOptions = defaultOptions;

        if (options){
            dateOptions = _.defaults(defaultOptions, options);
        }

        if (_.isString(date)){
            date = new Date(date);
        }

        var formattedDate = date.toLocaleString(appState.config.currentLocale, dateOptions);
        return formattedDate;
    }

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

        var defaultOptions = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        };

        if (includeDate) {
            defaultOptions.year = 'numeric';
            defaultOptions.month = '2-digit';
            defaultOptions.day = '2-digit';
        }

        var dateOptions = defaultOptions;

        if (options){
            dateOptions = _.defaults(defaultOptions, options);
        }

        var formattedDate = date.toLocaleString(appState.config.currentLocale, dateOptions);
        return formattedDate;
    }

    formatDateNormalize (date, options, includeTime, omitSeconds){

        if (_.isString(date)){
            date = new Date(date);
        }

        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();

        var hours = date.getHours();
        var minutes = date.getMinutes();
        var seconds = date.getSeconds();

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

        var formattedDate = year + '-' + month + '-' + day;

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

    formatTimeNormalize (date, options, includeDate, omitSeconds){

        if (_.isString(date)){
            date = new Date(date);
        }

        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();

        var hours = date.getHours();
        var minutes = date.getMinutes();
        var seconds = date.getSeconds();


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

        var formattedTime = '';
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

    formatCurrency (value){
        var returnValue = Intl.NumberFormat(appState.languageData.currentLocale, {maximumFractionDigits: 2}).format(value);
        return returnValue;
    }

    addZeros (value, maxLength){
        let _value = value + '';
        if (_value.length < maxLength){
            for (let i=0; i<maxLength - _value.length; i++){
                _value = '0' + _value;
            }
        }
        return _value;
    }

    nl2br (value) {
        return value.replace(/\r?\n/g, '<br />');
    }



}

exports.FormatHelper = FormatHelper;