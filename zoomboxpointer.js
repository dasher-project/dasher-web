// (c) 2019 Jim Hawkins. MIT licensed, see https://opensource.org/licenses/MIT

// ZoomBox subclass in which zooming is controlled by the pointer.

import ZoomBox from "./zoombox.js";

function loggable(num) {
    return num === undefined ? undefined : parseFloat(num.toFixed(2));
}

export default class ZoomBoxPointer extends ZoomBox {
    constructor(childTexts, prefix, pointer, colour, text) {
        super(colour, text);
        this._childTexts = childTexts;
        this._message = prefix + (text === undefined ? "" : text);
        this._pointer = pointer;
        console.log('spawn', this._message);

        // Tunable parameters.  
        // ToDo: Make them be set from the user interface instead.
        this._multiplierUpDown = 0.3;
        this._multiplierLeftRight = 0.3;
        this._multiplierHeight = 0.0015;

        const vowels = ["a", "e", "i", "o", "u"];
        this._childWeights = childTexts.map(text => 
            vowels.includes(text) ? 2 : 1);
        //  Array(childTexts.length).fill(1);
        this._childBoxes = Array(childTexts.length).fill(null);
    }

    get multiplierUpDown() {
        return this._multiplierUpDown;
    }
    set multiplierUpDown(multiplierUpDown) {
        this._multiplierUpDown = multiplierUpDown;
    }

    // Solve application of the right-left dimension of the pointer.
    solve_x_delta(delta, limits) {
        let candidateHolder = this._origin_index();
        let holder;
        let originalHeight;
        let holderHeight;
        let target;

        if (candidateHolder !== -1) {
            // There's a candidate child. Do half the calculation, then make
            // some checks. Consequence of the checks may be to discard the
            // candidate.
            holder = this.childBoxes[candidateHolder];
            originalHeight = holder.height;
            const solved = holder.solve_x_delta(delta, limits);
            holderHeight = solved.height;
            target = solved.target;
            if (holderHeight === originalHeight) {
                console.log('Stationary holder', holder._message);
                candidateHolder = -1;
            }
            else if (solved.left > limits.right) {
                console.log('Off holder', holder._message);
                candidateHolder = -1;
            }
        }

        if (candidateHolder === -1) {
            // No child to consider; solve height for this parent.
            const left = this.left + delta;
            return {
                "left": left, "height": this.solve_height(left, limits),
                "target": this
            };
        }
        else {
            // Solve this box's height from the unitHeight.
            const totalWeight = this._childWeights.reduce(
                (accumulator, weight) => accumulator + weight, 0);
            const unitHeight = (
                holderHeight / this._childWeights[candidateHolder]);
            const height = unitHeight * totalWeight;
            return {
                "left": this.solve_left(height, limits), "height": height,
                "target": target
            };
        }
    }

    // Calculate height, given left position.
    solve_height(left, limits) {
        const index = limits.gradients.findIndex(
            gradient => left < gradient.left);
        
        if (index < 0) {
            return limits.gradients[limits.gradients.length - 1].height;
        }

        const gradient0 = limits.gradients[index === 0 ? 1 : index];
        const gradient1 = limits.gradients[index === 0 ? 0 : index - 1];

        return gradient0.height + (
            ((gradient1.height - gradient0.height) * (gradient0.left - left)) /
            (gradient0.left - gradient1.left)
        )
    }

    // Calculate left position, given height.
    solve_left(height, limits) {
        const index = limits.gradients.findIndex(
            gradient => height > gradient.height);
        
        if (index < 0) {
            return limits.gradients[limits.gradients.length - 1].left;
        }

        const gradient0 = limits.gradients[index === 0 ? 1 : index];
        const gradient1 = limits.gradients[index === 0 ? 0 : index - 1];

        return gradient0.left + (
            (
                (gradient1.left - gradient0.left) *
                (gradient0.height - height)
            ) /
            (gradient0.height - gradient1.height)
        )
    }

    // Cut-down version of zoomBox.origin_holder() that doesn't descend
    // recursively.
    _origin_index() {
        if (this.holds_origin() !== 0) {
            return -1;
        }
        for(let index = this.childBoxes.length - 1; index >= 0; index--) {
            const zoomBox = this.childBoxes[index];
            if (zoomBox === null) {
                continue;
            }
            const holds = zoomBox.holds_origin();
            if (holds === 0) {
                return index;
            }
            if (holds === -1) {
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
        const totalWeight = this._childWeights.reduce(
            (accumulator, weight) => accumulator + weight, 0);
        const unitHeight = this.height / totalWeight;

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
            const childHeight = this._childWeights[index] * unitHeight;
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
                        this._childTexts, this._message, this._pointer,
                        index % 2 === 0 ? "lightblue" : "lightgreen",
                        this._childTexts[index]);
                    this.childBoxes[index].inherit(this);
                }
                const zoomBox = this.childBoxes[index];
        
                const childLeft = this.solve_left(childHeight, limits);
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
        const index = this._origin_index();
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
            const totalWeight = this._childWeights.reduce(
                (accumulator, weight) => accumulator + weight, 0);
            const unitHeight = newHeight / totalWeight;
            const holder = this.childBoxes[index];
            const childHeight = unitHeight * this._childWeights[index];
            holder.zoom_to_height(
                childHeight, this.solve_left(childHeight, limits), limits);

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
    zoom(into, after, limits) {
        // Solve left position and height, based on the pointer X position.
        const deltaLeftRight = (
            this._pointer.pointerX * this._multiplierLeftRight) * -1;
        const {
            left, height, target
        } = this.solve_x_delta(deltaLeftRight, limits);
        if (!Object.is(this, target)) {
            console.log('Solver target', target._message);
        }

        // Set the width, simple.
        this.set_dimensions(undefined, limits.width - left);

        // Zoom to the solved height and left position.
        this.zoom_to_height(height, left, limits)

        // Increment the middle, based on the pointer Y position, and cascade to
        // all child boxes.
        const deltaUpDown = this._pointer.pointerY * this.multiplierUpDown;
        this.adjust_dimensions(undefined,  deltaUpDown, true);

        return super.zoom(into, after, limits);
    }
}
