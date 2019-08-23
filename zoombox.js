// (c) 2019 Jim Hawkins. MIT licensed, see https://opensource.org/licenses/MIT

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
        this._update_rect();
        this._update_svgG();
    }

    get right() {
        return this._right;
    }
    set right(right) {
        this._right = right;
        this._update_rect();
        this._update_svgG();
    }

    get top() {
        return this._top;
    }
    set top(top) {
        this._top = top;
        this._update_rect();
        this._update_svgG();
    }

    get bottom() {
        return this._bottom;
    }
    set bottom(bottom) {
        this._bottom = bottom;
        this._update_rect();
        this._update_svgG();
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
        this._update_rect();
        this._update_svgG();
    }

    get svgG() {
        return this._svgG;
    }
    set svgG(svgG) {
        this._svgG = svgG;
        this._update_svgG();
    }
    _update_svgG() {
        if (!!this._svgG) {
            // Use an SVG group <g> element because its translate can be
            // smoothed with a CSS transition, which a <text> element's x and y
            // attributes cannot. TOTH https://stackoverflow.com/a/53452940
            this._svgG.style.transform =
                `translate(${this._left}px` + 
                `, ${(this._top + this._bottom) / 2}px)`;
            // console.log(this._svgG.style.transform);
        }
    }

    get svgRect() {
        return this._svgRect;
    }
    set svgRect(svgRect) {
        this._svgRect = svgRect;
        if (!!this._svgRect) {
            this._svgRect.setAttribute('fill', this._colour);
        }
        this._update_rect();
    }
    _update_rect() {
        if (!!this._svgRect) {
            this._svgRect.setAttribute('x', 0);
            this._svgRect.setAttribute('width', this._right - this._left);
            this._svgRect.setAttribute('y', (this._top - this._bottom)/2);
            this._svgRect.setAttribute('height', this._bottom - this._top);
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
        // The position of the text is always in the same place wrt the SVG
        // group. This method need only be called when the svg text element is
        // set, not when the dimensions of the zoom box are set.
        if (!!this._svgText) {
            this._svgText.setAttribute('x', 5);
            this._svgText.setAttribute('y', 0); 
            this._svgText.setAttribute('fill', "black");
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