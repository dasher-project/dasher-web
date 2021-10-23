// (c) 2021 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

import Palette from "./palette.js";
import ZoomBox from "./zoombox.js";

export default class Controller {
    constructor() {
    }

    spawnRootZoomBox(limits, left, height, palette) {
        if (limits === undefined) return undefined;
        
        if (height === undefined) {
            height = limits.solve_height(left);
        }
        else {
            left = limits.solve_left(height);
        }

        if (left === undefined || height === undefined) {
            return undefined;
        }

        const zoomBox = new ZoomBox(
            (palette === undefined) ? new Palette() : palette);
        zoomBox.set_dimensions(left, limits.right - left, 0, height);

        if (zoomBox.readyToChildSpawn(limits)) {
            
        }

        return zoomBox;
    }
}
