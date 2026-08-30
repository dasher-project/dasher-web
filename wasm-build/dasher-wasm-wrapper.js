/**
 * DasherCore WebAssembly Wrapper
 * Provides a JavaScript interface to the DasherCore C API
 *
 * The WASM module exports a MODULARIZE factory (createDasherModule).
 * Data files are preloaded into the Emscripten MEMFS at /data at build time.
 */

class DasherWasm {
    constructor() {
        this.module = null;
        this.context = null;
        this.canvas = null;
        this.ctx = null;
        this.outputCallback = null;
        this.messageCallback = null;
        this.dataDir = '/data';
        this.userDir = '/user';
        this._outputCbPtr = null;
        this._messageCbPtr = null;
        this._heapPtrs = [];
    }

    /**
     * Allocate a C string in WASM memory and return the pointer.
     * Pointers are tracked for cleanup.
     */
    _strToPtr(str) {
        const len = this.module.lengthBytesUTF8(str) + 1;
        const ptr = this.module._malloc(len);
        this.module.stringToUTF8(str, ptr, len);
        this._heapPtrs.push(ptr);
        return ptr;
    }

    _flushPtrs() {
        for (const ptr of this._heapPtrs) {
            this.module._free(ptr);
        }
        this._heapPtrs = [];
    }

    /**
     * Initialize the DasherCore WASM module.
     * @param {Object} options
     * @param {HTMLCanvasElement} options.canvas - Canvas for rendering
     * @param {Function} options.moduleFactory - The createDasherModule factory
     * @param {Function} [options.onOutput] - Callback (eventType, text) for text output
     * @param {Function} [options.onMessage] - Callback (messageType, text) for messages
     */
    async init(options = {}) {
        const { canvas, moduleFactory, onOutput, onMessage } = options;

        this.canvas = canvas;
        if (canvas) {
            this.ctx = canvas.getContext('2d');
        }
        this.outputCallback = onOutput || null;
        this.messageCallback = onMessage || null;

        let createModuleFunc = moduleFactory;
        if (!createModuleFunc) {
            const dasherModule = await import('./wasm/dasher.js');
            createModuleFunc = dasherModule.default;
        }

        this.module = await createModuleFunc({
            locateFile: (file) => `wasm/${file}`,
        });

        // Ensure /user directory exists in MEMFS for settings
        if (this.module.FS) {
            try { this.module.FS.mkdirTree(this.userDir); } catch (e) { /* already exists */ }
        }

        // Register callbacks with the C side (using addFunction for wasm callback support)
        if (this.module.addFunction && this.outputCallback) {
            const cb = this.module.addFunction((eventType, textPtr, userData) => {
                const text = this.module.UTF8ToString(textPtr);
                this.outputCallback(eventType, text);
            }, 'viii');
            this._outputCbPtr = cb;
        }

        if (this.module.addFunction && this.messageCallback) {
            const cb = this.module.addFunction((msgType, textPtr, userData) => {
                const text = this.module.UTF8ToString(textPtr);
                this.messageCallback(msgType, text);
            }, 'viii');
            this._messageCbPtr = cb;
        }

        return this;
    }

    /**
     * Create a Dasher context and realize it.
     * @param {string} [alphabetId] - Alphabet ID to use (optional)
     */
    createContext(alphabetId) {
        if (!this.module) {
            throw new Error('Module not initialized. Call init() first.');
        }

        const errPtr = this.module._malloc(4);
        this.module.setValue(errPtr, 0, '*');

        const dataDirPtr = this._strToPtr(this.dataDir);
        const userDirPtr = this._strToPtr(this.userDir);

        const context = this.module._dasher_create(dataDirPtr, userDirPtr, errPtr);

        const errP = this.module.getValue(errPtr, '*');
        this.module._free(errPtr);
        this._flushPtrs();

        if (errP) {
            const errStr = this.module.UTF8ToString(errP);
            throw new Error(`Failed to create context: ${errStr}`);
        }
        if (!context) {
            throw new Error('Failed to create Dasher context (returned null)');
        }

        this.context = context;

        // Register output/message callbacks with the engine
        if (this._outputCbPtr) {
            this.module._dasher_set_output_callback(this.context, this._outputCbPtr, 0);
        }
        if (this._messageCbPtr) {
            this.module._dasher_set_message_callback(this.context, this._messageCbPtr, 0);
        }

        return this;
    }

