// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

import Piece from './piece.js';

import PageBuilder from "../pagebuilder.js";

const structure = {
    "main": {
        $: {"order": 0}
    },
    "colour":{
        $: {"order": 1}
    },
    "speed":{
        $: {"order": 2}
    },
    "speech":{
        $: {"order": 3}
    },
    "developer": {
        $: {"order": 4}
    },
    "$": {
        "$": {
            "panel":true
        }
    }
};

export default class ControlPanel {
    constructor() {
        this._structure = structure;
    
    }

    descend(callback, state) {
        return this._descend(this._structure, null, null, callback, state);
    }

    _descend(structure, label, parent, callback, state) {
        const stateChild = callback(structure, label, parent, state);
        if (stateChild !== false) {
            for(const key of structure.$.childOrder) {
                this._descend(
                    structure[key], key, structure, callback, stateChild);
            }
        }
        return stateChild;
    }

    load() {
        this.descend((structure, label, parent, $) => {
            if (structure.$ === undefined) {
                structure.$ = {};
                if ($ !== undefined) {
                    Object.assign(structure.$, $);
                }
            }
            else {
                if ($ !== undefined) {
                    structure.$ = Object.assign({}, $, structure.$);
                }
            }
    
            if (structure.$.childOrder === undefined) {
                structure.$.childOrder = Object.entries(structure)
                .sort((kvA, kvB) => kvA[1].order - kvB[1].order)
                .map(kv => kv[0])
                .filter(key => key !== "$");
            }

            return structure.$.$;
        });
        return this._structure;
    }

    instantiate_panels(parentPiece) {
        const selectors = new Piece('div', parentPiece);
        selectors.node.classList.add('header__selectors');

        this.descend((structure, label, parent, statePiece) => {
            if (structure.$.panel && label !== null) {
                const piece = new Piece('div', statePiece);
                piece.node.classList.add(
                    'header__panel', `header__panel-${label}`);
                structure.$.piece = piece;
            
                structure.$.selector = this._load_button(
                    label[0].toLocaleUpperCase() + label.slice(1),
                    new Piece('div', selectors),
                    this.select_panel.bind(this, label)
                );
                return piece;
            }
            else {
                return statePiece;
            }
        }, parentPiece);
    }

    select_panel(selectedLabel) {
        this.descend((structure, label) => {
        // Find everything that is a panel and toggle the css class accordingly.
            if (structure.$.panel && label !== null) {
                structure.$.piece.node.classList.toggle(
                    'header__panel_selected', selectedLabel === label);
                structure.$.selector.classList.toggle(
                    'header__selector_selected', selectedLabel === label);
            }
        });
    }

    enable_controls() {
        this.descend(structure => {
            if (structure.$.panel) {
                structure.$.selector.removeAttribute('disabled');
            }
        });
    }

    _load_button(label, parentPiece, callback) {
        const button = PageBuilder.add_button(
            label, parentPiece === undefined ? undefined : parentPiece.node);
        button.setAttribute('disabled', true);
        button.addEventListener('click', callback);
        return button;
    }

}