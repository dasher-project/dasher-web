// (c) 2019 Jim Hawkins. MIT licensed, see https://opensource.org/licenses/MIT

import Piece from './piece.js';
import ZoomBoxRandom from './zoomboxrandom.js';
import ZoomBoxPointer from './zoomboxpointer.js';

class Index {
    constructor(parent) {
        this._parent = parent;
        this._intervalZoom = undefined;

        this._zoomBoxRandom = undefined;
        this._zoomBoxPointer = undefined;
        this._zoomBox = undefined;

        this._pointerX = 0;
        this._pointerY = 0;
    }

    get zoomBox() {
        return this._zoomBox;
    }
    set zoomBox(zoomBox) {
        // Setting to the same value, do nothing.
        if (Object.is(this._zoomBox, zoomBox)) {
            return;
        }

        if (!!this._intervalZoom) {
            clearInterval(this._intervalZoom);
            this._intervalZoom = null;
        }

        // De-render current zoomBox, if any.
        if (!!this._zoomBox) {
            this._zoomBox.render(null);
        }

        // Set underlying property.
        this._zoomBox = zoomBox;

        if (!!this._zoomBox) {
            this._zoomBox.render(this._svg);

            // Move the ZoomBox SVG group to be first so that the cross hairs
            // and pointer line will always be rendered in front of them.
            this._svg.node.insertBefore(
                this._zoomBox.piece.node, this._svg.node.firstChild);
        }
    }

    get pointerX() {
        return this._pointerX;
    }

    get pointerY() {
        return this._pointerY;
    }

    load(loadingID, footerID) {
        // Create a diagnostic area in which to display a bunch of numbers.
        this._header = new Piece('div', this._parent);
        this._loading = new Piece(document.getElementById(loadingID));
        this._header.add_child(this._loading);

        this._sizesTextNode = this._header.create(
            'span', {id:"sizes-text-node"}, "loading sizes ..."
        ).firstChild;

        this._buttonRandom = this._header.create(
            'button', {'type': 'button', 'disabled': true}, 'Go Random');
        this._buttonRandom.addEventListener('click', () => this.toggle_zooms());

        this._buttonPointer = this._header.create(
            'button', {'type': 'button', 'disabled': true}, 'Pointer');
        this._buttonPointer.addEventListener('click', () => this.pointer());

        // TOTH https://github.com/patrickhlauke/touch
        this._touch = 'ontouchstart' in window;

        const spans = this._header.create('span', {}, [
                this._touch ? "touch " : "mouse ", "X", ",", "Y"
        ]);
        this._xTextNode = spans[1].firstChild;
        this._yTextNode = spans[3].firstChild;

        this._svg = new Piece('svg', this._parent);
        // Touching and dragging in a mobile web view will scroll or pan the
        // screen, by default. Next line suppresses that. Reference:
        // https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action
        this._svg.node.style['touch-action'] = 'none';

        // Cross hair axis lines.
        this._svg.create('line', {
            x1:"0", y1:"-50%", x2:"0", y2:"50%",
            stroke:"black", "stroke-width":"1px"
        });
        this._svg.create('line', {
            x1:"-50%", y1:"0", x2:"50%", y2:"0",
            stroke:"black", "stroke-width":"1px"
        });
        // Add the pointer line, which will start at the origin and end wherever
        // the pointer happens to be.
        this._pointerLine = this._svg.create('line', {
            x1:"0", y1:"0", x2:"0", y2:"0",
            stroke:"red", "stroke-width":"1px"
        });

        const footer = document.getElementById(footerID);
        this._parent.appendChild(footer);

        // Next part of loading is after a time out so that the browser gets an
        // opportunity to render the layout.
        setTimeout(() => this._load1(footerID), 0);

        // To-do: should be an async function that returns a promise that
        // resolves to this.
        return this;
    }

    toggle_zooms() {
        if (this._intervalZoom === undefined) {
            return;
        }
        if (this._zoomBoxRandom === undefined) {
            this._zoomBoxRandom = new ZoomBoxRandom(
                "abcdefghijklmnopqrstuvwxyz".split(""), 30);
            this._set_zoomBox_size(this._zoomBoxRandom);
        }

        // Invoke setter and clear interval if different.
        this.zoomBox = this._zoomBoxRandom;
        this._buttonPointer.textContent = "Pointer";

        if (this._intervalZoom === null) {
            this._zoomBoxRandom.random_zooms();
            this._intervalZoom = setInterval(
                () => this._zoomBoxRandom.random_zooms(), 180);
            this._buttonRandom.textContent = "Stop";
        }
        else {
            clearInterval(this._intervalZoom);
            this._intervalZoom = null;
            this._buttonRandom.textContent = "Go Random";
        }
    }

