Intro to WebAssembly

- WebAssmebly is bytecode executables that is compiled using emscripten from c/c++ files.
- The em++ compiles c++ into both a .js and .wasm file.
- The .js file loads and provides interface into the .wasm file.
- Source the .js file from .html

Install Emscripten

https://webassembly.org/getting-started/developers-guide/

Source the Environment

$ source ./emsdk_env.sh --build=Release

Build the WebASM (note use of makefile)

$ make

Helpful Resources:

https://emscripten.org/docs/getting_started/Tutorial.html

https://webassembly.org/docs/c-and-c++/
