// (c) 2019 Jim Hawkins. MIT licensed, see https://opensource.org/licenses/MIT

// Zoom Box base class.

import Piece from "./piece.js";

export default class ZoomBox {
    constructor(colour, text) {
        this._colour = (colour === undefined ? null : colour);
        this._text = (text === undefined ? null : text);

        this._controller = null;

        this._left = undefined;
        this._width = undefined;
        this._middle = undefined;
        this._height = undefined;

        this._scale = 1;
        this._spawnMargin = undefined;
        this._spawnHeight = undefined;

        this._derender();

        this._renderHeightThreshold = undefined;

        // Only used by ZoomBoxRandom.
        this._xChange = undefined;
        this._yChange = undefined;

        // childBoxes is a sparse array.
        this._childBoxes = undefined;
        // childWeights mustn't be sparse.
        this._childWeights = undefined;
        this._totalWeight = undefined;
    }
    _derender() {
        // Principal graphics.
        this._svgGroup = null;
        this._svgRect = null;
        this._svgText = null;
        //
        // Diagnostic graphics.
        this._svgSpawnMargin = null;
        this._svgWidth = null;      
    }

    get childBoxes() {
        return this._childBoxes;
    }

    get childWeights() {
        return this._childWeights;
    }
    set childWeights(childWeights) {
        this._childWeights = childWeights;
        this._totalWeight = (
            (childWeights === undefined || childWeights === null) ? undefined :
            childWeights.reduce(
                (accumulator, weight) => accumulator + weight, 0)
        );
    }

    get totalWeight() {
        return this._totalWeight;
    }

    // Invoke the callback on each child box that isn't null.
    each_childBox(callback) {
        this.childBoxes !== undefined && this.childBoxes.forEach(
            (child, index) => child !== null && callback(child, index));
    }

    // Height at which this box is considered big enough to render. If the box
    // gets zoomed below this height, it is de-rendered.
    get renderHeightThreshold() {
        return this._renderHeightThreshold;
    }
    set renderHeightThreshold(renderHeightThreshold) {
        this._renderHeightThreshold = renderHeightThreshold;
        this.each_childBox(child => 
            child.renderHeightThreshold = renderHeightThreshold
        );
    }

    // Principal properties that define the location and size of the box. The
    // update() method is always a no-op in the current version but could be
    // changed later.
    get left() {
        return this._left;
    }
    set left(left) {
        this._left = left;
        this.update();
    }

    get width() {
        return this._width;
    }
    set width(width) {
        this._width = width;
        this.update();
    }

    get middle() {
        return this._middle;
    }
    set middle(middle) {
        this._middle = middle;
        this.update();
    }

    get height() {
        return this._height;
    }
    set height(height) {
        this._height = height;
        this.update();
    }

    // Computed properties for convenience.
    get top() {
        if (this.middle === undefined || this.height === undefined) {
            return undefined;
        }
        return this.middle - (this.height / 2);
    }

    get bottom() {
        if (this.middle === undefined || this.height === undefined) {
            return undefined;
        }
        return this.middle + (this.height / 2);
    }

    get piece() {
        return this._svgGroup;
    }

    // Special setters that avoid individual updates.
    set_dimensions(left, width, middle, height) {
        if (left !== undefined) {
            this._left = left;
        }
        if (width !== undefined) {
            this._width = width;
        }
        if (middle !== undefined) {
            this._middle = middle;
        }
        if (height !== undefined) {
            this._height = height;
        }

        this.update();
    }

    adjust_dimensions(xDelta, middleDelta, cascade=false) {
        if (xDelta !== undefined) {
            this._left += xDelta;
            this._width -= xDelta;    
        }
        this._middle += middleDelta;
        this.update();
        if (cascade) {
            this.each_childBox(zoomBox => 
                zoomBox.adjust_dimensions(xDelta, middleDelta, true));
        }
    }

    update() {
    }

    inherit(parent) {
        [
            "spawnMargin", "spawnHeight", "renderHeightThreshold"
        ].forEach(attribute => this[attribute] = parent[attribute]);
    }

    get controller() {
        return this._controller;
    }
    set controller(controller) {
        this._controller = controller;
    }

