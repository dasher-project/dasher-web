// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

import Piece from "./piece.js";

export default class Viewer {
    static view(svgPiece, limits) {
        const return_ = {
            "lower": new Piece('g', svgPiece, {"id": "view-lower"})
        };
        return_.rect = new Piece('rect', svgPiece, {
            "y": "-50%", "height": "100%", "fill": "white",
            "id": 'solver-right-mask'
        });
        return_.line = new Piece('line', svgPiece, {
            "y1": "-50%", "y2": "50%", "stroke": "black", "stroke-width":"1px",
            "id": 'solver-right-border'
        });
        Viewer.configure_view(return_, limits);
        return_.upper = new Piece('g', svgPiece, {"id": "view-upper"});
        return return_;
    }
    static configure_view(view, limits) {
        view.rect.set_attributes({
            "x": limits.solverRight, "width": limits.right - limits.solverRight,
            "fill-opacity": limits.showDiagnostic ? 0.5 : 1
        });
        view.line.set_attributes({
            "x1": limits.solverRight, "x2": limits.solverRight
        });
    }

    constructor(zoomBox, view) {
        this._zoomBox = zoomBox;
        this._view = view;
        this._clear();
    }

    _clear() {
        // Principal graphics.
        this._groupLower = null;
        this._groupUpper = null;
        this._rect = null;
        this._text = null;

        // Diagnostic graphics.
        this._spawnMargin = null;
        this._width = null;
        this._textBox = null;

        this._textWidth = 0;
        this._renderLeft = 0;
    }

    get lower() {return this._groupLower;}
    get upper() {return this._groupUpper;}

    // Following is too slow, due to the getBoundingClientRect apparently.
    // _set_text_width() {
    //     if (this._text === null) {
    //         this._textWidth = 0;
    //     }
    //     else {
    //         const textBounds = this._text.node.getBoundingClientRect();
    //         // console.log(this._zoomBox.text, this._textBounds);
    //         // edge += this._textBounds.width;
    //         this._textWidth = textBounds.width;
    //     }
    //     return this._textWidth;
    // }

    draw(limits) {
        Viewer.configure_view(this._view, limits);
        this._draw_one(null, limits.left, limits, 0);
    }

    _draw_one(after, parentEdge, limits, level) {
        if (this._should_render(limits)) {
            // if (this._zoomBox.message[0] === "M") {
            //     console.log(
            //         'predging', this._zoomBox.text, this._zoomBox.message,
            //         parentEdge, limits.textLeft);
            // }
            this._render_group(after, parentEdge, limits, level);
            const childEdge = (
                this._renderLeft + limits.textLeft + this._textWidth);
            const edge = childEdge > parentEdge ? childEdge : parentEdge;
            // if (this._zoomBox.message[0] === "M") {
            //     console.log(
            //         'edging', this._zoomBox.text, this._zoomBox.message,
            //         childEdge, this._renderLeft,
            //         limits.textLeft, this._textWidth);
            // }
            if (this._zoomBox.childBoxes !== undefined) {
                this._zoomBox.childBoxes.forEach(child => {
                    if (!child.dimension_undefined()) {
                        if (child.viewer === null) {
                            child.viewer = new Viewer(child, this._view);
                        }
                        child.viewer._draw_one(this, edge, limits, level + 1);
                    }
                });
            }
        }
        else {
            this.erase();
        }
    }

    _should_render(limits) {
        if (this._zoomBox.dimension_undefined()) {
            return false;
        }

        if (this._zoomBox.height < 0) {
            console.log('negative height', this._zoomBox);
            return false;
        }
        if (isNaN(this._zoomBox.height)) {
            console.log('height isNaN', this._zoomBox);
            return false;
        }

        if (this._zoomBox.bottom < limits.top) {
            return false;
        }
        if (this._zoomBox.top > limits.bottom) {
            return false;
        }

        if (this._zoomBox.width <= 0) {
            return false;
        }

        return true;
    }

