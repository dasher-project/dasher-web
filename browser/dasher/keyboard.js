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

// Utility to facilitate using KEY properties as keys. This is here because the
// following syntax isn't allowed in JavaScript.
//
//     const d = {KEY.command: KEY.insert, KEY.text: "typing"};
//
// But the following syntax is OK.
//
//     const d = assign({}, [[KEY.command, KEY.ready], [KEY.text, "typing"]]);
//
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
            if (command.log === undefined || this._transcript === null) {
                this._transcribe(command);
            }
            else {
                this._display_keyboard_log(command.log);
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
        const panel = {builder: new PageBuilder('fieldset')};
        panel.holder = new PageBuilder(panel.builder.add_node(
            'div', "Keyboard log will appear here."));
        panel.builder.add_node('legend', "Keyboard Log");

        this._keyboardLogPanel = panel;
    }

    _display_keyboard_log(logEntries) {
        if (logEntries === undefined || this._transcript === null) {
            return false;
        }
        if (typeof logEntries !== typeof []) {
            this._transcribe({entries: logEntries});
            return false;
        }
        this._keyboardLogPanel.holder.remove_childs();
        const pre = this._keyboardLogPanel.holder.add_node(
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
        return true;
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
            if (this._display_keyboard_log(response.logContents)) {
                delete response.logContents;
            }

            if (verbose || response.failed !== undefined) {
                this._transcribe(response);
            }
            return response;
        })
        .catch(error => {
            this._transcribe({sent:sent, error: `${error}`});
            return error;
        });
    }

    _ready(loading, ui) {
        this._send([KEY.command, KEY.ready], true)
        .then(response => {
            // On Android, the Chrome developer tools can be used to debug the
            // keyboard web view. This means that there's no need to show the
            // log in the web view. It's easier to use the console.  
            // On iOS, it doesn't seem to be possible to connect the Safari
            // developer tools to the keyboard web view. So, log output is
            // needed for iOS.  
            // The showLog flag tells the JS layer how to behave.
            //
            // -   showLog:false means don't show the log and log to the
            //     console.
            // -    showLog:true means show the log. You have to scroll up to
            //      see it but it's better than nothing. Default is true.
            const showLog = response.showLog;
            if (showLog === undefined || showLog) {
                PageBuilder.into(
                    document.body, this._keyboardLogPanel.builder.node);
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
        .catch(error => this._transcribe({error: `${error}`}));
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
