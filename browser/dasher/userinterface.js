// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

/*
This file contains the UserInterface class which is the top of the proof of
concept code. It exports a single class, UserInterface, that manages all the
other classes.

Whichever HTML file loads this script must also load the userinterface.css file.
*/

import Limits from './limits.js';
import Piece from './piece.js';
import Palette from './palette.js';
import Pointer from './pointer.js';
import ControllerRandom from './controllerrandom.js';
import ControllerPointer from './controllerpointer.js';
import Viewer from './viewer.js';
import ZoomBox from './zoombox.js';

import predictor_dummy from './predictor_dummy.js'
import predictor_basic from './predictor.js';
import predictor_test from './predictor_test.js';

import Speech from './speech.js';

import ControlPanel from "./controlpanel.js";

const messageLabelText = "Message:";
const speechAnnouncement = "Speech is now active.";

const defaultPredictorList = [{
    "label": "Basic", "item": predictor_basic
}, {
    "label": "None", "item": predictor_dummy
}, {
    "label": "Random", "item": predictor_test
}];

export default class UserInterface {
    constructor(parent) {
        this._parent = parent;
        this._intervalRender = undefined;

        this._keyboardMode = parent.classList.contains("keyboard");

        this._zoomBox = null;

        this._speakOnStop = false;
        this._speech = null;

        this._controllerRandom = new ControllerRandom(
            "abcdefghijklmnopqrstuvwxyz".split(""));
        // Pointer controller will need a Pointer and it isn't set up until the
        // load().
        this._controllerPointer = undefined;
        this._controller = null;
        this._frozenClickListener = null;

        this._view = undefined;
        // this._cssNode = document.createElement('style');
        // document.head.append(this._cssNode);

        this._speedLeftRightInput = undefined;

        // Spawn and render parameters in mystery SVG units.
        this._limits = new Limits();
        this._limits.minimumFontSizePixels = 20;
        this._limits.maximumFontSizePixels = 30;
        this._limits.drawThresholdRect = 10;
        this._limits.spawnThreshold = 4;
        this._limits.textLeft = 5;
        this._limits.spawnMargin = 30;

        // This value also appears in the userinterface.css file, in the
        // --transition variable, and it's good if they're the same.
        this._transitionMillis = 400;

        this._message = undefined;
        this._messageDisplay = null;
        this._diagnosticSpans = null;
        this._controlPanel = new ControlPanel();
        this._panels = this._controlPanel.load();

        this._palette = new Palette().build();

        // Predictors setter invocation, only OK after controlPanel is loaded.
        this.predictors = defaultPredictorList;

        this._svgRect = undefined;
        this._header = undefined;

        this._stopCallback = null;
    }

    get header() {
        return this._header === undefined ? undefined : this._header.node;
    }

    get stopCallback() { return this._stopCallback; }
    set stopCallback(stopCallback) { this._stopCallback = stopCallback;}

    get zoomBox() {
        return this._zoomBox;
    }
    set zoomBox(newBox) {
        const oldBox = this._zoomBox;

        // Setting to the same value, do nothing.
        if (Object.is(oldBox, newBox)) {
            return;
        }

        // Set underlying property.
        this._zoomBox = newBox;

        if (newBox === null) {
            this._stop_render();

            if (oldBox !== null) {
                oldBox.erase();
            }
        }
    }

    get message() {
        return this._message;
    }
    set message(message) {
        this._message = message;
        if (this._messageDisplay === null) {
            return;
        }
        if (this._limits.showDiagnostic) {
            const description = (
                message === "" ? "empty" :
                message === undefined ? "undefined" :
                message === null ? "null" :
                null
            );
            const labels = [messageLabelText];
            if (description !== null) {
                labels.push(" (", description, ")");
            }
            this._messageLabel.firstChild.nodeValue = labels.join("");
        }
        this._messageDisplay.node.textContent = (
            message === undefined ? null : message);
    }
    
    get predictors() {
        return this._predictors;
    }
    set predictors(predictors) {
        this._predictors = predictors.slice();
        this._panels.main.prediction.optionStrings = this.predictors.map(
            predictor => predictor.label);
    }

