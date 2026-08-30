#!/bin/bash
# Build script for DasherCore WebAssembly module
#
# Prerequisites:
#   - Emscripten SDK installed and activated (source emsdk_env.sh)
#   - CMake 3.12+ and Ninja
#
# Usage:
#   source /path/to/emsdk/emsdk_env.sh && ./build.sh

set -e

cd "$(dirname "$0")"
ROOT="$(pwd)"

# Check for emcc
if ! command -v emcc &> /dev/null; then
    echo "Error: emcc not found. Activate Emscripten first:"
    echo "  source /path/to/emsdk/emsdk_env.sh"
    exit 1
fi

echo "==> Building DasherCore static library..."

BUILD_DIR="$ROOT/build-wasm"
emcmake cmake -S "$ROOT/dashercore-src" -B "$BUILD_DIR" \
    -DCMAKE_BUILD_TYPE=Release \
    -DBUILD_CAPI=OFF \
    -DBUILD_TESTS=OFF \
    -GNinja

cmake --build "$BUILD_DIR" --target DasherCore -j

echo "==> Linking WebAssembly module..."

EXPORTS="$ROOT/exports.json"
if [ ! -f "$EXPORTS" ]; then
    echo "Error: $EXPORTS not found"
    exit 1
fi

mkdir -p "$ROOT/wasm"

em++ -O3 -DNDEBUG -fwasm-exceptions \
    "$ROOT/dashercore-src/src/CAPI.cpp" \
    -I "$ROOT/dashercore-src/src" \
    -I "$ROOT/dashercore-src/Thirdparty/pugixml/src" \
    "$BUILD_DIR/libDasherCore.a" \
    "$BUILD_DIR/Thirdparty/pugixml/libpugixml.a" \
    -o "$ROOT/wasm/dasher.js" \
    -s MODULARIZE=1 \
    -s EXPORT_NAME=createDasherModule \
    -s EXPORT_ES6=1 \
    -s ENVIRONMENT=web \
    -s EXPORTED_FUNCTIONS=@"$EXPORTS" \
    -s "EXPORTED_RUNTIME_METHODS=['getValue','setValue','UTF8ToString','stringToUTF8','lengthBytesUTF8','cwrap','ccall','FS','addFunction','removeFunction']" \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s INITIAL_MEMORY=64MB \
    -s MAXIMUM_MEMORY=512MB \
    -s FORCE_FILESYSTEM=1 \
    -s ALLOW_TABLE_GROWTH=1 \
    --preload-file "$ROOT/data-bundle@/data"

echo ""
echo "==> Build complete!"
echo "Output:"
ls -lh "$ROOT/wasm/"
echo ""
echo "Serve the output: npx serve . (or any static file server)"
echo "Then open:     http://localhost:8000/demo.html"
