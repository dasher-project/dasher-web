// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

export default class ControllerPointer {
    constructor(pointer, predictor) {
        this._pointer = pointer;
        this._predictor = predictor;
        // this._palette = palette;

        this._frozen = null;
        this._frozenTarget = null;

        // this._rootSpecification = {
        //     "colour": null, "cssClass": this._palette.sequenceCSS(0, 0),
        //     "message":[], "factory":this, "factoryData": {
        //         "predictorData": null, "childSpecifications": null,
        //         "ordinal": 0
        //     }
        // };
    }

    get predictor() {return this._predictor;}
    set predictor(predictor) {this._predictor = predictor;}

    get frozen() {return this._frozen;}
    set frozen(frozen) {
        if (frozen !== null && this._frozen === null) {
            this._frozenTarget = null;
        }
        this._frozen = frozen;
    }

    // get rootSpecification() {return this._rootSpecification;}

    get going() {return this._pointer.going;}

    /*
    async specify_child_boxes(zoomBox) {

        // If the box isn't a group, get a new template from the palette.
        // Create a box specification for: each plain character, and each group.
        // If the box is a group, it already has a list of specifications.
        if (zoomBox.factoryData.childSpecifications !== null) {
            return zoomBox.factoryData.childSpecifications;
        }

        const ordinal = zoomBox.factoryData.ordinal + 1;
        const prediction = await this.predictor.get_character_weights(
            zoomBox.messageCodePoints,
            zoomBox.message,
            zoomBox.factoryData.predictorData
        );
        const template = palette.template();

        // Apply predicted weights to the template, and set other ZoomBox
        // specification parameters.
        template.forEach(group => group.childSpecifications.forEach(
            (specification, index) => {
                specification.cssClass = palette.sequenceCSS(ordinal, index);
                const codePoint = specification.codePoint;
                specification.weight = (
                    prediction.weights.has(codePoint) ?
                    prediction.weights.get(codePoint) :
                    prediction.defaultWeight
                );
                specification.message = zoomBox.messageCodePoints.slice();
                if (codePoint !== null) {
                    specification.message.push(codePoint);
                }
                specification.text = this._palette.display_text(codePoint);
                specification.factory = this;
                specification.factoryData = {
                    "ordinal": ordinal, "childSpecifications": null,
                    "predictorData": (
                        prediction.contexts.has(codePoint) ?
                        prediction.contexts.get(codePoint) :
                        zoomBox.factoryData.predictorData
                    )
                };
            }
        ));

        const returning = [];
        template.forEach(group => {
            if (group.cssClass === null) {
                returning.push(...group.childSpecifications);
            }
            else {
                group.weight = group.childSpecifications.reduce(
                    (
                        accumulator, specification
                    ) => accumulator + specification.weight, 0
                );
                group.factory = this;
                group.factoryData = {
                    "predictorData": zoomBox.factoryData.predictorData,
                    "childSpecifications": group.childSpecifications
                };
                delete group.childSpecifications;
                returning.push(group);
            }
        });
        return returning;




        // Get a default array of specifications, or just characters, from the
        // Palette. Apply the get_character_weights to it, unless we already
        // have them because of a group.
        // const weights = (
        //     zoomBox.factoryData.characterWeights === null ?
        //     await this.predictor.get_character_weights(
        //         zoomBox.messageCodePoints,
        //         zoomBox.message,
        //         zoomBox.factoryData.predictorData
        //     ) :
        //     zoomBox.factoryData.characterWeights
        // );

        // Each character group can have weights.

        // const predictions = await this.predictor(
        //     zoomBox.messageCodePoints, zoomBox.message, zoomBox.prediction
        // );
        // return predictions.map((prediction, index) => {
        //     const codePoint = prediction.codePoint;

        //     const message = zoomBox.messageCodePoints.slice();
        //     if (codePoint !== null) {
        //         message.push(codePoint);
        //     }

        //     let colour = ControllerPointer.unsetColour;
        //     let cssClass = null;
        //     if (prediction.group === null) {
        //         prediction.ordinal = (
        //             zoomBox.prediction === null ? 0 :
        //             zoomBox.prediction.ordinal + 1
        //         );
        //         colour = null;

        //         // Get it from the palette.
        //         palette.sequenceCSS(prediction.ordinal, index);
        //     }
        //     else {
        //         prediction.ordinal = 0;
        //         if (prediction.group in ControllerPointer.groupColours) {
        //             colour = ControllerPointer.groupColours[
        //                 prediction.group];
        //         }
        //     }

        //     return {

        //         // Change `prediction` to factoryData.
        //         "prediction": prediction,
        //         "cssClass": (
        //             cssClass === null ?
        //             (colour === null ? prediction.group : undefined) :
        //             cssClass
        //         ),
        //         "colour": colour,
        //         "message": message,
        //         "text": this._palette.display_text(codePoint),
        //         "weight": prediction.weight,
        //         "factory": this
        //     };
        // });
    }
    */

