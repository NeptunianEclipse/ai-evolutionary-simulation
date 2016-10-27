/* canvas.js
 ***************************************************
 *
 * This script provides a single class, Canvas.
 *
 ***************************************************/

// A class that wraps a single canvas element and manages its context, allowing the standard as well as extended
// canvas capabilities
class Canvas {

    constructor(canvasElement, elementWidth, elementHeight, resScaleFactor, clearColour = "#000000") {
        this.element = canvasElement;

        this.resScaleFactor = resScaleFactor;
        this.elementWidth = elementWidth;
        this.elementHeight = elementHeight;
        this.clearColour = clearColour;

        this.element.style.backgroundColor = clearColour;

        this.context = canvasElement.getContext("2d");
        this.applyScale();

        this.scrollX = 0;
        this.scrollY = 0;
        this.zoom = 1;
        this.drawInWorldSpace = true;
    }

    // The width of the actual canvas DOM element in pixels
    get elementWidth() {
        return this.style.element.width;
    }
    set elementWidth(width) {
        this.element.width = width * this.resScaleFactor;
        this.element.style.width = width + "px";
    }

    // The height of the actual canvas DOM element in pixels
    get elementHeight() {
        return this.element.style.height;
    }
    set elementHeight(height) {
        this.element.height = height * this.resScaleFactor;
        this.element.style.height = height + "px";
    }

    // The dimensions of the canvas context in drawing units (i.e. a 400x400 rectangle will entirely fill a
    // 400x400 canvas)
    get width() {
        return this.element.width / this.resScaleFactor;
    }
    get height() {
        return this.element.height / this.resScaleFactor;
    }

    // The factor by which the canvas's resolution is scaled, while maintaining the same element and context size
    get resScaleFactor() {
        return this._resScaleFactor;
    }
    set resScaleFactor(factor) {
        this._resScaleFactor = factor;
    }

    // The offset coordinates for drawing anything on the canvas in world space, based on the scroll
    get offX() {
        if(this.drawInWorldSpace) {
            return this.scrollX;
        } else {
            return 0;
        }
    }
    get offY() {
        if(this.drawInWorldSpace) {
            return this.scrollY;
        } else {
            return 0;
        }
    }

    // The scale multiplier for drawing anything on the canvas in world space, based on the zoom
    get scaleX() {
        if(this.drawInWorldSpace) {
            return this.zoom;
        } else {
            return 1;
        }
    }
    get scaleY() {
        if(this.drawInWorldSpace) {
            return this.zoom;
        } else {
            return 1;
        }
    }

    // Transforms the given x world coordinate into a canvas coordinate (responds to scrolling and zooming)
    canvasPosX(x) {
        return (x + this.offX) * this.scaleX;
    }

    // Transforms the given y world coordinate into a canvas coordinate (responds to scrolling and zooming)
    canvasPosY(y) {
        return (y + this.offY) * this.scaleY;
    }

    // Transforms the given x canvas coordinate into a world coordinate (removes scrolling and zooming)
    worldPosX(x) {
        return (x / this.scaleX) - this.offX;
    }

    // Transforms the given y canvas coordinate into a world coordinate (removes scrolling and zooming)
    worldPosY(y) {
        return (y / this.scaleY) - this.offY;
    }

    // Transforms the given x world scale coordinate into a canvas scale coordinate (responds to scrolling and zooming)
    canvasScaleX(x) {
        return x * this.scaleX;
    }

    // Transforms the given y world scale coordinate into a canvas scale coordinate (responds to scrolling and zooming)
    canvasScaleY(y) {
        return y * this.scaleY;
    }

    /* BASIC DRAWING FUNCTIONS
     ***************************************************/

    // These functions are wrappers around the original canvas context drawing functions

    clearRect(x, y, width, height) {
        this.context.clearRect(this.canvasPosX(x), this.canvasPosY(y), this.canvasScaleX(width), this.canvasScaleY(height));
    }

    fillRect(x, y, width, height) {
        this.context.fillRect(this.canvasPosX(x), this.canvasPosY(y), this.canvasScaleX(width), this.canvasScaleY(height));
    }

    strokeRect(x, y, width, height) {
        this.usingZoomedLineWidth(function() {
            this.context.strokeRect(this.canvasPosX(x), this.canvasPosY(y), this.canvasScaleX(width), this.canvasScaleY(height));
        });
    }

