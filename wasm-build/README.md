# DasherCore WebAssembly Build

This directory contains a fully functional WebAssembly build of the DasherCore C++ engine, compiled with Emscripten for in-browser use.

## Quick Start

### Prerequisites

1. **Emscripten SDK** (emsdk) — installed and activated
   - Linux/Mac: `source /path/to/emsdk/emsdk_env.sh`
   - Windows: `call C:\path\to\emsdk\emsdk_env.bat`
2. **CMake 3.12+** and **Ninja** (for building the static libraries)
3. **Node.js** (for running the demo server)

### Clone with Submodule

```bash
git clone --recurse-submodules https://github.com/dasher-project/dasher-web.git
# Or if already cloned:
git submodule update --init --remote
```

### Build

```bash
# Windows
call emsdk_env.bat
build.bat

# Linux/Mac/WSL
source /path/to/emsdk/emsdk_env.sh
./build.sh
```

This produces three files in `wasm/`:
- `dasher.js` — ES6 module loader (~30KB)
- `dasher.wasm` — compiled binary (~984KB)
- `dasher.data` — preloaded data bundle (~7MB: alphabets, colours, training, strings)

### Run the Demo

```bash
node server.js
```

Open http://localhost:8000/demo.html in your browser.

## Build Process

The build has two stages:

1. **Static libraries** — CMake compiles DasherCore + pugixml into static archives (`build-wasm/libDasherCore.a`, `build-wasm/Thirdparty/pugixml/libpugixml.a`) using `emcmake` + Ninja.

2. **WASM link** — `em++` compiles `dashercore-src/src/CAPI.cpp` and links both archives into a final WASM module with ES6 export, filesystem, and preloaded data.

### Key Build Flags

| Flag | Purpose |
|------|---------|
| `-fwasm-exceptions` | C++ exceptions via WASM (not JS) |
| `-s EXPORT_ES6=1` | ES6 `export default` for browser `import()` |
| `-s ENVIRONMENT=web` | Web-only (smaller output) |
| `-s FORCE_FILESYSTEM=1` | MEMFS for preloaded data |
| `-s ALLOW_TABLE_GROWTH=1` | Required for `addFunction()` callbacks |
| `--preload-file data-bundle@/data` | Bundles data into MEMFS at `/data` |

## Architecture

```
demo.html                    Demo page (canvas, controls, input handling)
    |
dasher-wasm-wrapper.js       JS API wrapper (string passing, callbacks, rendering)
    |
wasm/dasher.js + .wasm       Emscripten module (ES6, MODULARIZE)
    |
DasherCore C++ Engine         Full native engine running in WASM
    |
MEMFS /data/                  Preloaded alphabets, colours, training, strings
```

### Data Bundle (`data-bundle/`)

Curated subset of DasherCore's data directory (~7MB):

```
data-bundle/
├── alphabet/        Alphabet definitions (English, German, French, Spanish, etc.)
├── colour/          Colour schemes
├── training/        Language model training text
└── Strings/         Localized strings (strings_en.json, etc.)
```

This is loaded into the WASM filesystem at `/data` at build time via `--preload-file`.

## JavaScript API (`DasherWasm`)

```javascript
const dasher = new DasherWasm();

// 1. Load module (imports wasm/dasher.js, registers callbacks)
await dasher.init({
    canvas: document.getElementById('canvas'),
    moduleFactory: createDasherModule,  // from import('./wasm/dasher.js')
    onOutput: (eventType, text) => { ... },
});

// 2. Create context (loads engine with /data as data directory)
dasher.createContext();

// 3. Set screen size — triggers Realize() which loads alphabets/training
dasher.setScreenSize(800, 600);

// 4. Interact
dasher.getAlphabets();           // ['ABCs', 'English (UK)', ...]
dasher.setAlphabet('English');   // switch alphabet
dasher.setSpeed(100);            // 20-400 percent
dasher.mouseMove(x, y);          // steer
dasher.mouseDown();              // start dashing
dasher.mouseUp();                // stop

// 5. Per-frame render + tick
dasher.frame(performance.now()); // BigInt time, renders to canvas

// 6. Output
dasher.getOutputText();          // current typed text
dasher.resetOutputText();        // clear text
dasher.reset();                  // full reset (text + model)

// 7. Cleanup
dasher.destroy();
```

### Initialization Order (Important)

`createContext()` → `setScreenSize()` → `getAlphabets()`

The `setScreenSize()` call triggers `Realize()` internally, which scans the MEMFS `/data` directory and loads alphabets, colours, and training data. Alphabet queries before this will return empty.

## File Structure

```
wasm-build/
├── dashercore-src/          DasherCore C++ source (git submodule, branch feature-CAPI)
│   ├── src/                 Source (including CAPI.cpp — the C API entry point)
│   └── Thirdparty/          pugixml XML parser
├── data-bundle/             Curated data for preloading (alphabets, colours, training, Strings)
├── build-wasm/              CMake build output (gitignored)
│   ├── libDasherCore.a      Compiled static library
│   ├── exports.json         Exported C API symbol list
│   └── Thirdparty/pugixml/libpugixml.a
├── wasm/                    Final WASM output (gitignored)
│   ├── dasher.js            ES6 module loader
│   ├── dasher.wasm          Binary
│   └── dasher.data          Preloaded data
├── build.sh                 Build script (Linux/Mac/WSL)
├── build.bat                Build script (Windows)
├── server.js                Node.js demo server (serves on :8000)
├── dasher-wasm-wrapper.js   JavaScript API wrapper
├── demo.html                Interactive demo page
├── package.json             npm scripts
└── README.md                This file
```

## Technical Notes

### String Passing
C strings are allocated via `_malloc` + `stringToUTF8` and tracked for cleanup (`_strToPtr` / `_flushPtrs` in the wrapper).

### Time (int64)
`dasher_frame()` takes an `int64_t` time. The wrapper uses `BigInt(Math.trunc(performance.now()))`.

### Callbacks
Output and message callbacks are registered via `addFunction()` (Emscripten's `WebAssembly.Table`-based callback mechanism), which is why `-s ALLOW_TABLE_GROWTH=1` is required at link time.

### Rendering
`dasher_frame()` returns arrays of draw commands (clear, circle, line, rectangle, text) which the wrapper renders to the `<canvas>` 2D context. Each command is 6 ints: `[opcode, a, b, c, d, argb_color]`.
