# Dasher Version Six Development

These are notes and documents for software developers contributing to the Dasher
Version Six project. For an introduction to the project, see the [readme](../)
in the parent directory.

# Objective

Create an open source version of Dasher with the same functionality as the original Dasher...
Using modern programming languages, with proper separation between the UI and the language model
With a state-of-the-art language model, as well as support for custom models
so it can be maintained, incorporated in other AAC systems, and extended.

The addition of any features beyond the original functionality of Dasher will be deferred until parity between the old and new versions is reached. (No feature creep!)

# Architecture

![Architecture](https://github.com/dasher-project/dasher-web/blob/master/documents/images/Architecture.png)

# Developer Guides

The following guides have been written for developers.

- [Specification](Specification/) of Dasher Version Six. Unfinished at time of
  writing but still useful for terminology.

- [Loading Notes](Loading.md) describes how the Dasher Version Six web code
  gets loaded in a browser, standalone app, or custom keyboard.

# Notes for developers of the browser code

To run the browser proof-of-concept under development, you might need to start
an HTTP server. This is due to security restrictions on running JavaScript, and
especially importing modules, from file:// URLs.

Python version 3 comes with an HTTP server that is suitable for this purpose. It
could be started like this.

    cd /path/where/you/cloned/dasher-web/browser/
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

## Delivery Requirements

- Interested in helping with the backlog? This project is open source and
  we would love your help. Just a few things..

### Pull Request

- Pull Requests to add/improve code will require:

1.  Passing Tests
2.  Code Review

### Testing

- Tests are performed using `jest` and `Travis-CI`. See `tests` sub-directory
  and the [backlog](../tests/readme.md) for more information.
- Make sure you run the tests locally, and they pass, before
  pushing any commits. Results of CI tests are posted to the Slack channel.
- It is the developers responsibility to ensure tests pass before requesting
  a code review and subsequent pull request. All new functionality should have

# License

Copyright (c) 2021 The ACE Centre-North, UK registered charity 1089313.  
MIT licensed, see
[https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT).
