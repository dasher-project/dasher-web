// (c) 2019 Jim Hawkins. MIT licensed, see https://opensource.org/licenses/MIT

import ZoomBox from "./zoombox.js";

export default class ZoomBoxRandom extends ZoomBox {
    constructor(texts, rectHeight) {
        super();
        this._texts = texts;
        this._rectHeight = rectHeight;
        this._resetWidth = rectHeight * 2;
    }

    // Override.
    cascade_width() {
        this._children.forEach(child => {
            const width = this._width - child.left;
            if (width > 0) {
                child.width = width;
            }
            else {
                child.setDimensions(
                    this._width - this._resetWidth, this._resetWidth);
            }
        });
    }

    // Override.
    render(parentPiece) {
        super.render(parentPiece);
        if (this.children.length <= 0) {
            this._spawn();
        }
    }

    _spawn() {
        let top = this.top;
        const width = this._rectHeight * 2;
        const left = this.width - width;

        this._texts.forEach((character, index) => {
            const zoomBox = new ZoomBox(
                index % 2 === 0 ? "lightgray" : "lightgreen", character
            );
            zoomBox.setDimensions(
                left, width, top,
                top + this._rectHeight + (this._rectHeight * Math.random())
            );
            zoomBox.xChange = 1 - ((index % 2) * 2);
            zoomBox.yChange = zoomBox.xChange;

            this.children.push(zoomBox);
            zoomBox.render(this._svgGroup);

            top += zoomBox.height;
        });
    }

    random_zooms() {
        const heightMin = this._rectHeight;
        const heightMax = this._rectHeight * 3;
        const leftMax = this.width - (this._rectHeight * 2);
        let top = this.children[0].top;
        this.children.forEach(zoomBox => {
            const xDelta = (50 + Math.random() * 250) * zoomBox.xChange;
            const yDelta = this._rectHeight * Math.random() * zoomBox.yChange;
            let left;
            let bottom;
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

            const height = zoomBox.height;
            if (
                (height + yDelta < heightMin && zoomBox.yChange < 0) ||
                (height + yDelta > heightMax && zoomBox.yChange > 0)
            ) {
                zoomBox.yChange *= -1;
                bottom = top + height;
            }
            else {
                bottom = top + height + yDelta;
            }

            zoomBox.setDimensions(left, width, top, bottom);

            top = zoomBox.bottom;
        });
    }

}
