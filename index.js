// (c) 2019 Jim Hawkins. MIT licensed, see https://opensource.org/licenses/MIT

import Piece from './piece.js';
import ZoomBoxRandom from './zoomboxrandom.js';

class Index {
    constructor(parent) {
        this._parent = parent;
        this._interval = undefined;

        this._zoomBox = new ZoomBoxRandom(
            "abcdefghijklmnopqrstuvwxyz".split(""), 30);
    }

    load(loadingID, footerID) {
        // Create a diagnostic area in which to display a bunch of numbers.
        this._header = new Piece('div', this._parent);
        this._loading = new Piece(document.getElementById(loadingID));
        this._header.add_child(this._loading);

        this._sizesTextNode = this._header.create(
            'span', {id:"sizes-text-node"}, "loading sizes ..."
        ).firstChild;

        this._button = this._header.create(
            'button', {'type': 'button', 'disabled': true}, 'Go Random');
        this._button.addEventListener('click', () => this.toggle_zooms());

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

    _setXY(x, y) {
        this._xTextNode.nodeValue = x.toFixed().toString();
        this._yTextNode.nodeValue = y.toFixed().toString();
    }

    toggle_zooms() {
        if (this._interval === undefined) {
            return;
        }
        if (this._interval === null) {
            this._interval = setInterval(
                () => this._zoomBox.random_zooms(), 180);
            this._button.textContent = "Stop";
        }
        else {
            clearInterval(this._interval);
            this._interval = null;
            this._button.textContent = "Go Random";
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
        if (!!this._zoomBox) {
            this._zoomBox.setDimensions(
                this._svgRect.width * -0.5,
                this._svgRect.width,
                this._svgRect.height * -0.5,
                this._svgRect.height * 0.5
            );
        }
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

    _update_pointer_line(clientX, clientY) {
        const xAdjust = -1 * (this._svgRect.x + (this._svgRect.width * 0.5));
        const yAdjust = this._svgRect.y + (this._svgRect.height * 0.5);
        const x = xAdjust + clientX;
        const y = yAdjust - clientY;
        this._pointerLine.setAttribute('x2', x.toString());
        this._pointerLine.setAttribute('y2', (-1 * y).toString());
        this._setXY(x, y);
    }

    _on_mouse_move(mouseEvent) {
        mouseEvent.preventDefault();
        return this._update_pointer_line(
            mouseEvent.clientX, mouseEvent.clientY);
    }

    _on_touch_move(touchEvent) {
        touchEvent.preventDefault();
        if (event.changedTouches.length <= 0) {
            return;
        }
        // For now, only handle the first touch point.
        const touch = event.changedTouches[0];
        return this._update_pointer_line(touch.clientX, touch.clientY);
    }

    _load1() {
        this._on_resize();
        window.addEventListener('resize', this._on_resize.bind(this));

        // Add a listener to set the pointer line end when the pointer moves.
        if (this._touch) {
            this._svg.node.addEventListener(
                'touchmove', this._on_touch_move.bind(this), {capture:true});
        }
        else {
            this._svg.node.addEventListener(
                'mousemove', this._on_mouse_move.bind(this), {capture:true});
        }
        //
        // Safari supports the above, mouse event, but doesn't support pointer
        // events like:
        // this._svg.addEventListener('pointermove', ...);

        this._zoomBox.render(this._svg);
        // Move the ZoomBox SVG group to be first so that the cross hairs and
        // pointer line will always be rendered in front of them.
        this._svg.node.insertBefore(
            this._zoomBox.piece.node, this._svg.node.firstChild);

        // Remove the loading... element and add the proper heading to show that
        // loading has finished.
        this._loading.remove();
        const h1 = Piece.create('h1', undefined, undefined, "Proof of Concept");
        this._header.node.insertBefore(h1, this._header.node.firstChild);

        // Previous lines could have changed the size of the svg so, after a
        // time out for rendering, process a resize.
        setTimeout( () => this._on_resize(), 0);
        this._interval = null;
        this._button.removeAttribute('disabled');
    }
}

document.body.onload = () => {
    const ui = document.getElementById('user-interface');
    const index = new Index(ui).load('loading', 'small-print');
}
