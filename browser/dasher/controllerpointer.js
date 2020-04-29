// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

export default class ControllerPointer {
    constructor(pointer, predictor) {
        this._pointer = pointer;
        this._predictor = predictor;

        this._frozen = null;
        this._frozenTarget = null;
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

    get going() {return this._pointer.going;}

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

        this._configure_box(rootBox);
        this._configure_child_boxes(rootBox);

        if (rootBox.factoryData.totalWeight === undefined) {
            await this._predict_weights(rootBox, limits);
        }
        else {
            this._arrange_children(rootBox, limits);
        }
    }

    _configure_child_boxes(parentBox) {
        parentBox.instantiate_child_boxes(this._configure_box.bind(this));
    }
    _configure_box(parentBox) {
        if (parentBox.factoryData === undefined) {
            parentBox.factoryData = {
                "weight": parentBox.template.weight,
                "totalWeight": undefined,
                "gettingWeights": false
            };
        }
    }

    async _predict_weights(parentBox, limits) {
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

        // Weights of all child boxes have been set. Now calculate the total
        // child box weight.  
        // Child boxes that are groups don't have their own weights. Instead,
        // they get the sum of their child box weights.
        parentBox.childBoxes.forEach(child => {
            if (
                child.template.weight === null &&
                child.factoryData.totalWeight === undefined
            ) {
                child.factoryData.weight = this._calculate_total_weight(child);
            }
        });
        this._calculate_total_weight(parentBox);

        parentBox.factoryData.gettingWeights = false;

        this._arrange_children(parentBox, limits)
    }
    _calculate_total_weight(zoomBox) {
        const totalWeight = zoomBox.childBoxes.reduce(
            (accumulator, child) =>
            accumulator + child.factoryData.weight, 0);
        zoomBox.factoryData.totalWeight = totalWeight;
        // console.log(
        //     `total weight "${zoomBox.message}"`, zoomBox.template.cssClass,
        //     totalWeight
        // );
        return totalWeight;
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
        for(const index of path) {
            target = target.childBoxes[index];
        }
        target.factoryData.weight = weight;
        target.factoryData.predictorData = predictorData;
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
    //
    // This method is where child boxes get their dimension set, including child
    // boxes that have only just become big enough to render. This method is
    // also where child boxes get erased and their grandchild boxes deleted.
    _arrange_children(parentBox, limits, up, initialiser) {
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
                const childLeft = limits.solve_left(childHeight);
                const childWidth = limits.width - childLeft;
   
                childBox.set_dimensions(
                    childLeft, childWidth,
                    childBottom - (childHeight / 2), childHeight);
                
                this._configure_child_boxes(childBox);
                if (childBox.factoryData.totalWeight === undefined) {
                    // Next function is async but this code doesn't wait for it
                    // to finish.
                    this._predict_weights(childBox, limits);
                }
                else {
                    this._arrange_children(childBox, limits);
                }
            }
            else {
                childBox.erase();
                // Clear the child boxes only if their weights could be
                // generated again.
                if (
                    childBox.template.cssClass === null &&
                    childBox.childBoxes !== undefined
                ) {
                    // console.log(`erasing childs "${childBox.cssClass} "${childBox.message}"`);
                    if (!childBox.factoryData.gettingWeights) {
                        // throw new Error(
                        //     'Erasing when prediction is in progress.')
                        childBox.clear_child_boxes();
                        childBox.factoryData.totalWeight = undefined;    
                    }
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

        // Arrange the child boxes, in two parts. First, push up everything
        // above the target. Second, push down everything below the target.
        const top = this._arrange_children(hereBox, limits, true, index);
        if (top === undefined) {
            throw new Error("Top undefined.");
        }
        this._arrange_children(hereBox, limits, false, index);

        // Finalise the adjustment to this box.
        hereBox.left = limits.solve_left(height);
        hereBox.width = limits.width - hereBox.left;
        hereBox.middle = top + (height / 2);

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
        return true;
    }

    build(parentBox, childBox, limits) {
        const index = childBox.trimmedIndex;

        // Code here is meant to arrange the parent in such a way that the
        // child height doesn't change. Check that by storing the height here.
        const childHeightBefore = Math.round(childBox.height * 100);

        // Calculate the parent height from the height of the child, via the
        // parent unitHeight. Then solve the left position of the parent
        // from its height. Set width as usual.
        const unitHeight = childBox.height / childBox.factoryData.weight;
        const height = unitHeight * parentBox.factoryData.totalWeight;
        const left = limits.solve_left(height);
        const width = limits.width - left;
        parentBox.set_dimensions(left, width, undefined, height);

        // Now calculate the top of the parent by adding the tops of all the
        // child boxes above this one. They will all have undefined dimensions
        // but won't have zero weight. Fortunately, the same calculation is
        // required by another method, so call it here.
        const top = this._arrange_children(parentBox, limits, true, index);
        if (top === undefined) {
            throw new Error("Top undefined.");
        }
        parentBox.middle = top + (height / 2);

        // Clear the parent insertion parameters.
        childBox.trimmedParent = null;
        childBox.trimmedIndex = undefined;

        this._arrange_children(parentBox, limits);

        // Check the child height wasn't changed. This should maybe be an
        // assertion except that asserting in production would be awkward.
        const childHeightAfter = Math.round(childBox.height * 100);
        if (childHeightAfter !== childHeightBefore) {
            console.log(
                'build check failed', childHeightBefore, childHeightAfter);
        }
    }

}
