// (c) 2019 Jim Hawkins. MIT licensed, see https://opensource.org/licenses/MIT

import Piece from './piece.js';
import ZoomBoxRandom from './zoomboxrandom.js';
import ZoomBoxPointer from './zoomboxpointer.js';

class Index {
    constructor(parent) {
        this._parent = parent;
        this._intervalZoom = undefined;
        // this._intervalRender = null;

        this._zoomBoxRandom = null;
        this._zoomBoxPointer = null;
        this._zoomBox = null;

        // Spawn and render parameters in mystery SVG units.
        this._spawnMargin = 30;
        this._spawnHeight = 300;
        this._renderHeightThreshold = 20;

        this._ratios = [
            {left:0.5, height: 0.02},
            {left:0.4, height: 0.05},
            {left:0, height: 0.5},
            {left:1 / -3, height: 1}            
        ];
        // this._multiplierXFullHeight = 1 / -3;
        // this._multiplierXZeroHeight = 1;

        this._transitionMillis = 400;

        this._pointerX = 0;
        this._pointerY = 0;

        this._svgRect = undefined;
        this._renderLimits = undefined;
    }

    get zoomBox() {
        return this._zoomBox;
    }
    set zoomBox(zoomBox) {
        // Setting to the same value, do nothing.
        if (Object.is(this._zoomBox, zoomBox)) {
            return;
        }

        if (this._intervalZoom !== undefined) {
            if (this._intervalZoom !== null) {
                clearInterval(this._intervalZoom);
                this._intervalZoom = null;
            }
        }
        // if (this._intervalRender !== null) {
        //     clearInterval(this._intervalRender);
        //     this._intervalRender = null;
        // }

        // De-render current zoomBox, if any.
        if (this._zoomBox !== null) {
            // this._zoomBox.renderPiece = null;
            this._zoomBox.render(null);
        }

        // Set underlying property.
        this._zoomBox = zoomBox;

        // if (this._zoomBox !== null) {
        //     // this._zoomBox.renderPiece = this._zoomBoxGroup;
        //     this._render_zoomBox();
        //     this._intervalRender = setInterval(
        //         this._render_zoomBox.bind(this), this._transitionMillis);
        // }
    }

    // _render_zoomBox() {
    //     if (this.zoomBox !== null && this._svgRect !== undefined) {
    //         this.zoomBox.render(
    //             this._zoomBoxGroup.node, null, this._renderLimits);
    //     }
    // }

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
        this._buttonRandom.addEventListener(
            'click', () => this.toggle_random());

        this._buttonPointer = this._header.create(
            'button', {'type': 'button', 'disabled': true}, 'Pointer');
        this._buttonPointer.addEventListener(
            'click', () => this.toggle_pointer());

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
        // Add the pointer line, which will start at the origin and end wherever
        // the pointer happens to be.
        this._pointerLine = this._svg.create('line', {
            x1:"0", y1:"0", x2:"0", y2:"0",
            stroke:"red", "stroke-width":"1px"
        });

        // Height gradient indicator lines. X and Y attributes get set properly
        // later.
        this._heightGradientPolyline = new Piece('polyline', this._svg, {
            // x1:0, y1:0, x2:0, y2:0, 
            "points":"", "stroke":"green", "stroke-width":"1px", "fill": "none"
        });
        // this._heightGradientBottomLine = new Piece('polyline', this._svg, {
        //     // x1:0, y1:0, x2:0, y2:0, 
        //     points:"", stroke:"green", "stroke-width":"1px"
        // });

        const footer = document.getElementById(footerID);
        this._parent.appendChild(footer);

        // Next part of loading is after a time out so that the browser gets an
        // opportunity to render the layout.
        setTimeout(() => this._load1(footerID), 0);

