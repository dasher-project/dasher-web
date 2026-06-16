# Dasher on the Web

[![Build and Deploy](https://github.com/dasher-project/dasher-web/actions/workflows/build-deploy.yml/badge.svg)](https://github.com/dasher-project/dasher-web/actions/workflows/build-deploy.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Dasher is a zooming text-entry interface, driven by continuous pointing gestures. This repo hosts a **WebAssembly build of the native DasherCore C++ engine** for in-browser use.

**Live demo:** https://dasher-project.github.io/dasher-web/

## Quick Start

```bash
git clone --recurse-submodules https://github.com/dasher-project/dasher-web.git
cd dasher-web/wasm-build

# Build (requires Emscripten SDK + CMake + Ninja)
source /path/to/emsdk/emsdk_env.sh
bash build.sh        # or build.bat on Windows

# Run locally
node server.js
# Open http://localhost:8000/demo.html
```

See [`wasm-build/README.md`](wasm-build/README.md) for full build details, API docs, and architecture.

## How It Works

The native DasherCore engine (C++) is compiled to WebAssembly via Emscripten. Data files (alphabets, colours, training text, localized strings) are preloaded into the WASM virtual filesystem. A JavaScript wrapper (`dasher-wasm-wrapper.js`) provides a clean API with canvas rendering, mouse/touch input, and parameter control.

Features include:
- Full DasherCore engine with PPM language model
- 14+ alphabets (English, German, French, Spanish, and more)
- Adjustable speed with auto-speed control
- Learning toggle for language model adaptation
- Mouse and touch input
- Canvas-based rendering

## Repository Structure

```
wasm-build/           WASM build (source, scripts, demo)
  dashercore-src/     DasherCore C++ source (git submodule)
  data-bundle/        Curated data files for preloading
  demo.html           Interactive demo
  dasher-wasm-wrapper.js   JavaScript API wrapper
  build.sh / build.bat    Build scripts
  server.js           Local dev server
documents/            Project specs and documentation
```

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
