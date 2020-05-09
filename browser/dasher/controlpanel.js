// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

import Piece from './piece.js';

import PageBuilder from "../pagebuilder.js";

const structure = {
    $:{$:{"panel":true}},

    "main": {
        $: {"order": 0},
        "prediction": {$:{"order": 0, "control":"select"}}
    },

    "colour":{
        $: {"order": 1},
        "fill": {
            $: {"order": 0, $: {"control": "color", "after":"colour"}},
            // See https://en.wikipedia.org/wiki/Web_colors
                "capital":{$:{"order": 0, "value": "#ffff00"}},
                  "small":{$:{"order": 1, "value": "#00BFFF"}},
                "numeral":{$:{"order": 2, "value": "#f08080"}},
            "punctuation":{$:{"order": 3, "value": "#32cd32"}},
            "contraction":{$:{"order": 4, "value": "#fbb7f0"}},
                  "space":{$:{"order": 5, "value": "#d3d3d3"}},
                   "root":{$:{"order": 6, "value": "#c0c0c0"}}
        },
        "sequence": {
            $: {
                "order": 1, "html": "div",
                $: {"control": "color", "label":null, "after":"colour"}
            },
            "sequence-0-0":{$:{"label": "Sequence:",
                               "order": 0, "value": "#90ee90"}},
            "sequence-0-1":{$:{"order": 1, "value": "#98fb98"}},
            "sequence-1-0":{$:{"order": 2, "value": "#add8e6"}},
            "sequence-1-1":{$:{"order": 3, "value": "#87ceeb"}}
        },
        "zoom__rect": {
            $: {"order": 2, "html":"div", "after":"border"},
            "outline":{$:{
                "order": 0, "control": "color", "value": "#000000"}},
            "show":{$:{
                "order": 1, "control": "checkbox"}}
        }
    },

    "speed":{
        $: {"order": 2},
        
             "speed":{$:{"order": 0, "html": "span"}},
        "horizontal":{$:{"order": 1, "control":"number",
                         "value": "0.2", "label":"Left-Right"}},
          "vertical":{$:{"order": 2, "control":"number",
                         "value": "0.2", "label":"Up-Down"}}
    },

    "speech":{
        $: {"order": 3}
    },

    "developer": {
        $: {"order": 4},

        "pointer":{$:{
            "order": 0, "control": "button"}},
        "random":  {$:{
            "order": 1, "control": "button", "label": "Go Random"}},
        "showDiagnostic": {$:{
            "order": 2, "control": "checkbox", "label": "Show diagnostic"}},
        "frozen": {$:{
            "order": 3, "control": "checkbox"}},
        "x": {$:{
            "order": 4, "control": "number", "value":"0"}},
        "y": {$:{
            "order": 5, "control": "number", "value":"0"}},
        "advance":{$:{
            "order": 6, "control": "button"}}
    }
};

const pathJoin = "_";

class Control {
    constructor(parentPiece, path, $) {
        this.$ = $;

        this._piece = undefined;
        this._node = undefined;
        this._valueListener = null;
        this._addedListener = null;
        this._optionStrings = undefined;

        this._label = Control.make_label(
            $, path, this._labelFirst && $.control !== "button");
        this._identifier = path.join(pathJoin);

        this._listenerType = (
            this.$.control === "button" ? "click" :
            this.$.control === "select" ? "input" :
            "change"
        );

        if ($.control === "button") {
            this._construct_button(parentPiece);
        }
        else if ($.control === "select") {
            this._construct_select(parentPiece);
        }
        else {
            this._construct_input(parentPiece);
        }
    }

    get piece() {return this._piece;}
    get node() {
        return this._piece === undefined ? this._node : this._piece.node;
    }

    static make_label($, path, colon) {
        return $.label === undefined ? [
            path[path.length - 1][0].toLocaleUpperCase(),
            path[path.length - 1].slice(1),
            colon ? ":" : ""
        ].join("") : $.label;
    }

    get _labelFirst() {
        return this.$.control !== "checkbox" && this.$.control !== "number";
    }

    _construct_button(parentPiece) {
        this._node = PageBuilder.add_button(
            this._label,
            parentPiece === undefined ? undefined : parentPiece.node);
        this.node.setAttribute('disabled', true);
    }

