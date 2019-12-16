// (c) 2019 Jim Hawkins. MIT licensed, see https://opensource.org/licenses/MIT

export default class ControllerPointer {
    constructor(pointer, predictor) {
        this._pointer = pointer;
        this._predictor = predictor;

        this._rootSpecification = {
            "colour":"silver", "message":"",
            "spawner":this, "prediction": null
        };
    }

    get rootSpecification() {return this._rootSpecification;}

    child_specifications(zoomBox) {
        const predictions = this._predictor(
            zoomBox.message, zoomBox.prediction);

        return predictions.map((prediction, index) => {
            const message = zoomBox.message + prediction.text;
            const displayText = (
                // Under-bracket displayed for space.
                prediction.text === " " ? String.fromCodePoint(0x23b5) :

                // Pilcrow displayed for newline.
                prediction.text === "\n" ? String.fromCodePoint(0xb6) :

                // TOTH:
                // https://ux.stackexchange.com/questions/91255/how-can-i-best-display-a-blank-space-character

                prediction.text
            )
            
            let colour = "white";
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
ControllerPointer.sequenceColours = [
    "LightBlue", "SkyBlue", "LightGreen", "PaleGreen"
];
ControllerPointer.groupColours = {
    "capital": "Yellow",
    "small": "SkyBlue",
    "numeral": "Red",
    "punctuation": "Azure",
    "space": "LightGray"
}