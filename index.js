// (c) 2019 Jim Hawkins. MIT licensed, see https://opensource.org/licenses/MIT

import ZoomBox from './zoombox.js';

class Index {
    constructor(parent) {
        this._parent = parent;
        this._characters = "abcdefghijklmnopqrstuvwxyz".split("");
    }

    _create(
        tag, attributes, text, parent, nameSpace='http://www.w3.org/2000/svg'
    ) {
        const element = document.createElementNS(nameSpace, tag);
        this._set_attributes(element, attributes);
        if (text !== undefined) {
            const textNode = document.createTextNode(text);
            element.appendChild(textNode);
        }

        if (parent !== null) {
            (parent === undefined ? this._svg : parent).appendChild(element);
        }
        return element;
    }
    _set_attributes(element, attributes) {
        if (attributes !== undefined) {
            for (const [key, value] of Object.entries(attributes)) {
                element.setAttribute(key, value);
            }
        }
        return element;
    }
    _createHTML(tag, attributes, text, parent) {
        return this._create(
            tag, attributes, text,
            parent === undefined ? this._parent : parent,
            'http://www.w3.org/1999/xhtml'
        );
    }

    load(loadingID, footerID) {
        // Create a diagnostic area in which to display a bunch of numbers.
        this._header = this._createHTML('div');
        this._loading = document.getElementById(loadingID);
        this._header.appendChild(this._loading);

        this._sizesTextNode = this._createHTML(
            'span', {id:"sizes-text-node"}, "loading sizes ...", this._header
        ).firstChild;
        // TOTH https://github.com/patrickhlauke/touch
        this._touch = 'ontouchstart' in window;
        this._createHTML(
            'span', {}, this._touch ? "touch " : "mouse ", this._header);
        this._xTextNode = this._createHTML(
            'span', {}, "X", this._header).firstChild;
        this._createHTML('span', {}, ",", this._header);
        this._yTextNode = this._createHTML(
            'span', {}, "Y", this._header).firstChild;
        this._setXY = (x, y) => {
            this._xTextNode.nodeValue = x.toFixed().toString();
            this._yTextNode.nodeValue = y.toFixed().toString();
        }

        this._svg = this._create('svg', undefined, undefined, this._parent);
        // Touching and dragging in a mobile web view will scroll or pan the
        // screen, by default. Next line suppresses that. Reference:
        // https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action
        this._svg.style['touch-action'] = 'none';

        // Axis lines.
        this._create('line', {
            x1:"0", y1:"-50%", x2:"0", y2:"50%",
            stroke:"black", "stroke-width":"1px"
        });
        this._create('line', {
            x1:"-50%", y1:"0", x2:"50%", y2:"0",
            stroke:"black", "stroke-width":"1px"
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
        this._svgRect = this._svg.getBoundingClientRect();
        // Change the svg viewBox so that the origin is in the centre.
        this._set_attributes(this._svg, {
            viewBox:
                `${this._svgRect.width * -0.5} ${this._svgRect.height * -0.5}` +
                ` ${this._svgRect.width} ${this._svgRect.height}`
        });

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
        this._on_resize()
        window.addEventListener('resize', () => this._on_resize());

        // Add the pointer line, which will start at the origin and end wherever
        // the pointer happens to be.
        this._pointerLine = this._create('line', {
            x1:"0", y1:"0", x2:"0", y2:"0",
            stroke:"red", "stroke-width":"1px"
        });
        //
        // Add a listener to set the pointer line end when the pointer moves.
        if (this._touch) {
            this._svg.addEventListener(
                'touchmove', this._on_touch_move.bind(this), {capture:true});
        }
        else {
            this._svg.addEventListener(
                'mousemove', this._on_mouse_move.bind(this), {capture:true});
        }
        //
        // Safari supports the above, mouse event, but doesn't support pointer
        // events like:
        // this._svg.addEventListener('pointermove', ...);

        // Load some likely looking content.
        const rectHeight = 30;
        let yPosition = -0.5 * this._svgRect.height;
        const xPosition = (this._svgRect.width * 0.5) - (rectHeight * 2);
        const zoomBoxes = this._characters.map((character, index) => {
            const zoomBox = new ZoomBox(
                index % 2 === 0 ? "lightgray" : "lightgreen",
                yPosition, this._svgRect.width * 0.5,
                yPosition + rectHeight, xPosition
            );
            zoomBox.xChange = 1 - ((index % 2) * 2);
            zoomBox.svgRect = this._create('rect');
            zoomBox.svgText = this._create('text', undefined, character);
            yPosition += rectHeight;
            return zoomBox;
        });

        setInterval(() => {
            const xMin = this._svgRect.width * -0.5;
            const xMax = (this._svgRect.width * 0.5) - (rectHeight * 2);
            zoomBoxes.forEach(zoomBox => {
                const xDelta = (1 + Math.random() * 50) * zoomBox.xChange;
                if (
                    (zoomBox.left + xDelta < xMin && zoomBox.xChange < 0) ||
                    (zoomBox.left + xDelta > xMax && zoomBox.xChange > 0)
                ) {
                    zoomBox.xChange *= -1;
                }
                else {
                    zoomBox.left += xDelta;
                }
            });
        }, 200);

        // Remove the loading... element and add the proper heading to show that
        // loading has finished.
        this._header.removeChild(this._loading);
        const h1 = this._createHTML('h1', undefined, "Proof of Concept", null);
        this._header.insertBefore(h1, this._header.firstChild);
        // Previous lines could have changed the size of the svg so, after a
        // time out for rendering, process a resize.
        setTimeout( () => this._on_resize(), 0);
    }
}

document.body.onload = () => {
    const ui = document.getElementById('user-interface');
    const index = new Index(ui).load('loading', 'small-print');
}
