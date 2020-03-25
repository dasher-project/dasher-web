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
import Pointer from './pointer.js';
import ControllerRandom from './controllerrandom.js';
import ControllerPointer from './controllerpointer.js';
import Viewer from './viewer.js';
import ZoomBox from './zoombox.js';
import Predictor from './predictor.js';
import PredictorTest from './predictor_test.js';

import Speech from './speech.js';

import PageBuilder from "../pagebuilder.js";

const messageLabelText = "Message:";

export default class UserInterface {
    constructor(parent) {
        this._parent = parent;
        this._intervalRender = undefined;

        this._keyboardMode = parent.classList.contains("keyboard");

        this._zoomBox = null;
        this._predictors = null;
        this._predictorSelect = null;

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
        this._panels = undefined;
        this._cssNode = document.createElement('style');
        document.head.append(this._cssNode);

        this._speedLeftRightInput = undefined;

        // Spawn and render parameters in mystery SVG units.
        this._spawnMargin = 30;

        this._limits = new Limits();
        // this._limits.ratios = UserInterface._ratios[0];

        this._limits.minimumFontSizePixels = 20;
        this._limits.maximumFontSizePixels = 30;
        this._limits.drawThresholdRect = 10;
        this._limits.spawnThreshold = 4;
        this._limits.textLeft = 5;

        // This value also appears in the userinterface.css file, in the
        // --transition variable, and it's good if they're the same.
        this._transitionMillis = 400;

        this._message = undefined;
        this._messageDisplay = null;
        this._divDiagnostic = null;
        this._controls = [];

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
        this._predictors = predictors;
        if (this._predictorSelect !== null) {
            this._load_predictor_controls();
        }
    }

    load(loadingID, footerID) {
        this._header = new Piece('div', this._parent);
        this._loading = (
            loadingID === null ? null :
            new Piece(document.getElementById(loadingID))
        );

        this._load_message();
        this._load_view();
        this._load_panels();
        if (this._loading !== null) {
            this._panels.main.piece.add_child(this._loading);
        }

        this._load_colours(this._panels.colour.piece);
        this._load_predictors();
        
        this._load_controls();
        const diagnosticSpans = this._load_diagnostic();
        this._load_pointer(diagnosticSpans);
        this._load_settings();

        this._controllerPointer = new ControllerPointer(
            this._pointer, this._get_predictor(0));
    
        // Grab the footer, which holds some small print, and re-insert it. The
        // small print has to be in the static HTML too.
        if (footerID !== null) {
            const footer = document.getElementById(footerID);
            this._parent.appendChild(footer);
        }

        // Next part of loading is after a time out so that the browser gets an
        // opportunity to render the layout first.
        setTimeout(() => this._load1(), 0);

        // To-do: should be an async function that returns a promise that
        // resolves to this.
        return this;
    }

    _load_panels() {
        const parentPiece = this._keyboardMode ? undefined : this._header;
        this._panels = {};
        const selectors = new Piece('div', parentPiece);
        selectors.node.classList.add('header__selectors');
        [
            'main', 'colour', 'speed', 'speech', 'developer'
        ].forEach(panelLabel => {
            const piece = new Piece('div', parentPiece);
            piece.node.classList.add('header__panel');
            this._panels[panelLabel] = {
                "piece": piece,
                "selector": this._load_button(
                    panelLabel[0].toLocaleUpperCase() + panelLabel.slice(1),
                    selectors, this._select_panel.bind(this, panelLabel)
                )
            };
        });
        this._select_panel('main');
    }
    _select_panel(label) {
        for(const [panelLabel, panel] of Object.entries(this._panels)) {
            // console.log('selecting', panelLabel, panelLabel === label);
            panel.piece.node.classList.toggle(
                'header__panel_selected', panelLabel === label);
            panel.selector.classList.toggle(
                'header__selector_selected', panelLabel === label);
        }
    }
    
