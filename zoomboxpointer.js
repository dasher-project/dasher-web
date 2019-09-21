// (c) 2019 Jim Hawkins. MIT licensed, see https://opensource.org/licenses/MIT

import ZoomBox from "./zoombox.js";

function loggable(num) {
    return num === undefined ? undefined : parseFloat(num.toFixed(2));
}

export default class ZoomBoxPointer extends ZoomBox {
    constructor(childTexts, prefix, pointer, colour, text) {
        super(colour, text);
        this._childTexts = childTexts;
        this._message = prefix + (text === undefined ? "" : text);
        this._pointer = pointer;

        this._multiplierUpDown = 0.1;
        this._multiplierLeftRight = 0.05;
        this._multiplierHeight = 0.0005;

        this._spawned = false;
    }

    get multiplierUpDown() {
        return this._multiplierUpDown;
    }
    set multiplierUpDown(multiplierUpDown) {
        this._multiplierUpDown = multiplierUpDown;
    }

    // Override.
    spawn() {
        if (this._spawned) {
            return;
        }
        this._spawned = true;
        this._childTexts.forEach((character, index) => {
            const zoomBox = new ZoomBoxPointer(
                this._childTexts, this._message, this._pointer,
                index % 2 === 0 ? "lightblue" : "lightgreen", character
            );
            zoomBox.inherit(this);
            zoomBox.renderPiece = this._svgGroup;
            this.children.push(zoomBox);
        });
        this.reset();
    }

    reset() {
        const width = (
            this.spawnMargin === undefined ? this.width / 3 :
            this.width - this.spawnMargin);
        const left = this.width - width;
        this.children.forEach(zoomBox => {
            zoomBox.set_dimensions(left, width);
        });
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

        const renderOrigin = deltaUpDown - this.middle + (
            (this.renderTop + this.renderBottom) / 2);
        const originHolder = this.origin_holder();
        // const holderMiddle = (
        //     (originHolder === null || Object.is(originHolder, this)) ?
        //     undefined : originHolder.middle);
        // const originIndex = this.children.findIndex(
        //     zoomBox => zoomBox.middle - renderOrigin > 0
        // );
        // const originOffset = (
        //     originIndex < 0 ? undefined :
        //     this.children[originIndex].middle - renderOrigin);
        const offsetBefore = (
            (originHolder === null || Object.is(originHolder, this)) ?
            undefined : originHolder.middle - originHolder.renderOrigin);


        // const diagnostic = this.children.filter(zoomBox => (
        //     zoomBox._text === "h" ||
        //     zoomBox._text === "i" ||
        //     zoomBox._text === "j"
        // ))
        // .reduce((accumulator, zoomBox) => accumulator.concat(
        //     zoomBox._text, loggable(zoomBox.middle - renderOrigin)
        // ), [
        //     originIndex, originOffset,
        //     renderOrigin, this.renderBottom, this.renderTop].map(
        //     value => loggable(value))
        // );
    

        if (offsetBefore === undefined) {
            this.set_dimensions(
                this.left - deltaLeftRight, this.width + deltaLeftRight,
                this.middle + deltaUpDown, heightMultiplier * this.height
            );
        }
        else {
            this.set_dimensions(
                this.left - deltaLeftRight, this.width + deltaLeftRight,
                this.middle + deltaUpDown, heightMultiplier * this.height,
                false
            );
            const revertOffset = offsetBefore + (
                originHolder.renderOrigin - originHolder.middle);
            console.log(
                'originHolder', originHolder._message,
                loggable(offsetBefore), loggable(originHolder.middle),
                loggable(originHolder.renderOrigin), loggable(revertOffset));
            
            // Implicit render, including children.
            this.middle += revertOffset + deltaUpDown;
        }

        // if (originOffset !== undefined) {
        //     // if (originIndex !== undefined) {
        //         // const revertOffset = originOffset - (
        //         //     this.children[originIndex].middle - renderOrigin);
        //     const revertOffset = originOffset - (
        //         originHolder.middle - renderOrigin);
        //     //     diagnostic.unshift(
        // //         loggable(this.children[originIndex].middle - renderOrigin),
        // //         loggable(revertOffset),
        // //         this.children[originIndex]._text);
        // //     console.log(diagnostic);

        // //     // Next thing works but only if the tree is one-layer. Really, the
        // //     // code should recursively descend to find the smallest child that
        // //     // held the origin, and adjust for its move. It might have
        // //     // derendered, which wouldn't be a problem actually.

        //     this.middle += revertOffset;
        // }
    }
}
