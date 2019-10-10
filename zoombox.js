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

        // this._excessWidth = 0;
        this._scale = 1;
        this._spawnMargin = undefined;
        this._spawnHeight = undefined;

        // this._renderPiece = null;
        this._derender();

        // this._renderTop = undefined;
        // this._renderBottom = undefined;
        this._renderHeightThreshold = undefined;

        this._xChange = undefined;
        this._yChange = undefined;
        // this._weight = 1;

        this._childBoxes = undefined;
        this._childWeights = undefined;
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

    each_childBox(callback) {
        this.childBoxes !== undefined && this.childBoxes.forEach(
            (child, index) => child !== null && callback(child, index));
    }

    // get_child_weight(index) {
    //     return 1;
    // }

    // get renderTop() {
    //     return this._renderTop;
    // }
    // set renderTop(renderTop) {
    //     this._renderTop = renderTop;
    //     this.render();
    // }

    // get renderBottom() {
    //     return this._renderBottom;
    // }
    // set renderBottom(renderBottom) {
    //     this._renderBottom = renderBottom;
    //     this.render();
    // }

    // get renderOrigin() {
    //     return (this.renderTop + this.renderBottom) / 2;
    // }

    get renderHeightThreshold() {
        return this._renderHeightThreshold;
    }
    set renderHeightThreshold(renderHeightThreshold) {
        this._renderHeightThreshold = renderHeightThreshold;
        // this.render();
        this.each_childBox(child => 
            child.renderHeightThreshold = renderHeightThreshold
        );
    }

    // get renderPiece() {
    //     return this._renderPiece;
    // }
    // set renderPiece(renderPiece) {
    //     if (!Object.is(renderPiece, this._renderPiece)) {
    //         this._renderPiece = renderPiece;
    //         this.render();
    //     }
    // }

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

    // get excessWidth() {
    //     return this._excessWidth;
    // }
    // set excessWidth(excessWidth) {
    //     this._excessWidth = excessWidth;
    //     this._children.forEach(child => child.excessWidth = excessWidth);
    //     this.render();
    // }

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

    // _set_for_render(width, top, height, renderTop, renderBottom, actual=true) {
    //     this._width = width;
    //     this._middle = top + (height / 2);
    //     this._height = height;
    //     // this._renderTop = renderTop;
    //     // this._renderBottom = renderBottom;
    //     // this.render(actual);
    // }

    inherit(parent) {
        [
            "spawnMargin", "spawnHeight", "renderHeightThreshold"
            //, "excessWidth"
        ].forEach(attribute => this[attribute] = parent[attribute]);
    }

    // get weight() {
    //     return this._weight;
    // }
    // set weight(weight) {
    //     this._weight = weight;
    // }

    // Override and call super in subclass
    // Override and return to skip the render() and spawn();
    zoom(into, after, limits) {
        // if (
        //     this._should_render(into, limits) && (
        //         this.spawnHeight === undefined ||
        //         this.height >= this.spawnHeight
        //     ) && (
        //         this.spawnMargin === undefined ||
        //         this.width >= this.spawnMargin
        //     )
        // ) {
        //     this.spawn();
        // }
        this.render(into, after, limits);
    }

    spawn() {
        // Override in subclass.
        return false;
    }

    // render(actual=true) {
    // Don't override.
    render(into, after, limits) {
        if (this._should_render(into, limits)) {
            this._render_group(into, after, limits);

            // if (
            //     (
            //         this.spawnHeight === undefined ||
            //         this.height >= this.spawnHeight
            //     ) && (
            //         this.spawnMargin === undefined ||
            //         this.width >= this.spawnMargin
            //     )
            // ) {
            //     this.spawn();
            // }

            
            this.each_childBox(child =>
                child.render(into, this._svgGroup.node, limits));
            return true;
        }
        else {
            if (this._svgGroup !== null) {
                this._svgGroup.remove();
                console.log('derender', this._message);
                this._derender();
            }
            this.each_childBox(child => child.render(null));

            // despawn!
            // const childs = this.childBoxes.length;
            // this.childBoxes.splice(0, this.childBoxes.length).forEach(
            //     child => child.render(null));
            // if (childs > 0) {
            //     console.log('despawn', this._message);
            // }
            return false;
        }

        // if (actual) {

        //     // Could optimise later, by tracking height and lastHeight.
        //     if (
        //         (
        //             this.spawnMargin === undefined ||
        //             this.width >= this.spawnMargin
        //         ) && (
        //             this.spawnHeight === undefined ||
        //             this.height >= this.spawnHeight
        //         )
        //     ) {
        //         this.spawn();
        //     }
        // }

        // this.child_arrange(actual);

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

        // if (this.renderTop !== undefined) {
            if (this.bottom < limits.top) {
                return false;
            }
        // }
        // if (this.renderBottom !== undefined) {
            if (this.top > limits.bottom) {
                return false;
            }
        // }
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

    _render_group(into, after, limits) {
        if (this._svgGroup === null) {
            // Use an SVG group <g> element because its translate can be
            // smoothed with a CSS transition, which a <text> element's x and y
            // attributes cannot. TOTH https://stackoverflow.com/a/53452940
            // Reference:
            // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform

            this._svgGroup = new Piece('g');
        }

        const messageLength = (
            this._message === undefined ? 0 : this._message.length);
        const limitLeft = limits.left + (messageLength * this.spawnMargin);
        const renderLeft = this.left < limitLeft ? limitLeft : this.left;

        const limitTop = limits.top + (messageLength * 5);
        const renderMiddle = (
            this.top < limitTop ? limitTop + this.spawnMargin : this.middle);

        // const renderLeft = this.left;
        // const renderMiddle = this.middle;

        this._svgGroup.node.style.transform = 
            `translate(${renderLeft}px, ${renderMiddle}px)` +
            ` scale(${this._scale}`;
        // console.log(this._svgGroup.node.style.transform);

        // ToDo: Try changing the above to a transform list, see:
        // https://developer.mozilla.org/en-US/docs/Web/API/SVGTransformList

        const parent = this._svgGroup.node.parentElement;
        // if (!parent && (this.renderPiece !== null)) {
        //     this.renderPiece.add_child(this._svgGroup);
        // }
        if (!Object.is(parent, into)) {
            if (after === null) {
                into.append(this._svgGroup.node);
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
            // this._svgGroup.node.insertAdjacentElement(
            //     'beforebegin', this._svgRect.node);

            this._svgRect.node.addEventListener(
                'click', event => console.log('rect', 'click', this, event)
            );
        }

        const trimTop = (
            this.top < limitTop ? limitTop - this.top : 0);
        const trimBottom = (
            this.bottom > limitBottom ? this.bottom - limitBottom : 0);
            this._svgRect.node.classList.toggle(
                'trim-top', trimTop !== 0);
            this._svgRect.node.classList.toggle(
                'trim-bottom', trimBottom !== 0);

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
            // width: this._width > 0 ? this._width + this.excessWidth : 0,
            // x: this.left < limitLeft ? limitLeft : this.left,
            width: this.width > 0 ? width : 0,
            // y: this.top < limitTop ? limitTop : this.top,
            y: drawY, height: drawHeight > 0 ? drawHeight : 0
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

    // arrange_children(left, width) {
    //     const totalWeight = (
    //         this._childWeights === undefined ?
    //         this.childBoxes.length :
    //         this._childWeights.reduce(
    //             (accumulator, weight) => accumulator + weight, 0)
    //     );
    //     const unitHeight = this.height / totalWeight;

    //     let top = this.top;
    //     this.each_childBox((zoomBox, index) => {
    //         const height = this._childWeights[index] * unitHeight;



    //         // Near here, spawn child[index] is it's null but big enough to
    //         // render. Also, despawn if non-null and too small.



    //         zoomBox.set_dimensions(left, width, top + (height / 2), height);
    //         zoomBox.arrange_children();
    //         top += height;
    //     });
    // }

    // child_arrange(actual) {
    //     let totalWeight = 0;
    //     let index = this.children.length;
    //     if (index <= 0) {
    //         return;
    //     }
    //     while(index > 0 && !isNaN(totalWeight)) {
    //         totalWeight += this.get_child_weight(--index);
    //     }

    //     if (isNaN(totalWeight)) {
    //         this._children.forEach(child => {
    //             child.width = this.width - child.left;
    //         });
    //     }
    //     else {
    //         const unitHeight = this.height / totalWeight;

    //         let top = this.height / -2;
    //         const renderTop = (
    //             this.renderTop === undefined ? undefined :
    //             this.renderTop - this.middle
    //         );
    //         const renderBottom = (
    //             this.renderBottom === undefined ? undefined :
    //             this.renderBottom - this.middle
    //         );
    //         this.children.forEach((zoomBox, index) => {
    //             const height = this.get_child_weight(index) * unitHeight;
    //             zoomBox._set_for_render(
    //                 this.width - zoomBox.left, top, height,
    //                 renderTop, renderBottom, actual);
    //             top += height;
    //         });
    //     }
    // }

    holds_origin() {
        // if (!this._should_render()) {
        //     return null;
        // }
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
        if (this.top > 0) { //this.renderOrigin) {
            return 1;
        }
        // If the bottom of the box is above the origin, then the whole box is
        // above the origin.
        // Exactly one of the checks has to be or-equals.
        if (this.bottom <= 0) { //this.renderOrigin) {
            return -1;
        }
        return 0;
    }

    origin_holder() {
        if (this.holds_origin() !== 0) {
            return null;
        }
        let childHolder = null;
        // let offset = 0;
        for(let index = this.childBoxes.length - 1; index >= 0; index--) {
            const zoomBox = this.childBoxes[index];
            if (zoomBox === null) {
                continue;
            }
            const holds = zoomBox.holds_origin();
            if (holds === 0) {
                // [childHolder, offset] = (
                //     this.children[holderIndex].origin_holder());
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
            // [this, 0] :
            // [childHolder, this.middle + offset]);
        // }
        // return [null, undefined];
        // return null;
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