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


        const vowels = ["a", "e", "i", "o", "u"];
        this.childWeights = childTexts.map(text => 
            vowels.includes(text) ? 2 : 1);
        //  Array(childTexts.length).fill(1);
        this._childBoxes = Array(childTexts.length).fill(null);
    }



    // Override.
    render(into, after, limits, level) {
        // let rootIndex = -1;
        // let insertParent = false;
        
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

            // rootIndex = this._trimmed_root_index(limits);
            // insertParent = (level === 0 && this._should_insert_parent(limits));

            // const originHolder = this.origin_holder();
            // this.manager.message = (
            //     originHolder === null ? undefined : originHolder.message);
        }

        // const baseReturn = super.render(into, after, limits, level);

        // if (insertParent) {
        //     return this._insert_parent(limits);
        // }

        // if (rootIndex === -1) {
        //     return baseReturn;
        // }

        // // If the code reaches this point then there is a new root box. This box
        // // is about to be derendered. The new root is a child of this box and
        // // would also get derendered, so detach it here.
        // const trimmedRoot = this.childBoxes[rootIndex];
        // this.childBoxes[rootIndex] = null;
        // //
        // // Later, the user might backspace and this box would need to be
        // // inserted back, as a parent of the new root. Set a reference and some
        // // values into the new root to make that possible.
        // trimmedRoot.trimmedParent = this;
        // trimmedRoot.trimmedIndex = rootIndex;
        // //
        // // Hand over the controller and manager.
        // trimmedRoot.controller = this.controller;
        // this.controller = null;
        // trimmedRoot.manager = this.manager;
        // this.manager = null;
        // //
        // // Finally, derender this box and return the new root box.
        // this.render(null);

        // return trimmedRoot;
    }


}
