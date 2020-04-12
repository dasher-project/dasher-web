// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

// Class to represent abstract zoom box.

const emptyChildBoxArray = [];

export default class ZoomBox {
    constructor(template, factory, parentCodePoints, ordinal, childIndex) {
        this._template = template;
        this._factory = factory;
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

        /*
        this._specification = specification;
        this._colour = (
            specification.colour === undefined ? null : specification.colour);
        this._cssClass = (
            specification.cssClass === undefined ? null :
            specification.cssClass);
        this._text = (
            specification.text === undefined ? null : specification.text);
        */
        
        this._weight = template.weight;
        this._spawned = false;

        if (template.cssClass === null) {
            this._childBoxes = emptyChildBoxArray;
        }
        else {
            this._instantiate_child_boxes();
        }
        this._predictorData = undefined;
        this._factoryData = undefined;

        this._left = undefined;
        this._width = undefined;
        this._middle = undefined;
        this._height = undefined;

        this._trimmedIndex = undefined;
        this._trimmedParent = null;

        this._viewer = null;

        

        // this._childSpecifications = [];
        // this._childCount = 0;
        // this._totalWeight = this._childSpecifications.reduce(
        //     (accumulator, specification) => accumulator + specification.weight,
        //     0
        // );
        // this._childBoxes = Array(this._childSpecifications.length).fill(null);


        /*
        this._ready = new Promise((resolve, reject) => {
            this._specification.factory.specify_child_boxes(this)
            .then(specifications => {
                this._set_child_specifications(specifications);
                resolve(true);
            })
            .catch(error => reject(error));
        });
        */
    }

    get spawned() {return this._spawned;}

    async spawn(limits) {
        if (limits === undefined) {
            throw new Error("Limits undefined in spawn().");
        }
        this._instantiate_child_boxes();
        await this._factory.populate(this, limits);
        this._totalWeight = this._childBoxes.reduce(
            (accumulator, child) => accumulator + child.weight, 0);
        this._spawned = true;
        return this.spawned;
    }

    _instantiate_child_boxes() {
        this._childBoxes = this._template.childTemplates.map(
            (template, index) => new ZoomBox(
                template, this._factory, this._messageCodePoints,
                template.codePoint === null ? this._ordinal : this._ordinal + 1,
                index
            )
        );
    }

    // _set_child_specifications(specifications) {
    //     this._childSpecifications = specifications;
    //     // this._childCount = this._childSpecifications.length;
    //     this._totalWeight = this._childSpecifications.reduce(
    //         (accumulator, specification) => accumulator + specification.weight,
    //         0
    //     );

    //     this._childBoxes = Array(this._childSpecifications.length).fill(null);
    //     return true;
    // }

    // get ready() { return this._ready; }
    // get colour() {return this._colour;}
    get cssClass() {return this._cssClass;}
    get text() {return this._template.displayText; } //this._text;}
    get template() {return this._template;}

    get trimmedIndex() {return this._trimmedIndex;}
    set trimmedIndex(trimmedIndex) {this._trimmedIndex = trimmedIndex;}

    get trimmedParent() {return this._trimmedParent;}
    set trimmedParent(trimmedParent) {this._trimmedParent = trimmedParent;}

    get messageCodePoints() {return this._messageCodePoints;}
     //this._specification.message;}
    get message() {return this._message;}

    get childBoxes() {return this._childBoxes;}
    // get childCount() {return this._childCount;}
    // get childSpecifications() {return this._childSpecifications;}

    // get controllerData() {return this._specification.controllerData;}
    get factoryData() {return this._factoryData;}
    set factoryData(factoryData) {this._factoryData = factoryData;}

    get predictorData() {return this._predictorData;}
    set predictorData(predictorData) {this._predictorData = predictorData;}

    get viewer() {return this._viewer;}
    set viewer(viewer) {this._viewer = viewer;}

    get weight() {return this._weight;}
    set weight(weight) {this._weight = weight;}

    // Erase this box from the view, if it has ever been drawn.
    erase() {
        if (this.viewer !== null) {
            this.viewer.erase();
        }
        this._spawned = false;
        this._childBoxes = emptyChildBoxArray;
    }

    child_weight(index) {
        return this._childBoxes[index].weight;
        // this.childSpecifications[index].weight;
    }

    get totalWeight() {
        return this._totalWeight;
    }

    // Invoke the callback on each child box that isn't null.
    // each_childBox(callback) {
    //     this.childBoxes !== undefined && this.childBoxes.forEach(
    //         (child, index) => child !== null && callback(child, index));
    // }

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
        if (!this.spawned) { return null; }