    load(loadingID, footerID) {
        this._header = new Piece('div', this._parent);
        this.header.classList.add('header');

        this._load_message();
        this._load_view();
        this._load_control_panel(loadingID);
        
        this._load_controls();
        this._load_pointer();
        this._load_speed_controls();

        this._controllerPointer = new ControllerPointer(
            this._pointer, this.predictors[0].item);

        // Grab the footer, which holds some small print, and re-insert it. The
        // small print has to be in the static HTML too.
        if (footerID !== null) {
            const footer = document.getElementById(footerID);
            this._parent.appendChild(footer);
        }

        // Next part of loading is after a time out so that the browser gets an
        // opportunity to render the layout first.
        setTimeout(this._finish_load.bind(this), 0);

        // To-do: should be an async function that returns a promise that
        // resolves to this.
        return this;
    }

    _load_message() {
        // Textarea in which the message is displayed, and surrounding div.
        this._messageDiv = new Piece(
            'div', this._header, {'id':"message-holder"});
        const identifierMessage = "message";
        this._messageLabel = this._messageDiv.create(
            'label', {'for':identifierMessage}, messageLabelText);
        this._messageDisplay = new Piece('textarea', this._messageDiv, {
            'id':identifierMessage, 'name':identifierMessage, 'readonly':true,
            'rows': this._keyboardMode ? 1 : 6, 'cols':24,
            'placeholder':"Message will appear here ..."
        });
    }

    _load_view() {
        // This element is the root of the whole zooming area.
        this._svg = new Piece('svg', this._parent);
        // Touching and dragging in a mobile web view will scroll or pan the
        // screen, by default. Next line suppresses that. Reference:
        // https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action
        this._svg.node.style['touch-action'] = 'none';
    }

    _load_control_panel(loadingID) {
        this._loading = (
            loadingID === null ? null :
            new Piece(document.getElementById(loadingID))
        );
        if (!this._keyboardMode) {
            // In keyboard mode, the control panel and all its HTML still exists
            // it just never gets added to the body so it doesn't get rendered.
            this._controlPanel.set_parent(this._header);
        }
        if (this._loading !== null) {
            this._panels.main.$.piece.add_child(this._loading);
        }
        this._controlPanel.select_panel("main");
    }
    
    _load_controls() {
        if (this._keyboardMode) {
            // In keyboard mode, the prediction select control is the only
            // control to be shown. The control panel parent isn't set, in
            // keyboard mode. So, pull the prediction select control out and put
            // it under the header, which is shown in keyboard mode.
            const piece = new Piece('div', this._header);
            piece.add_child(this._panels.main.prediction.piece);
        }

        this._panels.main.prediction.listener = index => {
            this._controllerPointer.predictor = this.predictors[index].item;
        };

        this._panels.main.behaviour.optionStrings = ["A","B"];
        this._panels.main.behaviour.listener = index => this._select_behaviour(
            index);

        if (!this._keyboardMode) {
            // There's a defect in speech.js that crashes in the Android
            // keyboard.
            this._load_speech_controls();
        }
        this._load_developer_controls();
    }

    _select_behaviour(index) {
        this._limits.targetRight = (index === 0);
        this._pointer.multiplierLeftRight = (index === 0 ? 0.1 : 0.2);
        // if (this._speedLeftRightInput !== undefined) {
        const speedLeftRightInput = this._panels.speed.horizontal.node;
        if (speedLeftRightInput !== undefined) {
            speedLeftRightInput.value = (index === 0 ? "0.1" : "0.2");
        }
        this._limits.ratios = UserInterface._ratios[index];
    }

    _load_speech_controls() {
        this._panels.speech.stop.listener = checked => {
            if (checked && this._speech !== null && !this._speakOnStop) {
                this._speech.speak(
                    speechAnnouncement,
                    this._panels.speech.voice.node.selectedIndex
                );
            }
            this._speakOnStop = checked;
        };
        this._panels.speech.voice.listener = index => {
            if (this._speakOnStop && this._speech !== null) {
                this._speech.speak(speechAnnouncement, index);
            }
        };

        new Speech().initialise(speech => {
            this._speech = speech;

            // To Do: Probably disable everything if !speech.available. Maybe
            // add convenience methods to Control to: hide the control. Hiding
            // could work by removing it from its parent ...

            this._panels.speech.stop.active = speech.available;
            if (speech.available) {
                this._panels.speech.voice.optionStrings = speech.voices.map(
                    voice => `${voice.name} (${voice.lang})`);
            }
            else {
                this._panels.speech.voice.optionStrings = [
                    'Speech unavailable'];
            }
        });
    }

