// (c) 2019 Jim Hawkins. MIT licensed, see https://opensource.org/licenses/MIT

// This script gets run by inclusion in a script tag in the index.html file.
// It has to have type="module" because it imports other modules. Structure is:
//
// 1.  Import statements.
// 2.  Class definition.
// 3.  Set the body onload to a function that instantiates the class.
//

import Piece from './piece.js';
import Pointer from './pointer.js';
import ZoomBoxRandom from './zoomboxrandom.js';
import ZoomBoxPointer from './zoomboxpointer.js';

class Index {
    constructor(parent) {
        this._parent = parent;
        this._intervalRender = undefined;

        this._zoomBoxRandom = null;
        this._zoomBoxPointer = null;
        this._zoomBox = null;

        // Spawn and render parameters in mystery SVG units.
        this._spawnMargin = 30;
        this._spawnHeight = 300;
        this._renderHeightThreshold = 20;

        this._ratios = [
            {left:1 / 2, height: 0.01},
            {left:1 / 5, height: 0.05},
            {left:1 / -6, height: 0.5},
            {left:1 / -3, height: 1}            
        ];

        // This value also appears in the index.css file, in the --transition
        // variable, and it's good if they're the same.
        this._transitionMillis = 400;

        this._randomStopped = false;
        this._message = undefined;
        this._messageDisplay = null;

        this._svgRect = undefined;
        this._renderLimits = undefined;
        this._heightGradientPolyline = null;
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

        if (newBox === null) {
            this._stop_render();
        }

        // De-render current zoomBox, if appropriate.
        if (oldBox !== null && newBox === null) {
            oldBox.render(null);
        }

        // Set underlying property.
        this._zoomBox = newBox;

        if (newBox === null) {
            return;
        }

        newBox.controller = this._pointer;
        newBox.manager = this;
        if (oldBox === null) {
            this._start_render();
        }
    }

