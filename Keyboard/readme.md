Keyboard Proof of Concept
=========================
This directory is for custom keyboard proofs of concept.

The custom keyboards make use of the Captive Web View library. Captive Web View
is an Open Source project from VMware. This repository has the Captive Web View
repository as a Git submodule.

Notes
=====
-   The iOS project has a workspace. This means that you should in general
    **always open the workspace** CustomKeyboard.xcworkspace file, and **never
    open the project**.

    Contents of the workspace are as follows.

    -   Keyboard, the Xcode project for this proof of concept.
        -   UserInterface, the HTML, CSS, and JavaScript.
        -   ContainingApplication, required to package the keyboard.
        -   Extension, the actual custom keyboard code.
    -   CaptiveWebView, reference to the submodule.

-   ToDo: Address the warning about Captive Web View being unsafe for
    extensions.

    https://stackoverflow.com/a/48863451/7657675

-   ToDo: Fix the defect that the keyboard renders blank when returning to the
    device after a time-out screen lock and a couple of minutes.

-   ToDo: Maybe change the Captive Web View load() return value in case the
    underlying load returns a null WKNavigation.

-   ToDo: Maybe add support for directory hierarchy in the Bundle but shared so
    that the iOS keyboard JS can import from its browser/ directory without
    having to be in the same directory.

-   Instructions for custom keyboards for iOS are in the Apple developer
    documentation archive here:  
    [https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/CustomKeyboard.html#//apple_ref/doc/uid/TP40014214-CH16-SW1](https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/CustomKeyboard.html#//apple_ref/doc/uid/TP40014214-CH16-SW1)

-   Jim found that the Xcode debugger always crashes a second or two after the
    custom keyboard opens. If the keyboard is re-opened then it runs OK but you
    can't, for example, get any logging output in the Xcode console.

    Another way to side-load is to run the containing application.

-   Instructions for adding Captive Web View for iOS are in its repository,
    here:  
    [https://github.com/vmware/captive-web-view/tree/master/foriOS](https://github.com/vmware/captive-web-view/tree/master/foriOS)

    You might have to build the Captive Web View target separately before you
    can build the custom keyboard.

License
=======
Copyright (c) 2019 Jim Hawkins. MIT licensed, see
[https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT).
