# Development

## Documentation

1. [Specifications](Specification/readme.md)
2. [Loading](Specification/Loading.md)

## Notes for developers
To run the proof-of-concept under development, you might need to start an HTTP
server. This is due to security restrictions on running JavaScript, and
especially importing modules, from file:// URLs.

Python version 3 comes with an HTTP server that is suitable for this purpose. It
could be started like this.

    cd /path/where/you/cloned/redash/browser/
    python3 -m http.server -b localhost

You can then run the code in the browser on your desktop, by entering
http://localhost:8000 as the address.

The Android debug bridge (adb) tool has a feature by which the mobile browser
can communicate with an HTTP server on the host machine. Proceed as follows.

1.  Connect your Android device, which must have been set up as a developer
    device, via USB.
2.  Run the adb command:

        adb reverse tcp:8000 tcp:8000

3.  Enter the address http://localhost:8000 in the mobile browser.

The mobile browser will then send requests to your local HTTP server. If the
browser is Chrome, and maybe anything based on a WebView, it will appear in the
chrome://inspect list and the Chrome developer tools can be used.

There doesn't seem to be any way to do this with an iOS device, although it can
be done on the simulator by entering the same address. An alternative may be to
set up an intranet that is accessible to the mobile browser.
