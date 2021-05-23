# Backlog
## Strategic Backlog

-   Language model integration.

-   Document and sub-document hierarchy.

    The userinterface.js file has too much code in it. The parts of the user
    interface should be modular:

    -   Control Panel, which is already fairly modular but is instantiated from
        the userinterface.js file.
    -   Zooming Area, whose code is in the userinterface.js file.
    -   Message Bar, whose code is also in the userinterface.js file.
    -   Small Print, which is only in the HTML.

    The Control Panel, Zooming Area, and Message Bar should be instantiated from
    a common builder class. Different loading contexts, like the browser and the
    custom keyboard, should then each have a subclass of the builder.

    The modules should also have a common interface for:

    -   DOM hierarchy.
    -   Data structure.
    -   Event listeners.

    The Control Panel already has a method, setParent(), that inserts its DOM
    hierarchy into another. It's optional. The whole hierarchy can be
    instantiated without being inserted into an HTML page. Parts of the
    hierarchy are accessible, which is what enables the behaviour selector to be
    inserted into the custom keyboard user interface, for example.

-   Improve the zooming based on the PhD material, aka S parameter.
    -   As part of the previous item, or standalone, make the zoom rate
        non-linear.
    -   Also make the zoom faster if the pointer is to the left of the origin,
        i.e. zooming out.

## Simple Backlog
-   Maybe replace the current userinterface.js stopCallback and pointer.js
    touchEndCallback mechanisms, and anything similar, with a custom DOMEvent.
    Or replace them with an EventTarget instance.
    See:

    -   https://developer.mozilla.org/en-US/docs/Web/API/Event
    -   https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent
    -   https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/EventTarget

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
-   See about fixing the text alignment on Firefox.
-   Change terminology of "origin holder" to maybe "delta target".
-   More use of built-in .append and .remove in piece.js module. See:

    -   https://developer.mozilla.org/en-US/docs/Web/API/ChildNode/remove

-   Dasher Version Six zooming user interface in a browser extension. See the
    following links.

    -   [https://developer.apple.com/documentation/safariservices/safari_app_extensions/building_a_safari_app_extension](https://developer.apple.com/documentation/safariservices/safari_app_extensions/building_a_safari_app_extension)
    -   [https://developer.chrome.com/docs/extensions/](https://developer.chrome.com/docs/extensions/)

-   More use of Piece.toggle in zoombox.js module.
-   Review "element" vs "node" in variable and function names.

# License
Copyright (c) 2021 The ACE Centre-North, UK registered charity 1089313.  
MIT licensed, see
[https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT).