    _load_developer_controls() {
        const panel = this._panels.developer;
        panel.pointer.listener = this.clicked_pointer.bind(this);
        panel.random.listener = this.clicked_random.bind(this);
        panel.showDiagnostic.listener = checked => {
            this._limits.showDiagnostic = checked;
            this._diagnostic_div_display();
            if (!checked) {
                this._messageLabel.firstChild.nodeValue = messageLabelText;
            }
        };
        panel.frozen.listener = checked => {
            if (this._controllerPointer === undefined) {
                return;
            }
            this._controllerPointer.frozen = (
                checked ? report => console.log("Frozen", report) : null);
            if (checked) {
                const catcher = document.getElementById("catcher");
                this._frozenClickListener = () => {
                    console.log('catchclick');
                    this._controllerPointer.report_frozen(
                        this.zoomBox, this._limits, false);
                };
                catcher.addEventListener("click", this._frozenClickListener);
            }
            else {
                catcher.removeEventListener("click", this._frozenClickListener);
            }
        };

        this._load_advance_controls();
        this._load_diagnostic();
    }

    _diagnostic_div_display() {
        this._panels.developer.diagnostic.$.piece.node.classList.toggle(
            '_hidden', !this._limits.showDiagnostic);
    }

    _load_advance_controls() {
        const panel = this._panels.developer;
        let testX = 0;
        let testY = 0;
        const updateXY = (x, y) => {
            if (x !== null) { testX = x; }
            if (y !== null) { testY = y; }
            if (this._pointer !== undefined) {
                this._pointer.rawX = testX;
                this._pointer.rawY = testY;    
            }
        };

        panel.x.listener = value => updateXY(value, null);
        panel.y.listener = value => updateXY(null, value);
        panel.advance.listener = () => {
            updateXY(null, null);
            this._start_render(false);
        };
    }

    _load_diagnostic() {
        this._diagnostic_div_display();
        // Diagnostic area in which to display various numbers. This is an array
        // so that the values can be updated.
        const diagnosticSpans = this._panels.developer.diagnostic.$.piece
        .create(
            'span', {}, [
            "loading sizes ...",
            " ", "pointer type", "(" , "X", ", ", "Y", ")",
            " height:", "Height", " ", "Go"
        ]);
        this._sizesTextNode = diagnosticSpans[0].firstChild;
        this._heightTextNode = 
            diagnosticSpans[diagnosticSpans.length - 3].firstChild;
        this._stopGoTextNode = 
            diagnosticSpans[diagnosticSpans.length - 1].firstChild;

        this._diagnosticSpans = diagnosticSpans;
    }

    _load_pointer() {
        // Instantiate the pointer. It will draw the cross hairs and pointer
        // line, always in front of the zoombox as drawn by the viewer.
        this._pointer = new Pointer();
        this._pointer.touchEndCallback = (() => {
            if (
                this._speakOnStop &&
                this.message !== undefined &&
                this.message !== null
            ) {
                this._speech.speak(
                    this.message, this._panels.speech.voice.node.selectedIndex);
            }
        });
        this._diagnosticSpans[2].firstChild.nodeValue = (
            this._pointer.touch ? "touch" : "mouse");
        this._pointer.xTextNode = this._diagnosticSpans[4].firstChild;
        this._pointer.yTextNode = this._diagnosticSpans[6].firstChild;

        this._pointer.activateCallback = this.activate_render.bind(this);
    }

    _load_speed_controls() {
        // Speed controls can only be set up after the pointer has been loaded.

        if (this._keyboardMode) {
            // Can't show settings in input controls in keyboard mode. The input
            // would itself require a keyboard. Set some slower default values.
            this._pointer.multiplierLeftRight = 0.2;
            this._pointer.multiplierUpDown = 0.2;
            this._select_behaviour(1);
            return;
        }

        this._panels.speed.horizontal.listener = value => {
            this._pointer.multiplierLeftRight = value
        };
        this._select_behaviour(0);
        this._panels.speed.vertical.listener = value => {
            this._pointer.multiplierUpDown = value;
        };
    }

