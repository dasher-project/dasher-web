// (c) 2019 Jim Hawkins. MIT licensed, see https://opensource.org/licenses/MIT

export default class ControllerPointer {
    constructor(pointer, predictor) {
        this._pointer = pointer;
        this._predictor = predictor;

        this._rootSpecification = {
            "colour":"silver", "message":[],
            "spawner":this, "prediction": null
        };
    }

    get rootSpecification() {return this._rootSpecification;}

    child_specifications(zoomBox) {
        const predictions = this._predictor(
            zoomBox.message, zoomBox.prediction);

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
                    colour = ControllerPointer.groupColours[prediction.group];
                }
            }

            return {
                "prediction": prediction,
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
        if (!this._pointer.going) {
            return;
        }

        // Solve left position and height, based on the pointer X position.
        const {
            left, height, target
        } = rootBox.solve_x_move(0 - this._pointer.x, limits);
        if (!Object.is(rootBox, target)) {
            console.log('Solver target', target.message);
        }
        
        // Set the width, simple.
        rootBox.set_dimensions(undefined, limits.width - left);
        
        // Zoom to the solved height and left position.
        rootBox.zoom_to_height(height, left, limits)

        // Increment the middle, based on the pointer Y position, and cascade to
        // all child boxes.
        rootBox.adjust_dimensions(undefined, this._pointer.y, true);
    }        

}

// See https://en.wikipedia.org/wiki/Web_colors

ControllerPointer.unsetColour = "LightSlateGray";

ControllerPointer.sequenceColours = [
    "LightBlue", "SkyBlue", "LightGreen", "PaleGreen"
];

ControllerPointer.groupColours = {
    "capital": "Yellow",
    "small": "DeepSkyBlue",
    "numeral": "LightCoral",
    "punctuation": "LimeGreen",
    "space": "LightGray"
}

// TOTH:
// https://ux.stackexchange.com/questions/91255/how-can-i-best-display-a-blank-space-character
ControllerPointer.displayTextMap = [
    [" ", 0x23b5], // Space mapped to under-bracket.
    ["\n", 0xb6]   // Newline mapped to pilcrow.
];
ControllerPointer.displayTextLeft = ControllerPointer.displayTextMap.map(
    pair => pair[0].codePointAt(0));
