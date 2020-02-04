// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT
//
// Some code copied from a Captive Web View sample, see:  
// https://github.com/vmware/captive-web-view/blob/master/forAndroid/Captivity/src/main/assets/UserInterface/captivity.js

// Import the Captive Web View simple page builder.
import PageBuilder from "./pagebuilder.js";

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
        this._transcribe({"step": "constructing"});
        const ui = new UserInterface(this._builder.node).load(null, footerID);

        // ui.stopCallback = () => {
        //     if (ui.message !== "") {
        //         this._send({"command": "insert", "text": ui.message})
        //         .then(() => ui.reset());
        //     }
        // };
        this._transcribe({"step": "constructed"});
        
        loading.remove();

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
    new CaptiveDasher(bridge);
    return null;
}
