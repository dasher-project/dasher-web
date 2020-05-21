Intro to WebAssembly

- WebAssmebly is bytecode executables that is compiled using emscripten from c/c++ files.
- The em++ compiles c++ into both a .js and .wasm file.
- The .js file loads and provides interface into the .wasm file.
- Source the .js file from .html

Install Emscripten

https://webassembly.org/getting-started/developers-guide/

Build Sample HTML

em++ helloDasher.cpp -O3 -s WASM=1 -s NO_EXIT_RUNTIME=1 -s "EXTRA_EXPORTED_RUNTIME_METHODS=['ccall']" -o helloDasher.js

Helpful Resources:


https://emscripten.org/docs/getting_started/Tutorial.html

https://webassembly.org/docs/c-and-c++/
