// (c) 2019 Jim Hawkins. MIT licensed, see https://opensource.org/licenses/MIT

export default class Pointer {
    constructor(svgPiece) {
        this._svgBoundingBox = undefined;

        // TOTH https://github.com/patrickhlauke/touch
        this._touch = 'ontouchstart' in window;

        this._x = 0;
        this._y = 0;

        this._xTextNode = null;
        this._yTextNode = null;
        this._pointerLine = null;

        // Setter invocation.
        this.svgPiece = svgPiece;
    }

    get svgPiece() { return this._svgPiece; }
    set svgPiece(svgPiece) {
        this._svgPiece = svgPiece;

        // Add the pointer line, which will start at the origin and end wherever
        // the pointer happens to be.
        this._pointerLine = this._svgPiece.create('line', {
            x1:"0", y1:"0", x2:"0", y2:"0",
            stroke:"red", "stroke-width":"1px"
        });

        // Add pointer listeners, either touch or mouse. Desktop Safari doesn't
        // support pointer events like:
        // 
        //     this._svgPiece.addEventListener('pointermove', ...);
        // 
        // So the code here uses mouse events instead.
        if (this._touch) {
            // This code has the same handler for touchstart and touchmove. MDN
            // says that best practice is to add the move and end handlers
            // inside the start handler. However, some other Internet research
            // suggests that this could be too late in the event life cycle to
            // prevent the window from scrolling, which is the default action
            // for a touch-move, or doesn't work on Android. A related point is
            // that the scrolling action is prevented by use of the touch-action
            // CSS feature, called when the SVG node is created.
            this._svgPiece.node.addEventListener(
                'touchstart', this._on_touch.bind(this), {capture:true});
            this._svgPiece.node.addEventListener(
                'touchmove', this._on_touch.bind(this), {capture:true});
            //
            // The same handler is used for touchend and touchcancel but this
            // isn't contentious.
            this._svgPiece.node.addEventListener(
                'touchend', this._on_touch_leave.bind(this), {capture:true});
            this._svgPiece.node.addEventListener(
                'touchcancel', this._on_touch_leave.bind(this), {capture:true});
        }
        else {
            this._svgPiece.node.addEventListener(
                'mousemove', this._on_mouse_move.bind(this), {capture:true});
            this._svgPiece.node.addEventListener(
                'mouseleave', this._on_mouse_leave.bind(this), {capture:true});
        }
    }

    get svgBoundingBox() {return this._svgBoundingBox;}
    set svgBoundingBox(svgBoundingBox) {this._svgBoundingBox = svgBoundingBox;}

    get touch() {return this._touch;}

    get x() {return this._x;}
    get y() {return this._y;}

    get xTextNode() {return this._xTextNode;}
    set xTextNode(xTextNode) {
        this._xTextNode = xTextNode;
        this._update_text_nodes();
    }
    get yTextNode() {return this._yTextNode;}
    set yTextNode(yTextNode) {
        this._yTextNode = yTextNode;
        this._update_text_nodes();
    }
    _update_text_nodes() {
        if (this.xTextNode !== null) {
            this.xTextNode.nodeValue = this.x.toFixed();
        }
        if (this.yTextNode !== null) {
            this.yTextNode.nodeValue = this.y.toFixed();
        }
    }

    _update_pointer(clientX, clientY) {
        // Check that the pointer isn't out-of-bounds. The pointer will go out
        // of bounds if the user touched the SVG and then moved out of the SVG.
        // Touch events continue to be posted, with the same target, in that
        // case.
        if (
            (this.svgBoundingBox !== undefined) &&
            (clientY >= this.svgBoundingBox.y) &&
            (clientY <= this.svgBoundingBox.y + this.svgBoundingBox.height) &&
            (clientX >= this.svgBoundingBox.x) &&
            (clientX <= this.svgBoundingBox.x + this.svgBoundingBox.width)
        ) {
            return this._update_pointer_raw(
                clientX - (
                    this.svgBoundingBox.x + (this.svgBoundingBox.width * 0.5)
                ),
                (
                    this.svgBoundingBox.y + (this.svgBoundingBox.height * 0.5)
                ) - clientY
            );
        }
        else {
            // Out of bounds, send co-ordinates that indicate stopping the
            // touch.
            return this._update_pointer_raw(0, 0);
        }
    }
    _update_pointer_raw(adjustedX, adjustedY) {
        // Update the zoom control properties.
        this._x = parseFloat(adjustedX);
        this._y = parseFloat(adjustedY);

        // Update the line from the origin to the pointer.
        this._pointerLine.setAttribute('x2', this.x);
        this._pointerLine.setAttribute('y2', -1 * this.y);

        // Update the diagnostic display.
        this._update_text_nodes();
    }

    _on_mouse_move(mouseEvent) {
        mouseEvent.preventDefault();
        return this._update_pointer(mouseEvent.clientX, mouseEvent.clientY);
    }
    _on_mouse_leave(mouseEvent) {
        // console.log(mouseEvent.target);
        // Mouse Leave events are posted for child nodes too.
        if (Object.is(mouseEvent.target, this._svgPiece.node)) {
            mouseEvent.preventDefault();
            return this._update_pointer_raw(0, 0);
        }
    }

    _on_touch(touchEvent) {
        touchEvent.preventDefault();
        if (event.changedTouches.length !== 1) {
            console.log('touch changes', touchEvent);
            return;
        }
        // For now, only handle the first touch point.
        const touch = event.changedTouches[0];

        // The target in the touch object will be the element in which the touch
        // started, even if the touch has now moved outside it. This is handled
        // downstream from here.

        return this._update_pointer(touch.clientX, touch.clientY);
    }
    _on_touch_leave(touchEvent) {
        touchEvent.preventDefault();
        return this._update_pointer_raw(0, 0);
    }

}