    _load_colours(parentPiece) {
        [
            ['Capital', "#ffff00"],
            ['Small', "#00BFFF"]
        ].forEach(([label, value]) => {
            // const inserted = node.sheet.insertRule(
            //     "#message-holder label {background-color: pink;}");
            // const inserted2 = node.sheet.insertRule(
            //     "rect.capital {fill: cyan;}");
            // console.log(inserted, inserted2, node.sheet.cssRules.length);
            const name = label.toLowerCase();
            const sheet = this._cssNode.sheet;
            const inserted = sheet.insertRule(
                `rect.${name} {fill: ${value};}`, sheet.cssRules.length);
            // console.log(inserted, name);

            this._load_input(
                parentPiece, 'color', name, `${label}:`, changed => {
                    // console.log(changed);
                    sheet.deleteRule(inserted);
                    sheet.insertRule(
                        `rect.${name} {fill: ${changed};}`, inserted);
                    // console.log(sheet.cssRules);
                }, value
            );
        });
    }

    _load_predictors() {
        if (this.predictors === null || this.predictors.length <= 0) {
            this.predictors = [{
                "label": "None", "item": new Predictor()
            }, {
                "label": "Random", "item": new PredictorTest()
            }];
        }
    }
    _get_predictor(index) {
        const predictor = this.predictors[index].item;
        return predictor.get.bind(predictor);
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

    _load_controls() {
        if (this._keyboardMode) {
            this._limits.showDiagnostic = false;
            this._load_predictor_controls(this._header);
            return;
        }
        this._buttonPointer = this._load_button(
            "Pointer", this._panels.main.piece, () => this.clicked_pointer());

        this._buttonRandom = this._load_button(
            "Go Random", this._panels.developer.piece,
            () => this.clicked_random());
        this._load_input(
            this._panels.developer.piece,
            "checkbox", "show-diagnostic", "Show diagnostic",
            checked => {
                this._limits.showDiagnostic = checked;
                this._diagnostic_div_display();
                if (!checked) {
                    this._messageLabel.firstChild.nodeValue = messageLabelText;
                }
            }, false);
        
        this._load_input(
            this._panels.developer.piece, "checkbox", "frozen", "Frozen",
            checked => {
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
                    catcher.addEventListener(
                        "click", this._frozenClickListener);
                }
                else {
                    catcher.removeEventListener(
                        "click", this._frozenClickListener);
                }
            }, false);

            this._load_predictor_controls(this._panels.main.piece);
            this._load_behaviours(this._panels.main.piece);

        new Speech().initialise(this._load_speech.bind(this));
    }

    _diagnostic_div_display() {
        const diagnosticDiv = this._divDiagnostic;
        if (diagnosticDiv !== null) {
            diagnosticDiv.node.classList.toggle(
                '_hidden', !this._limits.showDiagnostic);
        }
    }

    _load_input(parentPiece, type, identifier, label, callback, initialValue) {
        const attributes = {
            'type':type, 'disabled': true,
            'id':identifier, 'name':identifier
        };

        if (type === "checkbox" && initialValue) {
            attributes.checked = true;
            // else omit the `checked` attribute so that the check box starts
            // clear.
        }

        // TOTH https://github.com/sjjhsjjh/blender-driver/blob/master/user_interface/demonstration/UserInterface.js#L96
        const isFloat = (
            type === "number" && initialValue !== undefined &&
            initialValue.includes("."));
        const parsedValue = (
            initialValue === undefined ? undefined : (
                type === "number" ? (
                    isFloat ? parseFloat(initialValue) : parseInt(initialValue)
                ) : initialValue
            )
        );
        if (parsedValue !== undefined) {
            attributes.value = parsedValue;
        }
        if (type === "number") {
            attributes.step = isFloat ? 0.1 : 1;
        }

        const labelFirst = (type !== "checkbox" && type !== "number");
        if (labelFirst) {
            parentPiece.create('label', {'for':identifier}, label);
        }
        const control = parentPiece.create('input', attributes);
        this._controls.push(control);
        if (parsedValue !== undefined) {
            control.value = parsedValue;
        }
        if (!labelFirst) {
            parentPiece.create('label', {'for':identifier}, label);
        }

        if (initialValue !== undefined) {
            callback(initialValue);
        }

        if (type === "checkbox") {
            control.addEventListener(
                'change', (event) => callback(event.target.checked));
        }
        else {
            control.addEventListener(
                'change', (event) => callback(event.target.value));
        }

        return control;
    }

