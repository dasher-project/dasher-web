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
        // Optional render filters, used by the Learning Center so that only the
        // intended choices are visible:
        //  sliverRatio  > 0: among sibling boxes, any shorter than this fraction
        //                    of the tallest sibling is hidden, with everything
        //                    inside it (near-zero-probability leftovers).
        //  hideLabel    set: a box carrying this label is hidden with its label
        //                    and everything inside it (an invisible "end" box).
        //  boxGapRatio  > 0: boxes are drawn shrunk vertically by this fraction
        //                    of their height, so neighbours don't touch.
        this.sliverRatio = 0;
        this.hideLabel = '';
        this.boxGapRatio = 0;
        //  labelScale   > 1: letters inside boxes are drawn larger.
        this.labelScale = 1;
        // Recent frame signatures, to tell whether the view is moving (zooming).
        // frozen: the engine is not advanced at all (the canvas keeps its last
        // picture), so nothing can start zooming. Used while a prompt is up.
        this.frozen = false;
        this._redrawOnce = false;
        this.motionHistory = [];
        this._prevRects = null;
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
        this._redrawOnce = true; // a resize clears the canvas: draw it again
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
     * Get a long parameter by key.
     */
    getLongParameter(key) {
        if (!this.context) return 0;
        return this.module._dasher_get_long_parameter(this.context, key);
    }

    /**
     * Set a long parameter by key.
     */
    setLongParameter(key, value) {
        if (!this.context) return;
        this.module._dasher_set_long_parameter(this.context, key, value);
    }

    /**
     * Get a string parameter by key.
     */
    getStringParameter(key) {
        if (!this.context) return '';
        const ptr = this.module._dasher_get_string_parameter(this.context, key);
        return ptr ? this.module.UTF8ToString(ptr) : '';
    }

    /**
     * Set a string parameter by key.
     */
    setStringParameter(key, value) {
        if (!this.context) return;
        this._flushPtrs();
        const ptr = this._strToPtr(value);
        this.module._dasher_set_string_parameter(this.context, key, ptr);
    }

    // ── Settings manifest (dasher_get_parameter_*) ─────────────────────────
    // Struct dasher_parameter_info (wasm32: i32/ptr/long all 4 bytes):
    //   0 key, 4 name*, 8 desc*, 12 type, 16 ui_type, 20 min, 24 max,
    //   28 step, 32 advanced, 36 group*, 40 subgroup*

    /**
     * Number of parameters in the settings manifest.
     */
    getParameterCount() {
        return this.module._dasher_get_parameter_count();
    }

    /**
     * Manifest info for the parameter at index (0..count-1):
     * {key, name, desc, type, uiType, min, max, step, advanced, group, subgroup}
     */
    getParameterInfo(index) {
        const m = this.module;
        const ptr = m._malloc(44);
        try {
            if (m._dasher_get_parameter_info(index, ptr) !== 0) return null;
            return {
                key: m.getValue(ptr, 'i32'),
                name: m.UTF8ToString(m.getValue(ptr + 4, '*')),
                desc: m.UTF8ToString(m.getValue(ptr + 8, '*')),
                type: m.getValue(ptr + 12, 'i32'),
                uiType: m.getValue(ptr + 16, 'i32'),
                min: m.getValue(ptr + 20, 'i32'),
                max: m.getValue(ptr + 24, 'i32'),
                step: m.getValue(ptr + 28, 'i32') || 1,
                advanced: m.getValue(ptr + 32, 'i32') === 1,
                group: m.UTF8ToString(m.getValue(ptr + 36, '*')),
                subgroup: m.UTF8ToString(m.getValue(ptr + 40, '*')),
            };
        } finally {
            m._free(ptr);
        }
    }

    /**
     * Permitted values for an enum-typed long parameter: [{name, value}].
     */
    getParameterEnumValues(key) {
        const m = this.module;
        const count = m._dasher_get_parameter_enum_count(key);
        const values = [];
        for (let i = 0; i < count; i++) {
            values.push({
                name: m.UTF8ToString(m._dasher_get_parameter_enum_name(key, i)),
                value: m._dasher_get_parameter_enum_value(key, i),
            });
        }
        return values;
    }

    /**
     * Permitted values for a string parameter (e.g. alphabet, palette,
     * input filter): [names].
     */
    getParameterStringValues(key) {
        const m = this.module;
        const max = 512;
        const ptr = m._malloc(4 * max);
        try {
            const count = m._dasher_get_parameter_string_values(this.context, key, ptr, max);
            const values = [];
            for (let i = 0; i < count && i < max; i++) {
                values.push(m.UTF8ToString(m.getValue(ptr + i * 4, '*')));
            }
            return values;
        } finally {
            m._free(ptr);
        }
    }

    // ── Typing rate (RFC 0012) ─────────────────────────────────────────────

    /** Words per minute over a short rolling window (WPM = CPS × 12). */
    getWpm() {
        if (!this.context || !this.module._dasher_get_wpm) return 0;
        return this.module._dasher_get_wpm(this.context);
    }

    /** Characters per second over a short rolling window. */
    getCps() {
        if (!this.context || !this.module._dasher_get_cps) return 0;
        return this.module._dasher_get_cps(this.context);
    }

    /** Reset the rolling typing-rate window. */
    resetCps() {
        if (!this.context || !this.module._dasher_reset_cps) return;
        this.module._dasher_reset_cps(this.context);
    }

    // ── Game mode (RFC 0004 practice mode) ─────────────────────────────────

    enterGameMode() {
        if (!this.context) return false;
        // Returns 0 on success, -1 on failure.
        return this.module._dasher_enter_game_mode(this.context) === 0;
    }

    leaveGameMode() {
        if (!this.context) return;
        this.module._dasher_leave_game_mode(this.context);
    }

    gameModeActive() {
        if (!this.context) return false;
        return this.module._dasher_game_mode_active(this.context) !== 0;
    }

    /** Let the engine draw its target-text overlay on the canvas stream. */
    gameSetCanvasText(enabled) {
        if (!this.context) return;
        this.module._dasher_game_set_canvas_text(this.context, enabled ? 1 : 0);
    }

    getGameTargetText() {
        if (!this.context) return '';
        return this.module.UTF8ToString(this.module._dasher_game_get_target_text(this.context));
    }

    getGameCorrectCount() {
        if (!this.context) return 0;
        return this.module._dasher_game_get_correct_count(this.context);
    }

    getGameTargetLength() {
        if (!this.context) return 0;
        return this.module._dasher_game_get_target_length(this.context);
    }

    getGameWrongText() {
        if (!this.context) return '';
        return this.module.UTF8ToString(this.module._dasher_game_get_wrong_text(this.context));
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
        if (this.frozen && !this._redrawOnce) return;
        this._redrawOnce = false;
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

            this._recordSignature(cmds, cmdCount);
            this.renderFrame(cmds, cmdCount, strs, strCount);
        } finally {
            this.module._free(cmdsPtr);
            this.module._free(cmdCountPtr);
            this.module._free(strsPtr);
            this.module._free(strCountPtr);
        }
    }

    // How many boxes changed position since the previous frame. It is 0 when
    // Dasher is standing still, and falls off smoothly as a zoom eases to a stop.
    // (Boxes are compared as a set, so boxes appearing or disappearing while
    // zooming don't cause huge jumps; and deep zoom is handled because every
    // visible box is included, not just the big outer ones.)
    _recordSignature(cmds, cmdCount) {
        const cur = new Set();
        for (let i = 0; i < cmdCount; i += 6) {
            if (this.module.getValue(cmds + i * 4, 'i32') === 4) {
                const h = (((this.module.getValue(cmds + (i + 1) * 4, 'i32') * 31
                    + this.module.getValue(cmds + (i + 2) * 4, 'i32')) * 31
                    + this.module.getValue(cmds + (i + 3) * 4, 'i32')) * 31
                    + this.module.getValue(cmds + (i + 4) * 4, 'i32')) | 0;
                cur.add(h);
            }
        }
        let changed = 0;
        if (this._prevRects) for (const h of cur) if (!this._prevRects.has(h)) changed++;
        this._prevRects = cur;
        this.motionHistory.push(changed);
        if (this.motionHistory.length > 10) this.motionHistory.shift();
    }

    /** Average number of boxes that moved per frame over the last few frames. */
    motionLevel() {
        const h = this.motionHistory.slice(-8);
        return h.length < 8 ? 0 : h.reduce((a, b) => a + b, 0) / h.length;
    }

    /**
     * True while the view is zooming. Clicking toggles this in click-to-start
     * mode; mouseUp does not stop it.
     */
    isMoving() {
        return this.motionLevel() > 3;
    }

    /**
     * Render the frame's draw commands to the canvas.
     */
    renderFrame(cmds, cmdCount, strs, strCount) {
        if (!this.ctx || cmdCount === 0) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Stroke width for outlines. The flat command stream carries no
        // per-rect thickness (opcode 6 sets it for polylines only), so scale
        // a sensible default to the canvas resolution — a 1px hairline is
        // invisible on HiDPI canvases.
        this._lineWidth = Math.max(1, Math.round(this.canvas.width / 700));

        const hidden = (this.sliverRatio > 0 || this.hideLabel)
            ? this._findSlivers(cmds, cmdCount, strs, strCount) : null;

        for (let i = 0; i < cmdCount; i += 6) {
            if (hidden && hidden[i / 6]) continue;
            const opcode = this.module.getValue(cmds + i * 4, 'i32');
            const a = this.module.getValue(cmds + (i + 1) * 4, 'i32');
            const b = this.module.getValue(cmds + (i + 2) * 4, 'i32');
            const c = this.module.getValue(cmds + (i + 3) * 4, 'i32');
            const d = this.module.getValue(cmds + (i + 4) * 4, 'i32');
            const argb = this.module.getValue(cmds + (i + 5) * 4, 'i32');
            this.renderCommand(opcode, a, b, c, d, argb, strs, strCount);
        }
    }

    /**
     * Work out which draw commands to skip (see sliverRatio / hideLabel).
     * The engine emits every box rectangle first (parents before children),
     * then every label. Returns a Uint8Array indexed by command number
     * (1 = skip).
     */
    _findSlivers(cmds, cmdCount, strs, strCount) {
        const n = cmdCount / 6;
        const hidden = new Uint8Array(n);
        const rects = []; // {k, x1, y1, x2, y2, parent}
        const texts = []; // {k, x, y, label}
        const geti = (k, j) => this.module.getValue(cmds + k * 24 + j * 4, 'i32');
        for (let k = 0; k < n; k++) {
            const op = geti(k, 0);
            if (op === 3 || op === 4) {
                const a = geti(k, 1), b = geti(k, 2), c = geti(k, 3), d = geti(k, 4);
                rects.push({ k, x1: Math.min(a, c), y1: Math.min(b, d), x2: Math.max(a, c), y2: Math.max(b, d), parent: -1 });
            } else if (op === 5) {
                const idx = geti(k, 4);
                let label = '';
                if (this.hideLabel && strs && idx < strCount) {
                    label = this.module.UTF8ToString(this.module.getValue(strs + idx * 4, '*'));
                }
                texts.push({ k, x: geti(k, 1) + 1, y: geti(k, 2) - geti(k, 3) * 0.3, label });
            }
        }
        const tol = 1;
        const hid = new Uint8Array(rects.length);
        // nearest earlier rectangle containing each rectangle = its parent box
        for (let i = 0; i < rects.length; i++) {
            const r = rects[i];
            for (let j = i - 1; j >= 0; j--) {
                const p = rects[j];
                if (r.x1 >= p.x1 - tol && r.x2 <= p.x2 + tol && r.y1 >= p.y1 - tol && r.y2 <= p.y2 + tol) {
                    r.parent = j;
                    break;
                }
            }
        }
        if (this.sliverRatio > 0) {
            const maxH = new Map();
            const count = new Map();
            for (const r of rects) {
                const h = r.y2 - r.y1;
                maxH.set(r.parent, Math.max(maxH.get(r.parent) || 0, h));
                count.set(r.parent, (count.get(r.parent) || 0) + 1);
            }
            rects.forEach((r, i) => {
                if (count.get(r.parent) > 1 && (r.y2 - r.y1) < this.sliverRatio * maxH.get(r.parent)) hid[i] = 1;
            });
        }
        // which rectangle does each label sit in? (the last one containing it)
        const textRect = texts.map(t => {
            for (let j = rects.length - 1; j >= 0; j--) {
                const p = rects[j];
                if (t.x >= p.x1 && t.x <= p.x2 && t.y >= p.y1 && t.y <= p.y2) return j;
            }
            return -1;
        });
        if (this.hideLabel) {
            // A label sits at its own box's left edge: find that box exactly
            // (never a big ancestor, or everything would be hidden).
            const W = this.canvas.width, H = this.canvas.height;
            texts.forEach((t) => {
                if (t.label !== this.hideLabel) return;
                let best = -1, bestH = Infinity;
                rects.forEach((r, j) => {
                    const h = r.y2 - r.y1;
                    if (Math.abs(r.x1 - (t.x - 1)) <= 3 && t.y >= r.y1 && t.y <= r.y2 && h < bestH
                        && !((r.x2 - r.x1) >= W * 0.98 && h >= H * 0.98)) { best = j; bestH = h; }
                });
                if (best >= 0) hid[best] = 1;
            });
        }
        // everything inside a hidden box is hidden too (parents precede children)
        for (let i = 0; i < rects.length; i++) {
            if (rects[i].parent >= 0 && hid[rects[i].parent]) hid[i] = 1;
            if (hid[i]) hidden[rects[i].k] = 1;
        }
        texts.forEach((t, i) => {
            if ((textRect[i] >= 0 && hid[textRect[i]]) || (this.hideLabel && t.label === this.hideLabel)) hidden[t.k] = 1;
        });
        // Safety net: never blank the whole screen.
        let shown = 0;
        for (let i = 0; i < rects.length; i++) if (!hidden[rects[i].k]) shown++;
        if (rects.length > 0 && shown <= 1) hidden.fill(0);
        return hidden;
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
                this.ctx.lineWidth = this._cmdLineWidth || 1;
                this.ctx.beginPath();
                this.ctx.moveTo(a, b);
                this.ctx.lineTo(c, d);
                this.ctx.stroke();
                break;

            case 3: // Rectangle outline
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = this._lineWidth || 1;
                this.ctx.strokeRect(a, b, c - a, d - b);
                break;

            case 4: // Rectangle filled
                this.ctx.fillStyle = color;
                if (this.boxGapRatio > 0 && !(a <= 0 && b <= 0 && c >= this.canvas.width && d >= this.canvas.height)) {
                    // shrink vertically so neighbouring boxes don't touch
                    const inset = Math.min((d - b) * this.boxGapRatio / 2, Math.max(0, (d - b - 2) / 2));
                    this.ctx.fillRect(a, b + inset, c - a, d - b - 2 * inset);
                } else {
                    this.ctx.fillRect(a, b, c - a, d - b);
                }
                break;

            case 5: // Text
                if (strs && d < strCount) {
                    const strPtr = this.module.getValue(strs + d * 4, '*');
                    const text = this.module.UTF8ToString(strPtr);
                    if (text) {
                        this.ctx.fillStyle = color;
                        this.ctx.font = `${Math.round(c * (this.labelScale || 1))}px sans-serif`;
                        this.ctx.textBaseline = 'alphabetic';
                        this.ctx.fillText(text, a, b);
                    }
                }
                break;

            case 6: // Set line width for subsequent polyline segments
                this._cmdLineWidth = a;
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