    async populate(rootBox, limits) {
        // Comment out one or other of the following.

        // // Set left; solve height.
        // const width = this.limits.spawnMargin * 2;
        // const left = this._limits.right - width;
        // const height = this._limits.solve_height(left);

        // Set height; solve left.
        const height = limits.height / 2;
        const left = limits.solve_left(height);
        const width = limits.right - left;
        rootBox.set_dimensions(left, width, 0, height);

        this._configure_box(rootBox, true);
        // rootBox.instantiate_child_boxes();
        // rootBox.childBoxes.forEach(childBox => {
        //     this._configure_box(childBox);
        //     if (childBox.template.codePoint === null) {

        //     }
        // });

        if (rootBox.factoryData.totalWeight === undefined) {
            await this._predict_weights(rootBox);
        }
        this._arrange_children(rootBox, limits);
        // this._spawn(rootBox, limits);
        // .then(this.arrange_children.bind(this, rootBox, limits));
        // this.arrange_children(rootBox, limits);
    }

    _configure_box(parentBox, configureChildBoxes) {
        if (parentBox.factoryData === undefined) {
            parentBox.factoryData = {
                "weight": parentBox.template.weight,
                "totalWeight": undefined,
                "gettingWeights": false
            };
        }

        if (configureChildBoxes || parentBox.template.codePoint === null) {
            if (parentBox.instantiate_child_boxes()) {
                parentBox.childBoxes.forEach(
                    childBox => this._configure_box(childBox, false));
            }
        }
    }

    /*
    _spawn(rootBox, limits) { //, forcePrediction=false) {
        this._configure_box(rootBox);
        rootBox.instantiate_child_boxes();
        rootBox.childBoxes.forEach(childBox => this._configure_box(childBox));

        // if (rootBox.factoryData.totalWeight === undefined) {
        //     if (forcePrediction || rootBox.template.cssClass === null) {
        //         // console.log('spawn', `"${rootBox.message}"`)
        //         this.predictor(
        //             rootBox.messageCodePoints, rootBox.message,
        //             rootBox.predictorData, rootBox.template.palette,
        //             this._set_weight.bind(this, rootBox)
        //         );
        //     }
        //     this._set_total_weight(rootBox);
        // }

        this.arrange_children(rootBox, limits);
    }
    */

    async _predict_weights(parentBox) {
        if (parentBox.factoryData.gettingWeights) {
            return;
        }
        parentBox.factoryData.gettingWeights = true;
    
        if (parentBox.template.cssClass === null) {
            await this.predictor(
                parentBox.messageCodePoints, parentBox.message,
                parentBox.factoryData.predictorData,
                parentBox.template.palette,
                this._set_weight.bind(this, parentBox)
            );
        }

        parentBox.factoryData.totalWeight = parentBox.childBoxes.reduce(
            (accumulator, child) =>
            accumulator + child.factoryData.weight, 0);

        parentBox.factoryData.gettingWeights = false;
    }

