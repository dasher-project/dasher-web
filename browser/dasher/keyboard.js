// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT
//
// Some code copied from a Captive Web View sample, see:  
// https://github.com/vmware/captive-web-view/blob/master/forAndroid/Captivity/src/main/assets/UserInterface/captivity.js

// Import the Captive Web View simple page builder.
import PageBuilder from "./pagebuilder.js";

import UserInterface from "./userinterface.js"
import PredictorCompletions from "./predictor_completions.js"
import predictor_basic from './predictor.js';

// Cheeky constants that are strings but declared without strings being used.
const KEY = {
    // Commands that can be sent to the native layer.
    ready:null,
    insert:null,
    nextKeyboard:null,

    // Parameter names used in exchanges with the native layer.
    command:null,
    confirm:null,
    text:null
};
Object.keys(KEY).forEach(key => KEY[key] = key);

function assign(target, pairs) {
    pairs.forEach(([key, value]) => target[key] = value);
    return target;
}

class Keyboard {
    constructor(bridge) {
        this._bridge = bridge;
        const loading = document.getElementById('loading');

        this._builder = new PageBuilder('div', undefined, document.body);
        this._builder.node.setAttribute('id', "user-interface");
        this._builder.node.classList.add('keyboard');

        this._build_keyboard_log_panel();
        this._transcript = PageBuilder.add_transcript(undefined, true);

        bridge.receiveObjectCallback = command => {
            if (command.log !== undefined) {
                this._display_keyboard_log(command.log);
            }
            else {
                this._transcribe(command);
            }
            return assign(command, [KEY.confirm, "Keyboard"]);
        };
        const ui = new UserInterface(this._builder.node);
        ui.stopCallback = () => {
            if (ui.message !== "") {
                this._send([
                    [KEY.command, KEY.insert], [KEY.text, ui.message]
                ]).then(() => ui.reset());
            }
        };
        this._ready(loading, ui);
    }

    _build_keyboard_log_panel() {
        const builder = new PageBuilder('fieldset', undefined, document.body);
        builder.node.classList.add('dck__native-transcript');
        const holder = new PageBuilder(builder.add_node(
            'div', "Keyboard log will appear here."));
        builder.add_node('legend', "Keyboard Log");

        this._keyboardLog = holder;
    }

    _display_keyboard_log(logEntries) {
        this._keyboardLog.remove_childs();
        const pre = this._keyboardLog.add_node(
            'pre',
            logEntries.map(({index, messages, proxy}) => {
                const message = messages.join(" ");
                const proxyText = Array.isArray(proxy)
                    ? proxy.map(item => (
                        (item === null) ? "null"
                        : (item === "\n") ? "NL"
                        : (item === " ") ? "SPACE"
                        : (item === "") ? "EMPTY"
                        : `"${item}"`
                    )).join("...")
                    : proxy;
                return `${index} ${message} ${proxyText}`;
            }).join("\n")
        );
        pre.classList.add('cwv-transcript__log_line');
        // this._keyboardLog.add_node('pre', JSON.stringify(logEntries, undefined, 4));
    }

    _transcribe(messageObject) {
        const message = JSON.stringify(messageObject, undefined, 4);
        if (this._transcript === null) {
            console.log(message)
        }
        else {
            this._transcript.add(message, 'pre');
        }
    }

    _send(object_, verbose=false) {
        const sent = (
            Array.isArray(object_)
            ? (
                Array.isArray(object_[0])
                ? assign({}, object_)
                : assign({}, [object_])
            ) : object_
        );
        return (
            this._bridge ?
            this._bridge.sendObject(sent) :
            Promise.reject(new Error("No Bridge!"))
        ).then(response => {
            if (response.logContents != undefined) {
                this._display_keyboard_log(response.logContents);
                delete response.logContents;
            }

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

    _ready(loading, ui) {
        this._send([KEY.command, KEY.ready], true)
        .then(response => {
            const showLog = response.showLog;
            if (showLog === undefined || showLog) {
                PageBuilder.into(document.body, this._transcript.node);
            }
            else {
                this._transcript = null;
                this._transcribe(response);
            }

            const commands = response.predictorCommands;
            if (commands !== undefined && commands.length > 0) {
                // In this version, the commands are ignored. Just the presence
                // of the list in the response indicates that
                // PredictorCompletions can be used.
                const predictorCompletions = new PredictorCompletions(
                    this._send.bind(this));
                ui.predictors = [{
                    "label": "Auto-complete",
                    "item": predictorCompletions.get_character_weights.bind(
                        predictorCompletions)
                }, {
                    "label": "None", "item": predictor_basic
                }];
            }

            const heightPixels = response.heightPixels;
            if (heightPixels !== undefined) {
                document.body.style.height = `${heightPixels}px`;
            }

            ui.load(null, null);

            const showNextKeyboard = response.showNextKeyboard;
            if (showNextKeyboard === undefined || showNextKeyboard) {
                this._add_keyboard_button();
            }

            loading.remove();
        })
        .catch(error => this._transcribe({"error": `${error}`}));
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
            'click', () => this._send([KEY.command, KEY.nextKeyboard]));
    }

}

export default function(bridge) {
    new Keyboard(bridge);
    return null;
}
