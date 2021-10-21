// (c) 2021 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

/*
This file contains a few unit tests for Dasher Version Six.

Its export is an object that can be passed as a parameter to the TestRun.run()
method in the unittesting module.
*/

import Palette from "./palette.js";
import ZoomBox from "./zoombox.js";
import Limits from "./limits.js";
import Controller from "./controller.js";

const limitsWidth = 100;
const limitsHeight = 200;

function setLimitsRatios(limits) {
    limits.ratios = [
        {left:0.9, height: 0.01},
        {left:-1, height: 1}
    ];

}

export default {
    paletteTest: function (t) {
        const palette = t.assertNotUndefined(new Palette());
        t.assertEqual(palette.codePoints.length, palette.indexMap.size);
        t.assertEqual("a", palette.display_text("a".codePointAt(0)));
        t.assertNotEqual(" ", palette.display_text(" ".codePointAt(0)));
    },
    limitsTest: function (t) {
        const limits = t.assertNotUndefined(new Limits());
        limits.set(limitsWidth, limitsHeight);
        t.assertEqual(limits.width, limitsWidth);
        t.assertEqual(limits.height, limitsHeight);
        t.assertTypeError(() => limits.solve_height(0));
        setLimitsRatios(limits);

        t.assertUndefined(limits.solve_height(undefined));
        t.assertUndefined(limits.solve_left(undefined));
        t.assertNotUndefined(limits.solve_height(0));
    },
    zoomBoxTest: function (t) {
        const palette = t.assertNotUndefined(new Palette());
        const limits = t.assertNotUndefined(new Limits());
        limits.set(limitsWidth, limitsHeight);
        setLimitsRatios(limits);

        t.assertNotUndefined(new ZoomBox());
        t.assertNotUndefined(new ZoomBox(palette, []));
        const zoomBox = t.assertNotUndefined(new ZoomBox(palette));
        t.assertEqual(zoomBox.message.length, 0);
        t.assertUndefined(zoomBox.readyToChildSpawn());
        t.assertUndefined(zoomBox.readyToChildSpawn(limits));
        zoomBox.set_dimensions(limits.right + 10, 10, 0, 10);
        t.assertFalse(
            zoomBox.readyToChildSpawn(limits), "Unready if outside limits.");
        zoomBox.set_dimensions(limits.right - 10, 10, 0, 10);
        t.assertTrue(zoomBox.readyToChildSpawn(limits),
            "Ready if within limits.");
    },
    controllerTest: function (t) {
        const palette = t.assertNotUndefined(new Palette());
        const limits = t.assertNotUndefined(new Limits());
        limits.set(limitsWidth, limitsHeight);
        setLimitsRatios(limits);

        const controller = t.assertNotUndefined(new Controller());
        t.assertUndefined(controller.spawnRootZoomBox());
        t.assertUndefined(controller.spawnRootZoomBox(limits));
        const rootBoxPalette = t.assertNotUndefined(
            controller.spawnRootZoomBox(limits, 0, undefined, palette));
        t.assertEqual(rootBoxPalette.message.length, 0);

        const rootBox = t.assertNotUndefined(
            controller.spawnRootZoomBox(limits, 0));
        t.assertEqual(rootBox.message.length, 0, "Root box has empty message.");
    }
}