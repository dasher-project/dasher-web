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

    load() {
        return this._load(this._structure, undefined);
    }

    _load(structure, $) {
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
        console.log(structure.$.childOrder);

        // Recursive calls.
        for(const key of structure.$.childOrder) {
            this._load(structure[key], structure.$.$);
        }


        // for(const [label, panel] of structure.$.childOrder) {




        //     this._panels[panelLabel] = {
        //         "piece": piece,
        //         "selector": this._load_button(
        //             panelLabel[0].toLocaleUpperCase() + panelLabel.slice(1),
        //             new Piece('div', selectors),
        //             this._select_panel.bind(this, panelLabel)
        //         )
        //     };

        // }

        return this.structure;
    }

    instantiate_panels(parentPiece) {
        // this._panels = {};
        const selectors = new Piece('div', parentPiece);
        selectors.node.classList.add('header__selectors');
        this._instantiate_panels(parentPiece, selectors, this._structure, null);
    }

    _instantiate_panels(parentPiece, selectors, structure, label) {
        if (structure.$.panel && label !== null) {
            const piece = new Piece('div', parentPiece);
            piece.node.classList.add(
                'header__panel', `header__panel-${label}`);
            structure.$.piece = piece;
            parentPiece = piece;
        
            structure.$.selector = this._load_button(
                label[0].toLocaleUpperCase() + label.slice(1),
                new Piece('div', selectors),
                this.select_panel.bind(this, label)
            );
        };

        // Recursive calls.
        for(const key of structure.$.childOrder) {
            this._instantiate_panels(
                parentPiece, selectors, structure[key], key);
        }
    }

    select_panel(label) {
        this._select_panel(this._structure, label, null)
    }

    _select_panel(structure, selectedLabel, label) {
        // Descend the structure finding everything that is a panel and toggle
        // the css class accordingly.
        if (structure.$.panel && label !== null) {
            structure.$.piece.node.classList.toggle(
                'header__panel_selected', selectedLabel === label);
            structure.$.selector.classList.toggle(
                'header__selector_selected', selectedLabel === label);
        }

        // Recursive calls.
        for(const key of structure.$.childOrder) {
            this._select_panel(structure[key], selectedLabel, key);
        }
    }

    _load_button(label, parentPiece, callback) {
        const button = PageBuilder.add_button(
            label, parentPiece === undefined ? undefined : parentPiece.node);
        button.setAttribute('disabled', true);
        button.addEventListener('click', callback);
        return button;
    }

    enable_controls() {
        this._descend(this._structure, null, null,
            (structure, label, parent) => {
                if (structure.$.panel) {
                    structure.$.selector.removeAttribute('disabled');
                }        
            }
        );
    }

    _descend(structure, label, parent, callback) {
        callback(structure, label, parent);
        // Recursive calls.
        for(const key of structure.$.childOrder) {
            this._descend(structure[key], key, structure, callback);
        }
    }


}