    pointer() {
        if (this._intervalZoom === undefined) {
            return;
        }

        if (this._zoomBoxPointer === undefined) {
            this._zoomBoxPointer = new ZoomBoxPointer(
                "abcdefghijklmnopqrstuvwxyz".split(""), this);
            this._set_zoomBox_size(this._zoomBoxPointer);
        }
        const alreadyPointer = Object.is(this._zoomBox, this._zoomBoxPointer);

        // Invoke setter and clear interval if different.
        this.zoomBox = this._zoomBoxPointer;
        this._buttonRandom.textContent = "Go Random";

        if (alreadyPointer) {
            this._set_zoomBox_size(this.zoomBox);
            this.zoomBox.reset();
        }
        else {
            this._zoomBoxPointer.zoom();
            this._intervalZoom = setInterval(
                () => this._zoomBoxPointer.zoom(), 180);
            this._buttonPointer.textContent = "Reset";
        }
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

    _on_resize() {
        this._svgRect = this._svg.node.getBoundingClientRect();
        this._set_zoomBox_size(this._zoomBox);
        // Change the svg viewBox so that the origin is in the centre.
        this._svg.node.setAttribute('viewBox',
                `${this._svgRect.width * -0.5} ${this._svgRect.height * -0.5}` +
                ` ${this._svgRect.width} ${this._svgRect.height}`
        );

        // Update the diagnostic display with all the sizes.
        this._sizesTextNode.nodeValue = [
            `window(${window.innerWidth}, ${window.innerHeight})`,
            Index.bbox_text(document.body.getBoundingClientRect(), 'body'),
            Index.bbox_text(this._svgRect, 'svg')
        ].join(" ");
        // Reference for innerHeight property.
        // https://developer.mozilla.org/en-US/docs/Web/API/Window/innerHeight
    }
    _set_zoomBox_size(zoomBox) {
        if (!!zoomBox) {
            zoomBox.setDimensions(
                this._svgRect.width * -0.5,
                this._svgRect.width,
                this._svgRect.height * -0.5,
                this._svgRect.height * 0.5
            );
        }
    }

    _update_pointer(clientX, clientY) {
        this._update_pointer_raw(
            clientX - (this._svgRect.x + (this._svgRect.width * 0.5)),
            (this._svgRect.y + (this._svgRect.height * 0.5)) - clientY
        );
    }
    _update_pointer_raw(adjustedX, adjustedY) {
        this._pointerX = parseFloat(adjustedX);
        this._pointerY = parseFloat(adjustedY);

        this._pointerLine.setAttribute('x2', this._pointerX);
        this._pointerLine.setAttribute('y2', -1 * this._pointerY);

        this._xTextNode.nodeValue = this._pointerX.toFixed().toString();
        this._yTextNode.nodeValue = this._pointerY.toFixed().toString();
    }

    _on_mouse_move(mouseEvent) {
        mouseEvent.preventDefault();
        return this._update_pointer(mouseEvent.clientX, mouseEvent.clientY);
    }
    _on_mouse_leave(mouseEvent) {
        // console.log(mouseEvent.target);
        // Mouse Leave events are posted for child nodes too.
        if (Object.is(mouseEvent.target, this._svg.node)) {
            mouseEvent.preventDefault();
            return this._update_pointer_raw(0, 0);
        }
    }

    _on_touch_move(touchEvent) {
        touchEvent.preventDefault();
        if (event.changedTouches.length <= 0) {
            return;
        }
        // For now, only handle the first touch point.
        const touch = event.changedTouches[0];
        return this._update_pointer(touch.clientX, touch.clientY);
    }
    _on_touch_leave(touchEvent) {
        touchEvent.preventDefault();
        return this._update_pointer_raw(0, 0);
    }

    _load1() {
        this._on_resize();
        window.addEventListener('resize', this._on_resize.bind(this));

        // Add pointer listeners, either touch or mouse. Desktop Safari doesn't
        // support pointer events like:
        // 
        //     this._svg.addEventListener('pointermove', ...);
        // 
        // So the code here uses mouse events instead.
        if (this._touch) {
            this._svg.node.addEventListener(
                'touchmove', this._on_touch_move.bind(this), {capture:true});
            this._svg.node.addEventListener(
                'touchend', this._on_touch_leave.bind(this), {capture:true});
        }
        else {
            this._svg.node.addEventListener(
                'mousemove', this._on_mouse_move.bind(this), {capture:true});
            this._svg.node.addEventListener(
                'mouseleave', this._on_mouse_leave.bind(this), {capture:true});
        }

        this._load_zoomBox();

        // Remove the loading... element and add the proper heading to show that
        // loading has finished.
        this._loading.remove();
        const h1 = Piece.create('h1', undefined, undefined, "Proof of Concept");
        this._header.node.insertBefore(h1, this._header.node.firstChild);

        // Previous lines could have changed the size of the svg so, after a
        // time out for rendering, process a resize.
        setTimeout( () => this._on_resize(), 0);
        this._intervalZoom = null;
        this._buttonRandom.removeAttribute('disabled');
        this._buttonPointer.removeAttribute('disabled');
    }

    _load_zoomBox() {
    }
}

document.body.onload = () => {
    const ui = document.getElementById('user-interface');
    const index = new Index(ui).load('loading', 'small-print');
}
