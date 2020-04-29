// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://]]source.org/licenses/MIT
//
// Some code copied from a Captive Web View template. See:  
// https://github.com/vmware/captive-web-view/blob/master/foriOS/readme.md

class Main {
    constructor(bridge) {
        const loading = document.getElementById('loading');
        this._bridge = bridge;
        loading.firstChild.textContent = "ACE Keyboard";

        bridge.sendObject({"command": "ready"})
        .then(response => this._transcribe(response))
        .catch(error => this._transcribe(error));
    }

    _transcribe(message) {
        console.log(message);
    }
}

export default function(bridge) {
    new Main(bridge);
    return null;
}
