// (c) 2019 Jim Hawkins. MIT licensed, see https://opensource.org/licenses/MIT
//
// Some code copied from a Captive Web View template. See:  
// https://github.com/vmware/captive-web-view/blob/master/foriOS/readme.md

class Main {
    constructor(bridge) {
        const loading = document.getElementById('loading');

        this._transcript = document.createElement('div');
        document.body.append(this._transcript);

        bridge.receiveObjectCallback = command => {
            this._transcribe(command);
            return Object.assign(command, {"confirm": "Main"});
        };

        loading.firstChild.textContent = "ACE Keyboard Application";

        bridge.sendObject({"command": "ready"})
        .then(response => this._transcribe(response))
        .catch(error => this._transcribe(error));
    }

    _transcribe(message) {
        const pre = document.createElement('pre');
        pre.append(JSON.stringify(message, undefined, 4));
        this._transcript.append(pre);
    }
}

export default function(bridge) {
    new Main(bridge);
    return null;
}
