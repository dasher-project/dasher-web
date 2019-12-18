Proofs of Concept
=================
To run the proof of concept, go here:
[https://sjjhsjjh.github.io/dasher-poc/](https://sjjhsjjh.github.io/dasher-poc/)

Backlog
=======
-   Add layout options optimised for use as a custom keyboard. Message box
    should be on the left, not at the top, for example.
-   See about fixing the text alignment on Firefox.
-   Change box colours to be set by the CSS maybe.
-   Maybe optimise origin_holder to have callbacks before and after descent.
-   Change terminology of "origin holder" to maybe "delta target".
-   More use of built-in .append and .remove in piece.js module. See:

    -   https://developer.mozilla.org/en-US/docs/Web/API/ChildNode/remove
    
-   More use of Piece.toggle in zoombox.js module.
-   Review "element" vs "node" in variable and function names.

Notes for developers
====================
To run the proof-of-concept under development, you might need to start an HTTP
server. This is due to security restrictions on running JavaScript, and
especially importing modules, from file:// URLs.

Python version 3 comes with an HTTP server that is suitable for this purpose. It
could be started like this.

    cd /path/where/you/cloned/dasher-poc/
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

Jim isn't aware of any way to do this with an iOS device, although it can be
done on the simulator by entering the same address. An alternative may be to set
up an intranet that is accessible to the mobile browser.

License
=======
Copyright (c) 2019 Jim Hawkins. MIT licensed, see
[https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT).
