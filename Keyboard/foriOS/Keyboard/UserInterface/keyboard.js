// (c) 2019 Jim Hawkins. MIT licensed, see https://opensource.org/licenses/MIT
//
// Some code copied from a Captive Web View sample, see:  
// https://github.com/vmware/captive-web-view/blob/master/forAndroid/Captivity/src/main/assets/UserInterface/captivity.js

// Import the Captive Web View simple page builder.
import PageBuilder from "./pagebuilder.js";

class Main {
    constructor(bridge) {
        this._bridge = bridge;
        const loading = document.getElementById('loading');

        this._builder = new PageBuilder('div', undefined, document.body);
        this._transcript = PageBuilder.add_transcript(document.body, true);

        bridge.receiveObjectCallback = command => {
            this._transcribe(command);
            return Object.assign(command, {"confirm": "Keyboard"});
        };
        
        // Unicode 127760 is the globe emoji, aka globe with meridians. It's
        // used by the Apple keyboard, but with a changed colour. It could be
        // used here with code like this:
        //
        //     String.fromCodePoint(127760)
        //
        // The colour is part of the emoji, so changing it isn't right really.
        //
        // Another option could be the keyboard emoji, Unicode 9000. It doesn't
        // look good though.
        //
        // For now, just the text is put on the button.
        const keyboardButton = this._builder.add_button("Next Keyboard");
        keyboardButton.classList.add('keyboard');
        keyboardButton.addEventListener(
            'click', () => this._send({"command": "nextKeyboard"}));

        loading.firstChild.textContent = "ACE Keyboard Itself";

        this._send({"command": "ready"});
    }

    _transcribe(message) {
        this._transcript.add(JSON.stringify(message, undefined, 4), 'pre');
    }

    _send(object_) {
        return (
            this._bridge ?
            this._bridge.sendObject(object_) :
            Promise.reject(new Error("No Bridge!"))
        ).then(response => {
            this._transcribe(response);
            return response;
        })
        .catch(error => {
            this._transcribe(error);
            return error;
        });
    }

}

export default function(bridge) {
    new Main(bridge);
    return null;
}
