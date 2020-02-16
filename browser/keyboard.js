// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT
//
// Some code copied from a Captive Web View sample, see:  
// https://github.com/vmware/captive-web-view/blob/master/forAndroid/Captivity/src/main/assets/UserInterface/captivity.js

// Import the Captive Web View simple page builder.
import PageBuilder from "./pagebuilder.js";

import UserInterface from "./userinterface.js"
import PredictorCompletions from "./predictor_completions.js"
import Predictor from "./predictor.js";

class Keyboard {
    constructor(bridge) {
        this._bridge = bridge;
        const loading = document.getElementById('loading');

        this._builder = new PageBuilder('div', undefined, document.body);
        this._builder.node.setAttribute('id', "user-interface");
        this._builder.node.classList.add('keyboard');
        this._transcript = PageBuilder.add_transcript(document.body, true);

        bridge.receiveObjectCallback = command => {
            this._transcribe(command);
            return Object.assign(command, {"confirm": "Keyboard"});
        };
        const ui = new UserInterface(this._builder.node);
        ui.stopCallback = () => {
            if (ui.message !== "") {
                this._send({"command": "insert", "text": ui.message})
                .then(() => ui.reset());
            }
        };
        
        this._send({"command": "ready"}, true)
        .then(response => {
            const commands = response.predictorCommands;
            if (commands !== undefined && commands.length > 0) {
                // In this version, the commands are ignored. Just the presence
                // of the list in the response indicates that
                // PredictorCompletions can be used.
                ui.predictors = [{
                    "label": "Auto-complete",
                    "item": new PredictorCompletions(this._send.bind(this))
                }, {
                    "label": "No prediction",
                    "item": new Predictor()
                }];
            }

            loading.remove();
            ui.load(null, null);
            this._add_keyboard_button();
        })
        .catch(error => this._transcribe({"error": `${error}`}));
    }

    _transcribe(message) {
        this._transcript.add(JSON.stringify(message, undefined, 4), 'pre');
    }

    _send(object_, verbose=false) {
        return (
            this._bridge ?
            this._bridge.sendObject(object_) :
            Promise.reject(new Error("No Bridge!"))
        ).then(response => {
            if (verbose || response.failed !== undefined) {
                this._transcribe(response);
            }
            return response;
        })
        .catch(error => {
            this._transcribe(error);
            return error;
        });
    }

    _add_keyboard_button() {
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
    }

}

export default function(bridge) {
    new Keyboard(bridge);
    return null;
}
