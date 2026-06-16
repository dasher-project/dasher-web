@echo off
REM Build script for DasherCore WebAssembly module (Windows)
REM
REM Prerequisites:
REM   - Emscripten SDK installed and activated (run emsdk_env.bat)
REM   - CMake 3.12+ and Ninja
REM
REM Usage:
REM   call emsdk_env.bat && build.bat

setlocal enabledelayedexpansion
cd /d "%~dp0"
set "ROOT=%cd%"

REM Check for emcc
where emcc >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: emcc not found. Activate Emscripten first:
    echo   call C:\path\to\emsdk\emsdk_env.bat
    exit /b 1
)

echo ==^> Building DasherCore static library...

set "BUILD_DIR=%ROOT%\build-wasm"
emcmake cmake -S "%ROOT%\dashercore-src" -B "%BUILD_DIR%" ^
    -DCMAKE_BUILD_TYPE=Release ^
    -DBUILD_CAPI=OFF ^
    -DBUILD_TESTS=OFF ^
    -GNinja

if %ERRORLEVEL% NEQ 0 exit /b 1

cmake --build "%BUILD_DIR%" --target DasherCore -j

if %ERRORLEVEL% NEQ 0 exit /b 1

echo ==^> Linking WebAssembly module...

set "EXPORTS=%ROOT%\exports.json"
if not exist "%EXPORTS%" (
    echo Error: %EXPORTS% not found
    exit /b 1
)

if not exist "%ROOT%\wasm" mkdir "%ROOT%\wasm"

em++ -O3 -DNDEBUG -fwasm-exceptions ^
    "%ROOT%\dashercore-src\src\CAPI.cpp" ^
    -I "%ROOT%\dashercore-src\src" ^
    -I "%ROOT%\dashercore-src\Thirdparty\pugixml\src" ^
    "%BUILD_DIR%\libDasherCore.a" ^
    "%BUILD_DIR%\Thirdparty\pugixml\libpugixml.a" ^
    -o "%ROOT%\wasm\dasher.js" ^
    -s MODULARIZE=1 ^
    -s EXPORT_NAME=createDasherModule ^
    -s EXPORT_ES6=1 ^
    -s ENVIRONMENT=web ^
    -s EXPORTED_FUNCTIONS=@"%EXPORTS%" ^
    -s "EXPORTED_RUNTIME_METHODS=['getValue','setValue','UTF8ToString','stringToUTF8','lengthBytesUTF8','cwrap','ccall','FS','addFunction','removeFunction']" ^
    -s ALLOW_MEMORY_GROWTH=1 ^
    -s INITIAL_MEMORY=64MB ^
    -s MAXIMUM_MEMORY=512MB ^
    -s FORCE_FILESYSTEM=1 ^
    -s ALLOW_TABLE_GROWTH=1 ^
    --preload-file "%ROOT%\data-bundle@/data"

if %ERRORLEVEL% NEQ 0 (
    echo Build failed!
    exit /b 1
)

echo.
echo ==^> Build complete!
dir "%ROOT%\wasm\dasher.*"
echo.
echo Run the demo:  node server.js
echo Then open:     http://localhost:8000/demo.html
