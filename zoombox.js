// (c) 2019 Jim Hawkins. MIT licensed, see https://opensource.org/licenses/MIT

export default class ZoomBox {
    constructor(colour, top, right, bottom, left) {
        this._top = top;
        this._right = right;
        this._bottom = bottom;
        this._left = left;

        this._colour = colour;
        // this._text = text;

        this._svgRect = undefined;
        this._svgText = undefined;

        this._xChange = undefined;
    }

    get left() {
        return this._left;
    }
    set left(left) {
        this._left = left;
        this._update_rect();
        this._update_text();
    }

    get svgRect() {
        return this._svgRect;
    }
    set svgRect(svgRect) {
        this._svgRect = svgRect;
        this._update_rect();
    }
    _update_rect() {
        if (!!this._svgRect) {
            this._svgRect.setAttribute('x', this._left);
            this._svgRect.setAttribute('width', this._right - this._left);
            this._svgRect.setAttribute('y', this._top);
            this._svgRect.setAttribute('height', this._bottom - this._top);
            this._svgRect.setAttribute('fill', this._colour);
        }
    }

    get svgText() {
        return this._svgText;
    }
    set svgText(svgText) {
        this._svgText = svgText;
        this._update_text();
    }
    _update_text() {
        if (!!this._svgText) {
            this._svgText.setAttribute('x', this._left + 5);
            this._svgText.setAttribute('y', (this._top + this._bottom) / 2);
            this._svgText.setAttribute('fill', "black");
        }
    }

    get xChange() {
        return this._xChange;
    }
    set xChange(xChange) {
        this._xChange = xChange;
    }
}