        // To-do: should be an async function that returns a promise that
        // resolves to this.
        return this;
    }

    _start_zoom() {
        const zoom1 = () => {
            this.zoomBox.zoom(
                this._zoomBoxGroup.node, null, this._renderLimits);
            console.log(this.zoomBox.height);
        };
        zoom1();
        this._intervalZoom = setInterval(zoom1, this._transitionMillis);
    }

    toggle_random() {
        if (this._intervalZoom === undefined) {
            return;
        }
        if (this._zoomBoxRandom === null) {
            this._zoomBoxRandom = new ZoomBoxRandom(
                "abcdefghijklmnopqrstuvwxyz".split(""));
            this._set_zoomBox_size(this._zoomBoxRandom);
        }

        // Invoke setter and clear interval if different.
        this.zoomBox = this._zoomBoxRandom;
        this._buttonPointer.textContent = "Pointer";

        if (this._intervalZoom === null) {
            this._start_zoom()
            // this._zoomBoxRandom.zoom();
            // this._intervalZoom = setInterval(
            //     this.zoomBox.zoom.bind(this.zoomBox), this._transitionMillis);
            this._buttonRandom.textContent = "Stop";
        }
        else {
            clearInterval(this._intervalZoom);
            this._intervalZoom = null;
            this._buttonRandom.textContent = "Go Random";
        }
    }

    toggle_pointer() {
        if (this._intervalZoom === undefined) {
            return;
        }

        if (this._zoomBoxPointer === null) {
            this._zoomBoxPointer = new ZoomBoxPointer(
                "abcdefghijklmnopqrstuvwxyz".split(""), "", this, 'silver');
            this._zoomBoxPointer.spawnMargin = this._spawnMargin;
            this._zoomBoxPointer.spawnHeight = this._spawnHeight;
            this._zoomBoxPointer.renderHeightThreshold = (
                this._renderHeightThreshold);
            this._set_zoomBox_size(this._zoomBoxPointer);
        }
        const alreadyPointer = Object.is(this.zoomBox, this._zoomBoxPointer);

        // Invoke setter and clear interval if different.
        this.zoomBox = this._zoomBoxPointer;
        this._buttonRandom.textContent = "Go Random";

        if (alreadyPointer) {
            this._set_zoomBox_size(this.zoomBox);
            this.zoomBox.arrange_children(this._renderLimits);
        }
        else {
            // this._zoomBoxPointer.zoom();
            // this._intervalZoom = setInterval(
            //     this.zoomBox.zoom.bind(this.zoomBox), this._transitionMillis);
            this._start_zoom();
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

    get svgRect() {
        return this._svgRect;
    }
    set svgRect(boundingClientRect) {
        this._svgRect = boundingClientRect;
        this._renderLimits = {
            "top": boundingClientRect.height / -2,
            "bottom":  boundingClientRect.height / 2,
            "height":  boundingClientRect.height,
            "left": boundingClientRect.width / -2,
            "right": boundingClientRect.width / 2,
            "width": boundingClientRect.width,
            // "xFullHeight":
            //     boundingClientRect.width * this._multiplierXFullHeight,
            // "xZeroHeight":
            //     boundingClientRect.width * this._multiplierXZeroHeight
        };
        this._renderLimits.gradients = this._ratios.map(({left, height}) => {
            return {
                "left": boundingClientRect.width * left,
                "height": boundingClientRect.height * height
            };
        }).sort((first, second) => first.left - second.left);
        // Previous line will sort from lowest to highest. In practice, lowest
        // means most negative.

        // Height gradient track.
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
            
        


        // this._heightGradientTopLine.set_attributes({
        //     x1:this._renderLimits.xFullHeight, y1:"-50%",
        //     x2:this._renderLimits.xZeroHeight, y2:0
        // });
        // this._heightGradientBottomLine.set_attributes({
        //     x1:this._renderLimits.xFullHeight, y1:"50%",
        //     x2:this._renderLimits.xZeroHeight, y2:0
        // });
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

            // Set left; solve height.
            const width = this._spawnMargin * 2;
            const left = this._renderLimits.right - width;
            const height = zoomBox.solve_height(left, this._renderLimits);

            // // Set height; solve left.
            // const height = this.svgRect.height / 10;
            // const left = zoomBox.solve_left(height, this._renderLimits);
            // const width = this._renderLimits.right - left;


            zoomBox.set_dimensions(
                // (this._svgRect.width / 2) - width, width,
                left, width, 0, height
            );

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
        // zoomBox.renderTop = this.svgRect.height * -0.5;
        // zoomBox.renderBottom = this.svgRect.height * 0.5;
        // zoomBox.excessWidth = this.svgRect.width;
    }

    _update_pointer(clientX, clientY) {
        this._update_pointer_raw(
            clientX - (this.svgRect.x + (this.svgRect.width * 0.5)),
            (this.svgRect.y + (this.svgRect.height * 0.5)) - clientY
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
}

document.body.onload = () => {
    const ui = document.getElementById('user-interface');
    const index = new Index(ui).load('loading', 'small-print');
}
