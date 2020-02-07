Keyboard Proof of Concept
=========================
This directory is for custom keyboard proofs of concept.

The custom keyboards make use of the Captive Web View library. Captive Web View
is an Open Source project from VMware. This repository has the Captive Web View
repository as a Git submodule.

Notes
=====

## iOS Custom Keyboard

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

-   ToDo: Add the equivalent of the following code from the Xcode sample.

        self.nextKeyboardButton.isHidden = !self.needsInputModeSwitchKey
    
    The sample code sets the flag in the `viewWillLayoutSubviews` but that's
    questionable.

-   ToDo: Raise an issue on Captive Web View about the retain cycle and message
    handler.

-   ToDo: Maybe change the Captive Web View load() return value in case the
    underlying load returns a null WKNavigation.

-   ToDo: Maybe add support for directory hierarchy in the Bundle but shared so
    that the iOS keyboard JS can import from its browser/ directory without
    having to be in the same directory.

-   Instructions for custom keyboards for iOS are in the Apple developer
    documentation archive here:  
    [https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/CustomKeyboard.html#//apple_ref/doc/uid/TP40014214-CH16-SW1](https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/CustomKeyboard.html#//apple_ref/doc/uid/TP40014214-CH16-SW1)

-   It seems like the Xcode debugger always crashes a second or two after the
    custom keyboard opens. If the keyboard is re-opened then it runs OK but you
    can't, for example, get any logging output in the Xcode console.

    Another way to side-load is to run the containing application.

-   Instructions for adding Captive Web View for iOS are in its repository,
    here:  
    [https://github.com/vmware/captive-web-view/tree/master/foriOS](https://github.com/vmware/captive-web-view/tree/master/foriOS)

    You might have to build the Captive Web View target separately before you
    can build the custom keyboard.

## Android Custom Keyboard 

- There is a dependency on the captive-web-view subproject. First run the Gradle task 'forAndroid -> Tasks -> upload -> uploadArchives' in the 'captive-web-view' subproject to generate a local maven repo to satisfy the dependency.

- To make the Dasher keyboard available on a device or simulator, open Android settings on the device (ususally by swiping down from the top and tapping the cog icon), and then search for 'Virtual Keyboard'. Tap 'Manage keyboards' and enable the 'Dasher Keyboard'.

- You can switch to the Dasher custom keyboard by tapping a text field to present a standard keyboard and then tap the keyboard icon in the bottom right. Select 'Dasher Keyboard' in the alert.

License
=======
Copyright (c) 2020 The ACE Centre-North, UK registered charity 1089313. MIT
licensed, see
[https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT).