    _load_button(label, parentPiece, callback) {
        const button = PageBuilder.add_button(label, parentPiece.node);
        button.setAttribute('disabled', true);
        button.addEventListener('click', callback);
        this._controls.push(button);
        return button;
    }

    _load_speech(speech) {
        if (this._speech === null) {
            this._speech = speech;
            this._speakCheckbox = this._load_input(
                this._panels.speech.piece, "checkbox", "speak", "Speak on stop",
                checked => {
                    if (checked && !this._speakOnStop) {
                        speech.speak("Speech is now active.");
                    }
                    this._speakOnStop = checked;
                }, false);
            this._voiceSelect = new Piece(
                this._panels.speech.piece.create('select'));
            this._voiceSelect.node.addEventListener('input', () => {
                if (this._speakOnStop) {
                    speech.speak(
                        "Speech is now active.",
                        this._voiceSelect.node.selectedIndex);
                }
            });
        }
        
        if (speech.available) {
            this._speakCheckbox.removeAttribute('disabled');
            this._voiceSelect.remove_childs();
            speech.voices.forEach(voice => {
                this._voiceSelect.create(
                    'option', undefined, `${voice.name} (${voice.lang})`);
            });
        }
    }

    _load_predictor_controls(parentPiece) {
        if (this._predictorSelect === null) {
            const identifier = 'prediction-select';
            parentPiece.create('label', {'for':identifier}, "Prediction:");
            this._predictorSelect = new Piece(parentPiece.create('select', {
                'id': identifier, 'name': identifier //,  'disabled': true
            }));
            // this._controls.push(this._predictorSelect);
            this._predictorSelect.node.addEventListener('input', event => {
                if (this._controllerPointer !== undefined) {
                    this._controllerPointer.predictor = this._get_predictor(
                        event.target.selectedIndex);
                }
            });
        }

        this._predictorSelect.remove_childs();
        this.predictors.forEach(predictor =>
            this._predictorSelect.node.add(new Option(predictor.label))
        );
    }

    _load_behaviours(parentPiece) {
        const identifier = 'behaviour-select';
        parentPiece.create('label', {'for':identifier}, "Behaviour:");
        const behaviourSelect = parentPiece.create('select', {
            'disabled': true, 'id':identifier, 'name':identifier});
        this._controls.push(behaviourSelect);
        behaviourSelect.addEventListener('input', event => 
            this._select_behaviour(event.target.selectedIndex));

        ["A", "B"].forEach(optionLabel => {
            behaviourSelect.add(new Option(optionLabel));
        });

    }

    _select_behaviour(index) {
        this._limits.targetRight = (index === 0);
        this._pointer.multiplierLeftRight = (index === 0 ? 0.1 : 0.2);
        this._speedLeftRightInput.value = (index === 0 ? "0.1" : "0.2");
        this._limits.ratios = UserInterface._ratios[index];
    }

    _load_settings() {
        if (this._keyboardMode) {
            // Can't show settings in input controls in keyboard mode. The input
            // would itself require a keyboard. Set some slower default values.
            this._pointer.multiplierLeftRight = 0.2;
            this._pointer.multiplierUpDown = 0.2;
            return;
        }

        this._panels.speed.piece.create('span', {}, "Speed:");
        this._speedLeftRightInput = this._load_input(
            this._panels.speed.piece, "number", "multiplier-left-right", "Left-Right",
            value => this._pointer.multiplierLeftRight = value, "0.2");
        this._select_behaviour(0);
        this._load_input(
            this._panels.speed.piece, "number", "multiplier-up-down", "Up-Down",
            value => this._pointer.multiplierUpDown = value, "0.2");
    }

    _load_diagnostic() {
        this._divDiagnostic = new Piece('div', this._panels.developer.piece);
        // Diagnostic area in which to display various numbers. This is an array
        // so that the values can be updated.
        this._diagnostic_div_display();
        const diagnosticSpans = this._divDiagnostic.create('span', {}, [
            "loading sizes ...",
            " ", "pointer type", "(" , "X", ", ", "Y", ")",
            " height:", "Height", " ", "Go"
        ]);
        this._sizesTextNode = diagnosticSpans[0].firstChild;
        this._heightTextNode = 
            diagnosticSpans[diagnosticSpans.length - 3].firstChild;
        this._stopGoTextNode = 
            diagnosticSpans[diagnosticSpans.length - 1].firstChild;
        return diagnosticSpans;
    }

