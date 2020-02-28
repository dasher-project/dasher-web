Dasher in Web Technologies
==========================
Proofs of concept for Dasher zooming text entry implemented in web technologies.

-   Browser.

    To run the browser proof of concept, go here:
    [https://dasher-project.github.io/redash/browser/](https://dasher-project.github.io/redash/browser/)

-   Keyboard for iOS.

    There is an Xcode project for a functional custom keyboard for iOS in the
    [Keyboard](Keyboard) sub-directory.

-   Keyboard for Android.

    There is a Android Studio project for a functional custom keyboard for
    Android in the [Keyboard](Keyboard) sub-directory.

Backlog
=======
-   See about fixing the text alignment on Firefox.
-   Change box colours to be set by the CSS maybe.
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

License
=======
Copyright (c) 2020 The ACE Centre-North, UK registered charity 1089313. MIT
licensed, see
[https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT).
