Custom Keyboard for iOS
=======================
This directory is for the proof-of-concept custom keyboard for iOS.

Notes
=====
-   The iOS project has a workspace. This means that you should in general
    **always open the workspace** CustomKeyboard.xcworkspace file, and **never
    open the project**.

    Contents of the workspace are as follows.

    -   Keyboard, the Xcode project for this proof of concept.
        -   browser, reference to the HTML, CSS, and JavaScript.
        -   ContainingApplication, required to package the keyboard.
        -   Extension, the actual custom keyboard code.
    -   CaptiveWebView, reference to the submodule.

-   Instructions for adding Captive Web View for iOS are in its repository,
    here:  
    [https://github.com/vmware/captive-web-view/tree/master/foriOS](https://github.com/vmware/captive-web-view/tree/master/foriOS)

    You might have to build the Captive Web View target separately before you
    can build the custom keyboard.

-   ToDo: Raise an issue on Captive Web View about the retain cycle and message
    handler.

-   ToDo: Maybe change the Captive Web View load() return value in case the
    underlying load returns a null WKNavigation.

-   Instructions for custom keyboards for iOS are in the Apple developer
    documentation archive here:  
    [https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/CustomKeyboard.html#//apple_ref/doc/uid/TP40014214-CH16-SW1](https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/CustomKeyboard.html#//apple_ref/doc/uid/TP40014214-CH16-SW1)

-   It seems like the Xcode debugger always crashes a second or two after the
    custom keyboard opens. If the keyboard is re-opened then it runs OK but you
    can't, for example, get any logging output in the Xcode console.

    Another way to side-load is to run the containing application.

License
=======
Copyright (c) 2020 The ACE Centre-North, UK registered charity 1089313.  
MIT licensed, see
[https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT).
