// (c) 2019 Jim Hawkins. MIT licensed, see https://opensource.org/licenses/MIT

import ZoomBox from "./zoombox.js";

export default class ZoomBoxPointer extends ZoomBox {
    constructor(texts, pointer) {
        super();
        this._texts = texts;
        this._pointer = pointer;

        this._spawn();
    }

    _spawn() {
        this._texts.forEach((character, index) => {
            const zoomBox = new ZoomBox(
                index % 2 === 0 ? "lightblue" : "lightgreen", character
            );
            this.children.push(zoomBox);
        });
    }

    // Override.
    render(parentPiece) {
        if (this._svgGroup === undefined) {
            let top = this.top / 3;
            const width = this.width / 6;
            const left = this.width - width;
            const height = this.height / (3 * this._children.length);
            this._children.forEach(zoomBox => {
                zoomBox.excessWidth = this.width;
                zoomBox.setDimensions(left, width, top, top + height);
                top += height;
            });
        }

        // Invoke the base class render, which will render all the children.
        super.render(parentPiece);
    }

    zoom() {
        
    }
}
