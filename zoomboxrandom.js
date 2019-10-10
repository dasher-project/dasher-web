// (c) 2019 Jim Hawkins. MIT licensed, see https://opensource.org/licenses/MIT

// ZoomBox class in which child boxes change left position and height at random.

import ZoomBox from "./zoombox.js";

export default class ZoomBoxRandom extends ZoomBox {
    constructor(texts) {
        super();
        this._texts = texts;
    }

    spawn() {
        if (this._childBoxes !== undefined) {
            return false;
        }

        this._rectHeight = (this.height / this._texts.length) * 0.75;

        let top = this.top;
        const width = this._rectHeight * 2;
        const left = (this.left + this.width) - width;
        this._childBoxes = this._texts.map((character, index) => {
            const zoomBox = new ZoomBox(
                index % 2 === 0 ? "lightblue" : "lightgreen", character
            );
            zoomBox.xChange = 1 - ((index % 2) * 2);
            zoomBox.yChange = zoomBox.xChange;
            zoomBox.inherit(this);
            zoomBox.set_dimensions(
                left, width, top + (this._rectHeight / 2), this._rectHeight
            );
            top += this._rectHeight;

            return zoomBox;
        });
        return true;
    }

    // Override.
    zoom(into, after, limits) {
        this.spawn();

        const heightMin = this._rectHeight * 0.75;
        const heightMax = this._rectHeight * 1.75;
        const widthMin = this._rectHeight * 2;
        const widthMax = this.width;
        let top = this.top;
        this.each_childBox(zoomBox => {
            const xDelta = (50 + Math.random() * 250) * zoomBox.xChange;
            const yDelta = heightMin * Math.random() * zoomBox.yChange;
            let left;
            let width = zoomBox.width + xDelta;
            if (
                (width < widthMin && zoomBox.xChange < 0) ||
                (width > widthMax && zoomBox.xChange > 0)
            ) {
                // Reverse direction; don't move.
                zoomBox.xChange *= -1;
                width = undefined;
            }
            else {
                left = (this.left + this.width) - width;
            }

            let height = zoomBox.height;
            if (
                (height + yDelta < heightMin && zoomBox.yChange < 0) ||
                (height + yDelta > heightMax && zoomBox.yChange > 0)
            ) {
                // Reverse direction, don't change height. But, top will still
                // have to change because adjacent child boxes will have moved
                // probably.
                zoomBox.yChange *= -1;
            }
            else {
                height += yDelta;
            }

            zoomBox.set_dimensions(left, width, top + (height / 2), height);

            top += height;
        });

        super.zoom(into, after, limits);
    }

}