    /**
     * Set the screen size. This triggers Realize() on first call (loads alphabets etc).
     */
    setScreenSize(width, height) {
        if (!this.context) return;
        this.module._dasher_set_screen_size(this.context, width, height);
    }

    /**
     * Get all available alphabet names.
     * @returns {string[]}
     */
    getAlphabets() {
        if (!this.context) return [];
        const count = this.module._dasher_get_alphabet_count(this.context);
        const result = [];
        for (let i = 0; i < count; i++) {
            const namePtr = this.module._dasher_get_alphabet_name(this.context, i);
            result.push(this.module.UTF8ToString(namePtr));
        }
        return result;
    }

    /**
     * Get the current alphabet ID.
     * @returns {string}
     */
    getAlphabet() {
        if (!this.context) return '';
        const ptr = this.module._dasher_get_alphabet_id(this.context);
        return this.module.UTF8ToString(ptr);
    }

    /**
     * Set the alphabet by ID (name).
     */
    setAlphabet(alphabetId) {
        if (!this.context) return;
        const ptr = this._strToPtr(alphabetId);
        this.module._dasher_set_alphabet_id(this.context, ptr);
        this._flushPtrs();
    }

    /**
     * Set the dashing speed as a percentage (20-400).
     */
    setSpeed(percent) {
        if (!this.context) return;
        this.module._dasher_set_speed_percent(this.context, percent);
    }

    /**
     * Get the current speed percentage.
     */
    getSpeed() {
        if (!this.context) return 100;
        return this.module._dasher_get_speed_percent(this.context);
    }

    /**
     * Find a bool parameter key by name (e.g. "LMAdaptive", "AutoSpeedControl").
     * Returns the numeric key, or -1 if not found.
     */
    findParameterKey(name) {
        if (!this.module) return -1;
        const ptr = this._strToPtr(name);
        const key = this.module._dasher_find_parameter_key(ptr);
        this._flushPtrs();
        return key;
    }

    /**
     * Get a bool parameter by key.
     */
    getBoolParameter(key) {
        if (!this.context) return false;
        return this.module._dasher_get_bool_parameter(this.context, key) !== 0;
    }

    /**
     * Set a bool parameter by key.
     */
    setBoolParameter(key, value) {
        if (!this.context) return;
        this.module._dasher_set_bool_parameter(this.context, key, value ? 1 : 0);
    }

    /**
     * Handle mouse movement.
     */
    mouseMove(x, y) {
        if (!this.context) return;
        this.module._dasher_mouse_move(this.context, x, y);
    }

    /**
     * Handle mouse down (starts dashing).
     */
    mouseDown() {
        if (!this.context) return;
        this.module._dasher_mouse_down(this.context);
    }

    /**
     * Handle mouse up (stops dashing).
     */
    mouseUp() {
        if (!this.context) return;
        this.module._dasher_mouse_up(this.context);
    }

    /**
     * Advance one frame and render.
     * @param {number} [time] - Time in ms (defaults to Date.now())
     */
    frame(time) {
        if (!this.context) return;
        const t = time != null ? Math.trunc(time) : Date.now();
        const cmdsPtr = this.module._malloc(4);
        const cmdCountPtr = this.module._malloc(4);
        const strsPtr = this.module._malloc(4);
        const strCountPtr = this.module._malloc(4);

        try {
            this.module._dasher_frame(this.context, BigInt(t), cmdsPtr, cmdCountPtr, strsPtr, strCountPtr);

            const cmds = this.module.getValue(cmdsPtr, '*');
            const cmdCount = this.module.getValue(cmdCountPtr, 'i32');
            const strs = this.module.getValue(strsPtr, '*');
            const strCount = this.module.getValue(strCountPtr, 'i32');

            this.renderFrame(cmds, cmdCount, strs, strCount);
        } finally {
            this.module._free(cmdsPtr);
            this.module._free(cmdCountPtr);
            this.module._free(strsPtr);
            this.module._free(strCountPtr);
        }
    }

