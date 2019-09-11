// (c) 2019 Jim Hawkins. MIT licensed, see https://opensource.org/licenses/MIT

import ZoomBox from "./zoombox.js";

function loggable(num) {
    return num === undefined ? undefined : parseFloat(num.toFixed(2));
}

export default class ZoomBoxPointer extends ZoomBox {
    constructor(texts, pointer) {
        super();
        this._texts = texts;
        this._pointer = pointer;

        this._colour = 'lightyellow';

        this._multiplierUpDown = 0.3;
        this._multiplierLeftRight = 0.1;
        this._multiplierHeight = 0.0005;

        this._scale = 1;

        this._spawn();
    }

    get multiplierUpDown() {
        return this._multiplierUpDown;
    }
    set multiplierUpDown(multiplierUpDown) {
        this._multiplierUpDown = multiplierUpDown;
    }

    _spawn() {
        this._texts.forEach((character, index) => {
            const zoomBox = new ZoomBox(
                index % 2 === 0 ? "lightblue" : "lightgreen", character
            );
            zoomBox.spawnMargin = this.spawnMargin;
            this.children.push(zoomBox);
        });
    }

    // Override.
    render(parentPiece) {
        if (this._svgGroup === undefined) {
            this.reset();
        }

        // Invoke the base class render, which will render all the children.
        super.render(parentPiece);
    }
    reset() {
        this._scale = 1;
        const width = this.width / 6;
        const left = this.width - width;
        this.children.forEach(zoomBox => {
            zoomBox.excessWidth = this.width;
            zoomBox.setDimensions(left, width);
        });
        // This isn't efficient because it makes two passes through the child
        // boxes and renders each three times. Reset is a rare operation so it
        // doesn't matter.
        this.child_arrange();
    }

    // Override.
    zoom() {
        const deltaUpDown = this._pointer.pointerY * this.multiplierUpDown;
        const deltaLeftRight = (
            this._pointer.pointerX * this._multiplierLeftRight);

        const heightZoom = 1 + Math.abs(
            this._pointer.pointerX * this._multiplierHeight);
        const heightMultiplier = (
            this._pointer.pointerX > 0 ? heightZoom : 1 / heightZoom);
        // if (heightMultiplier != 1) {
        //     console.log(heightMultiplier);
        // }

        const thisHeightChangeHalf = (
            ((heightMultiplier * this.height) - this.height) / 2);
        this.setDimensions(
            this.left - deltaLeftRight, undefined,
            (this.top + deltaUpDown) - thisHeightChangeHalf,
            (this.bottom + deltaUpDown) + thisHeightChangeHalf
        );

        this.child_arrange();
    }
}
