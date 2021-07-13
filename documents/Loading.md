# Loading Notes
This document has **notes** on how the Dasher Version Six Zooming User Interface
loads.

1.  Web View or Browser.

    The Dasher Version Six user interface is implemented in web technologies:

    -   Hypertext Markup Language version 5 (HTML).
    -   Cascading Stylesheets (CSS).
    -   JavaScript (JS).
    -   Scalable Vector Graphics (SVG).

    The user interface loading process therefore starts in one of the following.
    
    -   Web browser application, such as Google Chrome, Safari, or Firefox for
        example.

    -   Web view control embedded in an application. Embeddable web view
        controls include Chromium and WebKit, for example.
    
        The
        [Dasher Version Six custom keyboards](https://github.com/dasher-project/dasher-captivewebview)
        for Android and iOS make use of the
        [Captive Web View](https://github.com/vmware/captive-web-view/)
        library to facilitate use of web technologies in mobile applications.
    
    The process starts with a loading document.

2.  Loading Document.

    Loading always begins with a loading document, written in HTML.

    The loading document:

    -   Includes a skeleton of the user interface, in HTML.
    -   Attaches a necessary CSS style sheet.
    -   Runs the first in a chain of loading scripts.

    These are some example loading documents:

    -   Browser proof-of-concept:
        [../browser/index.html](../browser/index.html)  
        The first script in the loading chain is the `index.js` file.

    -   Custom keyboard:
        [Keyboard.html](https://github.com/dasher-project/dasher-captivewebview/blob/main/Keyboard/WebResources/Keyboard.html)  
        The first script in the loading chain is the `captivewebview.js` file.

3.  Loading Script Chain.

    The loading script chain will be a number of JavaScript programs, each of
    which causes the next script to be executed. Scripts in the chain can be
    very short.

    These are some example loading script chains.

    -   The loading script chain for the browser proof-of-concept is only the
        [../browser/index.js](../browser/index.js) file.
    
        That script sets the on-load handler of the `body` tag to the next
        script in the chain, which is the last one.

    -   The loading script chain for the custom keyboard has the following
        files.

        1.  [captivewebview.js](https://github.com/vmware/captive-web-view/blob/main/Sources/CaptiveWebView/Resources/library/captivewebview.js)

            This file is part of the Captive Web View project and is included as
            a Git submodule into the Dasher Version Six custom keyboard code.

            The script causes the next file in the chain to be executed when the
            Captive Web View control has initialised.
        
        2.  [keyboard.js](https://github.com/dasher-project/dasher-captivewebview/blob/main/Keyboard/WebResources/keyboard.js)

            This file uses an ES 6 `import` statement to execute the next script
            in the chain, which is the last one.

    The last script in the loading chain will be the user interface builder.

4.  User Interface Builder.

    The user interface builder:

    -   Creates all the remaining HTML nodes that are needed in the UI, either
        directly or by instantiating the Control Panel.
    -   Attaches listeners to the control panel.
    -   Initialises the viewer and controller.
    -   Does everything else, pretty much.

    This is the user interface builder:  
    [../browser/dasher/userinterface.js](../browser/dasher/userinterface.js)

    **There is a strategic backlog item to overhaul this, see the
    [Backlog.md](Backlog.md) file.**

# Document Information
This document is part of the Dasher project and is under revision control here:  
[https://github.com/dasher-project/dasher-web/tree/master/documents](https://github.com/dasher-project/dasher-web/tree/master/documents)

(c) 2021 The ACE Centre-North, UK registered charity 1089313.  
MIT licensed, see [https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT)