    _set_weight(parentBox, codePoint, weight, predictorData) {
        const path = parentBox.template.palette.indexMap.get(codePoint);
        if (path === undefined) {
            throw new Error([
                `Set weight outside palette ${codePoint}`,
                ` "${String.fromCodePoint(codePoint)}"`,
                ` under "${parentBox.message}".`
            ].join(""));
        }
        let target = parentBox;
        // const stack = [];
        for(const index of path) {
            // this._configure_box(target);
            // target.instantiate_child_boxes();
            // target.childBoxes.forEach(
            //     childBox => this._configure_box(childBox));

            target = target.childBoxes[index];
            // stack.push(target);
        }
        // if (target.factoryData === undefined) {
        //     target.factoryData = { "weight": target.template.weight };
        // }
        // const delta = weight - target.factoryData.weight;
        // console.log('_set_weight', target.message, target.factoryData, weight);
        target.factoryData.weight = weight;
        target.factoryData.predictorData = predictorData;
        // for(const box of stack) {
        //     // if (box.factoryData === undefined) {
        //     //     box.factoryData = { "weight": box.template.weight };
        //     // }
        //     box.factoryData.weight += delta;
        // }
        // console.log(
        //     '_set_weight', stack.map(box => box.message), delta, path);
    }

    // Arrange some or all child boxes. There are three procedures, selected by
    // the `up` parameter:
    //
    // -   up:undefined  
    //     Assume this box already has its top set and arrange child boxes to
    //     occupy it.
    // -   up:true  
    //     Arrange all the child boxes above an initialiser specified by its
    //     index. Assume that the initialiser has its top set.
    // -   up:false  
    //     Arrange all the child boxes below an initialiser specified by its
    //     index. Assume that the initialiser has its bottom set.
    //
    // Returns the bottom or top value of the last child arranged.
    _arrange_children(parentBox, limits, up, initialiser) {
        if (parentBox.factoryData.totalWeight === undefined) {
            this._configure_box(parentBox, true);
            // Next function is async but this code doesn't wait for it to
            // finish.
            this._predict_weights(parentBox);
            return undefined;
        }
        const unitHeight = parentBox.height / parentBox.factoryData.totalWeight;

        let childTop;
        let childBottom;
        if (up === undefined) {
            childTop = parentBox.top;
            initialiser = -1;
            up = false;
        }
        else if (up) {
            childBottom = parentBox.childBoxes[initialiser].top;
        }
        else {
            childTop = parentBox.childBoxes[initialiser].bottom;
        }
        const direction = (up ? -1 : 1)

        const childLength = parentBox.childBoxes.length;
        for(
            let index = initialiser + direction;
            index >= 0 && index < childLength;
            index += direction
        ) {
            const childBox = parentBox.childBoxes[index];
            const childHeight = childBox.factoryData.weight * unitHeight;
            if (up) {
                childTop = childBottom - childHeight;
            }
            else {
                childBottom = childTop + childHeight;
            }

            const shouldSpawn = (
                limits.spawnThreshold === undefined ||
                childHeight >= limits.spawnThreshold) &&
                childBottom > limits.top && childTop < limits.bottom;

            if (shouldSpawn) {
                // if (this.childBoxes[index] === null) {
                //     this.childBoxes[index] = new ZoomBox(
                //         this.childSpecifications[index]);
                // }
                // const zoomBox = this.childBoxes[index];
        
                const childLeft = limits.solve_left(childHeight);
                const childWidth = limits.width - childLeft;
   
                // const dimensioned = !childBox.dimension_undefined();

                childBox.set_dimensions(
                    childLeft, childWidth,
                    childBottom - (childHeight / 2), childHeight);
                
                this._arrange_children(childBox, limits);
                // this._spawn(childBox, limits);
                // .then(this.arrange_children.bind(this, childBox, limits));
            }
            else {
                childBox.erase();
                // Clear the child boxes only if their weights could be
                // generated again.
                if (childBox.template.cssClass === null) {
                    if (!childBox.factoryData.gettingWeights) {
                        // throw new Error(
                        //     'Erasing when prediction is in progress.')
                        childBox.clear_child_boxes();
                        childBox.factoryData.totalWeight = undefined;    
                    }
                }
                // if (this.childBoxes[index] !== null) {
                //     // console.log(
                //     //     `Arrange spawn "${this.childBoxes[index].message}".`
                //     // );
                //     this.childBoxes[index].erase();
                //     this.childBoxes[index] = null;
                // }
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

    control(rootBox, limits) {
        if (!this.going) {
            return;
        }

        if (this.report_frozen(rootBox, limits, true)) {
            return;
        }

        // Select a target to which the move will be applied.  
        // Target is the box at the right-hand edge of the window and at the
        // same height as the pointer.  
        // Subtract one from the limit because boxes extend exactly to the
        // edge.
        const path = [];
        const maxRight = limits.solverRight - 3;
        const holderX = (
            limits.targetRight ? limits.solverRight : (
                this._pointer.rawX > maxRight ? maxRight : this._pointer.rawX
            )
        );
        const target = rootBox.holder(holderX, this._pointer.rawY, path);

        let moveX;
        let moveY;
        if (limits.targetRight) {
            moveX = 0 - this._pointer.x;
            moveY = this._pointer.y;
        }
        else {
            const calculation = this._calculate_move(target, limits);
            moveX = calculation.moveX;
            moveY = calculation.moveY;
        }

        if (target === null) {
            // If the pointer is outside even the root box, apply the move
            // to the root box anyway.
            path[0] = -1;
        }

        const applied = this._apply_move(
            rootBox, moveX, moveY, path, limits, 0);
        if (!applied) {
            console.log('Not applied.');
        }
    }

    report_frozen(rootBox, limits, onlyIfTargetChanged=false) {
        if (this.frozen === null) {
            return false;
        }
        // Pointer Y is positive upwards but Box Y is positive downwards. X has
        // the same sense in both Pointer and Box. The holder method adjusts for
        // that already.
        const target = rootBox.holder(
            this._pointer.rawX, this._pointer.rawY, []);
        if (onlyIfTargetChanged && (
            target === null || target === this._frozenTarget
        )) {
            return true;
        }
        this._frozenTarget = target;
        // const report = {"box": target, "p0x": p0x, "p0y": p0y};
        this._frozen(this._calculate_move(target, limits));
        return true;
    }

    _calculate_move(target, limits) {
        const p0x = this._pointer.rawX;
        const p0y = 0 - this._pointer.rawY;
        const calculation = {
            "box": target, "p0x": p0x, "p0y": p0y,
            "lx":limits.left, "rx":limits.solverRight};
        if (target === null) {
            Object.assign(calculation, {
                "moveX": 0 - this._pointer.x,
                "moveY": this._pointer.y
            });
        }
        else {
            const pointerX = this._pointer.x;
            let tx1 = target.left - pointerX;
            let adjustX = null;
            if (tx1 < limits.left && pointerX < 0) {
                adjustX = (limits.left - tx1) * p0x / limits.left;
                tx1 += adjustX;
            }
            const h1 = limits.solve_height(tx1);
            const on0 = (p0y - target.middle) / target.height;
            const p1y = p0y + this._pointer.y;
            // Algebra here:
            // on0 = (p1y - ty1) / h1
            // (on0 * h1) - p1y = -1 * ty1
            // p1y - (on0 * h1) = ty1
            const ty1 = p1y - (on0 * h1);
            const on1 = (p1y - ty1) / h1;

            Object.assign(calculation, {
                "message": target.message,
                "adjustX": adjustX,
                "on0": on0, "on1": on1,
                "h0": target.height, "h1": h1,
                "tx0": target.left, "tx1": tx1,
                "ty0": target.middle, "ty1": ty1,
                "moveX": tx1 - target.left, "moveY": ty1 - target.middle
            });
        }

        return calculation;
    }

    _apply_move(hereBox, moveX, moveY, path, limits, position) {
        const index = path[position];
        const isRootBox = position === 0;

        if (index === -1) {
            // End of the path; attempt to apply the move here.
            return this._apply_move_here(
                hereBox, moveX, moveY, limits, isRootBox);
        }

        // Attempt to apply the move to the specified child.
        const target = hereBox.childBoxes[index];
        const applied = this._apply_move(
            target, moveX, moveY, path, limits, position + 1);
        if (!applied) {
            // If it wasn't applied to a child, attempt to apply here instead.
            return this._apply_move_here(
                hereBox, moveX, moveY, limits, isRootBox);
        }

        // Now adjust this box so that it is congruent to the new height of the
        // target child. The following must become true:  
        // this.child_weight(index) * unitHeight = target.height  
        // Where:  
        // unitHeight = this.height / this.totalWeight
        // Therefore:
        const height = (
            (target.height / target.factoryData.weight) *
            hereBox.factoryData.totalWeight);
        
        // Unless this is the root box and adjusting its size would cause its
        // rect to be erased. In that case, undo the move by arranging the child
        // boxes based on this box's current height and position.
        if (isRootBox && height <= limits.drawThresholdRect) {
            console.log('Undo height', height, limits.drawThresholdRect);
            this._arrange_children(hereBox, limits);
            return false;
        }

        hereBox.height = height;
        //
        // Arrange the child boxes, in two parts. First, push up everything
        // above the target. Second, push down everything below the target.
        const top = this._arrange_children(hereBox, limits, true, index);
        if (top === undefined) {
            throw new Error("Top undefined.");
        }



        // this.arrange_children(hereBox, limits, true, index)
        // .then(top => {
            this._arrange_children(hereBox, limits, false, index);
            //
            // Finalise the adjustment to this box.
            hereBox.left = limits.solve_left(height);
            hereBox.width = limits.width - hereBox.left;
            hereBox.middle = top + (height / 2);
        // });
        return true;
    }

    _apply_move_here(hereBox, moveX, moveY, limits, isRootBox) {
        const movedLeft = hereBox.left + moveX;
        // At any point to the right of the last gradient, the solver will
        // return a minimum height. This has some undesirable side effects.
        // These can be avoided by rejecting the move if it would put this box
        // into that zone.
        if (movedLeft >= limits.solverRight) {
            if (isRootBox) {
                console.log('AMH left', movedLeft, limits.solverRight);
            }
            return false;
        }

        const solvedHeight = limits.solve_height(movedLeft);
        // The root box shouldn't ever have its rect erased. If this move is
        // being applied to the root box, and would result in erasure, reject
        // the move.
        if (isRootBox && solvedHeight <= limits.drawThresholdRect) {
            console.log('AMH height', solvedHeight, limits.drawThresholdRect);
            return false;
        }

        hereBox.left = movedLeft;
        hereBox.width = limits.width - hereBox.left;
        hereBox.height = solvedHeight;
        hereBox.middle += moveY;
        this._arrange_children(hereBox, limits);
        // this._spawn(hereBox, limits);
        // .then(this.arrange_children.bind(this, hereBox, limits));
        return true;
    }

    build(parentBox, childBox, limits) {
        const index = childBox.trimmedIndex;

        // parentBox.instantiate_child_boxes();
        // return this._spawn(parentBox).then(() => {
        //     parentBox.childBoxes[index] = childBox;
        //     this._set_total_weight(parentBox);

            // Next segment of code arranges the parent in such a way that the
            // child doesn't move.
            //
            // Calculate the parent height from the height of the child, via the
            // parent unitHeight. Then solve the left position of the parent
            // from its height. Set width as usual.
            const unitHeight = parentBox.height / childBox.factoryData.weight;
            const height = unitHeight * parentBox.factoryData.totalWeight;
            const left = limits.solve_left(height);
            const width = limits.width - left;
            parentBox.set_dimensions(left, width, undefined, height);
            //
            // Now calculate the top of the parent by adding the tops of all the
            // child boxes above this one. They will all be null but won't have
            // zero weight. Fortunately, the same calculation is required by
            // another method, so call it here.
            const top = this._arrange_children(parentBox, limits, true, index);
            if (top === undefined) {
                throw new Error("Top undefined.");
            }
            parentBox.middle = top + (height / 2);
            //
            // Reset the parent insertion parameters.
            childBox.trimmedParent = null;
            childBox.trimmedIndex = undefined;

            this._arrange_children(parentBox, limits);
        // });
    }

}
