// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

export default class ControllerPointer {
    constructor(pointer, predictor) {
        this._pointer = pointer;
        this._predictor = predictor;
        // this._palette = palette;

        this._frozen = null;
        this._frozenTarget = null;

        this._set_weight_bound = this._set_weight.bind(this);

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

    async populate(rootBox, limits) {
        if (rootBox.template.cssClass === null) {
            console.log('populate', `"${rootBox.message}"`)
            this.predictor(
                rootBox.messageCodePoints, rootBox.message,
                rootBox.predictorData, rootBox.template.palette,
                this._set_weight.bind(this, rootBox)
            );
        }
        rootBox.arrange_children(limits);
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
        const stack = [];
        for(const index of path) {
            target = target.childBoxes[index];
            stack.push(target);
        }
        const delta = weight - target.weight;
        for(const box of stack) {
            stack.weight += delta;
        }
        console.log(
            '_set_weight', stack.map(box => box.message), delta, path);
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

        const applied = rootBox.apply_move(moveX, moveY, path, limits);
        if (!applied) {
            console.log('Not applied.');
        }
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

}

// See https://en.wikipedia.org/wiki/Web_colors

ControllerPointer.unsetColour = "LightSlateGray";

ControllerPointer.groupColours = {
    "capital": null,
    "small": null,
    "numeral": null,
    "punctuation": null,
    "contraction": null,
    "space": null
};
