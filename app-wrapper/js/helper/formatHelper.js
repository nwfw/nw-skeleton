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

    formatDuration (time, secondFractions) {
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

        if (hours   < 10) {
            hours   = '0' + hours;
        }

        if (minutes < 10) {
            minutes = '0' + minutes;
        }

        if (seconds < 10) {
            seconds = '0' + seconds;
        }

        var formattedTime = '';
        if (hasDays){
            formattedTime = days + ' ' + _appWrapper.appTranslations.translate('days') + ' ' + hours + ':' + minutes + ':' + seconds;
        } else if (hasHours){
            formattedTime = hours + ':' + minutes + ':' + seconds;
        } else {
            formattedTime = minutes + ':' + seconds;
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

        var formattedDate = date.toLocaleString(appState.config.currentLocale, dateOptions);
        return formattedDate;
    }

    formatDateNormalize (date, options, includeTime, omitSeconds){

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


}

exports.FormatHelper = FormatHelper;