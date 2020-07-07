# Dasher in Web Technologies
Proofs of concept for Dasher zooming text entry implemented in web technologies.

-   Browser.

    To run the browser proof of concept, go here:
    [https://dasher-project.github.io/redash/browser/](https://dasher-project.github.io/redash/browser/)

-   Keyboard and app for iOS.

    There is an Xcode project for a functional custom keyboard for iOS in the
    [Keyboard](Keyboard) sub-directory. The keyboard is packaged in an app.

-   Keyboard for Android.

    There is a Android Studio project for a functional custom keyboard for
    Android in the [Keyboard](Keyboard) sub-directory.

# Backlog
## Strategic Backlog
-   Language model integration.
-   Improve the zooming based on the PhD material, aka S parameter.
    -   As part of the previous item, or standalone, make the zoom rate
        non-linear.
    -   Also make the zoom faster if the pointer is to the left of the origin, 
        i.e. zooming out.
-   Tests.  
    At time of writing, there are no tests. Some tests that there could be:

    -   Test the control panel as a user interface, saving and loading settings
        and so on.
    -   Test the PPM in isolation.
    -   Test the zooming UI maybe by screen capturing with Chrome Puppeteer.
    -   Capture and replay render cycles.

## Simple Backlog
-   Maybe replace the current userinterface.js stopCallback and pointer.js
    touchEndCallback mechanisms, and anything similar, with a custom DOMEvent.
    See:

    -   https://developer.mozilla.org/en-US/docs/Web/API/Event
    -   https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent

    The root SVG item that holds the zooming user interface would be a suitable
    EventTarget from which to dispatch these events. Using an event instead of a
    callback seems more flexible and in keeping with the standard.

-   Change the message position to float over the bottom left corner of the
    zooming area. Or make that a user preference between:

    -   Current browser position at top right.
    -   Floating over bottom left of the zooming area.
    -   Current keyboard position, across the top of the zooming area.

    In keyboard mode, the message should maybe be in a small floating control
    panel that also holds the predictor drop-down, and the next keyboard button.

-   Fix the childIndex that goes into the zoom box CSS class to be 1 sometimes.
    At the moment, it is always zero for the first child box. It should be 1 if
    the preceding parent box didn't have an even number of child boxes.

-   Option to expand all the settings panels.

    -   The main part of the change might be CSS only. Specifically, add a
        control-panel__parent Modifier in which the display isn't flex.
    
    -   Some other changes would be required:
    
        -   Add a UI control to toggle the modifier.
        -   Change the ControlPanel select_panel() method to do something other
            than scrollTo.

-   Change controlpanel.afterInstantiate to be based on JS Symbol constants
    and a Map maybe, instead of a dictionary object. See:

    -   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol
    -   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map

    However, it seems desirable that the controlpanelspecification object can be
    serialised to JSON, which it mightn't be if the above change is made.

-   Maybe arrange_children on resize. Also there are some cases in which the
    white rectangle doesn't extend to the edge of the zooming area.
-   Improve the Viewer textWidth to be based on a bounding box from the font
    metric. Could be done by loading one of each character when the UI is
    loading, and storing the bounding box for each.
-   Decommission textLeft, which is always zero at the moment.
-   Change the drawing of the X axis so it doesn't go all the way across the
    area. Original Dasher has a short horizontal line.
-   Maybe shuffle letters left or right in the tail.
-   Store what is set in the standalone app to be used in the keyboard too.
-   See about fixing the text alignment on Firefox.
-   Change terminology of "origin holder" to maybe "delta target".
-   More use of built-in .append and .remove in piece.js module. See:

    -   https://developer.mozilla.org/en-US/docs/Web/API/ChildNode/remove
    

-   Standalone app for Android. Make it the same as the standalone app for iOS,
    i.e. based on a Captive Web View.

-   Standalone app for macOS. Make it the same as the standalone app for iOS,
    i.e. based on a Captive Web View.

-   Standalone app for Mac Catalyst. Rebuild the standalone app for iOS with
    Catalyst support.

-   More use of Piece.toggle in zoombox.js module.
-   Review "element" vs "node" in variable and function names.

# Notes for developers
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

# License
Copyright (c) 2020 The ACE Centre-North, UK registered charity 1089313. MIT
licensed, see
[https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT).
