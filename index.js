// (c) 2019 Jim Hawkins. MIT licensed, see https://opensource.org/licenses/MIT

/*
This script gets run by inclusion in a script tag in the index.html file. It has
to have type="module" because it imports other modules. Structure is:

1.  Import statements.
2.  Class definition.
3.  Set the body onload to a function that instantiates the class.

*/

import Limits from './limits.js';
import Piece from './piece.js';
import Pointer from './pointer.js';
import ControllerRandom from './controllerrandom.js';
import ControllerPointer from './controllerpointer.js';
import ZoomBox from './zoombox.js';

class Index {
    constructor(parent) {
        this._parent = parent;
        this._intervalRender = undefined;

        this._zoomBox = null;

        this._controllerRandom = new ControllerRandom(
            "abcdefghijklmnopqrstuvwxyz".split(""));
        // Pointer controller will need a Pointer and it isn't set up until the
        // load().
        this._controllerPointer = undefined;
        this._controller = null;

        // Spawn and render parameters in mystery SVG units.
        this._spawnMargin = 30;
        this._renderHeightThreshold = 20;

        this._limits = new Limits();
        this._limits.ratios = [
            {left:1 / 2, height: 0.01},
            {left:1 / 5, height: 0.05},
            {left:1 / -6, height: 0.5},
            {left:1 / -3, height: 1}            
        ];

        // This value also appears in the index.css file, in the --transition
        // variable, and it's good if they're the same.
        this._transitionMillis = 400;

        this._message = undefined;
        this._messageDisplay = null;

        this._svgRect = undefined;
    }

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
                oldBox.render(null);
            }
        }
        else {
            if (oldBox === null) {
                // Transition from null to non-null, start the render interval.
                this._start_render();
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
        this._messageDisplay.node.textContent = (
            message === undefined ? null : message);
    }

    load(loadingID, footerID) {
        this._header = new Piece('div', this._parent);
        this._loading = new Piece(document.getElementById(loadingID));
        this._header.add_child(this._loading);

        // Textarea in which the message is displayed.
        this._messageDiv = new Piece(
            'div', this._header, {'id':"message-holder"});
        const identifierMessage = "message";
        this._messageDiv.create('label', {'for':identifierMessage}, "Message:");
        this._messageDisplay = new Piece('textarea', this._messageDiv, {
            'id':identifierMessage, 'name':identifierMessage, 'readonly':true,
            'rows':6, 'cols':24,
            'placeholder':"Message will appear here ..."
        });

        // Diagnostic area in which to display various numbers. This is an array
        // so that the values can be updated.
        const diagnosticDiv = new Piece('div', this._header);
        const diagnosticSpans = diagnosticDiv.create('span', {}, [
            "loading sizes ...",
            " ", "pointer type", "(" , "X", ", ", "Y", ")", " height:", "Height"
        ]);
        this._sizesTextNode = diagnosticSpans[0].firstChild;
        this._heightTextNode = 
            diagnosticSpans[diagnosticSpans.length - 1].firstChild;

        // Controls.
        const identifierShowDiagnostic = "show-diagnostic";
        this._controlShowDiagnostic = this._header.create(
            'input', {
                'type':'checkbox',
                'id':identifierShowDiagnostic,
                'name':identifierShowDiagnostic,
                'disabled': true
            }
        );
        this._header.create('label', {
            'for':identifierShowDiagnostic
        }, "Show diagnostic");
        this._controlShowDiagnostic.addEventListener('change', (event) => 
            this._limits.showDiagnostic = event.target.checked
        );

        this._buttonRandom = this._header.create(
            'button', {'type': 'button', 'disabled': true}, 'Go Random');
        this._buttonRandom.addEventListener(
            'click', () => this.clicked_random());

        this._buttonPointer = this._header.create(
            'button', {'type': 'button', 'disabled': true}, 'Pointer');
        this._buttonPointer.addEventListener(
            'click', () => this.clicked_pointer());

        this._svg = new Piece('svg', this._parent);
        // Touching and dragging in a mobile web view will scroll or pan the
        // screen, by default. Next line suppresses that. Reference:
        // https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action
        this._svg.node.style['touch-action'] = 'none';

        // Add an SVG group to hold the root zoom box first. The cross hairs and
        // pointer line will always be rendered in front of it.
        this._zoomBoxGroup = new Piece('g', this._svg);

        this._pointer = new Pointer(this._svg);
        diagnosticSpans[2].firstChild.nodeValue = (
            this._pointer.touch ? "touch" : "mouse");
        this._pointer.xTextNode = diagnosticSpans[4].firstChild;
        this._pointer.yTextNode = diagnosticSpans[6].firstChild;
        this._pointer.multiplierLeftRight = 0.3;
        this._pointer.multiplierUpDown = 0.3;

        this._controllerPointer = new ControllerPointer(
            this._pointer, "abcdefghijklmnopqrstuvwxyz".split(""));
    
        // Grab the footer, which holds some small print, and re-insert it. The
        // small print has to be in the static HTML too.
        const footer = document.getElementById(footerID);
        this._parent.appendChild(footer);

        // Next part of loading is after a time out so that the browser gets an
        // opportunity to render the layout first.
        setTimeout(() => this._load1(footerID), 0);

        // To-do: should be an async function that returns a promise that
        // resolves to this.
        return this;
    }

    _load1() {
        this._limits.svgPiece = this._svg;
        this._on_resize();
        window.addEventListener('resize', this._on_resize.bind(this));

        // Remove the loading... element and add the proper heading to show that
        // loading has finished.
        this._loading.remove();
        const h1 = Piece.create('h1', undefined, undefined, "Proof of Concept");
        this._messageDiv.node.insertAdjacentElement('afterend', h1);

        // Previous lines could have changed the size of the svg so, after a
        // time out for rendering, process a resize.
        setTimeout( () => this._on_resize(), 0);

        // Activate intervals and controls.
        this._intervalRender = null;
        [
            this._buttonRandom, this._buttonPointer, this._controlShowDiagnostic
        ].forEach(control => control.removeAttribute('disabled'));
    }

    _start_render() {
        const render_one = () => {
            if (this.zoomBox === null || this._controller === null) {
                return false;
            }

            // Process one control cycle.
            this._controller.control(this.zoomBox, this._limits);
            //
            // Update diagnostic display.
            this._heightTextNode.nodeValue = this.zoomBox.height.toLocaleString(
                undefined, {maximumFractionDigits:0});
            //
            // Update message to be the message of whichever box is across the
            // origin.
            const originHolder = this.zoomBox.origin_holder();
            this.message = (
                originHolder === null ? undefined : originHolder.message);

            // Process one render cycle.
            this.zoomBox.render(this._zoomBoxGroup.node, null, this._limits, 0);

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
                    this.zoomBox.render(null);
                }
            }

            if (root !== null) {
                // Invoke setter.
                this.zoomBox = root;
            }

            return true;
        };

        if (render_one()) {
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
        }
        else {
            // First click or click after clicking the pointer button. Set up
            // the random moving boxes.
            this._controllerRandom.going = true;
            this._controller = this._controllerRandom;
            this._new_ZoomBox();
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
            this._buttonPointer.textContent = "Reset";
        }

        this._controller = this._controllerPointer;
        // Next line will discard the current zoom box, which will effect a
        // reset, if the mode was already pointer.
        this._new_ZoomBox();

        // The other button will switch to random mode.
        this._buttonRandom.textContent = "Go Random";
    }

    _new_ZoomBox() {
        // Setter invocation that will de-render the current box, if any.
        this.zoomBox = null;

        const zoomBox = new ZoomBox(this._controller.rootSpecification);
        zoomBox.spawnMargin = this._spawnMargin;
        zoomBox.renderHeightThreshold = this._renderHeightThreshold;

        this._set_zoomBox_size(zoomBox);

        this._controller.populate(zoomBox, this._limits);

        this.zoomBox = zoomBox;
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
            Index.bbox_text(document.body.getBoundingClientRect(), 'body'),
            Index.bbox_text(this.svgRect, 'svg')
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

document.body.onload = () => {
    const ui = document.getElementById('user-interface');
    const index = new Index(ui).load('loading', 'small-print');
}
