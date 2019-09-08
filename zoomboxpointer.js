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
        let top = this.top; // / 3;
        const width = this.width / 6;
        const left = this.width - width;
        const unitHeight = this._unit_height();
        // / (3 * this._children.length);
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

    zoom() {
        const deltaUpDown = this._pointer.pointerY * this.multiplierUpDown;
        const deltaZoom = this._pointer.pointerX;
        this._scale += deltaZoom / 1000;
        this.setDimensions(
            this.left - (deltaZoom), undefined,
            this.top + deltaUpDown, // - deltaZoom,
            this.bottom + deltaUpDown //  + deltaZoom
        );
        return;

        const unitHeight = this._unit_height();
        // const aboveIncrement = deltaUpDown; // -deltaZoom
        // const belowIncrement = deltaUpDown;

        const childs = this.children.length;
        const firstMover = this.children.findIndex(
            zoomBox => zoomBox.bottom > 0);
        // let lastAbove = -1;
        // let firstBelow = childs;
        // for(const [index, zoomBox] of this.children.entries()) {
        //     // if (zoomBox.top < 0) {
        //     //     lastAbove = index;
        //     // }
        //     if (zoomBox.bottom > 0) {
        //         firstBelow = index;
        //         break;
        //     }
        // }
        // const lastAbove = (
        //     firstBelow === childs ? childs - 1 : (
        //         this.children[firstBelow].top < 0 ? firstBelow : -1
        //     )
        // );

        let startBottom = undefined;
        let startTop = undefined;
        let lastAbove = firstMover;
        let firstBelow = firstMover;
        if (firstMover === -1) {
            // All are above zero.
            lastAbove = childs - 1;
            firstBelow = childs;
            startBottom = this.children[lastAbove].bottom; // + deltaUpDown;
        }
        else {
            const zoomBox = this.children[firstMover];
            if (zoomBox.top > 0) {
                // All are below zero.
                startTop = zoomBox.top; // + deltaUpDown;
                lastAbove = -1;
            }
            else {
                const heightChangeHalf = (
                    (unitHeight * zoomBox.weight) - zoomBox.height) * 0.5;
                // startBottom = (zoomBox.top + deltaUpDown) - deltaZoom;
                // startTop = zoomBox.bottom + deltaUpDown + deltaZoom;
                startBottom = zoomBox.top + heightChangeHalf;
                startTop = zoomBox.bottom - heightChangeHalf;
                zoomBox.setDimensions(
                    // index < firstBelow ? zoomBox.left - deltaZoom : 
                    undefined,
                    undefined, startBottom, startTop
                );
                lastAbove = firstMover - 1;
                firstBelow = firstMover + 1;
            }
        }


        // if (lastAbove === -1) { return;}

        // console.log(lastAbove, firstMover, firstBelow, loggable(deltaUpDown));

        this._zoom_above(lastAbove, startBottom, deltaUpDown, unitHeight);
        //, 0 - deltaZoom);
        this._zoom_below(firstBelow, startTop, deltaUpDown, unitHeight);
        //, deltaZoom);

        // let bottom = (
        //     firstBelow === childs && lastAbove !== -1 ?
        //     this.children[lastAbove].bottom + aboveIncrement :
        //     undefined
        // );
        // for(let index=lastAbove; index >= 0; index--) {
        //     const zoomBox = this.children[index];
        //     bottom = top;
        //     top = zoomBox.top + deltaUpDown;// + aboveIncrement;
        //     console.log(
        //         'above', index, loggable(zoomBox.top), loggable(top),
        //         loggable(bottom));
        //     zoomBox.setDimensions(
        //         // index < firstBelow ? zoomBox.left - deltaZoom : 
        //         undefined,
        //         undefined, top, bottom
        //     );
        // }

        // let top = (
        //     lastAbove === -1 && firstBelow !== childs ?
        //     this.children[firstBelow].top + belowIncrement :
        //     undefined
        // );
        // for(let index=firstBelow; index < childs; index++) {
        //     const zoomBox = this.children[index];
        //     top = bottom;
        //     bottom = zoomBox.bottom + belowIncrement;
        //     console.log(
        //         'below', index, loggable(zoomBox.bottom), loggable(top),
        //         loggable(bottom));
        //     zoomBox.setDimensions(
        //         // index < firstBelow ? zoomBox.left - deltaZoom : 
        //         undefined,
        //         undefined, top, bottom
        //     );
        // }

        // this.children
        // .filter(zoomBox => !(
        //     isNaN(zoomBox.top) ||
        //     isNaN(zoomBox.bottom) ||
        //     isNaN(zoomBox.left)
        // ))
        // .forEach((zoomBox, index) => {
        //     const top = deltaUpDown + (
        //         zoomBox.top < 0 ?
        //         zoomBox.top - deltaZoom : 
        //         zoomBox.top + deltaZoom
        //     );
        //     const bottom = deltaUpDown + (
        //         zoomBox.bottom < 0 ?
        //         zoomBox.bottom - deltaZoom : 
        //         zoomBox.bottom + deltaZoom
        //     );
        //     // 
        //     if (index === 0) {
        //         zoomBox.setDimensions(
        //         zoomBox.left - deltaZoom, undefined, top, bottom);}
        // });
    }

    _zoom_above(startIndex, startBottom, delta, unitHeight) {
        let top = startBottom;
        for(let index=startIndex; index >= 0; index--) {
            const zoomBox = this.children[index];
            const bottom = top;
            top = bottom + delta + (zoomBox.weight * unitHeight);
            // delta += increment;
            // console.log(
            //     'above', index, loggable(zoomBox.top), loggable(top),
            //     loggable(bottom));
            zoomBox.setDimensions(
                // index < firstBelow ? zoomBox.left - deltaZoom : 
                undefined,
                undefined, top, bottom
            );
        }
    }

    _zoom_below(startIndex, startTop, delta, unitHeight) {
        const childs = this.children.length;
        let bottom = startTop;
        for(let index=startIndex; index < childs; index++) {
            const zoomBox = this.children[index];
            const top = bottom;
            bottom = top + delta - (zoomBox.weight * unitHeight);
            // delta += increment;
            // console.log(
            //     'below', index, loggable(zoomBox.bottom), loggable(top),
            //     loggable(bottom));
            zoomBox.setDimensions(
                // index < firstBelow ? zoomBox.left - deltaZoom : 
                undefined,
                undefined, top, bottom
            );
        }

    }
}
