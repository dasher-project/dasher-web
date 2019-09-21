// (c) 2019 Jim Hawkins. MIT licensed, see https://opensource.org/licenses/MIT

import Piece from "./piece.js";

export default class ZoomBox {
    constructor(colour, text) {
        this._colour = (colour === undefined ? null : colour);
        this._text = (text === undefined ? null : text);

        this._left = undefined;
        this._width = undefined;
        this._middle = undefined;
        this._height = undefined;

        this._excessWidth = 0;
        this._scale = 1;
        this._spawnMargin = undefined;
        this._spawnHeight = undefined;

        this._renderPiece = null;
        //
        // Principal graphics.
        this._svgGroup = null;
        this._svgRect = null;
        this._svgText = null;
        //
        // Diagnostic graphics.
        this._svgSpawnMargin = null;
        this._svgWidth = null;

        this._renderTop = undefined;
        this._renderBottom = undefined;
        this._renderHeightThreshold = undefined;

        this._xChange = undefined;
        this._yChange = undefined;
        // this._weight = 1;

        this._children = [];
    }

    get children() {
        return this._children;
    }

    get_child_weight(index) {
        return 1;
    }

    get renderTop() {
        return this._renderTop;
    }
    set renderTop(renderTop) {
        this._renderTop = renderTop;
        this.render();
    }

    get renderBottom() {
        return this._renderBottom;
    }
    set renderBottom(renderBottom) {
        this._renderBottom = renderBottom;
        this.render();
    }

    get renderOrigin() {
        return (this.renderTop + this.renderBottom) / 2;
    }

    get renderHeightThreshold() {
        return this._renderHeightThreshold;
    }
    set renderHeightThreshold(renderHeightThreshold) {
        this._renderHeightThreshold = renderHeightThreshold;
        this.render();
        this.children.forEach(child => {
            child.renderHeightThreshold = renderHeightThreshold;
        });
    }

    get renderPiece() {
        return this._renderPiece;
    }
    set renderPiece(renderPiece) {
        if (!Object.is(renderPiece, this._renderPiece)) {
            this._renderPiece = renderPiece;
            this.render();
        }
    }

    get left() {
        return this._left;
    }
    set left(left) {
        this._left = left;
        this.render();
    }

    get width() {
        return this._width;
    }
    set width(width) {
        this._width = width;
        this.render();
    }

    get excessWidth() {
        return this._excessWidth;
    }
    set excessWidth(excessWidth) {
        this._excessWidth = excessWidth;
        this._children.forEach(child => child.excessWidth = excessWidth);
        this.render();
    }

    get middle() {
        return this._middle;
    }
    set middle(middle) {
        this._middle = middle;
        this.render();
    }

    get height() {
        return this._height;
    }
    set height(height) {
        this._height = height;
        this.render();
    }

    get piece() {
        return this._svgGroup;
    }

    set_dimensions(left, width, middle, height, actual=true) {
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

        this.render(actual);
    }

    _set_for_render(width, top, height, renderTop, renderBottom, actual=true) {
        this._width = width;
        this._middle = top + (height / 2);
        this._height = height;
        this._renderTop = renderTop;
        this._renderBottom = renderBottom;
        this.render(actual);
    }

    inherit(parent) {
        [
            "spawnMargin", "spawnHeight", "renderHeightThreshold", "excessWidth"
        ].forEach(attribute => this[attribute] = parent[attribute]);
    }

    // get weight() {
    //     return this._weight;
    // }
    // set weight(weight) {
    //     this._weight = weight;
    // }

    render(actual=true) {
        if (!this._should_render()) {
            if (this._svgGroup !== null) {
                this._svgGroup.remove();
            }
            return;
        }

        if (actual) {
            this._render_group();
            this._render_rect();
            this._render_text();
            this._render_diagnostics();

            // Could optimise later, by tracking height and lastHeight.
            if (
                (
                    this.spawnMargin === undefined ||
                    this.width >= this.spawnMargin
                ) && (
                    this.spawnHeight === undefined ||
                    this.height >= this.spawnHeight
                )
            ) {
                this.spawn();
            }
        }

        this.child_arrange(actual);
    }