    fillText(text, x, y, maxWidth) {
        this.usingZoomedFontSize(function() {
            this.context.fillText(text, this.canvasPosX(x), this.canvasPosY(y), maxWidth/*this.canvasScaleX(maxWidth)*/);
        });
    }

    strokeText(text, x, y, maxWidth) {
        this.usingZoomedFontSize(function() {
            this.context.strokeText(text, this.canvasPosX(x), this.canvasPosY(y), this.canvasScaleX(maxWidth));
        });
    }

    beginPath() {
        this.context.beginPath();
    }

    closePath() {
        this.context.closePath();
    }

    moveTo(x, y) {
        this.context.moveTo(this.canvasPosX(x), this.canvasPosY(y));
    }

    lineTo(x, y) {
        this.usingZoomedLineWidth(function () {
            this.context.lineTo(this.canvasPosX(x), this.canvasPosY(y));
        });
    }

    arc(x, y, radius, startAngle, endAngle, anticlockwise) {
        this.context.arc(this.canvasPosX(x), this.canvasPosY(y), this.canvasScaleX(radius), startAngle, endAngle, anticlockwise);
    }

    stroke() {
        this.usingZoomedLineWidth(function () {
            this.context.stroke();
        });
    }

    fill() {
        this.context.fill();
    }


    /* EXTENDED DRAWING FUNCTIONS
     ***************************************************/

    // These functions have been added to help simplify common tasks

    // Executes the given code block, performing all draw functions in world space
    drawInCanvasSpace(block) {
        this._block = block;
        this.drawInWorldSpace = false;
        this._block();
        this.drawInWorldSpace = true;;
    }

    // Executes the given code block, performing all line related functions with a line width proportional to the current
    // zoom (i.e. in world space)
    usingZoomedLineWidth(block) {
        this._block = block;
        this._oldLineWidth = this.lineWidth;
        this.lineWidth *= this.zoom;
        this._block();
        this.lineWidth = this._oldLineWidth;
    }

    // Executes the given code block, performing all text related functions with a font size proportional to the current
    // zoom (i.e. in world space)
    usingZoomedFontSize(block) {
        this._block = block;
        this._oldFontSize = this.fontSize;
        this.fontSize *= this.zoom;
        this._block();
        this.fontSize = this._oldFontSize;
    }

    // Clears the entire canvas
    clear() {
        this.fillStyle = this.clearColour;
        this.drawInCanvasSpace(function() {
            this.fillRect(0, 0, this.width, this.height);
        });
    }


    /* OTHER FUNCTIONS
     ***************************************************/

    // Scales the canvas context based on the scale factor property. Must be called when changes are made to the canvas
    // scale
    applyScale() {
        this.context.scale(this.resScaleFactor, this.resScaleFactor);
    }


    /* CANVAS DRAWING PROPERTIES
     ***************************************************/

    // These properties are wrappers around the original canvas context drawing properties

    get lineWidth() {
        return this.context.lineWidth;
    }
    set lineWidth(width) {
        this.context.lineWidth = width;
    }
    get rawLineWidth() {
        return this.context.lineWidth;
    }

    get font() {
        return this.context.font;
    }

    get fillStyle() {
        return this.context.fillStyle;
    }
    set fillStyle(fillStyle) {
        this.context.fillStyle = fillStyle;
    }

    get strokeStyle() {
        return this.context.strokeStyle;
    }
    set strokeStyle(strokeStyle) {
        this.context.strokeStyle = strokeStyle;
    }

    get globalAlpha() {
        return this.context.globalAlpha;
    }
    set globalAlpha(val) {
        this.context.globalAlpha = val;
    }

    get textAlign() {
        return this.context.textAlign;
    }
    set textAlign(val) {
        this.context.textAlign = val;
    }

    /* EXTENDED CANVAS DRAWING PROPERTIES
     ***************************************************/

    // Returns the current font size
    get fontSize() {
        return this._fontSize;
    }
    set fontSize(size) {
        this._fontSize = size;
        this.context.font = this.fontSize + "px " + this.fontFamily;
    }

    // Returns the current font family
    get fontFamily() {
        return this._fontFamily;
    }
    set fontFamily(family) {
        this._fontFamily = family;
        this.context.font = this.fontSize + "px " + this.fontFamily;
    }

}