        if (!this.holds(rawX, rawY)) {
            // This box doesn't hold the point, so neither will any of its child
            // boxes.
            return null;
        }

        if (path === undefined) {
            // If the caller didn't specify a path, create a path here. It gets
            // discarded on return but makes the code easier to read.
            path = [];
        }

        // This box holds the point; check its child boxes. The child array is
        // sparse because it doesn't have instances for child boxes that are too
        // small to spawn.
        for(let index = this.childBoxes.length - 1; index >= 0; index--) {
            const child = this.childBoxes[index];
            if (!child.spawned) { continue; }

            // Recursive call.
            const holder = child.holder(rawX, rawY, path);
            if (holder === null) { continue; }

            // If the code reaches here then a child holds the point. Finish
            // here.
            path.unshift(index);
            return holder;
        }

        // If the code reaches here, this box holds the point, and none of its
        // child boxes do.
        path.push(-1);
        return this;
    }

    holds(rawX, rawY) {
        if (this.dimension_undefined() || !this.spawned) {
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
        const rootBox = position === 0;

        if (index === -1) {
            // End of the path; attempt to apply the move here.
            return this._apply_move_here(moveX, moveY, limits, rootBox);
        }

        // Attempt to apply the move to the specified child.
        const target = this.childBoxes[index];
        const applied = target.apply_move(
            moveX, moveY, path, limits, position + 1);
        if (!applied) {
            // If it wasn't applied to a child, attempt to apply here instead.
            return this._apply_move_here(moveX, moveY, limits, rootBox);
        }

        // Now adjust this box so that it is congruent to the new height of the
        // target child. The following must become true:  
        // this.child_weight(index) * unitHeight = target.height  
        // Where:  
        // unitHeight = this.height / this.totalWeight
        // Therefore:
        const height = (
            (target.height / this.child_weight(index)) * this.totalWeight);
        
        // Unless this is the root box and adjusting its size would cause its
        // rect to be erased. In that case, undo the move by arranging the child
        // boxes based on this box's current height and position.
        if (rootBox && height <= limits.drawThresholdRect) {
            console.log('Undo height', height, limits.drawThresholdRect);
            this.arrange_children(limits);
            return false;
        }

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
        return true;
    }

    _apply_move_here(moveX, moveY, limits, rootBox) {
        const movedLeft = this.left + moveX;
        // At any point to the right of the last gradient, the solver will
        // return a minimum height. This has some undesirable side effects.
        // These can be avoided by rejecting the move if it would put this box
        // into that zone.
        if (movedLeft >= limits.solverRight) {
            if (rootBox) {
                console.log('AMH left', movedLeft, limits.solverRight);
            }
            return false;
        }

        const solvedHeight = limits.solve_height(movedLeft);
        // The root box shouldn't ever have its rect erased. If this move is
        // being applied to the root box, and would result in erasure, reject
        // the move.
        if (rootBox && solvedHeight <= limits.drawThresholdRect) {
            console.log('AMH height', solvedHeight, limits.drawThresholdRect);
            return false;
        }

        this.left = movedLeft;
        this.width = limits.width - this.left;
        this.height = solvedHeight;
        this.middle += moveY;
        this.arrange_children(limits);
        return true;
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

            const childBox = this.childBoxes[index];
            if (shouldSpawn) {
                // if (this.childBoxes[index] === null) {
                //     this.childBoxes[index] = new ZoomBox(
                //         this.childSpecifications[index]);
                // }
                // const zoomBox = this.childBoxes[index];
        
                const childLeft = limits.solve_left(childHeight);
                const childWidth = limits.width - childLeft;
    
                childBox.set_dimensions(
                    childLeft, childWidth,
                    childBottom - (childHeight / 2), childHeight);
                
                if (childBox.spawned) {
                    childBox.arrange_children(limits);
                }
                else {
                    // Spawn is async but we don't care here.
                    childBox.spawn(limits);
                }
            }
            else {
                childBox.erase();
                // if (this.childBoxes[index] !== null) {
                //     // console.log(
                //     //     `Arrange spawn "${this.childBoxes[index].message}".`
                //     // );
                //     this.childBoxes[index].erase();
                //     this.childBoxes[index] = null;
                // }
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
        this._childBoxes = emptyChildBoxArray; // [rootIndex] = null;




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
        for(let index = this.childBoxes.length - 1; index >= 0; index--) {
            if (!this.childBoxes[index].spawned) {
                continue;
            }

            if (candidate === undefined) {
                candidate = index;
            }
            else {
                // Second spawned child box; don't trim.
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

        parent.spawn(limits);
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