    _should_render() {
        if (
            this.left === undefined || this.width === undefined ||
            this.middle === undefined || this.height === undefined ||
            this.renderPiece === null
        ) {
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

        if (this.renderTop !== undefined) {
            if (this.middle + (this.height / 2) < this.renderTop) {
                return false;
            }
        }
        if (this.renderBottom !== undefined) {
            if (this.middle - (this.height / 2) > this.renderBottom) {
                return false;
            }
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

    _render_group() {
        if (this._svgGroup === null) {
            // Use an SVG group <g> element because its translate can be
            // smoothed with a CSS transition, which a <text> element's x and y
            // attributes cannot. TOTH https://stackoverflow.com/a/53452940
            // Reference:
            // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform

            this._svgGroup = new Piece('g');
        }

        this._svgGroup.node.style.transform = 
            `translate(${this.left}px, ${this.middle}px)` +
            ` scale(${this._scale}`;
        // console.log(this._svgGroup.node.style.transform);

        // ToDo: Try changing the above to a transform list, see:
        // https://developer.mozilla.org/en-US/docs/Web/API/SVGTransformList

        const parent = this._svgGroup.node.parentElement;
        if (!parent && (this.renderPiece !== null)) {
            this.renderPiece.add_child(this._svgGroup);
        }
    }

    _render_rect() {
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

        this._svgRect.set_attributes({
            width: this._width > 0 ? this._width + this.excessWidth : 0,
            y: this.height / -2, height: this.height
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

    _render_diagnostics() {
        if (this._svgWidth === null) {
            this._svgWidth = new Piece('line',  this._svgGroup, {
                stroke:"black", "stroke-width":"1px",
                "stroke-dasharray":"4"
            });
        }
        this._svgWidth.set_attributes({
            x1: `${this.width}`, y1: `${this.height / -2}`,
            x2: `${this.width}`, y2: `${this.height / 2}`
        });

        if (this.spawnMargin === undefined) {
            if (this._svgSpawnMargin !== null) {
                this._svgSpawnMargin.remove();
                this._svgSpawnMargin = null;
            }
            return;
        }

        if (this._svgSpawnMargin === null) {
            this._svgSpawnMargin = new Piece('line', this._svgGroup, {
                x1:"0", x2:`${this.spawnMargin}`,
                // y1:"0", y2:"0",
                stroke:"black", "stroke-width":"1px",
                "stroke-dasharray":"4"
            });
        }
        this._svgSpawnMargin.set_attributes({
            y1: `${this.height / -2}`,
            y2: `${this.height / 2}`
        });
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

    child_arrange(actual) {
        let totalWeight = 0;
        let index = this.children.length;
        if (index <= 0) {
            return;
        }
        while(index > 0 && !isNaN(totalWeight)) {
            totalWeight += this.get_child_weight(--index);
        }

        if (isNaN(totalWeight)) {
            this._children.forEach(child => {
                child.width = this.width - child.left;
            });
        }
        else {
            const unitHeight = this.height / totalWeight;

            let top = this.height / -2;
            const renderTop = (
                this.renderTop === undefined ? undefined :
                this.renderTop - this.middle
            );
            const renderBottom = (
                this.renderBottom === undefined ? undefined :
                this.renderBottom - this.middle
            );
            this.children.forEach((zoomBox, index) => {
                const height = this.get_child_weight(index) * unitHeight;
                zoomBox._set_for_render(
                    this.width - zoomBox.left, top, height,
                    renderTop, renderBottom, actual);
                top += height;
            });
        }
    }

    holds_origin() {
        if (!this._should_render()) {
            return null;
        }
        const top = this.middle - (this.height / 2);
        if (top > this.renderOrigin) {
            return 1;
        }
        const bottom = top + this.height;
        if (bottom <= this.renderOrigin) {
            return -1;
        }
        return 0;
    }

    origin_holder() {
        if (this.holds_origin() === 0) {
            let childHolder = null;
            // let offset = 0;
            for(
                let holderIndex = this.children.length - 1;
                holderIndex >= 0;
                holderIndex--
            ) {
                const holds = this.children[holderIndex].holds_origin();
                if (holds === 0) {
                    // [childHolder, offset] = (
                    //     this.children[holderIndex].origin_holder());
                    childHolder = this.children[holderIndex].origin_holder();
                    break;
                }
                if (holds === -1) {
                    break;
                }
            }
            return childHolder === null ? this : childHolder;
                // [this, 0] :
                // [childHolder, this.middle + offset]);
        }
        // return [null, undefined];
        return null;
    }

    get spawnMargin() {
        return this._spawnMargin;
    }
    set spawnMargin(spawnMargin) {
        this._spawnMargin = spawnMargin;
        this._children.forEach(child => child.spawnMargin = spawnMargin);
    }

    get spawnHeight() {
        return this._spawnHeight;
    }
    set spawnHeight(spawnHeight) {
        this._spawnHeight = spawnHeight;
        this._children.forEach(child => child.spawnHeight = spawnHeight);
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

    zoom() {
        // Override in subclass.
    }

    spawn() {
        // Override in subclass.
    }
}