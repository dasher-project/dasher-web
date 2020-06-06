// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

// This is a utility class that wraps creation of HTML and SVG nodes. The class
// takes care of setting the required namespace (NS), by having a static map of
// which tags are in which namespace. The maps is created as a static property,
// at the end of the file.
// If you're having trouble, check that the tag you're using is in the map.

export default class Piece {
    constructor(tagOrNode, parent, attributes, text) {
        this._node = (
            typeof(tagOrNode) === Piece._stringType ?
            Piece.create(
                tagOrNode,
                (parent instanceof Piece) ? parent.node : parent, 
                attributes,
                text
            ) :
            tagOrNode
        );
    }

    get node() { return this._node; }

    static create(tag, parent, attributes, text, nameSpace) {
        if (nameSpace === undefined) {
            nameSpace = Piece.NS_for_tag(tag);
            if (nameSpace === undefined) {
                throw new Error(
                    `Unknown name space for <${tag}>.` +
                    ' Add it to Piece.nameSpaces in the piece.js file.');
            }
        }
        else {
            const mappedNS = Piece.nameSpaces[nameSpace];
            if (mappedNS !== undefined) {
                nameSpace = mappedNS;
            }
        }

        if (text instanceof Array) {
            return text.map(text1 => Piece.create(
                tag, parent, attributes, text1, this.node, nameSpace))
        }

        const element = (
            tag === undefined ? undefined :
            document.createElementNS(nameSpace, tag));
        Piece.set_attributes(element, attributes);
        const textNode = (
            text === undefined || text === null ? undefined :
            document.createTextNode(text));
        if (element === undefined) {
            element = textNode;
        }
        else {
            if (textNode !== undefined) {
                element.appendChild(textNode);
            }
        }
        if (parent !== undefined) {
            parent.appendChild(element);
        }
        return element;
    }
    create(tag, attributes, text, nameSpace) {
        return Piece.create(tag, this.node, attributes, text, nameSpace);
    }

    add_child(piece, append=true) {
        // In case this.node has no child nodes, this.node.firstChild is null
        // anyway, which causes appending.
        return this.node.insertBefore(
            piece.node, append ? null : this.node.firstChild);
    }

    remove() {
        const parent = this.node.parentElement;
        return (!!parent) ? parent.removeChild(this.node) : this.node;
    }

    remove_all() {
        // TOTH: https://stackoverflow.com/a/22966637
        const parent = this.node.parentNode;
        if (parent === null) {
            return;
        }
        const clone = this.node.cloneNode(false);
        parent.replaceChild(clone, this.node);
        this._node = clone;
    }

    // TOTH: https://github.com/vmware/captive-web-view/blob/master/forAndroid/captivewebview/src/main/assets/library/pagebuilder.js#L131
    static remove_childs(parent, beforeChild) {
        let child = parent.firstChild;
        if (beforeChild === undefined) {
            beforeChild = null;
        }
        while(child !== beforeChild ) {
            parent.removeChild(child);
            child = parent.firstChild;
        }
    }
    remove_childs(beforeChild) {
        return Piece.remove_childs(this.node, beforeChild);
    }

    static set_attributes(element, attributes) {
        if (attributes !== undefined && element !== undefined) {
            // There seems to be a strange behaviour in Safari and WKWebView
            // that, if you first set type='color' then set value='#hexColour',
            // the picker control will always show black as the initial colour.
            // However, if you first set the value, and then set the type, the
            // initial colour will reflect the value correctly.  
            // The following code works around the behaviour by filtering out
            // the type setting, if the element is an input control of type
            // color. Then the filtered out attribute setting is applied after.
            const attributes2 = (
                element.tagName.toLowerCase() === 'input' ? {} : null);

            for (const [key, value] of Object.entries(attributes)) {
                if (
                    attributes2 !== null &&
                    key.toLowerCase() === 'type' &&
                    value === 'color'
                ) {
                    attributes2[key] = value;
                }
                else {
                    element.setAttribute(key, value);
                }
            }
            if (attributes2 !== null) {
                for (const [key, value] of Object.entries(attributes2)) {
                    element.setAttribute(key, value);
                }
            }
        }
        return element;
    }
    set_attributes(attributes) {
        Piece.set_attributes(this.node, attributes);
    }

    _createHTML(tag, attributes, text, parent) {
        return this._create(
            tag, attributes, text,
            parent === undefined ? this._parent : parent,
            'http://www.w3.org/1999/xhtml'
        );
    }

    static toggle(piece, condition, create) {
        if (condition) {
            return piece === null ? create() : piece;
        }
        if (piece !== null) {
            piece.remove();
        }
        return null;
    }

    static NS_for_tag(tag) {
        return Piece.tagMap[tag];
    }
}

// Static properties.

Piece.nameSpaces = {
    'html': {
        'url': 'http://www.w3.org/1999/xhtml',
        'tags': [
            'div', 'fieldset', 'form', 'span', 'button', 'h1', 'input', 'label',
            'legend', 'option', 'pre', 'select', 'textarea'
        ]
    },
    'svg': {
        'url': 'http://www.w3.org/2000/svg',
        'tags': ['svg', 'rect', 'text', 'g', 'line', 'animate', 'polyline']
    }
};

// Inverted map of tag names to name space URL values.
// This could be done with Object.fromEntries() but it seems not to be supported
// in Firefox.
Piece.tagMap = {};
Object.values(Piece.nameSpaces).map(
    nameSpace => nameSpace.tags.map(tag => [tag, nameSpace.url])
).reduce(
    (accumulator, value) => accumulator.concat(value), []
).forEach(pair => Piece.tagMap[pair[0]] = pair[1]);

Piece._stringType = typeof("");
