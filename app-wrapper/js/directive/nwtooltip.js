/**
 * @fileOverview nw-tooltip filter file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */
// const _ = require('lodash');
/**
 * NW-tooltip directive
 *
 * @name nw-tooltip
 * @memberOf directives
 */


let getTooltip = function(identifier){
    let tooltips = document.querySelectorAll('.nw-tooltip');
    for(let i=0; i<tooltips.length; i++){
        let tooltip = tooltips[i];
        if (tooltip.getAttribute('data-tooltip-identifier') == identifier){
            return tooltip;
        }
    }
};

let createTooltip = function(el){
    let title = el.getAttribute('title');
    let identifier = el.getAttribute('data-identifier');
    let tooltip = document.createElement('div');
    tooltip.className = 'nw-tooltip';
    tooltip.setAttribute('data-tooltip-identifier', identifier);
    tooltip.innerHTML = title;
    document.body.appendChild(tooltip);
    return tooltip;
};

let removeTooltip = function(el){
    let identifier = el.getAttribute('data-identifier');
    let tooltips = document.querySelectorAll('.nw-tooltip[data-tooltip-identifier=' + identifier + ']');
    for (let i=0; i<tooltips.length; i++){
        let tooltip = tooltips[i];
        if (tooltip && tooltip.parentNode){
            tooltip.parentNode.removeChild(tooltip);
        }
    }
    clearTimeouts(el);
};

let handleMouseOver = function(e) {
    let el = e.target;
    if (!el.getAttribute('data-nwtooltip')){
        while (el.parentNode && !el.getAttribute('data-nwtooltip')){
            el = el.parentNode;
        }
    }
    e.stopPropagation();
    e.stopImmediatePropagation();
    let identifier = el.getAttribute('data-identifier');
    let htmlHelper = window.getAppWrapper().getHelper('html');
    if (identifier){
        let tooltip = createTooltip(el);
        if (tooltip){
            let title = el.getAttribute('title');
            tooltip.innerHTML = title;
            htmlHelper.addClass(tooltip, 'prepared-tooltip');
            el.setAttribute('data-title', title);
            el.removeAttribute('title');
            clearTimeouts(el);
            el.overTimeout = setTimeout(() => {
                showTooltip(e);
            }, window.getAppWrapper().getConfig('appConfig.tooltipDelay'));
        }
    }
};

let handleMouseOut = function(e) {
    let el = e.target;
    if (!el.getAttribute('data-nwtooltip')){
        while (el.parentNode && !el.getAttribute('data-nwtooltip')){
            el = el.parentNode;
        }
    }
    clearTimeouts(el);
    el.setAttribute('title', el.getAttribute('data-title'));
    el.removeAttribute('data-title');
    el.outTimeout = setTimeout(() => {
        hideTooltip(e);
    }, window.getAppWrapper().getConfig('appConfig.tooltipTTL'));
};

let clearTimeouts = function(el){
    clearTimeout(el.overTimeout);
    clearTimeout(el.outTimeout);
    clearTimeout(el.removeClassTimeout);
};

let showTooltip = function(e){
    let el = e.target;
    if (!el.getAttribute('data-nwtooltip')){
        while (el.parentNode && !el.getAttribute('data-nwtooltip')){
            el = el.parentNode;
        }
    }
    let identifier = el.getAttribute('data-identifier');
    let htmlHelper = window.getAppWrapper().getHelper('html');
    if (identifier){
        let tooltip = getTooltip(identifier);
        if (tooltip){
            let position = htmlHelper.getAbsolutePosition(el);
            let elDimensions = htmlHelper.getCloneRealDimensions(el);
            let top = parseInt((position.offsetTop + elDimensions.height), 10);
            let left = parseInt((position.offsetLeft + (elDimensions.width / 2)), 10);
            htmlHelper.setElementStyles(tooltip, {
                top: top + 'px',
                left: left + 'px',
            });
            htmlHelper.addClass(tooltip, 'visible-tooltip');
        }
    }
};

let hideTooltip = function(e){
    let el = e.target;
    if (!el.getAttribute('data-nwtooltip')){
        while (el.parentNode && !el.getAttribute('data-nwtooltip')){
            el = el.parentNode;
        }
    }
    let identifier = el.getAttribute('data-identifier');
    if (identifier){
        let tooltip = getTooltip(identifier);
        if (tooltip){
            let htmlHelper = window.getAppWrapper().getHelper('html');
            htmlHelper.removeClass(tooltip, 'visible-tooltip');
            clearTimeout(el.removeClassTimeout);
            el.removeClassTimeout = setTimeout(() => {
                removeTooltip(el);
            }, 300);
        }
    }
};

let initializeTooltip = function(el) {
    let title = el.getAttribute('title');
    let htmlHelper = window.getAppWrapper().getHelper('html');
    if (title){
        el.setAttribute('data-title', title);
        el.setAttribute('data-nwtooltip', '1');
        htmlHelper.getUniqueElementIdentifier(el, true);
        el.addEventListener('mouseover', handleMouseOver, true);
        el.addEventListener('mouseout', handleMouseOut, true);
    }
};

exports.directive = {
    bind: function (el) {
        clearTimeout(el.initTimeout);
        el.initTimeout = setTimeout(() => {
            initializeTooltip(el);
        }, 100);
    },
    unbind: function (el) {
        el.removeEventListener('mouseover', handleMouseOver);
        el.removeEventListener('mouseout', handleMouseOut);
        removeTooltip(el);
    }
};