/**
 * @fileOverview nw-tooltip filter file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */

const _ = require('lodash');

/**
 * NW-tooltip directive
 *
 * @name nw-tooltip
 * @memberOf directives
 */


let getTooltip = function(identifier){
    let tooltips = document.querySelectorAll('.nw-tooltip-wrapper');
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
    tooltip.className = 'nw-tooltip-wrapper';
    tooltip.setAttribute('data-tooltip-identifier', identifier);
    tooltip.innerHTML = '<div class="nw-tooltip">' + title + '</div>';
    tooltip.el = el;
    tooltip.addEventListener('mouseover', handleTooltipMouseOver, true);
    tooltip.addEventListener('mouseout', handleTooltipMouseOut, true);
    document.body.appendChild(tooltip);
    return tooltip;
};

let removeTooltip = function(el){
    delete el.nwTooltipBinding;
    let identifier = el.getAttribute('data-identifier');
    let tooltips = document.querySelectorAll('.nw-tooltip-wrapper[data-tooltip-identifier=' + identifier + ']');
    for (let i=0; i<tooltips.length; i++){
        let tooltip = tooltips[i];
        if (tooltip){
            tooltip.removeEventListener('mouseover', handleTooltipMouseOver);
            tooltip.removeEventListener('mouseout', handleTooltipMouseOut);
            if (tooltip.parentNode && tooltip.parentNode.removeChild && _.isFunction(tooltip.parentNode.removeChild)){
                tooltip.parentNode.removeChild(tooltip);
            }
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
            tooltip.innerHTML = '<div class="nw-tooltip">' + title + '</div>';
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

let handleTooltipMouseOver = function(e) {

    let tooltip = e.target;
    if (!tooltip.hasClass('nw-tooltip-wrapper')){
        while (tooltip.parentNode && !tooltip.hasClass('nw-tooltip-wrapper')){
            tooltip = tooltip.parentNode;
        }
    }
    let el = tooltip.el;
    clearTimeout(el.outTimeout);
};

let handleTooltipMouseOut = function(e) {
    let tooltip = e.target;
    if (tooltip.hasClass('nw-tooltip-wrapper')){
        let el = tooltip.el;
        clearTimeout(el.outTimeout);
        el.outTimeout = setTimeout(() => {
            hideTooltip(e);
        }, window.getAppWrapper().getConfig('appConfig.tooltipTTL'));
    }
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
            let bindingValue = 1;
            if (el.nwTooltipBinding && el.nwTooltipBinding.value && _.isObject(el.nwTooltipBinding.value)){
                bindingValue = el.nwTooltipBinding.value;
                if (bindingValue) {
                    if (bindingValue.classes){
                        let classes = bindingValue.classes;
                        if (!_.isArray(bindingValue.classes)){
                            classes = bindingValue.classes.split(',');
                        }
                        for( let i=0; i<classes.length; i++){
                            if (!tooltip.hasClass(classes[i])){
                                tooltip.addClass(classes[i]);
                            }
                        }
                    }
                }
            }
            let position = htmlHelper.getAbsolutePosition(el);
            let elDimensions = htmlHelper.getCloneRealDimensions(el);
            let top = parseInt((position.offsetTop + elDimensions.height), 10);
            let left = parseInt((position.offsetLeft + (elDimensions.width / 2)), 10);
            let tooltipStyles = {
                top: top + 'px',
                left: left + 'px',
            };
            let windowWidth = window.innerWidth;
            let tooltipDimensions = htmlHelper.getRealDimensions(tooltip);
            if (tooltipDimensions.width + left > windowWidth){
                delete tooltipStyles.left;
                tooltip.addClass('stick-right');
                tooltipStyles.right = '5px';
            } else if (left - parseInt(tooltipDimensions.width / 2, 10) < 0){
                tooltip.addClass('stick-left');
                tooltipStyles.left = '5px';
            }
            htmlHelper.setElementStyles(tooltip, tooltipStyles);
            htmlHelper.addClass(tooltip, 'visible-tooltip');
        }
    }
};

let hideTooltip = function(e){
    let el = e.target;
    if (el.hasClass('nw-tooltip-wrapper')){
        el = el.el;
    } else if (!el.getAttribute('data-nwtooltip')){
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

let initializeTooltip = function(el, binding) {
    let title = el.getAttribute('title');
    el.nwTooltipBinding = binding;
    let htmlHelper = window.getAppWrapper().getHelper('html');
    if (title){
        el.setAttribute('data-title', title);
        el.setAttribute('data-nwtooltip', '1');
        htmlHelper.getUniqueElementIdentifier(el, true);
        el.addEventListener('mouseover', handleMouseOver, true);
        el.addEventListener('mouseout', handleMouseOut, true);
    }
};

let updateTooltip = function(el) {
    let identifier = el.getAttribute('data-identifier');
    if (identifier){
        let tooltip = getTooltip(identifier);
        if (tooltip){
            let title = el.getAttribute('title');
            if (title){
                el.setAttribute('data-title', title);
                tooltip.innerHTML = '<div class="nw-tooltip">' + title + '</div>';
            }
        }
    }
};

exports.directive = {
    bind: function (el, binding) {
        clearTimeout(el.initTimeout);
        el.initTimeout = setTimeout(() => {
            initializeTooltip(el, binding);
        }, 100);
    },
    unbind: function (el) {
        el.removeEventListener('mouseover', handleMouseOver);
        el.removeEventListener('mouseout', handleMouseOut);
        removeTooltip(el);
    },
    componentUpdated: function(el){
        updateTooltip(el);
    }
};