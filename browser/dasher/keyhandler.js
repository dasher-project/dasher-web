// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

import Piece from './piece.js';

const keyDown = Symbol('keydown');
const keyUp = Symbol('keyup');

export default class KeyHandler {
    constructor(structure) {
        this._active = false;

        this._piece = new Piece('div', undefined, {});
        this.node.classList.add(
            'key-handler__display', 'key-handler__display_inactive');

        this._listenerKeyDown = this._listener.bind(this, keyDown);
        this._listenerKeyUp = this._listener.bind(this, keyUp);
    }

    get piece() {return this._piece;}
    get node() {return this.piece.node;}

    _display(...text) { this.node.textContent = text.join(""); }

    get active() {return this._active;}
    set active(active) {
        active = !!active;
        if (active === this._active) { return; }

        this._active = active;
        if (active) {
            this._display('KeyHandler active.');
            document.addEventListener('keydown', this._listenerKeyDown, false);
            document.addEventListener('keyup', this._listenerKeyUp, false);
        }
        else {
            this._display('KeyHandler inactive.');
            document.removeEventListener('keydown', this._listenerKeyDown);
            document.removeEventListener('keyup', this._listenerKeyDown);
        }

        this.node.classList.toggle('key-handler__display_inactive', !active);
    }

    _listener(eventType, event) {
        const keyDescriptions = [eventType.description, " "];
        const keyName = event.key === " " ? "Space" : event.key;
        if (keyName.length === 1) {
            keyDescriptions.push('"');
        }
        keyDescriptions.push(keyName);
        if (keyName.length === 1) {
            keyDescriptions.push('"');
        }
        if (event.repeat) {
            keyDescriptions.push(" repeating");
        }
        this._display(...keyDescriptions, ".");
    }
}
