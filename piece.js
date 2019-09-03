// (c) 2019 Jim Hawkins. MIT licensed, see https://opensource.org/licenses/MIT

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
            text === undefined ? undefined : document.createTextNode(text));
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

    add_child(piece) {
        return this.node.appendChild(piece.node);
    }

    remove() {
        const parent = this.node.parentElement;
        return (!!parent) ? parent.removeChild(this.node) : this.node;
    }

    static set_attributes(element, attributes) {
        if (attributes !== undefined && element !== undefined) {
            for (const [key, value] of Object.entries(attributes)) {
                element.setAttribute(key, value);
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

    static NS_for_tag(tag) {
        return Piece.tagMap[tag];
    }
}

// Static properties.

Piece.nameSpaces = {
    'html': {
        'url': 'http://www.w3.org/1999/xhtml',
        'tags': ['div', 'span', 'button', 'h1']
    },
    'svg': {
        'url': 'http://www.w3.org/2000/svg',
        'tags': ['svg', 'rect', 'text', 'g', 'line']
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
