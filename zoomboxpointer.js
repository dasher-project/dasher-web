// (c) 2019 Jim Hawkins. MIT licensed, see https://opensource.org/licenses/MIT

// ZoomBox subclass in which zooming can be controlled by a pointer.

import ZoomBox from "./zoombox.js";

function loggable(num) {
    return num === undefined ? undefined : parseFloat(num.toFixed(2));
}

export default class ZoomBoxPointer extends ZoomBox {
    constructor(childTexts, prefix, colour, text) {
        super(colour, text);
        this._childTexts = childTexts;
        this._message = prefix + (text === undefined ? "" : text);
        console.log(`spawn "${this.message}".`);

        this._trimmedIndex = undefined;
        this._trimmedParent = null;

        const vowels = ["a", "e", "i", "o", "u"];
        this.childWeights = childTexts.map(text => 
            vowels.includes(text) ? 2 : 1);
        //  Array(childTexts.length).fill(1);
        this._childBoxes = Array(childTexts.length).fill(null);
    }

    get trimmedIndex() {return this._trimmedIndex;}
    set trimmedIndex(trimmedIndex) {this._trimmedIndex = trimmedIndex;}

    get trimmedParent() {return this._trimmedParent;}
    set trimmedParent(trimmedParent) {this._trimmedParent = trimmedParent;}

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
            const childHeight = this.childWeights[index] * unitHeight;
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
                    this.childBoxes[index] = new ZoomBoxPointer(
                        this._childTexts, this.message,
                        index % 2 === 0 ? "lightblue" : "lightgreen",
                        this._childTexts[index]);
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
            const childHeight = unitHeight * this.childWeights[index];
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

    // Override.
    render(into, after, limits, level) {
        let rootIndex = -1;
        let insertParent = false;
        
        // If there's a controller and it isn't at the rest position, do the
        // zooming. Only the current root will have a controller; child boxes
        // don't get the controller.
        if (
            into !== null && this.controller !== null && this.controller.going
        ) {
            // Solve left position and height, based on the pointer X position.
            const deltaLeftRight = 0 - this.controller.x;
            const {
                left, height, target
            } = this.solve_x_move(deltaLeftRight, limits);
            if (!Object.is(this, target)) {
                console.log('Solver target', target.message);
            }

            // Set the width, simple.
            this.set_dimensions(undefined, limits.width - left);

            // Zoom to the solved height and left position.
            this.zoom_to_height(height, left, limits)

            // Increment the middle, based on the pointer Y position, and
            // cascade to all child boxes.
            const deltaUpDown = this.controller.y;
            this.adjust_dimensions(undefined, deltaUpDown, true);

            rootIndex = this._trimmed_root_index(limits);
            insertParent = (level === 0 && this._should_insert_parent(limits));

            const originHolder = this.origin_holder();
            this.manager.message = (
                originHolder === null ? undefined : originHolder.message);
        }

        const baseReturn = super.render(into, after, limits, level);

        if (insertParent) {
            return this._insert_parent(limits);
        }

        if (rootIndex === -1) {
            return baseReturn;
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
        //
        // Hand over the controller and manager.
        trimmedRoot.controller = this.controller;
        this.controller = null;
        trimmedRoot.manager = this.manager;
        this.manager = null;
        //
        // Finally, derender this box and return the new root box.
        this.render(null);

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
        for(let index = this.childBoxes.length - 1; index >= 0; index--) {
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

    _should_insert_parent(limits) {
        // Parent should be inserted if there is one, and if there is any space
        // around this box.
        return this.trimmedParent !== null && (
            this.left > limits.left ||
            this.bottom < limits.bottom ||
            this.top > limits.top
        );
    }

    _insert_parent(limits) {
        const parent = this.trimmedParent;
        const index = this.trimmedIndex;

        // Put this box in as a child box of the parent.
        parent.childBoxes[index] = this;

        // Next segment of code arranges the parent in such a way that this box
        // doesn't move.
        //
        // Calculate the parent height from the height of this box, via the
        // parent unitHeight. Then solve the left position of the parent from
        // its height. Set width as usual.
        const unitHeight = this.height / parent.childWeights[index];
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
        // Hand back the controller.
        parent.controller = this.controller;
        this.controller = null;
        parent.manager = this.manager;
        this.manager = null;
        //
        // Reset the parent insertion parameters.
        this.trimmedParent = null;
        this.trimmedIndex = undefined;

        return parent;
    }

}
