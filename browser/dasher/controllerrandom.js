// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

import Palette from "./palette.js";

class PaletteSmall extends Palette {
    // Override:
    constructor(texts) {
        super();
        this._groupDefinitions = [{"name": null, "texts": texts}];
    }

    // Override:
    build() {
        super.build();
        this.rootTemplate.childTemplates.forEach(
            template => template.childTemplates = []
        );
        // console.log("PaletteSmall", this.rootTemplate);
        return this;
    }

    // Override:
    get groupDefinitions() {return this._groupDefinitions;}
}

export default class ControllerRandom {
    constructor(texts) {
        this._palette = new PaletteSmall(texts).build();
        this._rectHeight = undefined;
        this._going = true;
    }

    get palette() {return this._palette;}

    get going() {return this._going;}
    set going(going) {this._going = going;}

    control(rootBox) {
        if (this._rectHeight === undefined || !this.going) {
            return;
        }

        const heightMin = this._rectHeight * 0.75;
        const heightMax = this._rectHeight * 1.75;
        const widthMin = this._rectHeight * 2;
        const widthMax = rootBox.width;
        let top = rootBox.top;
        rootBox.childBoxes.forEach(childBox => {
            const xChange = childBox.controllerData.xChange;
            const yChange = childBox.controllerData.yChange;
            const xDelta = (50 + Math.random() * 250) * xChange;
            const yDelta = heightMin * Math.random() * yChange;

            let left;
            let width = childBox.width + xDelta;
            if (
                (width < widthMin && xChange < 0) ||
                (width > widthMax && xChange > 0)
            ) {
                // Reverse direction; don't move.
                childBox.controllerData.xChange *= -1;
                width = undefined;
            }
            else {
                left = (rootBox.left + rootBox.width) - width;
            }

            let height = childBox.height;
            if (
                (height + yDelta < heightMin && yChange < 0) ||
                (height + yDelta > heightMax && yChange > 0)
            ) {
                // Reverse direction, don't change height. But, top will
                // still have to change because adjacent child boxes will
                // have moved probably.
                childBox.controllerData.yChange *= -1;
            }
            else {
                height += yDelta;
            }

            childBox.set_dimensions(left, width, top + (height / 2), height);

            top += height;
        });
    }

    async populate(rootBox, limits) {
        rootBox.set_dimensions(
            limits.width * -0.45,
            limits.width * 0.9,
            0, limits.height * 0.9
        );

        rootBox.instantiate_child_boxes(() => {});

        this._rectHeight = (rootBox.height / rootBox.childBoxes.length) * 0.75;

        let top = rootBox.top;
        const width = this._rectHeight * 2;
        const left = (rootBox.left + rootBox.width) - width;
        rootBox.childBoxes.forEach((childBox, index) => {
            const xChange = 1 - ((index % 2) * 2);
            childBox.controllerData = {"xChange":xChange, "yChange":xChange};
            childBox.set_dimensions(
                left, width, top + (this._rectHeight / 2), this._rectHeight
            );
            // Next line will set childBoxes to an empty array
            childBox.instantiate_child_boxes();

            top += this._rectHeight;
        });
    }
}
