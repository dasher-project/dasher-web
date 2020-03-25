// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

export default class ControllerPointer {
    constructor(pointer, predictor) {
        this._pointer = pointer;
        this._predictor = predictor;

        this._frozen = null;
        this._frozenTarget = null;

        this._rootSpecification = {
            "colour":"silver", "message":[],
            "spawner":this, "prediction": null
        };
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

    get rootSpecification() {return this._rootSpecification;}

    get going() {return this._pointer.going;}

    async child_specifications(zoomBox) {
        const predictions = await this.predictor(
            zoomBox.messageCodePoints, zoomBox.message, zoomBox.prediction
        );
        return predictions.map((prediction, index) => {
            const codePoint = prediction.codePoint;

            const message = zoomBox.messageCodePoints.slice();
            if (codePoint !== null) {
                message.push(codePoint);
            }

            const displayTextIndex = (
                codePoint === null ? undefined :
                ControllerPointer.displayTextLeft.indexOf(codePoint));
            const displayText = (
                displayTextIndex === undefined ? null :
                String.fromCodePoint(
                    displayTextIndex >= 0 ?
                    ControllerPointer.displayTextMap[displayTextIndex][1] :
                    codePoint
                )
            );
                    
            let colour = ControllerPointer.unsetColour;
            if (prediction.group === null) {
                prediction.ordinal = (
                    zoomBox.prediction === null ? 0 :
                    zoomBox.prediction.ordinal + 1
                );
                colour = ControllerPointer.sequenceColours[
                    (index % 2) + ((prediction.ordinal % 2) * 2)];
            }
            else {
                prediction.ordinal = 0;
                if (prediction.group in ControllerPointer.groupColours) {
                    colour = ControllerPointer.groupColours[
                        prediction.group];
                }
            }

            return {
                "prediction": prediction,
                "cssClass": colour === null ? prediction.group : undefined,
                "colour": colour,
                "message": message,
                "text": displayText,
                "weight": prediction.weight,
                "spawner": this
            };
        });
    }

    populate(rootBox, limits) {
        rootBox.arrange_children(limits);
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

ControllerPointer.sequenceColours = [
    "LightBlue", "SkyBlue", "LightGreen", "PaleGreen"
];

ControllerPointer.groupColours = {
    "capital": null, // "Yellow",
    "small": null, // "DeepSkyBlue",
    "numeral": "LightCoral",
    "punctuation": "LimeGreen",
    "space": "LightGray",
    "highlight": "PapayaWhip"
}

// TOTH:
// https://ux.stackexchange.com/questions/91255/how-can-i-best-display-a-blank-space-character
ControllerPointer.displayTextMap = [
    [" ", 0x23b5], // Space mapped to under-bracket.
    ["\n", 0xb6]   // Newline mapped to pilcrow.
];
ControllerPointer.displayTextLeft = ControllerPointer.displayTextMap.map(
    pair => pair[0].codePointAt(0));
