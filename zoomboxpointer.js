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
        console.log('spawn', this._message);

        this._multiplierUpDown = 0.3;
        this._multiplierLeftRight = 0.3;
        this._multiplierHeight = 0.0015;

        const vowels = ["a", "e", "i", "o", "u"];
        this._childWeights = childTexts.map(text => 
            vowels.includes(text) ? 2 : 1);
        //  Array(childTexts.length).fill(1);
        this._childBoxes = Array(childTexts.length).fill(null);
    }

    get multiplierUpDown() {
        return this._multiplierUpDown;
    }
    set multiplierUpDown(multiplierUpDown) {
        this._multiplierUpDown = multiplierUpDown;
    }

    // Override.
    // spawn() {
    //     if (this.childBoxes.length > 0) {
    //         return false;
    //     }
    //     this._childTexts.forEach((character, index) => {
    //         const zoomBox = new ZoomBoxPointer(
    //             this._childTexts, this._message, this._pointer,
    //             index % 2 === 0 ? "lightblue" : "lightgreen", character
    //         );
    //         // Setting zoomBox.weight would go here.
    //         zoomBox.inherit(this);
    //         // zoomBox.renderPiece = this._svgGroup;
    //         this.childBoxes.push(zoomBox);
    //     });
    //     this.reset();
    //     return true;
    // }

    // reset() {
    //     const width = (
    //         this.spawnMargin === undefined ? this.width / 3 :
    //         this.width - this.spawnMargin);
    //     const left = (this.left + this.width) - width;
    //     this.arrange_children(left, width);
    // }

    solve_x_delta(delta, limits) {
        const index = this._origin_index();
        if (index === -1) {
            // No child to consider; solve height for this parent.
            const left = this.left + delta;
            return {
                "left": left, "height": this.solve_height(left, limits),
                "target": this
            };
        }
        else {
            const holder = this.childBoxes[index];
            const originalHeight = holder.height;
            const {
                height:holderHeight, target:target
            } = holder.solve_x_delta(delta, limits);

            if (holderHeight === originalHeight) {
                console.log('stationary', holder._message);
                const left = this.left + delta;
                return {
                    "left": left, "height": this.solve_height(left, limits),
                    "target": this
                };    
            }

            // Solve this box's height from the unitHeight.
            const totalWeight = this._childWeights.reduce(
                (accumulator, weight) => accumulator + weight, 0);
            const unitHeight = holderHeight / this._childWeights[index];
            const height = unitHeight * totalWeight;
            return {
                "left": this.solve_left(height, limits), "height": height,
                "target": target
            };
        }
    }

    solve_height(left, limits) {
        const index = limits.gradients.findIndex(
            gradient => left < gradient.left);
        
        if (index < 0) {
            return limits.gradients[limits.gradients.length - 1].height;
        }

        const gradient0 = limits.gradients[index === 0 ? 1 : index];
        const gradient1 = limits.gradients[index === 0 ? 0 : index - 1];

        return gradient0.height + (
            ((gradient1.height - gradient0.height) * (gradient0.left - left)) /
            (gradient0.left - gradient1.left)
        )
        // return (
        //     (limits.height * (limits.xZeroHeight - left)) /
        //     (limits.xZeroHeight - limits.xFullHeight)
        // );
    }
    solve_left(height, limits) {
        const index = limits.gradients.findIndex(
            gradient => height > gradient.height);
        
        if (index < 0) {
            return limits.gradients[limits.gradients.length - 1].left;
        }

        const gradient0 = limits.gradients[index === 0 ? 1 : index];
        const gradient1 = limits.gradients[index === 0 ? 0 : index - 1];

        return gradient0.left + (
            (
                (gradient1.left - gradient0.left) *
                (gradient0.height - height)
            ) /
            (gradient0.height - gradient1.height)
        )

        // return gradient0.left - (
        //     (height * (gradient0.left - gradient1.left)) / limits.height
        // );
        // return limits.xZeroHeight - (
        //     (height * (limits.xZeroHeight - limits.xFullHeight)) / limits.height
        // );
    }

    _origin_index() {
        if (this.holds_origin() !== 0) {
            return -1;
        }
        for(let index = this.childBoxes.length - 1; index >= 0; index--) {
            const zoomBox = this.childBoxes[index];
            if (zoomBox === null) {
                continue;
            }
            const holds = zoomBox.holds_origin();
            if (holds === 0) {
                return index;
            }
            if (holds === -1) {
                // Found a child above the origin. All remaining child boxes
                // will be above this one, so stop checking.
                return -1;
            }
        }
        // Didn't find any child that holds the origin.
        return -1;
    }

    arrange_children(limits, up, initialiser) {
        const totalWeight = this._childWeights.reduce(
            (accumulator, weight) => accumulator + weight, 0);
        const unitHeight = this.height / totalWeight;

        let childTop;
        let childBottom;
        if (up === undefined) {
            childTop = this.top;
            initialiser = -1;
            up = false;
        }
        else if (up) {
            childBottom = this._childBoxes[initialiser].top;
        }
        else {
            childTop = this._childBoxes[initialiser].bottom;
        }
        const direction = (up ? -1 : 1)

        const childLength = this.childBoxes.length;
        for(
            let index = initialiser + direction;
            index >= 0 && index < childLength;
            index += direction
        ) {
            const childHeight = this._childWeights[index] * unitHeight;
            if (up) {
                childTop = childBottom - childHeight;
            }
            else {
                childBottom = childTop + childHeight;
            }

            const shouldSpawn = (
                this.renderHeightThreshold === undefined ||
                childHeight >= this.renderHeightThreshold) &&
                childBottom > limits.top && childTop < limits.bottom;

            if (shouldSpawn) {
                if (this.childBoxes[index] === null) {
                    this.childBoxes[index] = new ZoomBoxPointer(
                        this._childTexts, this._message, this._pointer,
                        index % 2 === 0 ? "lightblue" : "lightgreen",
                        this._childTexts[index]);
                    this.childBoxes[index].inherit(this);
                }
                const zoomBox = this.childBoxes[index];
        
                const childLeft = this.solve_left(childHeight, limits);
                const childWidth = limits.width - childLeft;
    
                zoomBox.set_dimensions(
                    childLeft, childWidth,
                    childBottom - (childHeight / 2), childHeight);
                zoomBox.arrange_children(limits);
            }
            else {
                if (this.childBoxes[index] !== null) {
                    this.childBoxes[index].render(null);
                    this.childBoxes[index] = null;
                }
            }

            if (up) {
                childBottom -= childHeight;
            }
            else {
                childTop += childHeight;
            }
        }
        return up ? childBottom : childTop;
    }

    zoom_to_height(newHeight, left, limits) {
        const index = this._origin_index();
        if (index === -1) {
            const halfHeightChange = (newHeight - this.height) / 2;
            if (this.top > 0) {
                this.middle += halfHeightChange;
            }
            // If the bottom of the box is above the origin, then the whole box
            // is above the origin.
            // Exactly one of the checks has to be or-equals.
            if (this.bottom <= 0) {
                this.middle -= halfHeightChange;
            }
            this.height = newHeight;
            this.left = left;
            this.width = limits.width - left;
            this.arrange_children(limits)
        }
        else {
            const totalWeight = this._childWeights.reduce(
                (accumulator, weight) => accumulator + weight, 0);
            const unitHeight = newHeight / totalWeight;
            const holder = this.childBoxes[index];
            const childHeight = unitHeight * this._childWeights[index];
            holder.zoom_to_height(
                childHeight, this.solve_left(childHeight, limits), limits);

            this.height = newHeight;
            this.left = left;
            this.width = limits.width - left;

            // push up everything above the holder; push down everything below
            // the holder.
            const top = this.arrange_children(limits, true, index);
            this.arrange_children(limits, false, index);
            this.middle = top + (newHeight / 2);
        }

    }

    // Override.
    zoom(into, after, limits) {
        const deltaLeftRight = (
            this._pointer.pointerX * this._multiplierLeftRight) * -1;

        // const originHolder = this.origin_holder();
        // const holderMiddle = (
        //     originHolder === null ? this.middle : originHolder.middle);


        const {
            left, height, target
        } = this.solve_x_delta(deltaLeftRight, limits);
        if (!Object.is(this, target)) {
            console.log('Solver target', target._message);
        }
        const originHolder = target;
        const holderMiddle = target.middle;

        const deltaUpDown = (
            this._pointer.pointerY * this.multiplierUpDown
            // * (target.height / limits.height)
        );

        // const left = this.left + deltaLeftRight;
        // const height = (
        //     (limits.height * (limits.right - left)) /
        //     (limits.right - limits.xFullHeight));
        // const middle = this.middle + deltaUpDown;
        // let top = middle - (height / 2);

        // this.set_dimensions(left, undefined, undefined, height);
        this.set_dimensions(undefined, limits.width - left);
        //, this.middle + deltaUpDown, height);
        this.zoom_to_height(height, left, limits)


        // this.arrange_children(limits);

        // It's possible the holder has been despawned. That's OK. The
        // originHolder keeps a reference to it so it won't have been garbage
        // collected.
        // const originChange = (
        //     originHolder === null ? this.middle : originHolder.middle
        // ) -  holderMiddle;

        // if (originHolder !== null && !Object.is(originHolder, this)) {
        //     console.log("origin", originHolder._message, originChange);
        // }

        this.adjust_dimensions(undefined,  deltaUpDown, true);


        // let topTrim = limits.top - top;
        // if (topTrim < 0) {
        //     topTrim = 0;
        // }
        // else {
        //     top = limits.top;
        // }
        
        // const heightZoom = 1 + Math.abs(
        //     this._pointer.pointerX * this._multiplierHeight);
        // const heightMultiplier = (
        //     this._pointer.pointerX > 0 ? heightZoom : 1 / heightZoom);

        //     // if (heightMultiplier != 1) {
        // //     console.log(heightMultiplier);
        // // }
        // const originHolder = this.origin_holder();
        // const holderMiddle = (
        //     originHolder === null ? undefined : originHolder.middle);
        // this.height *= heightMultiplier;
        // this.arrange_children();
        // // console.log(
        // //     holderMiddle,
        // //     originHolder === null ? undefined :
        // //     holderMiddle - originHolder.middle,
        // //     originHolder === null ? null : originHolder._text
        // // );
        // const originAdjustment = (
        //     holderMiddle === undefined ? 0 :
        //     holderMiddle - originHolder.middle);
        
        // this.adjust_dimensions(
        //     deltaLeftRight, originAdjustment + deltaUpDown, true);

        super.zoom(into, after, limits);
        return;





        const renderOrigin = deltaUpDown - this.middle + (
            (this.renderTop + this.renderBottom) / 2);
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