    /**
     * Render the frame's draw commands to the canvas.
     */
    renderFrame(cmds, cmdCount, strs, strCount) {
        if (!this.ctx || cmdCount === 0) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = 0; i < cmdCount; i += 6) {
            const opcode = this.module.getValue(cmds + i * 4, 'i32');
            const a = this.module.getValue(cmds + (i + 1) * 4, 'i32');
            const b = this.module.getValue(cmds + (i + 2) * 4, 'i32');
            const c = this.module.getValue(cmds + (i + 3) * 4, 'i32');
            const d = this.module.getValue(cmds + (i + 4) * 4, 'i32');
            const argb = this.module.getValue(cmds + (i + 5) * 4, 'i32');
            this.renderCommand(opcode, a, b, c, d, argb, strs, strCount);
        }
    }

    renderCommand(opcode, a, b, c, d, argb, strs, strCount) {
        const alpha = (argb >>> 24) & 0xFF;
        const red = (argb >> 16) & 0xFF;
        const green = (argb >> 8) & 0xFF;
        const blue = argb & 0xFF;

        if (alpha === 0) return;

        const color = `rgba(${red}, ${green}, ${blue}, ${alpha / 255})`;

        switch (opcode) {
            case 0: // Clear screen
                this.ctx.fillStyle = color;
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                break;

            case 1: // Circle (d=1 fill, d=0 stroke)
                this.ctx.beginPath();
                this.ctx.arc(a, b, c, 0, 2 * Math.PI);
                if (d === 1) {
                    this.ctx.fillStyle = color;
                    this.ctx.fill();
                } else {
                    this.ctx.strokeStyle = color;
                    this.ctx.stroke();
                }
                break;

            case 2: // Line
                this.ctx.strokeStyle = color;
                this.ctx.beginPath();
                this.ctx.moveTo(a, b);
                this.ctx.lineTo(c, d);
                this.ctx.stroke();
                break;

            case 3: // Rectangle outline
                this.ctx.strokeStyle = color;
                this.ctx.strokeRect(a, b, c - a, d - b);
                break;

            case 4: // Rectangle filled
                this.ctx.fillStyle = color;
                this.ctx.fillRect(a, b, c - a, d - b);
                break;

            case 5: // Text
                if (strs && d < strCount) {
                    const strPtr = this.module.getValue(strs + d * 4, '*');
                    const text = this.module.UTF8ToString(strPtr);
                    if (text) {
                        this.ctx.fillStyle = color;
                        this.ctx.font = `${c}px sans-serif`;
                        this.ctx.textBaseline = 'alphabetic';
                        this.ctx.fillText(text, a, b);
                    }
                }
                break;

            default:
                break;
        }
    }

    /**
     * Get the current output text.
     * @returns {string}
     */
    getOutputText() {
        if (!this.context) return '';
        const ptr = this.module._dasher_get_output_text(this.context);
        return this.module.UTF8ToString(ptr);
    }

    /**
     * Reset the output text only.
     */
    resetOutputText() {
        if (!this.context) return;
        this.module._dasher_reset_output_text(this.context);
    }

    /**
     * Full reset (text + model position).
     */
    reset() {
        if (!this.context) return;
        this.module._dasher_reset(this.context);
    }

    /**
     * Clean up resources.
     */
    destroy() {
        if (this.context && this.module) {
            this.module._dasher_destroy(this.context);
            this.context = null;
        }
        if (this._outputCbPtr && this.module.removeFunction) {
            this.module.removeFunction(this._outputCbPtr);
            this._outputCbPtr = null;
        }
        if (this._messageCbPtr && this.module.removeFunction) {
            this.module.removeFunction(this._messageCbPtr);
            this._messageCbPtr = null;
        }
    }
}

if (typeof window !== 'undefined') {
    window.DasherWasm = DasherWasm;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DasherWasm;
}
