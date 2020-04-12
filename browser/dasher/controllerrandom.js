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
        console.log("PaletteSmall", this.rootTemplate);
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
        rootBox.childBoxes.forEach(zoomBox => {
            const xChange = zoomBox.factoryData.xChange;
            const yChange = zoomBox.factoryData.yChange;
            const xDelta = (50 + Math.random() * 250) * xChange;
            const yDelta = heightMin * Math.random() * yChange;

            let left;
            let width = zoomBox.width + xDelta;
            if (
                (width < widthMin && xChange < 0) ||
                (width > widthMax && xChange > 0)
            ) {
                // Reverse direction; don't move.
                zoomBox.factoryData.xChange *= -1;
                width = undefined;
            }
            else {
                left = (rootBox.left + rootBox.width) - width;
            }

            let height = zoomBox.height;
            if (
                (height + yDelta < heightMin && yChange < 0) ||
                (height + yDelta > heightMax && yChange > 0)
            ) {
                // Reverse direction, don't change height. But, top will
                // still have to change because adjacent child boxes will
                // have moved probably.
                zoomBox.factoryData.yChange *= -1;
            }
            else {
                height += yDelta;
            }

            zoomBox.set_dimensions(left, width, top + (height / 2), height);

            top += height;
        });

    }

    async populate(rootBox, limits) {
        if (this._rectHeight === undefined && rootBox.childBoxes.length > 0) {
            this._rectHeight = (
                rootBox.height / rootBox.childBoxes.length) * 0.75;
        }
        else {
            return;
        }

        let top = rootBox.top;
        const width = this._rectHeight * 2;
        const left = (rootBox.left + rootBox.width) - width;
        rootBox.childBoxes.forEach((zoomBox, index) => {
            const xChange = 1 - ((index % 2) * 2);
            zoomBox.factoryData = {"xChange":xChange, "yChange":xChange};
            zoomBox.set_dimensions(
                left, width, top + (this._rectHeight / 2), this._rectHeight
            );
            top += this._rectHeight;
        });
        for(const zoomBox of rootBox.childBoxes) {
            await zoomBox.spawn(limits);
        }
    }
}