    _render_group(after, edge, limits, level) {
        if (this._groupLower === null) {
            // Use an SVG group <g> element because its translate can be
            // smoothed with a CSS transition, which a <text> element's x and y
            // attributes cannot. TOTH https://stackoverflow.com/a/53452940
            // Reference:
            // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform

            this._groupLower = new Piece('g', undefined, {"id": [
                "group-lower", this._zoomBox.message, this._zoomBox.text
            ].join("_") });
            this._groupUpper = new Piece('g', undefined, {"id": [
                "group-upper", this._zoomBox.message, this._zoomBox.text
            ].join("_") });
        }

        const box = this._zoomBox;
        const margin = (
            limits.spawnMargin === undefined ? 0 : limits.spawnMargin);
        const limitLeft = limits.left + (level * margin);
        const renderLeft = box.left < limitLeft ? limitLeft : box.left;

        // ToDo: Change 5 on the next line to a constant.
        const limitTop = limits.top + (margin === 0 ? 0 : level * 5);
        const [trimTop, trimBottom, renderMiddle] = this._trims(
            limitTop, limits.bottom, margin);
        
        this._groupLower.node.style.transform = 
            `translate(${renderLeft}px, ${renderMiddle}px)`;
        // ToDo: Try changing the above to a transform list, see:
        // https://developer.mozilla.org/en-US/docs/Web/API/SVGTransformList

        // if (renderMiddle !== this.middle) {
        //     console.log(
        //         this.message, renderMiddle, limitTop, margin, limits.top);
        // }

        const textLeft = (
            renderLeft + limits.textLeft < edge ?
            edge - renderLeft : limits.textLeft);
        this._groupUpper.node.style.transform = 
            `translate(${renderLeft + textLeft}px, ${renderMiddle}px)`;

        this._renderLeft = renderLeft;

        this._insert_group(
            this._groupLower, this._view.lower,
            after === null ? null : after.lower.node);
        this._insert_group(
            this._groupUpper, this._view.upper,
            after === null ? null : after.upper.node);

            this._render_rect(
            trimTop, trimBottom,
            limits.drawThresholdRect, limits.width,
            box.middle - renderMiddle
        );

        // if (this._zoomBox.message[0] === "M") {
        //     console.log(
        //         "grouping", this._zoomBox.text, this._zoomBox.message, edge, renderLeft,
        //         limits.textLeft, textLeft);
        // }

        this._render_text(
            0,
            limits.minimumFontSizePixels, limits.maximumFontSizePixels);
        this._render_diagnostics(
            limits.showDiagnostic, box.middle - renderMiddle,
            limits.spawnMargin);
    }

    _trims(limitTop, limitBottom, margin) {
        const box = this._zoomBox;
        const trimTop = (
            box.top < limitTop ? limitTop - box.top : 0);
        const trimBottom = (
            box.bottom > limitBottom ? box.bottom - limitBottom : 0);
        
        const acrossOrigin = box.top < 0 && box.bottom >= 0;
        
        const renderMiddle = (
            trimTop === 0 && trimBottom === 0 ? box.middle :
            trimTop === 0 ? box.top + margin :
            trimBottom === 0 && !acrossOrigin ? box.bottom - margin :
            limitTop + margin
        );
        return [trimTop, trimBottom, renderMiddle];
    }

    _insert_group(group, base, after) {
        const parent = group.node.parentElement;
        const baseNode = base.node;
        if (!Object.is(parent, baseNode)) {
            if (after === null) {
                baseNode.insertBefore(group.node, baseNode.firstChild);
            }
            else {
                after.insertAdjacentElement('afterend', group.node);
            }
        }
    }

    _render_rect(trimTop, trimBottom, threshold, width, renderOffset) {
        const box = this._zoomBox;
        if (
            (box.colour === null && box.cssClass === null) ||
            (threshold !== undefined && box.height < threshold)
        ) {
            if (this._rect !== null) {
                this._rect.remove();
                this._rect = null;
            }
            return;
        }

        if (this._rect === null) {
            const attributes = { "x": 0 };
            if (box.colour !== null) {
                attributes.fill = box.colour;
            }
            this._rect = new Piece('rect', undefined, attributes);
            if (box.cssClass !== null) {
                this._rect.node.classList.add(box.cssClass)
            }
            this._rect.node.classList.add('zoom__rect')
            this._groupLower.add_child(this._rect, false);

            this._rect.node.addEventListener('click', event =>
                console.log('rect', 'click', box, event)
            );
        }

        this._rect.node.classList.toggle('trim-top', trimTop !== 0);
        this._rect.node.classList.toggle('trim-bottom', trimBottom !== 0);

        const drawY = (box.height / -2) + renderOffset + trimTop;
        if (isNaN(drawY)) {
            console.log('drawY nan.');
        }
        const drawHeight = box.height - (trimTop + trimBottom);

        // if (drawHeight < 0) {
        //     console.log(
        //         'drawHeight', box.message, drawHeight, trimTop, trimBottom);
        // }

        // console.log({
        //     offset:renderOffset, height: this.height,
        //     drawY:drawY, drawHeight:drawHeight,
        //     trimTop:trimTop, trimBottom:trimBottom
        // });

        this._rect.set_attributes({
            width: box.width > 0 ? width : 0,
            y: drawY,
            height: drawHeight > 0 ? drawHeight : 0
        });
    }