    _construct_select(parentPiece) {
        const attributes = {
            'id':this._identifier, 'name':this._identifier, 'disabled': true};
        this._with_label(parentPiece, () => {
            this._piece = new Piece('select', parentPiece, attributes);
        });

        if (this.optionStrings !== undefined) {
            this.optionStrings.forEach(optionString => this.node.add(
                new Option(optionString)
            ));
        }
    }

    _with_label(parentPiece, build) {
        if (this._label !== null && this._labelFirst) {
            parentPiece.create('label', {'for':this._identifier}, this._label);
        }
        build();
        if (this._label !== null && !this._labelFirst) {
            parentPiece.create('label', {'for':this._identifier}, this._label);
        }
    }

    _construct_input(parentPiece) {
        const attributes = {
            'type':this.$.control, 'disabled': true,
            'id':this._identifier, 'name':this._identifier
        };
        if (this.$.control === "checkbox" && this.$.value) {
            attributes.checked = true;
            // else omit the `checked` attribute so that the check box starts
            // clear.
        }

        // TOTH https://github.com/sjjhsjjh/blender-driver/blob/master/user_interface/demonstration/UserInterface.js#L96
        this._isFloat = (
            this.$.control === "number" && this.$.value !== undefined &&
            this.$.value.includes("."));
        this._parsedValue = (
            this.$.value === undefined ? undefined : (
                this.$.control === "number" ? (
                    this._isFloat ? parseFloat(this.$.value) :
                    parseInt(this.$.value)
                ) : this.$.value
            )
        );
        if (this._parsedValue !== undefined) {
            attributes.value = this._parsedValue;
        }
        if (this.$.control === "number") {
            attributes.step = this._isFloat ? 0.1 : 1;
        }

        this._with_label(parentPiece, () => {
            this._node = parentPiece.create('input', attributes);
        });
        if (this._parsedValue !== undefined) {
            this.node.value = this._parsedValue;
        }
    }

    get listener() {return this._valueListener;}

    set listener(listener) {
        if (this._addedListener !== null) {
            this.node.removeEventListener(
                this._listenerType, this._addedListener);
            this._addedListener = null;
        }

        if (this.$.control === "button") {
            this._addedListener = listener;
        }
        else if (this.$.control === "select") {
            this._addedListener = event => listener(
                event.target.selectedIndex, event.target.value);
        }
        else {
            if (this._parsedValue !== undefined) {
                listener(this._parsedValue);
            }

            if (this.$.control === "checkbox") {
                this._addedListener = event => listener(event.target.checked);
            }
            else if (this.$.control === "number") {
                const parser = this._isFloat ? parseFloat : parseInt;
                this._addedListener = event => listener(parser(
                    event.target.value));
            }
            else {
                this._addedListener = event => listener(event.target.value);
            }
        }

        this.node.addEventListener(this._listenerType, this._addedListener);
        this._valueListener = listener;
    }

    get optionStrings() {return this._optionStrings;}
    set optionStrings(optionStrings) {
        // Only works with control:select instances.

        this._optionStrings = optionStrings.slice();

        // ToDo: Near here, get the current value and preserve it in case the
        // new options include it.
        if (this.piece !== null) {
            this.piece.remove_all();
        }
        if (this.node !== null) {
            this._optionStrings.forEach(optionString => this.node.add(
                new Option(optionString)));
        }
    }
}

export default class ControlPanel {
    constructor() {
        this._structure = structure;

        this._cssNode = undefined;
        this._selectors = undefined;
    }

    descend(callback, state) {
        return this._descend(this._structure, [], callback, state);
    }

    _descend(structure, path, callback, state) {
        const stateChild = callback(structure, path, state);
        if (stateChild !== false) {
            for(const key of structure.$.childOrder) {
                path.push(key);
                this._descend(structure[key], path, callback, stateChild);
                path.pop();
            }
        }
        return stateChild;
    }

    replace(path, replacement) {
        let structure = this._structure;
        let index = 0;
        for (; index < path.length - 1; index += 1) {
            structure = structure[path[index]];
        }
        structure[path[index]] = replacement;
        return structure;
    }

