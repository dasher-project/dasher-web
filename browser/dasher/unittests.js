// (c) 2022 The ACE Centre-North, UK registered charity 1089313.
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

import * as assert from "../unittesting/assert.js"
import { Result } from "../unittesting/result.js";

const limitsWidth = 100;
const limitsHeight = 200;

function setLimitsRatios(limits) {
    limits.ratios = [
        {left:0.9, height: 0.01},
        {left:-1, height: 1}
    ];

}

export default function dasherUnitTests(t) {
    t.sub(paletteTest);
    t.sub(limitsTest);
    t.sub(zoomBoxTest);
    t.sub(spawnTest);
    t.sub(controllerTest);
}

function paletteTest(t) {
    const palette = t(assert.NotUndefined, new Palette());
    t(assert.Equal, palette.codePoints.length, palette.indexMap.size);
    t(assert.Equal, "a", palette.display_text("a".codePointAt(0)));
    t(assert.NotEqual, " ", palette.display_text(" ".codePointAt(0)));
}

function limitsTest(t) {
    const limits = t(assert.NotUndefined, new Limits());
    limits.set(limitsWidth, limitsHeight);
    t(assert.Equal, limits.width, limitsWidth);
    t(assert.Equal, limits.height, limitsHeight);
    const thrown = t(assert.Throw, () => limits.solve_height(0));
    t(assert.Instance, thrown, TypeError);
    setLimitsRatios(limits);

    t(assert.Undefined, limits.solve_height(undefined));
    t(assert.Undefined, limits.solve_left(undefined));
    t(assert.NotUndefined, limits.solve_height(0));
}

function zoomBoxTest(t) {
    const palette = t(assert.NotUndefined, new Palette());
    const limits = t(assert.NotUndefined, new Limits());
    limits.set(limitsWidth, limitsHeight);
    setLimitsRatios(limits);

    t(assert.NotUndefined, new ZoomBox());
    t(assert.NotUndefined, new ZoomBox(palette, []));
    const zoomBox = t(assert.NotUndefined, new ZoomBox(palette));
    t(assert.Equal, zoomBox.message.length, 0);
    t(assert.Undefined, zoomBox.readyToChildSpawn());
    t(assert.Undefined, zoomBox.readyToChildSpawn(limits));
    zoomBox.set_dimensions(limits.right + 10, 10, 0, 10);
    t(assert.Equal, zoomBox.readyToChildSpawn(limits), false,
     "unready-if-outside-limits");
    zoomBox.set_dimensions(limits.right - 10, 10, 0, 10);
    t(assert.Equal, zoomBox.readyToChildSpawn(limits), true,
        "ready-if-within-limits");
}

function spawnTest(t) {
    const palette = t(
        assert.NotUndefined, new Palette(), "Palette-constructor");
    const parentBox = t(
        assert.NotUndefined, new ZoomBox(palette), "ZoomBox-constructor");

    const childBoxes = t(assert.NotUndefined,
        palette.spawnChildBoxes(parentBox), 'palette-spawnChildBoxes');
    t(assert.Equal, childBoxes.length, palette.codePoints.length,
        "Spawned one child box per palette code point");

    // First approach, create two sub-results each with an assertion for each
    // array element.
    const tChildCodePoints = t(Result,
        "Spawned child boxes have one more code point than the parent");
    const tChildMessageTexts = t(Result,
        "Spawned child boxes have correct message text");
    childBoxes.forEach((childBox, index) => {
        tChildCodePoints(assert.Equal,
            parentBox.messageCodePoints.length + 1
            , childBox.messageCodePoints.length
            , childBox.message
        );

        const paletteCodePoint = palette.codePoints[index];
        tChildMessageTexts(assert.Equal,
            // Uncomment the + to induce a failure.
            childBox.message // + (index === 50 ? "f" : "")
            , String.fromCodePoint(
                ...parentBox.messageCodePoints, paletteCodePoint)
        );

    });

    // Second approach, append two assertions for each array element.
    childBoxes.forEach((childBox, index) => {
        const assertionMessage = `childBoxes[${index}].`;
        t(assert.Equal,
            parentBox.messageCodePoints.length + 1,
            childBox.messageCodePoints.length,
            "Child has one more code point than parent", assertionMessage);
        t(assert.Equal,
            // Uncomment the + to induce a failure.
            childBox.message // + (index === 50 ? "f" : "")
            , String.fromCodePoint(
                ...parentBox.messageCodePoints, palette.codePoints[index]),
            "Child message text", assertionMessage);
    });


    parentBox.childSpawn();

    // Assert that the zoomBox.childBoxes array contents are the same as the
    // childBoxes array.
    const tSpawns = t(Result,
        "parent childSpawn() same as palette childSpawn()");
    tSpawns(assert.Equal, parentBox.childBoxes.length, childBoxes.length,
        "childBoxes arrays same length");
    for(let index=0; index < childBoxes.length; index++) {
        const left = parentBox.childBoxes[index];
        const right = childBoxes[index];
        tSpawns(assert.Equal,
            left.messageCodePoints.length, right.messageCodePoints.length,
            "messageCodePoints same length", index);
        tSpawns(assert.Equal,
            // Uncomment the + to induce a failure.
            left.message, right.message //+ (index === 50 ? "f" : "")
            , "message same", index);
    }

    // Could also assert that the palette method was called exactly once, by
    // mocking.
}

function controllerTest(t) {
    const palette = t(assert.NotUndefined, new Palette());
    const limits = t(assert.NotUndefined, new Limits());
    limits.set(limitsWidth, limitsHeight);
    setLimitsRatios(limits);

    const controller = t(assert.NotUndefined, new Controller());
    t(assert.Undefined, controller.spawnRootZoomBox());
    t(assert.Undefined, controller.spawnRootZoomBox(limits));
    const rootBoxPalette = t(assert.NotUndefined,
        controller.spawnRootZoomBox(limits, 0, undefined, palette));
    t(assert.Equal, rootBoxPalette.message.length, 0);

    const rootBox = t(assert.NotUndefined,
        controller.spawnRootZoomBox(limits, 0));
    t(assert.Equal, rootBox.message.length, 0, "Root box has empty message");
}
