/**
 * @fileOverview nw-tooltip filter file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.3.1
 */


/**
 * NW-tooltip directive
 *
 * Initialized by adding v-nwtooltip="1" to the element. Tooltip will use "title" attribute for its contents.
 * Additional options can be passed by setting "data-tooltip-data" attribute to JSON object that can contain following properties:
 *     classes: an array of classes to add to tooltip wrapper
 *     showCloseLink: bool to set close link rendering (default false)
 *     immediate: bool to set whether tooltip should show/hide immediately on element mouseover/mouseout
 *     noAutoHide: bool to set auto hiding (default true)
 *     showAbove: bool to show tooltip above element
 *
 * @name nw-tooltip
 * @memberOf directives
 */

let getTooltip = function(el){
    let identifier = el.getAttribute('data-identifier');
    if (identifier) {
        let tooltips = el.ownerDocument.querySelectorAll('.nw-tooltip-wrapper[data-tooltip-identifier=' + identifier + ']');
        if (tooltips && tooltips.length) {
            return tooltips[0];
        }
    }
};

let getTooltipData = function(el){
    let tooltipData;
    if (el.getAttribute('data-tooltip-data')) {
        try {
            tooltipData = JSON.parse(el.getAttribute('data-tooltip-data'));
        } catch (ex) {
            // console.log('Tooltip ex', ex);
        }
    }
    return tooltipData;
};

let getTooltipInnerHtml = function(el) {
    let innerHtml = '';
    let tooltipData = getTooltipData(el);
    let showCloseLink = false;
    if (tooltipData){
        if (tooltipData.showCloseLink) {
            showCloseLink = true;
        }
    }
    if (showCloseLink) {
        innerHtml += '<a href="#" class="close-tooltip fa fa-times"></a>';
    } else {
        innerHtml += '<a href="#" class="close-tooltip fa fa-times" style="display: none;"></a>';
    }
    innerHtml += '<div class="nw-tooltip">' + getTooltipTextInnerHtml(el) + '</div>';
    return innerHtml;
};

let getTooltipTextInnerHtml = function(el) {
    let innerHtml = '';
    let title = el.getAttribute('title');
    innerHtml += title;
    return innerHtml;
};

let createTooltip = function(el){
    let identifier = el.getAttribute('data-identifier');
    let tooltip = el.ownerDocument.createElement('div');
    let tooltipClassNames = ['nw-tooltip-wrapper'];
    let tooltipData = getTooltipData(el);
    if (tooltipData){
        if (tooltipData.classes && tooltipData.classes.length) {
            tooltipClassNames = _.concat(tooltipClassNames, tooltipData.classes);
        }
    }
    tooltip.className = tooltipClassNames.join(' ');
    tooltip.setAttribute('data-tooltip-identifier', identifier);
    tooltip.innerHTML = getTooltipInnerHtml(el);
    tooltip.el = el;
    tooltip.addEventListener('mouseover', handleTooltipMouseOver, false);
    tooltip.addEventListener('mouseout', handleTooltipMouseOut, false);
    el.ownerDocument.body.appendChild(tooltip);
    let closeLink = tooltip.querySelector('.close-tooltip');
    if (closeLink) {
        closeLink.addEventListener('click', handleTooltipCloseClick);
    }
    return tooltip;
};