    _load_view() {
        // This element is the root of the whole zooming area.
        this._svg = new Piece('svg', this._parent);
        // Touching and dragging in a mobile web view will scroll or pan the
        // screen, by default. Next line suppresses that. Reference:
        // https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action
        this._svg.node.style['touch-action'] = 'none';
    }

    _load_pointer(diagnosticSpans) {
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
                    this.message, this._voiceSelect.node.selectedIndex);
            }
        });
        diagnosticSpans[2].firstChild.nodeValue = (
            this._pointer.touch ? "touch" : "mouse");
        this._pointer.xTextNode = diagnosticSpans[4].firstChild;
        this._pointer.yTextNode = diagnosticSpans[6].firstChild;

        this._pointer.activateCallback = this.activate_render.bind(this);
    }

    _load1() {
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
            this._panels.main.piece.add_child(h1, false);
        }

        // Previous lines could have changed the size of the svg so, after a
        // time out for rendering, process a resize.
        setTimeout(() => {
            this._on_resize();
            if (this._keyboardMode) {
                this.clicked_pointer();
            }
        }, 0);

        // Activate intervals and controls.
        this._intervalRender = null;
        this._controls.forEach(control => control.removeAttribute('disabled'));
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
            // previously trimmed parent. Note that the current root should
            // be de-rendered if it is being replace by a child.
            let root = this.zoomBox.parent_root(this._limits);
            if (root === null) {
                root = this.zoomBox.child_root(this._limits);
                if (root !== null) {
                    // Could de-render by setting this.zoomBox to null and
                    // letting the setter take care of it. However, that would
                    // result in a suspension of the render interval.
                    this.zoomBox.erase();
                }
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
            this._new_ZoomBox(true);
        }

        // The other button will switch to pointer mode.
        this._buttonPointer.textContent = "Pointer";

        // This button will either stop or go.
        this._buttonRandom.textContent = (
            this._controllerRandom.going ? "Stop" : "Go Random");
    }

    clicked_pointer() {
        if (this._intervalRender === undefined) {
            return;
        }

        if (!Object.is(this._controller, this._controllerPointer)) {
            // Current mode is random. Change this button's label to indicate
            // what it does if clicked again.
            if (!this._keyboardMode) {
                this._buttonPointer.textContent = "Reset";
            }
        }

        this._controller = this._controllerPointer;
        // Next line will discard the current zoom box, which will effect a
        // reset, if the mode was already pointer.
        this._new_ZoomBox(false);

        // The other button will switch to random mode.
        if (!this._keyboardMode) {
            this._buttonRandom.textContent = "Go Random";
        }
    }

    _new_ZoomBox(startRender) {
        // Setter invocation that will de-render the current box, if any.
        this.zoomBox = null;

        const zoomBox = new ZoomBox(this._controller.rootSpecification);
        zoomBox.spawnMargin = this._spawnMargin;
        zoomBox.viewer = new Viewer(zoomBox, this._view);

        this._set_zoomBox_size(zoomBox);

        this.zoomBox = zoomBox;
        
        this.zoomBox.ready
        .then(ready => {
            if (ready) {
                this._controller.populate(zoomBox, this._limits);
                this._start_render(startRender);
            }
            else {
                throw new Error("ZoomBox ready false.")
            }
         })
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
        this._set_zoomBox_size(this.zoomBox);
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
    _set_zoomBox_size(zoomBox) {
        if (Object.is(this._controller, this._controllerPointer)) {
            // Comment out one or other of the following.

            // // Set left; solve height.
            // const width = this._spawnMargin * 2;
            // const left = this._limits.right - width;
            // const height = this._limits.solve_height(left);

            // Set height; solve left.
            const height = this.svgRect.height / 4;
            const left = this._limits.solve_left(height);
            const width = this._limits.right - left;

            zoomBox.set_dimensions(left, width, 0, height);
        }
        else if (Object.is(this._controller, this._controllerRandom)) {
            zoomBox.set_dimensions(
                this.svgRect.width * -0.5,
                this.svgRect.width,
                0, this.svgRect.height
            );
        }
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
