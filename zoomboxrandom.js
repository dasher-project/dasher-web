// (c) 2019 Jim Hawkins. MIT licensed, see https://opensource.org/licenses/MIT

import ZoomBox from "./zoombox.js";

export default class ZoomBoxRandom extends ZoomBox {
    constructor(texts) {
        super();
        this._texts = texts;

        this._spawned = false;
    }

    get_child_weight(index) {
        return NaN;
    }

    spawn() {
        if (this._spawned) {
            return;
        }
        this._spawned = true;

        this._rectHeight = (this.height / this._texts.length) * 0.75;

        let top = this.height / -2;
        const width = this._rectHeight * 2;
        const left = this.width - width;
        this._texts.forEach((character, index) => {
            const zoomBox = new ZoomBox(
                index % 2 === 0 ? "lightblue" : "lightgreen", character
            );
            zoomBox.xChange = 1 - ((index % 2) * 2);
            zoomBox.yChange = zoomBox.xChange;
            zoomBox.inherit(this);
            zoomBox.set_dimensions(
                left, width, top + (this._rectHeight / 2), this._rectHeight
            );
            zoomBox.renderPiece = this._svgGroup;
            this.children.push(zoomBox);
            top += this._rectHeight;
        });
    }

    // Override.
    zoom() {
        const heightMin = this._rectHeight * 0.75;
        const heightMax = this._rectHeight * 1.75;
        const leftMax = this.width - (this._rectHeight * 2);
        let top = this.height / -2;
        this.children.forEach(zoomBox => {
            const xDelta = (50 + Math.random() * 250) * zoomBox.xChange;
            const yDelta = heightMin * Math.random() * zoomBox.yChange;
            let left;
            let width;
            if (
                (zoomBox.left + xDelta < 0 && zoomBox.xChange < 0) ||
                (zoomBox.left + xDelta > leftMax && zoomBox.xChange > 0)
            ) {
                zoomBox.xChange *= -1;
            }
            else {
                left = zoomBox.left + xDelta;
                width = this.width - left;
            }

            let height = zoomBox.height;
            if (
                (height + yDelta < heightMin && zoomBox.yChange < 0) ||
                (height + yDelta > heightMax && zoomBox.yChange > 0)
            ) {
                zoomBox.yChange *= -1;
            }
            else {
                height += yDelta;
            }

            zoomBox.set_dimensions(left, width, top + (height / 2), height);

            top += height;
        });
    }

}
