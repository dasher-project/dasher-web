// (c) 2019 Jim Hawkins. MIT licensed, see https://opensource.org/licenses/MIT

const _vowels = ["a", "e", "i", "o", "u"];

export default class ControllerPointer {
    constructor(pointer, texts) {
        this._pointer = pointer;
        this._texts = texts;

        this._rootSpecification = {spawner:this, colour:"silver", message:""};
    }

    get rootSpecification() {return this._rootSpecification;}

    child_specifications(zoomBox) {
        return this._texts.map((character, index) => {
            return {
                colour: index % 2 === 0 ? "lightblue" : "lightgreen",
                text: character,
                message: zoomBox.message + character,
                weight: _vowels.includes(character) ? 2 : 1,
                spawner: this
            };
        });
    }

    populate(rootBox, limits) {
        rootBox.arrange_children(limits);
    }

    control(rootBox, limits) {
        if (!this._pointer.going) {
            return;
        }

        // Solve left position and height, based on the pointer X position.
        const {
            left, height, target
        } = rootBox.solve_x_move(0 - this._pointer.x, limits);
        if (!Object.is(rootBox, target)) {
            console.log('Solver target', target.message);
        }
        
        // Set the width, simple.
        rootBox.set_dimensions(undefined, limits.width - left);
        
        // Zoom to the solved height and left position.
        rootBox.zoom_to_height(height, left, limits)

        // Increment the middle, based on the pointer Y position, and cascade to
        // all child boxes.
        rootBox.adjust_dimensions(undefined, this._pointer.y, true);
    }        

}