    // Override and call super in subclass.
    render(into, after, limits, level) {
        if (this._should_render(into, limits)) {
            this._render_group(into, after, limits, level);
            this.each_childBox(child =>
                child.render(into, this._svgGroup.node, limits, level + 1));
        }
        else {
            if (this._svgGroup !== null) {
                this._svgGroup.remove();
                console.log('derender', this._message);
                this._derender();
            }
            this.each_childBox(child => child.render(null));
        }
        return null;
    }

    _should_render(into, limits) {
        if (into === null || this.dimension_undefined()) {
            return false;
        }

        if (this.height < 0) {
            console.log('negative height', this);
            return false;
        }
        if (isNaN(this.height)) {
            console.log('height isNaN', this);
            return false;
        }

        if (this.bottom < limits.top) {
            return false;
        }
        if (this.top > limits.bottom) {
            return false;
        }
        if (this.renderHeightThreshold !== undefined) {
            if (this.height < this.renderHeightThreshold) {
                return false;
            }
        }

        if (this.width <= 0) {
            return false;
        }

        return true;
    }

    dimension_undefined() {
        return (
            this.left === undefined || this.width === undefined ||
            this.middle === undefined || this.height === undefined
        );
    }

    _render_group(into, after, limits, level) {
        if (this._svgGroup === null) {
            // Use an SVG group <g> element because its translate can be
            // smoothed with a CSS transition, which a <text> element's x and y
            // attributes cannot. TOTH https://stackoverflow.com/a/53452940
            // Reference:
            // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform

            this._svgGroup = new Piece('g');
        }

        const margin = (this.spawnMargin === undefined ? 0 : this.spawnMargin);
        // if (this._message !== undefined && this._message.length !== level) {
        //     console.log('Level diff');
        // }
        const limitLeft = limits.left + (level * margin);
        const renderLeft = this.left < limitLeft ? limitLeft : this.left;

        const limitTop = limits.top + (margin === 0 ? 0 : level * 5);
        const renderMiddle = (
            this.top < limitTop ? limitTop + margin : this.middle);
        
        this._svgGroup.node.style.transform = 
            `translate(${renderLeft}px, ${renderMiddle}px)` +
            ` scale(${this._scale}`;
        // ToDo: Try changing the above to a transform list, see:
        // https://developer.mozilla.org/en-US/docs/Web/API/SVGTransformList

        // if (renderMiddle !== this.middle) {
        //     console.log(
        //         this._message, renderMiddle, limitTop, margin, limits.top);
        // }

        const parent = this._svgGroup.node.parentElement;
        if (!Object.is(parent, into)) {
            if (after === null) {
                into.insertBefore(this._svgGroup.node, into.firstChild);
            }
            else {
                after.insertAdjacentElement('afterend', this._svgGroup.node);
            }
        }

        this._render_rect(
            limitTop, limits.bottom, limits.width, this.middle - renderMiddle);
        this._render_text();
        this._render_diagnostics(
            limits.showDiagnostic, this.middle - renderMiddle);

    }

    _render_rect(limitTop, limitBottom, width, renderOffset) {
        if (this._colour === null) {
            if (this._svgRect !== null) {
                this._svgRect.remove();
                this._svgRect = null;
            }
            return;
        }

        if (this._svgRect === null) {
            this._svgRect = new Piece('rect', this._svgGroup, {
                "x": 0, "fill": this._colour
            });

            this._svgRect.node.addEventListener(
                'click', event => console.log('rect', 'click', this, event)
            );
        }

        const trimTop = (
            this.top < limitTop ? limitTop - this.top : 0);
        const trimBottom = (
            this.bottom > limitBottom ? this.bottom - limitBottom : 0);
        this._svgRect.node.classList.toggle('trim-top', trimTop !== 0);
        this._svgRect.node.classList.toggle('trim-bottom', trimBottom !== 0);

        const drawY = (this.height / -2) + renderOffset + trimTop;
        const drawHeight = this.height - (trimTop + trimBottom);

        if (drawHeight < 0) {
            console.log(
                'drawHeight', this._message, drawHeight, trimTop, trimBottom);
        }

        // console.log({
        //     offset:renderOffset, height: this.height,
        //     drawY:drawY, drawHeight:drawHeight,
        //     trimTop:trimTop, trimBottom:trimBottom
        // });

        this._svgRect.set_attributes({
            width: this.width > 0 ? width : 0,
            y: drawY,
            height: drawHeight > 0 ? drawHeight : 0
        });
    }

