exports.defineTags = function(dictionary) {
    dictionary.defineTag('relativelink', {
        mustHaveValue: true,
        onTagged: function(doclet, tag) {
            var value;
            try {
                value = JSON.parse(tag.value.replace(/;$/, ''));
                doclet.relativeLink = '';
                doclet.relativeLink += '<a href="' + value.url + '">' + value.text + '</a>';
                doclet.relativeLink += '';
                doclet.relativeLinkRaw = value;
            } catch (ex) {
                console.log(ex);
            }
        }
    });
};

exports.handlers = {
    newDoclet: function(e) {
        if (e && e.doclet && e.doclet.relativeLink){
            e.doclet.description = e.doclet.relativeLink;
        }
    }
};