    load() {
        this.descend((structure, path, $) => {
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
        this._instantiate();
        return this._structure;
    }

    _instantiate(/*parentPiece*/) {
        this._selectors = new Piece('div'); //, parentPiece);
        this._selectors.node.classList.add('header__selectors');

        this.descend((structure, path, statePiece) => {
            if (structure.$.panel && path.length > 0) {
                const label = path[path.length - 1];
                const piece = new Piece('div', statePiece);
                piece.node.classList.add(
                    'header__panel', `header__panel-${label}`);
                structure.$.piece = piece;
            
                structure.$.selector = new Control(
                    new Piece('div', this._selectors), path,
                    {"control": "button"});
                structure.$.selector.listener = this.select_panel.bind(
                    this, label);

                statePiece = piece;
            }

            if (structure.$.control !== undefined) {
                const control = new Control(statePiece, path, structure.$);
                this.replace(path, control);
                return false;
            }

            if (structure.$.html !== undefined) {
                structure.$.piece = new Piece(
                    structure.$.html, statePiece, {}, 
                    structure.$.html === "span" ?
                    Control.make_label(structure.$, path, true) :
                    undefined);
                statePiece = structure.$.piece;
            }

            return statePiece;
        }); //, parentPiece);

        this.descend((structure, path) => {
            if (structure.$.after !== undefined) {
                (afterInstantiate[structure.$.after].bind(this)
                )(path, structure);
            }
        });
    }

    set_parent(parentPiece) {
        if (this._selectors !== undefined) {
            parentPiece.add_child(this._selectors);
        }
        this.descend((structure, path) => {
            if (path.length === 0) {
                return true;
            }
            if (structure.$.panel && path.length > 0) {
                parentPiece.add_child(structure.$.piece);
                return false;
            }
            throw new Error('Non-panel in structure.');
        });
    }

    add_CSS_node() {
        if (this._cssNode === undefined) {
            this._cssNode = document.createElement('style');
            document.head.append(this._cssNode);
        }
        return this._cssNode;
    }

    select_panel(selectedLabel) {
        this.descend((structure, path) => {
            // Find everything that is a panel and toggle the css classes  on
            // the panel and its selector accordingly.
            if (structure.$.panel && path.length > 0) {
                const label = path[path.length - 1];
                structure.$.piece.node.classList.toggle(
                    'header__panel_selected', selectedLabel === label);
                structure.$.selector.node.classList.toggle(
                    'header__selector_selected', selectedLabel === label);
            }
        });
    }

    enable_controls() {
        this.descend(structure => {
            const element = (
                structure.$.panel ? structure.$.selector.node :
                structure.$.control !== undefined ? structure.node :
                null
            );
            if (element !== null) {
                element.removeAttribute('disabled');
            }
        });
    }

}

const afterInstantiate = {

    border: function(path, structure) {
        let colorControl;
        let checkboxControl;
        for(const key of structure.$.childOrder) {
            if (structure[key].$.control === "color") {
                colorControl = structure[key];
            }
            if (structure[key].$.control === "checkbox") {
                checkboxControl = structure[key];
            }
        }

        let nowOn = !!checkboxControl.$.value;
        let nowColour = colorControl.$.value;
        const name = path[path.length - 1];
    
        function rule() {
            return [
                'rect.', name, " {",
                "stroke-width: ", nowOn ? "1px" : "0px", "; ",
                "stroke: ", nowColour, ";}"
            ].join("");
        }
    
        const sheet = this.add_CSS_node().sheet;
        const inserted = sheet.insertRule(rule(), sheet.cssRules.length);

        checkboxControl.listener = checked => {
            nowOn = checked;
            sheet.deleteRule(inserted);
            sheet.insertRule(rule(), inserted);
        };
        colorControl.listener = chosen => {
            nowColour = chosen;
            sheet.deleteRule(inserted);
            sheet.insertRule(rule(), inserted);
        };
    },

    colour: function(path, control) {
        const name = path[path.length - 1];
        const sheet = this.add_CSS_node().sheet;
        const inserted = sheet.insertRule(
            `rect.${name} {fill: ${control.$.value};}`,
            sheet.cssRules.length);

        control.listener = value => {
            sheet.deleteRule(inserted);
            sheet.insertRule(`rect.${name} {fill: ${value};}`, inserted);
        };
    }

};
