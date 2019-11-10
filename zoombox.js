// (c) 2019 Jim Hawkins. MIT licensed, see https://opensource.org/licenses/MIT

// Zoom Box base class.

import Piece from "./piece.js";

export default class ZoomBox {
    constructor(specification) {

        this._specification = specification;
        this._colour = (
            specification.colour === undefined ? null : specification.colour);
        this._text = (
            specification.text === undefined ? null : specification.text);

        this._left = undefined;
        this._width = undefined;
        this._middle = undefined;
        this._height = undefined;

        this._trimmedIndex = undefined;
        this._trimmedParent = null;

        this._spawnMargin = undefined;

        this._derender();

        this._renderHeightThreshold = undefined;

        this._controllerSettings = specification.controllerSettings;

        this._childSpecifications = (
            this._specification.spawner ?
            this._specification.spawner.child_specifications(this) :
            []
        );
        this._childCount = this._childSpecifications.length;
        this._totalWeight = this._childSpecifications.reduce(
            (accumulator, specification) => accumulator + specification.weight,
            0
        );

        // childBoxes is a sparse array.
        this._childBoxes = Array(this._childSpecifications.length).fill(null);
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

    get trimmedIndex() {return this._trimmedIndex;}
    set trimmedIndex(trimmedIndex) {this._trimmedIndex = trimmedIndex;}

    get trimmedParent() {return this._trimmedParent;}
    set trimmedParent(trimmedParent) {this._trimmedParent = trimmedParent;}

    get message() {return this._specification.message;}

    get childBoxes() {return this._childBoxes;}
    get childCount() {return this._childCount;}
    get childSpecifications() {return this._childSpecifications;}
    get controllerSettings() {return this._controllerSettings;}

    child_weight(index) {
        return this.childSpecifications[index].weight;
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

    get right() {
        if (this.left === undefined || this.width === undefined) {
            return undefined;
        }
        return this.left + this.width;
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
            "spawnMargin", "renderHeightThreshold"
        ].forEach(attribute => this[attribute] = parent[attribute]);
    }

    render(into, after, limits, level) {
        if (this._should_render(into, limits)) {
            this._render_group(into, after, limits, level);
            this.each_childBox(child =>
                child.render(into, this._svgGroup.node, limits, level + 1));
        }
        else {
            if (this._svgGroup !== null) {
                this._svgGroup.remove();
                console.log('derender', this.message);
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
        const limitLeft = limits.left + (level * margin);
        const renderLeft = this.left < limitLeft ? limitLeft : this.left;

        const limitTop = limits.top + (margin === 0 ? 0 : level * 5);
        const renderMiddle = (
            this.top < limitTop ? limitTop + margin : this.middle);
        
        this._svgGroup.node.style.transform = 
            `translate(${renderLeft}px, ${renderMiddle}px)`;
        // ToDo: Try changing the above to a transform list, see:
        // https://developer.mozilla.org/en-US/docs/Web/API/SVGTransformList

        // if (renderMiddle !== this.middle) {
        //     console.log(
        //         this.message, renderMiddle, limitTop, margin, limits.top);
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
                'drawHeight', this.message, drawHeight, trimTop, trimBottom);
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

    // Solve application of a right-left movement.
    solve_x_move(delta, limits) {
        let candidateIndex = this.y_origin_index();
        let solvedHeight;
        let target;

        if (candidateIndex !== -1) {
            // There's a candidate child. Do half the calculation, then make
            // some checks. Consequence of the checks may be to discard the
            // candidate.
            const candidate = this.childBoxes[candidateIndex];
            const originalHeight = candidate.height;
            const solved = candidate.solve_x_move(delta, limits);
            solvedHeight = solved.height;
            target = solved.target;
            if (solvedHeight === originalHeight) {
                console.log('Stationary holder', candidate.message);
                candidateIndex = -1;
            }
            else if (solved.left > limits.right) {
                console.log('Off holder', candidate.message);
                candidateIndex = -1;
            }
        }

        if (candidateIndex === -1) {
            // No child to consider; solve height for this parent.
            const left = this.left + delta;
            return {
                "left": left, "height": limits.solve_height(left),
                "target": this
            };
        }
        else {
            // Solve this box's height from the unitHeight.
            const unitHeight = solvedHeight / this.child_weight(candidateIndex);
            const height = unitHeight * this.totalWeight;
            return {
                "left": limits.solve_left(height), "height": height,
                "target": target
            };
        }
    }

    // Returns a value indicating the vertical position of this box in relation
    // to the origin.
    //
    // -   null if any properties involved in the determination aren't defined.
    // -   0 if this box is across the origin.
    // -   1 if this box is below the origin.
    // -   -1 if this box is above the origin.
    across_y_origin() {
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
        if (this.across_y_origin() !== 0 || this.left > 0 || this.right <= 0) {
            return null;
        }
        let childHolder = null;
        for(let index = this.childBoxes.length - 1; index >= 0; index--) {
            const zoomBox = this.childBoxes[index];
            if (zoomBox === null) {
                continue;
            }
            const across = zoomBox.across_y_origin();
            if (across === 0 && zoomBox.left <= 0 && zoomBox.right > 0) {
                childHolder = zoomBox.origin_holder();
                break;
            }
            if (across === -1) {
                // Found a child above the origin. All remaining child boxes
                // will be above this one, so stop checking.
                break;
            }
        }
        return childHolder === null ? this : childHolder;
    }

    // Returns the index of the immediate child box that is across the Y origin,
    // if there is one, or -1 otherwise. Doesn't descend recursively into child
    // boxes.
    y_origin_index() {
        if (this.across_y_origin() !== 0) {
            return -1;
        }
        for(let index = this.childBoxes.length - 1; index >= 0; index--) {
            const zoomBox = this.childBoxes[index];
            if (zoomBox === null) {
                continue;
            }
            const across = zoomBox.across_y_origin();
            if (across === 0) {
                return index;
            }
            if (across === -1) {
                // Found a child above the origin. All remaining child boxes
                // will be above this one, so stop checking.
                return -1;
            }
        }
        // Didn't find any child that holds the origin.
        return -1;
    }

    // Arrange some or all child boxes. There are three procedures, selected by
    // the `up` parameter:
    //
    // -   up:undefined  
    //     Assume this box already has its top set and arrange child boxes to
    //     occupy it.
    // -   up:true  
    //     Arrange all the child boxes above an initialiser specified by its
    //     index. Assume that the initialiser has its top set.
    // -   up:false  
    //     Arrange all the child boxes below an initialiser specified by its
    //     index. Assume that the initialiser has its bottom set.
    //
    // Returns the bottom or top value of the last child arranged.
    arrange_children(limits, up, initialiser) {
        const unitHeight = this.height / this.totalWeight;

        let childTop;
        let childBottom;
        if (up === undefined) {
            childTop = this.top;
            initialiser = -1;
            up = false;
        }
        else if (up) {
            childBottom = this._childBoxes[initialiser].top;
        }
        else {
            childTop = this._childBoxes[initialiser].bottom;
        }
        const direction = (up ? -1 : 1)

        const childLength = this.childBoxes.length;
        for(
            let index = initialiser + direction;
            index >= 0 && index < childLength;
            index += direction
        ) {
            const childHeight = this.child_weight(index) * unitHeight;
            if (up) {
                childTop = childBottom - childHeight;
            }
            else {
                childBottom = childTop + childHeight;
            }

            const shouldSpawn = (
                this.renderHeightThreshold === undefined ||
                childHeight >= this.renderHeightThreshold) &&
                childBottom > limits.top && childTop < limits.bottom;

            if (shouldSpawn) {
                if (this.childBoxes[index] === null) {
                    this.childBoxes[index] = new ZoomBox(
                        this.childSpecifications[index]);
                    this.childBoxes[index].inherit(this);
                }
                const zoomBox = this.childBoxes[index];
        
                const childLeft = limits.solve_left(childHeight);
                const childWidth = limits.width - childLeft;
    
                zoomBox.set_dimensions(
                    childLeft, childWidth,
                    childBottom - (childHeight / 2), childHeight);
                zoomBox.arrange_children(limits);
            }
            else {
                if (this.childBoxes[index] !== null) {
                    this.childBoxes[index].render(null);
                    this.childBoxes[index] = null;
                }
            }

            if (up) {
                childBottom -= childHeight;
            }
            else {
                childTop += childHeight;
            }
        }
        return up ? childBottom : childTop;
    }

    // Zoom this box to a specified new height, as follows.
    //
    // If this box has a child box that is across the origin, recursively call
    // its zoom_to_height, then shuffle all the other child boxes in this box,
    // then set this box to hold all its child boxes.  
    // Otherwise, move this box up or down, if it isn't across the origin, set
    // its height, then arrange its child boxes.
    //
    // The array of child boxes is sparse, so the origin might be in between two
    // child boxes, if the intervening child boxes are currently too small to
    // render.
    zoom_to_height(newHeight, left, limits) {
        const index = this.y_origin_index();
        if (index === -1) {
            const halfHeightChange = (newHeight - this.height) / 2;
            if (this.top > 0) {
                this.middle += halfHeightChange;
            }
            // If the bottom of the box is above the origin, then the whole box
            // is above the origin.
            // Exactly one of the checks has to be or-equals.
            if (this.bottom <= 0) {
                this.middle -= halfHeightChange;
            }
            this.height = newHeight;
            this.left = left;
            this.width = limits.width - left;
            this.arrange_children(limits)
        }
        else {
            const unitHeight = newHeight / this.totalWeight;
            const holder = this.childBoxes[index];
            const childHeight = unitHeight * this.child_weight(index);
            holder.zoom_to_height(
                childHeight, limits.solve_left(childHeight), limits);

            this.height = newHeight;
            this.left = left;
            this.width = limits.width - left;

            // push up everything above the holder; push down everything below
            // the holder.
            const top = this.arrange_children(limits, true, index);
            this.arrange_children(limits, false, index);
            this.middle = top + (newHeight / 2);
        }

    }

    get spawnMargin() {
        return this._spawnMargin;
    }
    set spawnMargin(spawnMargin) {
        this._spawnMargin = spawnMargin;
        this.each_childBox(child => child.spawnMargin = spawnMargin);
    }

    // If a child of this box should now be the new root box, then set it up and
    // return the new root box. Otherwise return null.
    child_root(limits) {
        const rootIndex = this._trimmed_root_index(limits);
        if (rootIndex === -1) {
            return null;
        }

        // If the code reaches this point then there is a new root box. This box
        // is about to be derendered. The new root is a child of this box and
        // would also get derendered, so detach it here.
        const trimmedRoot = this.childBoxes[rootIndex];
        this.childBoxes[rootIndex] = null;
        //
        // Later, the user might backspace and this box would need to be
        // inserted back, as a parent of the new root. Set a reference and some
        // values into the new root to make that possible.
        trimmedRoot.trimmedParent = this;
        trimmedRoot.trimmedIndex = rootIndex;

        return trimmedRoot;
    }

    _trimmed_root_index(limits) {
        if (this.left > limits.left) {
            // This box is still inside the window; don't trim.
            return -1;
        }

        // If there is exactly one non-null child box, it could be the trimmed
        // root. A child box will be null if it wasn't ever rendered, or if it
        // went off limits and was derendered.
        let candidate;
        for(let index = this.childCount - 1; index >= 0; index--) {
            if (this.childBoxes[index] === null) {
                continue;
            }

            if (candidate === undefined) {
                candidate = index;
            }
            else {
                // Second non-null child box; don't trim.
                return -1;
            }
        }
        
        if (candidate === undefined) {
            // Zero non-null child boxes; can't trim.
            return -1;
        }

        if (this.childBoxes[candidate].left > limits.left) {
            // The candidate box isn't at the edge of the window; don't trim.
            return -1;
        }

        return candidate;
    }

    // If the trimmed parent of this box should now be the new root box then set
    // it up and return the new root box. Otherwise return null.
    parent_root(limits) {
        const parent = this.trimmedParent;
        // If there isn't a trimmed parent, or there isn't any space around this
        // box, root box shouldn't change.
        if (
            parent === null || !(
                this.left > limits.left ||
                this.bottom < limits.bottom ||
                this.top > limits.top
            )
        ) {
            return null;
        }

        const index = this.trimmedIndex;

        // Put this box in as a child box of the parent.
        parent.childBoxes[index] = this;

        // Next segment of code arranges the parent in such a way that this box
        // doesn't move.
        //
        // Calculate the parent height from the height of this box, via the
        // parent unitHeight. Then solve the left position of the parent from
        // its height. Set width as usual.
        const unitHeight = this.height / parent.child_weight(index);
        const height = unitHeight * parent.totalWeight;
        const left = limits.solve_left(height);
        const width = limits.width - left;
        parent.set_dimensions(left, width, undefined, height);
        //
        // Now calculate the top of the parent by adding the tops of all the
        // child boxes above this one. They will all be null but won't have zero
        // weight. Fortunately, the same calculation is required by another
        // method, so call it here.
        const top = parent.arrange_children(limits, true, index);
        parent.middle = top + (height / 2);
        //
        // Reset the parent insertion parameters.
        this.trimmedParent = null;
        this.trimmedIndex = undefined;

        return parent;
    }
}