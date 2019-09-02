// (c) 2019 Jim Hawkins. MIT licensed, see https://opensource.org/licenses/MIT

import ZoomBox from "./zoombox.js";

export default class ZoomBoxRandom extends ZoomBox {
    constructor(texts, rectHeight) {
        super();
        this._texts = texts;
        this._rectHeight = rectHeight;
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
        const right = this.right - this.left;
        const left = right - (this._rectHeight * 2);
        console.log(this.right);

        this._texts.forEach((character, index) => {
            const zoomBox = new ZoomBox(
                index % 2 === 0 ? "lightgray" : "lightgreen", character
            );
            zoomBox.setDimensions(
                top,
                right,
                top + this._rectHeight + (this._rectHeight * Math.random()),
                left
            );
            zoomBox.xChange = 1 - ((index % 2) * 2);
            zoomBox.yChange = zoomBox.xChange;

            zoomBox.resetWidth = this._rectHeight * 2;

            this.children.push(zoomBox);
            zoomBox.render(this._svgGroup);

            top += zoomBox.height;
        });
    }

    random_zooms() {
        const heightMin = this._rectHeight;
        const heightMax = this._rectHeight * 3;
        const xMin = 0;
        const xMax = this.right - (this.left + (this._rectHeight * 2));
        let top = this.children[0].top;
        this.children.forEach(zoomBox => {
            const xDelta = (50 + Math.random() * 250) * zoomBox.xChange;
            const yDelta = this._rectHeight * Math.random() * zoomBox.yChange;
            let left;
            let bottom;
            if (
                (zoomBox.left + xDelta < xMin && zoomBox.xChange < 0) ||
                (zoomBox.left + xDelta > xMax && zoomBox.xChange > 0)
            ) {
                zoomBox.xChange *= -1;
            }
            else {
                left = zoomBox.left + xDelta;
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

            zoomBox.setDimensions(top, undefined, bottom, left);

            top = zoomBox.bottom;
        });
    }

}
