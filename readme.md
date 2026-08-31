# Dasher on the Web

[![Build and Deploy](https://github.com/dasher-project/dasher-web/actions/workflows/build-deploy.yml/badge.svg)](https://github.com/dasher-project/dasher-web/actions/workflows/build-deploy.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Dasher is a zooming text-entry interface, driven by continuous pointing gestures. This repo hosts a **WebAssembly build of the native DasherCore C++ engine** for in-browser use.

**Live demo:** https://dasher-project.github.io/dasher-web/

**Enhanced playground:** https://dasher-project.github.io/dasher-web/js-demo/ —
theme picker (12 colour palettes), node-shape and outline controls, and a
searchable catalogue of 470+ alphabets fetched on demand (20 bundled with
training text; the rest lazy-load from the static catalogue and use
fallback frequencies until you type).

## Quick Start

```bash
git clone --recurse-submodules https://github.com/dasher-project/dasher-web.git
cd dasher-web/wasm-build

# Build (requires Emscripten SDK + CMake + Ninja)
source /path/to/emsdk/emsdk_env.sh
bash build.sh        # or build.bat on Windows

# Serve the output with any static server
npx serve .
# Open http://localhost:3000/demo.html
```

See [`wasm-build/README.md`](wasm-build/README.md) for full build details, API docs, and architecture.

## How It Works

The native DasherCore engine (C++) is compiled to WebAssembly via Emscripten. Data files (alphabets, colours, training text, localized strings) are preloaded into the WASM virtual filesystem. A JavaScript wrapper (`dasher-wasm-wrapper.js`) provides a clean API with canvas rendering, mouse/touch input, and parameter control.

Features include:
- Full DasherCore engine with PPM language model
- 10 trained languages (English, German, Spanish, French, Italian,
  Portuguese, Dutch, Polish, Russian, Arabic) — 19 alphabets
- Adjustable speed with auto-speed control
- Learning toggle for language model adaptation
- Mouse and touch input
- Canvas-based rendering

## Repository Structure

```
wasm-build/           WASM build (source, scripts, demo)
  dashercore-src/     DasherCore C++ source (git submodule, branch main)
  data-bundle/        Curated data files for preloading
  demo.html           Interactive demo
  dasher-wasm-wrapper.js   JavaScript API wrapper
  build.sh / build.bat    Build scripts
```

## Legacy pure-JS demo

Before the WASM build, this repo carried a complete pure-JavaScript
Dasher demo (`browser/`) originally written by Jim Hawkins (ACE
Centre-North, later VMware). It is preserved, with all its v0.2.0
enhancements (90 languages, script-generated alphabets,
saved-language migration), on the **`legacy-js-demo`** tag:

```bash
git checkout legacy-js-demo        # browse or run the JS demo
```

Releases from **v0.2.0** also carried it. It was retired from `main`
in favour of the WASM DasherCore build — same engine as the desktop
and mobile apps, no separate JS codebase to maintain.

## Embedding in Your Site

The deployed demo is hosted at `https://dasher-project.github.io/dasher-web/`. You can link to it, embed it in an iframe, or self-host the files.

### Option 1: Iframe

```html
<iframe
  src="https://dasher-project.github.io/dasher-web/"
  width="800" height="600"
  style="border:1px solid #ddd; border-radius:8px;"
  allow="fullscreen"
></iframe>
```

### Option 2: Self-hosted

Copy these files from a build (or from the GH Pages output) into your project:

```
dasher-wasm-wrapper.js
wasm/
  dasher.js
  dasher.wasm
  dasher.data
```

Then use the JavaScript API directly:

```html
<canvas id="dasher" width="800" height="600"></canvas>

<script src="dasher-wasm-wrapper.js"></script>
<script type="module">
  const canvas = document.getElementById('dasher');
  const { default: createModule } = await import('./wasm/dasher.js');

  const dasher = new DasherWasm();
  await dasher.init({
    canvas,
    moduleFactory: createModule,
    onOutput: (eventType, text) => console.log('Output:', text),
  });

  dasher.createContext();
  dasher.setScreenSize(canvas.width, canvas.height);

  // Input
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    dasher.mouseMove(
      (e.clientX - rect.left) * (canvas.width / rect.width),
      (e.clientY - rect.top) * (canvas.height / rect.height)
    );
  });
  canvas.addEventListener('mousedown', () => dasher.mouseDown());
  canvas.addEventListener('mouseup', () => dasher.mouseUp());

  // Render loop
  function loop() {
    dasher.frame(performance.now());
    requestAnimationFrame(loop);
  }
  loop();
</script>
```

The wrapper also exposes parameter control:

```javascript
// Switch alphabet
dasher.setAlphabet('English');

// Adjust speed (20-400%)
dasher.setSpeed(120);

// Toggle auto-speed / learning
dasher.setBoolParameter(dasher.findParameterKey('BP_AUTO_SPEEDCONTROL'), true);
dasher.setBoolParameter(dasher.findParameterKey('BP_LM_ADAPTIVE'), true);
```

## License

MIT licensed. Copyright (c) dasher-project contributors.

## Other Versions of Dasher

- [DasherCore](https://github.com/dasher-project/DasherCore) - C++ core engine
- [Dasher (classic)](https://github.com/dasher-project/dasher/) - Original desktop version
- [Dasher for iOS/Android](https://github.com/dasher-project/dasher-captivewebview) - Mobile apps
- [Dasher for Desktop](https://github.com/dasher-project/dasher-electron) - Electron wrapper