    _render_text(textLeft, minimumFontSizePixels, maximumFontSizePixels) {
        const box = this._zoomBox;
        if (box.text === null) {
            if (this._text !== null) {
                this._text.remove();
                this._text = null;
                this._textWidth = 0;
            }
            return;
        }

        if (this._text === null) {
            this._text = new Piece('text', this._groupUpper, {
                "x": textLeft, "y": 0, "fill": "black",
                "alignment-baseline": "middle"
            }, box.text);
        }

        let fontSize = box.height * 0.9;
        if (
            minimumFontSizePixels !== undefined &&
            fontSize < minimumFontSizePixels
        ) {
            fontSize = minimumFontSizePixels;
        }
        if (
            maximumFontSizePixels !== undefined &&
            fontSize > maximumFontSizePixels
        ) {
            fontSize = maximumFontSizePixels;
        }

        // Very crude estimation.
        this._textWidth = fontSize;
        //
        // Better estimation, but too slow.
        // const textBounds = this._text.node.getBoundingClientRect();
        // console.log(this._textWidth, textBounds.width);

        this._text.node.setAttribute('font-size', `${fontSize}px`);
        this._text.node.setAttribute('x', textLeft);
    }

    _render_diagnostics(show, renderOffset, spawnMargin) {
        const box = this._zoomBox;
        const y1 = renderOffset + (box.height / -2);
        const y2 = renderOffset + (box.height / 2);

        this._width = Piece.toggle(
            this._width, show, () => new Piece('line',  this._groupLower, {
                stroke:"black", "stroke-width":"1px",
                "stroke-dasharray":"4",
                "class": 'diagnostic-width'
            })
        );
        if (show) {
            this._width.set_attributes({
                x1: `${box.width}`, y1: `${y1}`,
                x2: `${box.width}`, y2: `${y2}`
            });    
        }

        this._spawnMargin = Piece.toggle(
            this._spawnMargin, show && (spawnMargin !== undefined),
            () => new Piece('line', this._groupLower, {
                x1:"0", x2:`${spawnMargin}`,
                stroke:"black", "stroke-width":"1px",
                "stroke-dasharray":"4"
            })
        );
        if (this._spawnMargin !== null) {
            this._spawnMargin.set_attributes({y1: `${y1}`, y2: `${y2}`});
        }

        this._textBox = Piece.toggle(
            this._textBox, show && this._textWidth > 0,
            () => new Piece('line', this._groupUpper, {
                x1:0, y1: "0", y2: "0",
                stroke:"white", "stroke-width":"2px",
                "stroke-dasharray":"4"
            })
        );
        if (this._textBox !== null) {
            this._textBox.set_attributes({x2: this._textWidth});
        }

        /* The following animation code doesn't seem to work.
        this._svgSpawnMargin.remove_all();
        this._svgSpawnMargin.create('animateDUFF', {
            attributeName: 'y1',
            attributeType: 'XML',
            from: this._svgSpawnMargin.node.getAttribute('y1'),
            to: `${this.height / -2}`,
            dur:'0.2s'
        });
        this._svgSpawnMargin.create('animateDUFF', {
            attributeName: 'y2',
            attributeType: 'XML',
            from: this._svgSpawnMargin.node.getAttribute('y2'),
            to: `${this.height / 2}`,
            dur:'0.2s'
        });
        */
    }

    erase() {
        if (this._groupLower !== null) {
            this._groupLower.remove();
            this._groupUpper.remove();
            this._clear();
        }
        if (this._zoomBox.childBoxes !== undefined) {
            this._zoomBox.childBoxes.forEach(child => child.erase());
        }
    }
}