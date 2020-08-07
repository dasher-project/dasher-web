// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT
//
// Some code copied from a Captive Web View sample, see:  
// https://github.com/vmware/captive-web-view/blob/master/forAndroid/Captivity/src/main/assets/UserInterface/captivity.js

// Import the Captive Web View simple page builder.
import PageBuilder from "./pagebuilder.js";

import predictor_dummy from './predictor_dummy.js'
import predictor_basic from './predictor.js';
import predictor_test from './predictor_test.js';
import PredictorCompletions from "./predictor_completions.js"

import UserInterface from "./userinterface.js"

class CaptiveDasher {
    constructor(bridge) {
        this._bridge = bridge;
        const loading = document.getElementById('loading');

        this._builder = new PageBuilder('div', undefined, document.body);
        this._builder.node.setAttribute('id', "user-interface");

        const footerID = "footer";
        const footer = new PageBuilder('div', undefined, document.body);
        footer.node.setAttribute('id', footerID);
        footer.node.classList.add("dash-footer")

        const back = footer.add_anchor("Main.html", "Close");
        back.classList.remove("cwv-anchor");
        back.classList.add("dash-anchor", "dash-anchor_back");

        this._transcript = footer.add_transcript(document.body, true);

        bridge.receiveObjectCallback = command => {
            this._transcribe(command);
            return Object.assign(command, {"confirm": "CaptiveDasher"});
        };
        const ui = new UserInterface(this._builder.node);

        // ui.stopCallback = () => {
        //     if (ui.message !== "") {
        //         this._send({"command": "insert", "text": ui.message})
        //         .then(() => ui.reset());
        //     }
        // };
        
        loading.remove();

        this._send({"command": "ready"}, true)
        .then(response => {
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
                    "label": "Basic", "item": predictor_basic
                }, {
                    "label": "None", "item": predictor_dummy
                }, {
                    "label": "Random", "item": predictor_test
                }];
            }
            ui.load(null, footerID);
        });
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

}

export default function(bridge) {
    new CaptiveDasher(bridge);
    return null;
}