    _finish_load() {
        this._limits.svgPiece = this._svg;
        this._on_resize();
        window.addEventListener('resize', this._on_resize.bind(this));

        // Initialise the view. It will insert a couple of SVG groups, and some
        // other business.
        this._view = Viewer.view(this._svg, this._limits);
        //
        // Set the pointer's SVG so it can draw the cross hairs and pointer.
        // Those go last so that they are on top of everything else.
        this._pointer.svgPiece = this._svg;

        // Remove the loading... element and add the proper heading to show that
        // loading has finished.
        if (this._loading !== null) {
            this._loading.remove();
            const h1 = new Piece(
                'h1', undefined, undefined, "Dasher Six beta");
            this._panels.main.$.piece.add_child(h1, false);
        }

        // Previous lines could have changed the size of the svg so, after a
        // time out for rendering, process a resize.
        setTimeout(() => {
            this._on_resize();
            this.clicked_pointer();
        }, 0);

        // Activate intervals and controls.
        this._intervalRender = null;
        this._controlPanel.enable_controls();
    }

    _start_render(continuous) {
        const render_one = () => {
            if (this.zoomBox === null || this._controller === null) {
                return false;
            }

            // Process one control cycle.
            this._controller.control(this.zoomBox, this._limits);
            //
            // Update diagnostic display. The toLocaleString method will insert
            // thousand separators.
            this._heightTextNode.nodeValue = this.zoomBox.height.toLocaleString(
                undefined, {maximumFractionDigits:0});
            //
            // Update message to be the message of whichever box is across the
            // origin.
            const originHolder = this.zoomBox.holder(0, 0);
            if (this._pointer.going && (
                originHolder === undefined || (
                    originHolder !== null && (
                        originHolder.message === null ||
                        originHolder.message === undefined
                    )
                )
            )) {
                console.log(
                    'No message', originHolder,
                    (originHolder === null || originHolder === undefined) ?
                    "N/A" : originHolder.message);
            }
            this.message = (
                originHolder === null ? undefined : originHolder.message);

            // Process one draw cycle.
            this.zoomBox.viewer.draw(this._limits);

            // Check if the root box should change, either to a child or to a
            // previously trimmed parent. Note that the current root should be
            // de-rendered if it is being replace by a child.
            //
            // First, check if a previously trimmed parent should be pulled
            // back.
            let root = this.zoomBox.parent_root(this._limits);
            if (root === null) {
                // If the code gets here then there isn't a parent to pull back.
                // Check if a child of the root should become the root.
                root = this.zoomBox.child_root(this._limits);
                if (root !== null) {
                    // Could de-render by setting this.zoomBox to null and
                    // letting the setter take care of it. However, that would
                    // result in a suspension of the render interval.
                    this.zoomBox.erase();
                }
            }
            else {
                // Previously trimmed parent is being pulled back. Get its
                // dimensions recalculated by the controller.
                this._controller.build(root, this.zoomBox, this._limits);
            }

            if (root !== null) {
                // Invoke setter.
                this.zoomBox = root;
            }

            if (!this._controller.going) {
                this._stop_render();
            }
            return true;
        };

        if (render_one() && continuous) {
            this._stopGoTextNode.nodeValue = "Started";
            this._intervalRender = setInterval(
                render_one, this._transitionMillis);
        }
        else {
            this._stop_render();
        }
    }
    _stop_render() {
        // intervalZoom is undefined only while the initial build of the page is
        // in progress.
        if (this._intervalRender === undefined) {
            return;
        }

        if (this._intervalRender !== null) {
            clearInterval(this._intervalRender);
            this._intervalRender = null;
            this._stopGoTextNode.nodeValue = "Stopped";
            if (this.stopCallback !== null) {
                this.stopCallback();
            }
        }
    }
    activate_render() {
        if (this._intervalRender === undefined) {
            return;
        }

        if (this._intervalRender === null && this.zoomBox !== null) {
            this._start_render(true);
        }
    }

