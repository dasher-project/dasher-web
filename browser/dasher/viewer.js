// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

import Piece from "./piece.js";

export default class Viewer {
    static view(svgPiece) {
        // Add an SVG group to hold the root zoom box.
        return new Piece('g', svgPiece);
    }

    constructor(zoomBox, view) {
        this._zoomBox = zoomBox;
        this._view = view;
        this._clear();
    }

    _clear() {
        // Principal graphics.
        this._group = null;
        this._rect = null;
        this._text = null;

        // Diagnostic graphics.
        this._spawnMargin = null;
        this._width = null;
    }

    draw(limits) {
        this._draw_one(null, limits, 0);
    }

    _draw_one(after, limits, level) {
        if (this._should_render(limits)) {
            this._render_group(after, limits, level);
            this._zoomBox.each_childBox(child => {
                if (child.viewer === null) {
                    child.viewer = new Viewer(child, this._view);
                }
                child.viewer._draw_one(this._group.node, limits, level + 1);
            });
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
        /*

        This check seems unnecessary here. Small boxes get erased in
        arrange_children anyway.

        if (this._zoomBox.renderHeightThreshold !== undefined) {
            if (this._zoomBox.height < this._zoomBox.renderHeightThreshold) {
                // return false;
                console.log(`Viewer RHT "${this._zoomBox.message}".`);
            }
        }
        */

        if (this._zoomBox.width <= 0) {
            return false;
        }

        return true;
    }

    _render_group(after, limits, level) {
        if (this._group === null) {
            // Use an SVG group <g> element because its translate can be
            // smoothed with a CSS transition, which a <text> element's x and y
            // attributes cannot. TOTH https://stackoverflow.com/a/53452940
            // Reference:
            // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform

            this._group = new Piece('g');
        }

        const box = this._zoomBox;
        const margin = (box.spawnMargin === undefined ? 0 : box.spawnMargin);
        const limitLeft = limits.left + (level * margin);
        const renderLeft = box.left < limitLeft ? limitLeft : box.left;

        // ToDo: Change 5 on the next line to a constant.
        const limitTop = limits.top + (margin === 0 ? 0 : level * 5);
        const [trimTop, trimBottom, renderMiddle] = this._trims(
            limitTop, limits.bottom, margin);
        
        this._group.node.style.transform = 
            `translate(${renderLeft}px, ${renderMiddle}px)`;
        // ToDo: Try changing the above to a transform list, see:
        // https://developer.mozilla.org/en-US/docs/Web/API/SVGTransformList

        // if (renderMiddle !== this.middle) {
        //     console.log(
        //         this.message, renderMiddle, limitTop, margin, limits.top);
        // }

        const parent = this._group.node.parentElement;
        const viewerNode = this._view.node
        if (!Object.is(parent, viewerNode)) {
            if (after === null) {
                viewerNode.insertBefore(
                    this._group.node, viewerNode.firstChild);
            }
            else {
                after.insertAdjacentElement('afterend', this._group.node);
            }
        }

        this._render_rect(
            trimTop, trimBottom,
            limits.drawThresholdRect, limits.width,
            box.middle - renderMiddle
        );
        this._render_text(
            limits.minimumFontSizePixels, limits.maximumFontSizePixels);
        this._render_diagnostics(
            limits.showDiagnostic, box.middle - renderMiddle);
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

    _render_rect(trimTop, trimBottom, threshold, width, renderOffset) {
        const box = this._zoomBox;
        if (
            box.colour === null ||
            (threshold !== undefined && box.height < threshold)
        ) {
            if (this._rect !== null) {
                this._rect.remove();
                this._rect = null;
            }
            return;
        }

        if (this._rect === null) {
            this._rect = new Piece('rect', undefined, {
                "x": 0, "fill": box.colour
            });
            this._group.add_child(this._rect, false);

            this._rect.node.addEventListener('click', event =>
                console.log('rect', 'click', box, event)
            );
        }

        this._rect.node.classList.toggle('trim-top', trimTop !== 0);
        this._rect.node.classList.toggle('trim-bottom', trimBottom !== 0);

        const drawY = (box.height / -2) + renderOffset + trimTop;
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

    _render_text(minimumFontSizePixels, maximumFontSizePixels) {
        const box = this._zoomBox;
        if (box.text === null) {
            if (this._text !== null) {
                this._text.remove();
                this._text = null;
            }
            return;
        }

        if (this._text === null) {
            this._text = new Piece('text', this._group, {
                "x": 5, "y": 0, "fill": "black",
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
        // const fontSize = (
        //     box.spawnMargin !== undefined && box.height > box.spawnMargin ?
        //     box.spawnMargin : box.height
        // ) * 0.9;
        this._text.node.setAttribute('font-size', `${fontSize}px`);
    }

    _render_diagnostics(show, renderOffset) {
        const box = this._zoomBox;
        const y1 = renderOffset + (box.height / -2);
        const y2 = renderOffset + (box.height / 2);

        this._width = Piece.toggle(
            this._width, show, () => new Piece('line',  this._group, {
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
            this._spawnMargin, show && (box.spawnMargin !== undefined),
            () => new Piece('line', this._group, {
                x1:"0", x2:`${box.spawnMargin}`,
                stroke:"black", "stroke-width":"1px",
                "stroke-dasharray":"4"
            })
        )
        if (this._spawnMargin !== null) {
            this._spawnMargin.set_attributes({y1: `${y1}`, y2: `${y2}`});
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
        if (this._group !== null) {
            this._group.remove();
            // console.log('erase', this._zoomBox.message);
            this._clear();
        }
        this._zoomBox.each_childBox(child => child.erase());
    }
}