// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

// Class to represent abstract zoom box.

export default class ZoomBox {
    constructor(template, parentCodePoints, ordinal, childIndex) {
        this._template = template;
        this._messageCodePoints = parentCodePoints.slice();
        this._ordinal = ordinal;
        this._childIndex = childIndex;

        if (template.codePoint !== null) {
            this._messageCodePoints.push(template.codePoint);
        }
        this._cssClass = (
            template.cssClass === null ?
            template.palette.sequence_CSS(ordinal, childIndex) :
            template.cssClass);


        this._message = (
            this.messageCodePoints === undefined ? undefined :
            String.fromCodePoint(...this.messageCodePoints));

        this._childBoxes = undefined;
        this._controllerData = undefined;

        this._left = undefined;
        this._width = undefined;
        this._middle = undefined;
        this._height = undefined;

        this._trimmedIndex = undefined;
        this._trimmedParent = null;

        this._viewer = null;
    }

    instantiate_child_boxes(configure) {
        if (this._childBoxes === undefined) {
            this._childBoxes = this._template.childTemplates.map(
                (template, index) => new ZoomBox(
                    template, this._messageCodePoints,
                    template.codePoint === null ?
                    this._ordinal :
                    this._ordinal + 1,
                    index
                )
            );
            this._childBoxes.forEach(childBox => {
                configure(childBox);
                if (childBox.template.cssClass !== null) {
                    childBox.instantiate_child_boxes(configure);
                }
            });

            return true;
        }

        return false;
    }

    get cssClass() {return this._cssClass;}
    get text() {return this._template.displayText; } //this._text;}
    get template() {return this._template;}

    get trimmedIndex() {return this._trimmedIndex;}
    set trimmedIndex(trimmedIndex) {this._trimmedIndex = trimmedIndex;}

    get trimmedParent() {return this._trimmedParent;}
    set trimmedParent(trimmedParent) {this._trimmedParent = trimmedParent;}

    get messageCodePoints() {return this._messageCodePoints;}
    get message() {return this._message;}

    get childBoxes() {return this._childBoxes;}
    clear_child_boxes() {this._childBoxes = undefined;}

    get controllerData() {return this._controllerData;}
    set controllerData(controllerData) {this._controllerData = controllerData;}

    get viewer() {return this._viewer;}
    set viewer(viewer) {this._viewer = viewer;}

    // Erase this box from the view, if it has ever been drawn. Note that child
    // boxes are left in place.
    erase() {
        // console.log(`erase() "${this.cssClass} "${this.message}"`);
        if (this.viewer !== null) {
            // Next line cascades to erase all child boxes.
            this.viewer.erase();
        }
        this._left = undefined;
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

    update() {
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
        // if (!this.spawned) { return null; }

        if (!this.holds(rawX, rawY)) {
            // This box doesn't hold the point, so neither will any of its child
            // boxes. The holds() method can return undefined, which this method
            // treats as `false`.
            return null;
        }

        if (path === undefined) {
            // If the caller didn't specify a path, create a path here. It gets
            // discarded on return but makes the code easier to read.
            path = [];
        }

        // This box holds the point; check its child boxes.  
        // The child array isn't sparse now, although it was in earlier
        // versions.
        for(let index = this.childBoxes.length - 1; index >= 0; index--) {
            const child = this.childBoxes[index];

            // Recursive call.
            const holder = child.holder(rawX, rawY, path);
            // If any child dimension is undefined, holder() will return null.
            if (holder === null) { continue; }

            // If the code reaches here then a child holds the point. Finish
            // here.  
            // The recursive call to holder() will have push'd the -1
            // terminator.
            path.unshift(index);
            return holder;
        }

        // If the code reaches here, this box holds the point, and none of its
        // child boxes do. Push the terminator and return.
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

    // If a child of this box should now be the new root box, then set it up and
    // return the new root box. Otherwise return null.
    child_root(limits) {
        const rootIndex = this._trimmed_root_index(limits);
        if (rootIndex === -1) {
            return null;
        }

        // If the code reaches this point then there is a new root box. This box
        // is about to be erased. The new root is a child of this box and would
        // also get erased, so save it here and replace it in the child box
        // array with a dummy.
        const trimmedRoot = this.childBoxes[rootIndex];
        this.childBoxes[rootIndex] = {erase:() => {
            return;
        }};

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

        // If there is exactly one child box with defined dimensions, it could
        // be the trimmed root. A child box will have undefined dimensions if it
        // wasn't ever rendered, or if it went off limits and was erased.
        let candidate;
        for(let index = this.childBoxes.length - 1; index >= 0; index--) {
            if (this.childBoxes[index].dimension_undefined()) {
                continue;
            }

            if (candidate === undefined) {
                candidate = index;
            }
            else {
                // If the code reaches this point then two candidates have been
                // found. The condition for trimming is that there is exactly
                // one candidate, so getting here means we can't trim.
                return -1;
            }
        }
        
        if (candidate === undefined) {
            // Zero child boxes with defined dimensions; can't trim.
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

        // If there isn't a trimmed parent, root box shouldn't change.
        if (parent === null) {
            return null;
        }

        // If there isn't any space around this box, root box shouldn't change.
        // It only matters if there is no space above if this isn't the first
        // child box. Vice versa, it only matters if there is no space below if
        // this isn't the last child box.
        if (!(
            this.left > limits.left ||
            (
                this.bottom < limits.bottom &&
                this.trimmedIndex < parent.childBoxes.length - 1
            ) ||
            (
                this.top > limits.top &&
                this.trimmedIndex > 0
            )
        )) {
            return null;
        }

        // console.log(
        //     parent.childBoxes[this.trimmedIndex], this.left > limits.left,
        //     this.bottom < limits.bottom, this.top > limits.top);

        parent.childBoxes[this.trimmedIndex] = this;

        return parent;
    }
}