    // Go-Random button was clicked.
    clicked_random() {
        if (this._intervalRender === undefined) {
            return;
        }

        if (Object.is(this._controller, this._controllerRandom)) {
            // Consecutive clicks on this button stop and resume the random
            // movement.
            this._controllerRandom.going = !this._controllerRandom.going;
            this.activate_render();
        }
        else {
            // First click or click after clicking the pointer button. Set up
            // the random moving boxes.
            this._controllerRandom.going = true;
            this._controller = this._controllerRandom;
            this._rootTemplate = this._controller.palette.rootTemplate;
            this._new_ZoomBox(true);
        }

        // The other button will switch to pointer mode.
        this._panels.developer.pointer.node.textContent = "Pointer";

        // This button will either stop or go.
        this._panels.developer.random.node.textContent = (
            this._controllerRandom.going ? "Stop" : "Go Random");
    }

    // Pointer button was clicked.
    clicked_pointer() {
        if (this._intervalRender === undefined) {
            return;
        }

        if (!Object.is(this._controller, this._controllerPointer)) {
            // Current mode is random. Change this button's label to indicate
            // what it does if clicked again.
            this._panels.developer.pointer.node.textContent = "Reset";
        }

        this._controller = this._controllerPointer;
        // Next line will discard the current zoom box, which will effect a
        // reset, if the mode was already pointer.
        this._rootTemplate = this._palette.rootTemplate;
        this._new_ZoomBox(false);

        // The other button will switch to random mode.
        this._panels.developer.random.node.textContent = "Go Random";
    }

    _new_ZoomBox(startRender) {
        // Setter invocation that will de-render the current box, if any.
        this.zoomBox = null;

        // Root template is set at the same time as the controller.
        const zoomBox = new ZoomBox(this._rootTemplate, [], 0, 0);
        zoomBox.viewer = new Viewer(zoomBox, this._view);

        // Setter invocation.
        this.zoomBox = zoomBox;
        
        // The populate() method is async, so that a predictor could be called.
        this._controller.populate(this.zoomBox, this._limits)
        .then(() => this._start_render(startRender))
        .catch(error => {
            // The thrown error mightn't be noticed, if the console isn't
            // visible. So, set it into the message too.
            this.message = `ZoomBox couldn't be made ready.\n${error}`;
            throw error;
        });
    }

    reset() {
        this._new_ZoomBox(false);
    }

    static bbox_text(boundingBox, label) {
        return [
            label === undefined ? '' : label,
            '(',
            ['x', 'y', 'width', 'height']
            .map(property => boundingBox[property].toFixed(2))
            .join(', '),
            ')'
        ].join('');
    }

    get svgRect() {
        return this._svgRect;
    }
    set svgRect(boundingClientRect) {
        this._svgRect = boundingClientRect;
        this._pointer.svgBoundingBox = boundingClientRect;
        this._limits.set(boundingClientRect.width, boundingClientRect.height);
        if (this._view !== undefined) {
            // Redraw the solver-right mask and border.
            Viewer.configure_view(this._view, this._limits);
        }
    }

    _on_resize() {
        this.svgRect = this._svg.node.getBoundingClientRect();

        if (this._controller !== null) {
            this._controller.populate(this.zoomBox, this._limits);
        }

        // Change the svg viewBox so that the origin is in the centre.
        this._svg.node.setAttribute('viewBox',
                `${this.svgRect.width * -0.5} ${this.svgRect.height * -0.5}` +
                ` ${this.svgRect.width} ${this.svgRect.height}`
        );

        // Update the diagnostic display with all the sizes.
        this._sizesTextNode.nodeValue = [
            `window(${window.innerWidth}, ${window.innerHeight})`,
            UserInterface.bbox_text(
                document.body.getBoundingClientRect(), 'body'),
            UserInterface.bbox_text(
                this.svgRect, 'svg')
        ].join(" ");
        // Reference for innerHeight property.
        // https://developer.mozilla.org/en-US/docs/Web/API/Window/innerHeight
    }

}

UserInterface._ratios = [[
    {left:1 / 3, height: 0.01},
    {left:1 / 5, height: 0.05},
    {left:1 / -6, height: 0.5},
    {left:1 / -3, height: 1}
], [
    {left:0.34, height: 0.01},
    {left:0.33, height: 0.02},
    {left:0.16, height: 0.25},
    {left:0, height: 0.475},
    {left:-0.16, height: 1}
]];