let removeTooltip = function(el){
    delete el.nwTooltipBinding;
    let identifier = el.getAttribute('data-identifier');
    let tooltips = el.ownerDocument.querySelectorAll('.nw-tooltip-wrapper[data-tooltip-identifier=' + identifier + ']');
    for (let i=0; i<tooltips.length; i++){
        let tooltip = tooltips[i];
        if (tooltip){
            tooltip.removeEventListener('mouseover', handleTooltipMouseOver);
            tooltip.removeEventListener('mouseout', handleTooltipMouseOut);
            let closeLink = tooltip.querySelector('.close-tooltip');
            if (closeLink) {
                closeLink.removeEventListener('click', handleTooltipCloseClick);
            }
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
            let tooltipData = getTooltipData(el);
            let delay = window.getAppWrapper().getConfig('appConfig.tooltipDelay');
            if (tooltipData){
                if (tooltipData.immediate) {
                    delay = 1;
                }
            }
            let title = el.getAttribute('title');
            htmlHelper.addClass(tooltip, 'prepared-tooltip');
            el.setAttribute('data-title', title);
            el.removeAttribute('title');
            clearTimeouts(el);
            el.overTimeout = setTimeout(() => {
                showTooltip(e);
            }, delay);
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
    let duration = window.getAppWrapper().getConfig('appConfig.tooltipTTL');
    clearTimeouts(el);
    el.setAttribute('title', el.getAttribute('data-title'));
    el.removeAttribute('data-title');
    let tooltipData = getTooltipData(el);
    let autoHide = true;
    if (tooltipData){
        if (tooltipData.noAutoHide) {
            autoHide = false;
        }
        if (tooltipData.immediate) {
            duration = 1;
        }
    }
    if (autoHide) {
        el.outTimeout = setTimeout(() => {
            hideTooltip(el);
        }, duration);
    }
};

let handleTooltipMouseOver = function(e) {
    let tooltip = e.target;
    let htmlHelper = window.getAppWrapper().getHelper('html');
    if (!htmlHelper.hasClass(tooltip, 'nw-tooltip-wrapper')){
        while (tooltip.parentNode && !htmlHelper.hasClass(tooltip, 'nw-tooltip-wrapper')){
            tooltip = tooltip.parentNode;
        }
    }
    let el = tooltip.el;
    let tooltipData = getTooltipData(el);
    if (tooltipData){
        if (tooltipData.immediate) {
            return;
        }
    }
    clearTimeout(el.outTimeout);
};

let handleTooltipMouseOut = function(e) {
    let tooltip = e.target;
    let htmlHelper = window.getAppWrapper().getHelper('html');
    if (htmlHelper.hasClass(tooltip, 'nw-tooltip-wrapper')){
        let el = tooltip.el;
        let tooltipData = getTooltipData(el);
        if (tooltipData){
            if (tooltipData.immediate) {
                return;
            }
        }
        clearTimeout(el.outTimeout);
        let autoHide = true;
        if (tooltipData){
            if (tooltipData.noAutoHide) {
                autoHide = false;
            }
        }
        if (autoHide) {
            el.outTimeout = setTimeout(() => {
                hideTooltip(el);
            }, window.getAppWrapper().getConfig('appConfig.tooltipTTL'));
        }
    }
};

let handleTooltipCloseClick = function(e) {
    e.preventDefault();
    let tooltip = e.target.getParentByClass(e.target, 'nw-tooltip-wrapper');
    if (tooltip && tooltip.el) {
        hideTooltip(tooltip.el);
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
        let tooltip = getTooltip(el);
        let tooltipData = getTooltipData(el);
        if (tooltip){
            clearTimeout(tooltip.closeLinkTimeout);
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
                            if (!htmlHelper.hasClass(tooltip, classes[i])){
                                htmlHelper.addClasstooltip, (classes[i]);
                            }
                        }
                    }
                }
            }
            let position = htmlHelper.getAbsolutePosition(el);
            let elDimensions = htmlHelper.getCloneRealDimensions(el);
            let tooltipDimensions = htmlHelper.getRealDimensions(tooltip);
            let top = parseInt((position.offsetTop + elDimensions.height), 10);
            let left = parseInt((position.offsetLeft + (elDimensions.width / 2)), 10);
            let tooltipStyles = {
                top: top + 'px',
                left: left + 'px',
            };
            let windowWidth = el.ownerDocument.defaultView.innerWidth;

            if (tooltipDimensions.width + left > windowWidth){
                delete tooltipStyles.left;
                htmlHelper.addClass(tooltip, 'stick-right');
                tooltipStyles.right = '5px';
            } else if (left - parseInt(tooltipDimensions.width / 2, 10) < 0){
                htmlHelper.addClass(tooltip, 'stick-left');
                tooltipStyles.left = '5px';
            }
            if (tooltipData && tooltipData.showAbove) {
                htmlHelper.addClass(tooltip, 'tooltip-above');
                tooltipStyles['margin-top'] = '-' + (elDimensions.height + 5) + 'px';
            } else {
                htmlHelper.removeClass(tooltip, 'tooltip-above');
            }
            htmlHelper.setElementStyles(tooltip, tooltipStyles);
            htmlHelper.addClass(tooltip, 'visible-tooltip');
            tooltip.closeLinkTimeout = setTimeout(() => { showCloseLink(el); }, 3000);
        }
    }
};

let showCloseLink = function(el) {
    if (el.hasClass('nw-tooltip-wrapper')){
        el = el.el;
    } else if (!el.getAttribute('data-nwtooltip')){
        while (el.parentNode && !el.getAttribute('data-nwtooltip')){
            el = el.parentNode;
        }
    }
    let identifier = el.getAttribute('data-identifier');
    if (identifier){
        let tooltip = getTooltip(el);
        if (tooltip){
            let closeLink = tooltip.querySelector('.close-tooltip');
            if (closeLink) {
                let htmlHelper = window.getAppWrapper().getHelper('html');
                htmlHelper.removeElementStyles(closeLink, ['display']);
                clearTimeout(tooltip.closeLinkTimeout);
            }
        }
    }
};

let hideTooltip = function(el){
    if (el.hasClass('nw-tooltip-wrapper')){
        el = el.el;
    } else if (!el.getAttribute('data-nwtooltip')){
        while (el.parentNode && !el.getAttribute('data-nwtooltip')){
            el = el.parentNode;
        }
    }
    let identifier = el.getAttribute('data-identifier');
    if (identifier){
        let tooltip = getTooltip(el);
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
        let tooltip = getTooltip(el);
        if (tooltip){
            let title = el.getAttribute('title');
            if (title){
                el.setAttribute('data-title', title);
                let tooltipTextEl = tooltip.querySelector('.nw-tooltip');
                if (tooltipTextEl) {
                    tooltipTextEl.innerHTML = getTooltipTextInnerHtml(el);
                }
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