    _render_text() {
        if (this._text === null) {
            if (this._svgText !== null) {
                this._svgText.remove();
                this._svgText = null;
            }
            return;
        }

        if (this._svgText === null) {
            this._svgText = new Piece('text', this._svgGroup, {
                "x": 5, "y": 0, "fill": "black",
                "alignment-baseline": "middle"
            }, this._text);
        }

        const fontSize = (
            this.spawnMargin !== undefined && this.height > this.spawnMargin ?
            this.spawnMargin : this.height
        ) * 0.9;
        this._svgText.node.setAttribute('font-size', `${fontSize}px`);
    }

    _render_diagnostics(show, renderOffset) {
        const y1 = renderOffset + (this.height / -2);
        const y2 = renderOffset + (this.height / 2);

        this._svgWidth = Piece.toggle(
            this._svgWidth, show, () => new Piece('line',  this._svgGroup, {
                stroke:"black", "stroke-width":"1px",
                "stroke-dasharray":"4",
                "class": 'diagnostic-width'
            })
        );
        if (show) {
            this._svgWidth.set_attributes({
                x1: `${this.width}`, y1: `${y1}`,
                x2: `${this.width}`, y2: `${y2}`
            });    
        }

        this._svgSpawnMargin = Piece.toggle(
            this._svgSpawnMargin, show && (this.spawnMargin !== undefined),
            () => new Piece('line', this._svgGroup, {
                x1:"0", x2:`${this.spawnMargin}`,
                stroke:"black", "stroke-width":"1px",
                "stroke-dasharray":"4"
            })
        )
        if (this._svgSpawnMargin !== null) {
            this._svgSpawnMargin.set_attributes({y1: `${y1}`, y2: `${y2}`});
        }

        /* The following animation code doesn't seem to work.
        this._svgSpawnMargin.remove_all();
        this._svgSpawnMargin.create('animateDUFF', {
            attributeName: 'y1',
            attributeType: 'XML',
            from: this._svgSpawnMargin.node.getAttribute('y1'),
            to: `${this.height / -2}`,
            dur:'0.2s'
        });
        this._svgSpawnMargin.create('animateDUFF', {
            attributeName: 'y2',
            attributeType: 'XML',
            from: this._svgSpawnMargin.node.getAttribute('y2'),
            to: `${this.height / 2}`,
            dur:'0.2s'
        });
        */
    }

    // Returns a value indicating the vertical position of this box in relation
    // to the origin.
    //
    // -   null if any properties involved in the determination aren't defined.
    // -   0 if this box is across the origin.
    // -   1 if this box is below the origin.
    // -   -1 if this box is above the origin.
    holds_origin() {
        if (this.dimension_undefined()) {
            return null;
        }
        if (this.renderHeightThreshold !== undefined) {
            if (this.height < this.renderHeightThreshold) {
                return null;
            }
        }

        // If the top of box is below the origin, then the whole box is below
        // the origin.
        if (this.top > 0) {
            return 1;
        }
        // If the bottom of the box is above the origin, then the whole box is
        // above the origin.
        // Exactly one of the checks has to be or-equals.
        if (this.bottom <= 0) {
            return -1;
        }
        return 0;
    }

    // If this box or a child of this box holds the origin, returns a reference
    // to the holder. Otherwise returns null.
    origin_holder() {
        if (this.holds_origin() !== 0) {
            return null;
        }
        let childHolder = null;
        for(let index = this.childBoxes.length - 1; index >= 0; index--) {
            const zoomBox = this.childBoxes[index];
            if (zoomBox === null) {
                continue;
            }
            const holds = zoomBox.holds_origin();
            if (holds === 0) {
                childHolder = zoomBox.origin_holder();
                break;
            }
            if (holds === -1) {
                // Found a child above the origin. All remaining child boxes
                // will be above this one, so stop checking.
                break;
            }
        }
        return childHolder === null ? this : childHolder;
    }

    get spawnMargin() {
        return this._spawnMargin;
    }
    set spawnMargin(spawnMargin) {
        this._spawnMargin = spawnMargin;
        this.each_childBox(child => child.spawnMargin = spawnMargin);
    }

    get spawnHeight() {
        return this._spawnHeight;
    }
    set spawnHeight(spawnHeight) {
        this._spawnHeight = spawnHeight;
        this.each_childBox(child => child.spawnHeight = spawnHeight);
    }

    // Properties used by ZoomBoxRandom.
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