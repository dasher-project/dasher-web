// (c) 2019 Jim Hawkins. MIT licensed, see https://opensource.org/licenses/MIT

import Piece from "./piece.js";

export default class ZoomBox {
    constructor(colour, top, right, bottom, left) {
        this._top = top;
        this._right = right;
        this._bottom = bottom;
        this._left = left;

        this._colour = colour;
        // this._text = text;

        this._svgG = undefined;
        this._svgRect = undefined;
        this._svgText = undefined;

        this._xChange = undefined;
        this._yChange = undefined;
    }

    get left() {
        return this._left;
    }
    set left(left) {
        this._left = left;
        this._update_render();
    }

    get right() {
        return this._right;
    }
    set right(right) {
        this._right = right;
        this._update_render();
    }

    get top() {
        return this._top;
    }
    set top(top) {
        this._top = top;
        this._update_render();
    }

    get bottom() {
        return this._bottom;
    }
    set bottom(bottom) {
        this._bottom = bottom;
        this._update_render();
    }

    get height() {
        return this._bottom - this._top;
    }

    setDimensions(top, right, bottom, left) {
        if (top !== undefined) {
            this._top = top;
        }
        if (right !== undefined) {
            this._right = right;
        }
        if (bottom !== undefined) {
            this._bottom = bottom;           
        }
        if (left !== undefined) {
            this._left = left;
        }
        this._update_render();
    }

    get parentPiece() {
        return this._parentPiece;
    }
    set parentPiece(parentPiece) {
        this._parentPiece = parentPiece;
    }

    get text() {
        return this._text;
    }
    set text(text) {
        this._text = text;
    }

    render() {
        this._svgGroup = new Piece('g');
        this._svgRect = this._svgGroup.create('rect', {
            "x": 0, "fill": this._colour
        });
        this._svgText = this._svgGroup.create('text', {
            "x": 5, "y": 0, "fill": "black", "alignment-baseline": "middle"
        }, this.text);

        this._update_render();
        this.parentPiece.add_child(this._svgGroup);
    }

    _update_render() {
        if (!!this._svgGroup) {
            // Use an SVG group <g> element because its translate can be
            // smoothed with a CSS transition, which a <text> element's x and y
            // attributes cannot. TOTH https://stackoverflow.com/a/53452940
            this._svgGroup.node.style.transform = 
                `translate(${this._left}px` +
                `, ${(this._top + this._bottom) / 2}px)`;
            // console.log(this._svgGroup.node.style.transform);
        }
        if (!!this._svgRect) {
            this._svgRect.setAttribute('width', this._right - this._left);
            this._svgRect.setAttribute('y', (this._top - this._bottom)/2);
            this._svgRect.setAttribute('height', this.height);
        }
        if (!!this._svgText) {
            this._svgText.setAttribute('font-size', `${this.height * 0.9}px`);
        }
    }

    get xChange() {
        return this._xChange;
    }
    set xChange(xChange) {
        this._xChange = xChange;
    }

    get yChange() {
        return this._yChange;
    }
    set yChange(yChange) {
        this._yChange = yChange;
    }
}