    get randomStopped() {
        return this._randomStopped;
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
            " ", "pointer type", "(" , "X", ",", "Y", ")", " height:", "Height"
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
        this._controlShowDiagnostic.addEventListener('change', (event) => {
            if (this._renderLimits !== undefined) {
                this._renderLimits.showDiagnostic = event.target.checked;
                this._show_limits(this._renderLimits);
            }
        });

        this._buttonRandom = this._header.create(
            'button', {'type': 'button', 'disabled': true}, 'Go Random');
        this._buttonRandom.addEventListener(
            'click', () => this.toggle_random());

        this._buttonPointer = this._header.create(
            'button', {'type': 'button', 'disabled': true}, 'Pointer');
        this._buttonPointer.addEventListener(
            'click', () => this.toggle_pointer());

        this._svg = new Piece('svg', this._parent);
        // Touching and dragging in a mobile web view will scroll or pan the
        // screen, by default. Next line suppresses that. Reference:
        // https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action
        this._svg.node.style['touch-action'] = 'none';

        // Add an SVG group to hold the root zoom box first. The cross hairs and
        // pointer line will always be rendered in front of it.
        this._zoomBoxGroup = new Piece('g', this._svg);

        // Cross hair axis lines.
        this._svg.create('line', {
            x1:"0", y1:"-50%", x2:"0", y2:"50%",
            stroke:"black", "stroke-width":"1px"
        });
        this._svg.create('line', {
            x1:"-50%", y1:"0", x2:"50%", y2:"0",
            stroke:"black", "stroke-width":"1px"
        });

        this._pointer = new Pointer(this._svg);
        diagnosticSpans[2].firstChild.nodeValue = (
            this._pointer.touch ? "touch" : "mouse");
        this._pointer.xTextNode = diagnosticSpans[4].firstChild;
        this._pointer.yTextNode = diagnosticSpans[6].firstChild;
    
        // Add a rect to catch all touch events. If the original target of a
        // touch start is removed from the document, a touch end doesn't get
        // sent. This means that the rect elements in the zoom UI can't be
        // allowed to receive touch starts.  
        // The catcher can't have fill:none because then it doesn't receive
        // touch events at all. So, it has an opacity of zero.  
        // The touch handlers are attached to the svg element, even so, the
        // event will get handled down in the SVG elements.
        this._svg.create('rect', {
            x:"-50%", y:"-50%", width:"100%", height:"100%", id:"catcher",
            'fill-opacity':0
        })

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

    _start_render() {
        const render_one = () => {
            if (this.zoomBox === null) {
                return false;
            }
            const rootBox = this.zoomBox.render(
                this._zoomBoxGroup.node, null, this._renderLimits, 0);
            this._heightTextNode.nodeValue = this.zoomBox.height.toLocaleString(
                undefined, {maximumFractionDigits:0});

            if (rootBox !== null) {
                // Invoke setter.
                this.zoomBox = rootBox;
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
        // intervalZoom is undefined just while the initial build of the page is
        // in progress.
        if (this._intervalRender === undefined) {
            return;
        }

        if (this._intervalRender !== null) {
            clearInterval(this._intervalRender);
            this._intervalRender = null;
        }
    }

    toggle_random() {
        if (this._intervalRender === undefined) {
            return;
        }
        if (this._zoomBoxRandom === null) {
            this._zoomBoxRandom = new ZoomBoxRandom(
                "abcdefghijklmnopqrstuvwxyz".split(""));
            this._set_zoomBox_size(this._zoomBoxRandom);
        }
        const changeType = !this._already(this._zoomBoxRandom);

        this._buttonPointer.textContent = "Pointer";

        if (changeType) {
            this._randomStopped = false;
            // Invoke setter.
            this.zoomBox = null;
        }
        else {
            this._randomStopped = !this._randomStopped;
        }

        this.zoomBox = this._zoomBoxRandom;
        this._buttonRandom.textContent = (
            this._randomStopped ? "Go Random" : "Stop");
    }

    toggle_pointer() {
        if (this._intervalRender === undefined) {
            return;
        }

        if (this._zoomBoxPointer === null) {
            this._new_ZoomBoxPointer();
        }
        const changeType = !this._already(this._zoomBoxPointer);

        this._buttonRandom.textContent = "Go Random";

        if (changeType) {
            this._buttonPointer.textContent = "Reset";
        }
        else {
            // Reset action.
            this._new_ZoomBoxPointer();
        }
        // Invoke setter twice.
        this.zoomBox = null;
        this.zoomBox = this._zoomBoxPointer;
    }
    _new_ZoomBoxPointer() {
        const zoomBox = new ZoomBoxPointer(
            "abcdefghijklmnopqrstuvwxyz".split(""), "", 'silver');
        zoomBox.controller = this._pointer;
        zoomBox.manager = this;
        zoomBox.spawnMargin = this._spawnMargin;
        zoomBox.spawnHeight = this._spawnHeight;
        zoomBox.renderHeightThreshold = this._renderHeightThreshold;

        this._set_zoomBox_size(zoomBox);

        zoomBox.arrange_children(this._renderLimits);

        this._zoomBoxPointer = zoomBox;
    }

    _already(zoomBox) {
        return Object.is(this.zoomBox, zoomBox);
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

        if (this._renderLimits === undefined) {
            this._renderLimits = {};
        }
        Object.assign(this._renderLimits, {
            "top": boundingClientRect.height / -2,
            "bottom":  boundingClientRect.height / 2,
            "height":  boundingClientRect.height,
            "left": boundingClientRect.width / -2,
            "right": boundingClientRect.width / 2,
            "width": boundingClientRect.width,
        });
        this._renderLimits.gradients = this._ratios.map(({left, height}) => {
            return {
                "left": boundingClientRect.width * left,
                "height": boundingClientRect.height * height
            };
        }).sort((first, second) => first.left - second.left);
        // Previous line will sort from lowest to highest. In practice, lowest
        // means most negative. The left-most will be gradients[0].

        this._show_limits(this._renderLimits);
    }

    _show_limits(limits) {
        this._heightGradientPolyline = Piece.toggle(
            this._heightGradientPolyline, limits.showDiagnostic, () =>
            new Piece('polyline', this._svg, {
                "points":"", "stroke":"green", "stroke-width":"1px",
                "fill": "none"
            })
        );

        if (this._heightGradientPolyline === null) {
            return;
        }
        
        this._heightGradientPolyline.set_attributes({"points":[
            ...Array.from(this._renderLimits.gradients,
                ({left, height}) => {return {
                    "left": left, "height": height / -2
                };}),
            ...Array.from(this._renderLimits.gradients,
                ({left, height}) => {return {
                    "left": left, "height": height / 2
                };}).reverse()
        ].reduce(
            (accumulated, {left, height}) => `${accumulated} ${left},${height}`,
            "")
        });
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
        if (zoomBox instanceof ZoomBoxPointer) {
            // Comment out one or other of the following.

            // // Set left; solve height.
            // const width = this._spawnMargin * 2;
            // const left = this._renderLimits.right - width;
            // const height = zoomBox.solve_height(left, this._renderLimits);

            // Set height; solve left.
            const height = this.svgRect.height / 4;
            const left = zoomBox.solve_left(height, this._renderLimits);
            const width = this._renderLimits.right - left;

            zoomBox.set_dimensions(left, width, 0, height);
        }
        else if (zoomBox instanceof ZoomBoxRandom) {
            zoomBox.set_dimensions(
                this.svgRect.width * -0.5,
                this.svgRect.width,
                0, this.svgRect.height
            );
        }
        else {
            return;
        }
    }

    _load1() {
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
}

document.body.onload = () => {
    const ui = document.getElementById('user-interface');
    const index = new Index(ui).load('loading', 'small-print');
}
