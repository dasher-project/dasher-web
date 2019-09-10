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
            zoomBox.weight = 1;
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
        let top = this.top;
        const width = this.width / 6;
        const left = this.width - width;
        const unitHeight = this._unit_height();
        this.children.forEach(zoomBox => {
            zoomBox.excessWidth = this.width;
            const height = zoomBox.weight * unitHeight;
            zoomBox.setDimensions(left, width, top, top + height);
            top += height;
        });
    }
    _unit_height() {
        const totalWeight = this.children.reduce(
            (accumulator, zoomBox) => accumulator + zoomBox.weight, 0
        );
        return this.height / totalWeight;
    }

    // Override.
    zoom() {
        const deltaUpDown = this._pointer.pointerY * this.multiplierUpDown;
        const deltaLeftRight = (
            this._pointer.pointerX * this._multiplierLeftRight);

        const heightZoom = 1 + Math.abs(
            this._pointer.pointerX * this._multiplierHeight);
        const heightMultiplier = (
            deltaLeftRight > 0 ? heightZoom : 1 / heightZoom);
        // if (heightMultiplier != 1) {
        //     console.log(heightMultiplier);
        // }

        const thisHeightChangeHalf = (
            ((heightMultiplier * this.height) - this.height) / 2);
        this.setDimensions(
            undefined, undefined,
            this.top - thisHeightChangeHalf, this.bottom + thisHeightChangeHalf
        );

        const unitHeight = this._unit_height();

        const childs = this.children.length;
        const firstBelow = this.children.findIndex(
            zoomBox => zoomBox.bottom > 0);

        const firstMover = firstBelow === -1 ? childs - 1 : firstBelow;
        const zoomBox = this.children[firstMover];
        const heightChangeHalf = (
            (unitHeight * zoomBox.weight) - zoomBox.height) * 0.5;
        const startBottom = (zoomBox.top + deltaUpDown) - heightChangeHalf;
        const startTop = (zoomBox.bottom + deltaUpDown) + heightChangeHalf;
        zoomBox.setDimensions(
            zoomBox.left - deltaLeftRight, undefined,
            startBottom, startTop
        );

        this._zoom_above(
            firstMover - 1, startBottom, -1 * deltaLeftRight, unitHeight);
        this._zoom_below(
            firstMover + 1, startTop, -1 * deltaLeftRight, unitHeight);
    }

    _zoom_above(startIndex, startBottom, delta, unitHeight) {
        let top = startBottom;
        for(let index=startIndex; index >= 0; index--) {
            const zoomBox = this.children[index];
            const bottom = top;
            top = bottom  - (zoomBox.weight * unitHeight);
            zoomBox.setDimensions(zoomBox.left + delta, undefined, top, bottom);
        }
    }

    _zoom_below(startIndex, startTop, delta, unitHeight) {
        const childs = this.children.length;
        let bottom = startTop;
        for(let index=startIndex; index < childs; index++) {
            const zoomBox = this.children[index];
            const top = bottom;
            bottom = top + (zoomBox.weight * unitHeight);
            zoomBox.setDimensions(zoomBox.left + delta, undefined, top, bottom);
        }

    }
}
