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

export default function dasherUnitTests(t) {
    t.assertSubTest(paletteTest);
    t.assertSubTest(limitsTest);
    t.assertSubTest(zoomBoxTest);
    t.assertSubTest(spawnTest);
    t.assertSubTest(controllerTest);
}

function paletteTest(t) {
    const palette = t.assertNotUndefined(new Palette());
    t.assertEqual(palette.codePoints.length, palette.indexMap.size);
    t.assertEqual("a", palette.display_text("a".codePointAt(0)));
    t.assertNotEqual(" ", palette.display_text(" ".codePointAt(0)));
}

function limitsTest(t) {
    const limits = t.assertNotUndefined(new Limits());
    limits.set(limitsWidth, limitsHeight);
    t.assertEqual(limits.width, limitsWidth);
    t.assertEqual(limits.height, limitsHeight);
    t.assertTypeError(() => limits.solve_height(0));
    setLimitsRatios(limits);

    t.assertUndefined(limits.solve_height(undefined));
    t.assertUndefined(limits.solve_left(undefined));
    t.assertNotUndefined(limits.solve_height(0));
}

function zoomBoxTest(t) {
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
}

function spawnTest(t) {
    const palette = t.assertNotUndefined(new Palette());
    const parentBox = t.assertNotUndefined(new ZoomBox(palette));
    
    const childBoxes = t.assertNotUndefined(
        palette.spawnChildBoxes(parentBox));
    t.assertEqual(childBoxes.length, palette.codePoints.length,
        "Spawned one child box per palette code point.");
    
    const tChildCodePoints = t.child("ChildCodePoints");
    const tChildMessageTexts = t.child("ChildMessageTexts");
    t.assertResult(tChildCodePoints,
        "All spawned child boxes have one more code point than the parent.");
    // t.lastAssertion.showIfPassed = true;
    t.assertResult(tChildMessageTexts,
        "All spawned child boxes have correct message text.");
    childBoxes.forEach((childBox, index) => {
        tChildCodePoints.assertEqual(
            parentBox.messageCodePoints.length + 1
            , childBox.messageCodePoints.length
            , "Child has one more code point than parent.", childBox.message
        );
        // if (index === 5) tChildCodePoints.lastAssertion.showIfPassed = true;

        const paletteCodePoint = palette.codePoints[index];
        let appendage = "";
        if (index === 50) {
            appendage = "f";
        }
        tChildMessageTexts.assertEqual(
            childBox.message // + appendage
            , String.fromCodePoint(
                ...parentBox.messageCodePoints, paletteCodePoint)
            , "Child message text correct."
        );

    });

    childBoxes.forEach((childBox, index) => {
        const assertionMessage = `childBoxes[${index}].`;
        t.assertEqual(
            parentBox.messageCodePoints.length + 1,
            childBox.messageCodePoints.length,
            "Child has one more code point than parent.", assertionMessage);
        t.assertEqual(
            childBox.message, // + (index === 30 ? "f" : ""),
            String.fromCodePoint(
                ...parentBox.messageCodePoints, palette.codePoints[index]),
            "Child message text.", assertionMessage);
    });


    parentBox.childSpawn();

    t.assertCompareArrays(
        (left, right, index) => (
            (
                left.messageCodePoints.length
                === right.messageCodePoints.length
            )
            && (
                left.message // + (index === 50 ? "f" : "")
                === right.message
            )
        ),
        parentBox.childBoxes, childBoxes,
        "parent childSpawn() same as palette childSpawn()."
    );
    // Assert that the zoomBox.childBoxes array contents are the same as the
    // childBoxes array. Could also assert that the palette method was
    // called exactly once, by mocking.
}

function controllerTest(t) {
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
