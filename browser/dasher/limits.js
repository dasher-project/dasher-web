// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

import Piece from './piece.js';

export default class Limits {
    constructor() {
        this._top = undefined;
        this._bottom = undefined;
        this._height = undefined;
        this._left = undefined;
        this._right = undefined;
        this._width = undefined;

        this._ratios = null;
        this._showDiagnostic = false;

        this._minimumFontSizePixels = undefined;
        this._maximumFontSizePixels = undefined;
        this._drawThresholdRect = undefined;
        this._spawnThreshold = undefined;
        this._textLeft = 5;
        this._targetRight = true;
        this._spawnMargin = undefined;

        this._gradients = undefined;
        this._solverRight = undefined;

        this._svgPiece = null;
        this._heightGradientPolyline = null;
    }

    get top() {return this._top;}
    get bottom() {return this._bottom;}
    get height() {return this._height;}
    get left() {return this._left;}
    get right() {return this._right;}
    get width() {return this._width;}

    get ratios() {return this._ratios;}
    set ratios(ratios) {
        this._ratios = ratios;
        this._calculate_gradients();
    }

    get showDiagnostic() {return this._showDiagnostic;}
    set showDiagnostic(showDiagnostic) {
        this._showDiagnostic = showDiagnostic;
        this._show_gradients();
    }

    get solverRight() {return this._solverRight;}

    get svgPiece() {return this._svgPiece;}
    set svgPiece(svgPiece) {
        this._svgPiece = svgPiece;
        this._show_gradients();
    }

    set(width, height) {
        this._width = width;
        this._height = height;

        this._left = width / -2;
        this._right = width / 2;

        this._top = height / -2;
        this._bottom = height / 2;

        this._calculate_gradients();
    }

    _calculate_gradients() {
        this._gradients = (
            this._ratios === null ||
            this.width === undefined || this.height === undefined
        ) ? undefined :
        this._ratios.map(ratio => {
            return {
                "left": this.width * ratio.left,
                "height": this.height * ratio.height
            };
        }).sort((first, second) => first.left - second.left);
        // Previous line will sort from lowest to highest. In practice, lowest
        // means most negative. The left-most will be gradients[0].
        this._solverRight = (
            this._gradients === undefined ? undefined :
            this._gradients[this._gradients.length - 1].left
        );

        this._show_gradients();
    }

    _show_gradients() {
        this._heightGradientPolyline = Piece.toggle(
            this._heightGradientPolyline, (
                this.showDiagnostic &&
                this._gradients !== undefined &&
                this.svgPiece !== null
            ), () => new Piece('polyline', this._svgPiece, {
                "points":"", "stroke":"green", "stroke-width":"1px",
                "fill": "none"
            })
        );

        if (this._heightGradientPolyline === null) {
            return;
        }
        
        this._heightGradientPolyline.set_attributes({"points":[
            ...Array.from(this._gradients,
                ({left, height}) => {return {
                    "left": left, "height": height / -2
                };}),
            ...Array.from(this._gradients,
                ({left, height}) => {return {
                    "left": left, "height": height / 2
                };}).reverse()
        ].reduce(
            (accumulated, {left, height}) => `${accumulated} ${left},${height}`,
            "")
        });
    }

    get minimumFontSizePixels() {return this._minimumFontSizePixels;}
    set minimumFontSizePixels(minimumFontSizePixels) {
        this._minimumFontSizePixels = minimumFontSizePixels;
    }

    get maximumFontSizePixels() {return this._maximumFontSizePixels;}
    set maximumFontSizePixels(maximumFontSizePixels) {
        this._maximumFontSizePixels = maximumFontSizePixels;
    }

    get drawThresholdRect() {return this._drawThresholdRect;}
    set drawThresholdRect(drawThresholdRect) {
        this._drawThresholdRect = drawThresholdRect;
    }

    get spawnThreshold() {return this._spawnThreshold;}
    set spawnThreshold(spawnThreshold) {
        this._spawnThreshold = spawnThreshold;
    }

    get textLeft() {return this._textLeft;}
    set textLeft(textLeft) {
        this._textLeft = textLeft;
    }

    get targetRight() {return this._targetRight;}
    set targetRight(targetRight) {
        this._targetRight = targetRight;
    }

    get spawnMargin() {return this._spawnMargin;}
    set spawnMargin(spawnMargin) {
        this._spawnMargin = spawnMargin;
    }

    // Calculate height, given left position.
    solve_height(left) {
        const index = this._gradients.findIndex(
            gradient => left < gradient.left);
        
        if (index < 0) {
            return this._gradients[this._gradients.length - 1].height;
        }

        const gradient0 = this._gradients[index === 0 ? 1 : index];
        const gradient1 = this._gradients[index === 0 ? 0 : index - 1];

        return gradient0.height + (
            ((gradient1.height - gradient0.height) * (gradient0.left - left)) /
            (gradient0.left - gradient1.left)
        )
    }

    // Calculate left position, given height.
    solve_left(height) {
        const index = this._gradients.findIndex(
            gradient => height > gradient.height);
        
        if (index < 0) {
            return this._gradients[this._gradients.length - 1].left;
        }

        const gradient0 = this._gradients[index === 0 ? 1 : index];
        const gradient1 = this._gradients[index === 0 ? 0 : index - 1];

        return gradient0.left + (
            (
                (gradient1.left - gradient0.left) *
                (gradient0.height - height)
            ) /
            (gradient0.height - gradient1.height)
        )
    }

}
