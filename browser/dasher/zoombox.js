// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

// Class to represent abstract zoom box.

export default class ZoomBox {
    constructor(specification) {

        this._specification = specification;
        this._colour = (
            specification.colour === undefined ? null : specification.colour);
        this._text = (
            specification.text === undefined ? null : specification.text);
        this._prediction = (
            specification.prediction === undefined ? null :
            specification.prediction);
        
        this._message = (
            this.messageCodePoints === undefined ? undefined :
            String.fromCodePoint(...this.messageCodePoints));

        this._left = undefined;
        this._width = undefined;
        this._middle = undefined;
        this._height = undefined;

        this._trimmedIndex = undefined;
        this._trimmedParent = null;

        this._spawnMargin = undefined;

        this._controllerSettings = specification.controllerSettings;
        this._viewer = null;
        
        this._childSpecifications = [];
        this._childCount = 0;
        this._totalWeight = this._childSpecifications.reduce(
            (accumulator, specification) => accumulator + specification.weight,
            0
        );
        this._childBoxes = Array(this._childSpecifications.length).fill(null);
        
        this._ready = new Promise((resolve, reject) => {
            const spawner = this._specification.spawner;
            if (spawner === null) {
                resolve(true);
            }
            else {
                spawner.child_specifications(this)
                .then(specifications => {
                    this._set_child_specifications(specifications);
                    resolve(true);
                })
                .catch(error => reject(error));
            }
        });
    }

    _set_child_specifications(specifications) {
        this._childSpecifications = specifications;
        this._childCount = this._childSpecifications.length;
        this._totalWeight = this._childSpecifications.reduce(
            (accumulator, specification) => accumulator + specification.weight,
            0
        );

        this._childBoxes = Array(this._childSpecifications.length).fill(null);
        return true;
    }

    get ready() { return this._ready; }
    get colour() {return this._colour;}
    get text() {return this._text;}
    get prediction() {return this._prediction;}

    get trimmedIndex() {return this._trimmedIndex;}
    set trimmedIndex(trimmedIndex) {this._trimmedIndex = trimmedIndex;}

    get trimmedParent() {return this._trimmedParent;}
    set trimmedParent(trimmedParent) {this._trimmedParent = trimmedParent;}

    get messageCodePoints() {return this._specification.message;}
    get message() {return this._message;}

    get childBoxes() {return this._childBoxes;}
    get childCount() {return this._childCount;}
    get childSpecifications() {return this._childSpecifications;}
    get controllerSettings() {return this._controllerSettings;}

    get viewer() {return this._viewer;}
    set viewer(viewer) {this._viewer = viewer;}

    // Erase this box from the view, if it has ever been drawn.
    erase() {
        if (this.viewer !== null) {
            this.viewer.erase();
        }
    }

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

    /*


    Moved to the limits object.

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
    */

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

    update() {
    }

    inherit(parent) {
        [
            "spawnMargin" //, "renderHeightThreshold"
        ].forEach(attribute => this[attribute] = parent[attribute]);
    }

    dimension_undefined() {
        return (
            this.left === undefined || this.width === undefined ||
            this.middle === undefined || this.height === undefined
        );
    }

    /* Returns the leafiest child of this box that holds the specified point, or
     * null if this box doesn't hold the point. If a `path` is passed, it will
     * be populated with a list of the child index values used to reach the
     * holder, and a -1 terminator.
     */
    holder(rawX, rawY, path) {
        if (path === undefined) {
            // If the caller didn't specify a path, create a path here. It gets
            // discarded on return but makes the code easier to read.
            path = [];
        }

        if (!this.holds(rawX, rawY)) {
            // This box doesn't hold the point, so neither will any of its child
            // boxes.
            return null;
        }

        // This box holds the point; check its child boxes. The child array is
        // sparse because it doesn't have instances for child boxes that are too
        // small to spawn.
        for(let index = this.childCount - 1; index >= 0; index--) {
            const child = this.childBoxes[index];
            if (child === null) { continue; }

            // Recursive call.
            const holder = child.holder(rawX, rawY, path);
            if (holder === null) { continue; }

            // If the code reaches here then a child holds the point, or
            // returned `undefined`. Either way, finish here.
            path.unshift(index);
            return holder;
        }

        // If the code reaches here, this box holds the point, and none of its
        // child boxes do.
        path.push(-1);
        return this;
    }

    holds(rawX, rawY) {
        if (this.dimension_undefined()) {
            return undefined;
        }

        // Box top and bottom are measured from the top of the window. This
        // means that negative numbers represent points above the origin.
        const negativeY = 0 - rawY;
        return (
            rawX >= this.left && rawX <= this.right &&
            negativeY >= this.top && negativeY <= this.bottom
        );
    }

    apply_move(moveX, moveY, path, limits, position) {
        if (position === undefined) {
            position = 0;
        }
        const index = path[position];

        if (index === -1) {
            // Apply the move here.
            this.left += moveX;
            this.width = limits.width - this.left;
            this.height = limits.solve_height(this.left);
            this.middle += moveY;
            this.arrange_children(limits);
            return;
        }

        // Apply the move to the specified child.
        const target = this.childBoxes[index];
        target.apply_move(moveX, moveY, path, limits, position + 1);
        //
        // Now adjust this box so that it is congruent to the new height of the
        // target child. The following must become true:  
        // this.child_weight(index) * unitHeight = target.height  
        // Where:  
        // unitHeight = this.height / this.totalWeight
        // Therefore:
        const height = (
            (target.height / this.child_weight(index)) * this.totalWeight);
        this.height = height;
        //
        // Arrange the child boxes, in two parts. First, push up everything
        // above the target. Second, push down everything below the target.
        const top = this.arrange_children(limits, true, index);
        this.arrange_children(limits, false, index);
        //
        // Finalise the adjustment to this box.
        this.left = limits.solve_left(height);
        this.width = limits.width - this.left;
        this.middle = top + (height / 2);
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
                limits.spawnThreshold === undefined ||
                childHeight >= limits.spawnThreshold) &&
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
                    // console.log(
                    //     `Arrange spawn "${this.childBoxes[index].message}".`
                    // );
                    this.childBoxes[index].erase();
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
