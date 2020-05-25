// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

import Piece from './piece.js';

import PageBuilder from "../pagebuilder.js";

const pathJoin = "_";

class Control {
    constructor(parentPiece, path, $) {
        this.$ = $;

        this._piece = undefined;
        this._node = undefined;
        this._valueListener = null;
        this._addedListener = null;
        this._optionStrings = undefined;
        this._active = undefined;

        this._selectedIndex = undefined;
        this._selectedString = undefined;

        this._panelListener = null;

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
        else {
            if ($.control === "select") {
                this._construct_select(parentPiece);
            }
            else {
                this._construct_input(parentPiece);
            }
            this._add_panel_listener();
        }
    }

    get panelListener() {return this._panelListener;}
    set panelListener(panelListener) {this._panelListener = panelListener;}
    _add_panel_listener() {
        this.node.addEventListener(
            this._listenerType, this._panel_listener.bind(this));
    }
    _panel_listener(event) {
        if (this.panelListener !== null) {
            this.panelListener(event);
        }
    }

    get piece() {return this._piece;}
    get node() {
        return this._piece === undefined ? this._node : this._piece.node;
    }

    get active() {return this._active;}
    set active(active) {
        this._active = active;
        if (this.node !== undefined) {
            if (active) {
                this.node.removeAttribute('disabled');
            }
            else {
                this.node.setAttribute('disabled', true);
            }
        }
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
        this.active = !!this.active;
    }

    _construct_select(parentPiece) {
        const attributes = {'id':this._identifier, 'name':this._identifier};
        this._with_label(parentPiece, () => {
            this._piece = new Piece('select', parentPiece, attributes);
        });
        this.active = !!this.active;

        // If option strings were set early, create <option> elements now.
        if (this.optionStrings !== undefined) {
            this.optionStrings.forEach(optionString => this.node.add(
                new Option(optionString)
            ));
        }

        this.select_option(
            this.$.value === undefined ? undefined : this.$.value.value,
            this.$.value === undefined ? 0 : this.$.value.index);
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
            'type':this.$.control,
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
        if (this._parsedValue !== undefined && this.$.control !== "checkbox") {
            attributes.value = this._parsedValue;
        }
        if (this.$.control === "number") {
            attributes.step = this._isFloat ? 0.1 : 1;
        }

        this._with_label(parentPiece, () => {
            this._node = parentPiece.create('input', attributes);
        });
        this.active = !!this.active;
        if (this._parsedValue !== undefined) {
            if (this.$.control === "checkbox") {
                this.node.checked = this._parsedValue;
            }
            else {
                this.node.value = this._parsedValue;
            }
        }
    }

    get listener() {return this._valueListener;}

    set listener(listener) {
        if (this._addedListener !== null) {
            this.node.removeEventListener(
                this._listenerType, this._addedListener);
            this._addedListener = null;
        }
        this._valueListener = listener;

        if (listener === null || listener === undefined) {
            return;
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
    }

    get optionStrings() {return this._optionStrings;}
    set optionStrings(optionStrings) {
        // Only works with control:select instances.

        this._optionStrings = optionStrings.slice();

        if (this.node !== null && this.node.selectedIndex !== -1) {
            // Get the current value and preserve it in case the new options
            // include it but in a different place.
            this._selectedIndex = this.node.selectedIndex;
            this._selectedString = this.node.value;
        }

        if (this.piece !== null) {
            this.piece.remove_all();
        }
        if (this.node !== null) {
            this._optionStrings.forEach(optionString => this.node.add(
                new Option(optionString)));
        }
        this.select_option(this._selectedString, this._selectedIndex);

        // It seems that an input event listener added to a <select> gets added
        // to all its <option> children and that's what makes it work. If the
        // children get removed, the listener has to be set again.
        this.listener = this.listener;
        this._add_panel_listener();
    }

    get json() {
        if (this.$.control === "button") {
            return undefined;
        }

        if (this.$.control === "select") {
            return {
                "index":
                    this.node.selectedIndex === -1 ?
                    this._selectedIndex :
                    this.node.selectedIndex,
                "value": this.node.value
            };
        }

        if (this.$.control === "checkbox") {
            return this.node.checked;
        }

        if (this.$.control === "number") {
            const parser = this._isFloat ? parseFloat : parseInt;
            return parser(this.node.value);
        }

        return this.node.value;
    }

    set_value(value) {
        const listener = (
            this._valueListener === null || this._valueListener === undefined ?
            () => {} : this._valueListener);

        if (this.$.control === "select") {
            this.select_option(value.value, value.index);
            listener(this.node.selectedIndex, this.node.value);
        }
        else {
            if (this.$.control === "checkbox") {
                value = !!value;
                this.node.checked = value;
            }
            else {
                if (this.$.control === "number") {
                    const parser = this._isFloat ? parseFloat : parseInt;
                    value = parser(value);
                }
                this.node.value = value;
            }
            listener(value);
        }
    }

    select_option(selectedString, selectedIndex) {
        const foundIndex = (
            selectedString === undefined ? -1 :
            this._optionStrings.indexOf(selectedString));
        
        if (foundIndex === -1) {
            this._selectedIndex = selectedIndex;
            this._selectedString = undefined;
        }
        else {
            selectedIndex = foundIndex;
            this._selectedString = selectedString;
            this._selectedIndex = selectedIndex;
        }
        if (selectedIndex !== undefined) {
            this.node.selectedIndex = selectedIndex;
        }

        // Retain the selectedString and selectedIndex in case the optionStrings
        // get set later. That supports early selection, like before the
        // optionStrings get set.

        // Other code that might be useful later:
        // this.node.value = this.node.options[selectedIndex].value;
        // this.node.options.forEach((option, index)=> {
        //     option.setAttribute('selected', index === foundIndex);
        // });
    }
}

export default class ControlPanel {
    constructor(structure) {
        this._structure = structure;

        this._cssNode = undefined;
        this._selectors = undefined;
        this._defaultValues = undefined;
        this._managerListener = null;
    }

    // Maybe this getter should return Object.assign({}, _defaultValues).
    get defaultValues() {return this._defaultValues;}

    get managerListener() {return this._managerListener;}
    set managerListener(managerListener) {
        this._managerListener = managerListener;
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

    _instantiate() {
        this._selectors = new Piece('div');
        this._selectors.node.classList.add('control-panel__selectors');

        this.descend((structure, path, statePiece) => {
            if (structure.$.panel && path.length > 0) {
                const label = path[path.length - 1];
                const piece = new Piece('div', statePiece);
                piece.node.classList.add(
                    'control-panel__panel', `control-panel__panel-${label}`);
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
                control.panelListener = () => {
                    if (this.managerListener !== null) {
                        this.managerListener();
                    }
                };
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
        });

        this._defaultValues = this.get_values();

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
                    'control-panel__panel_selected', selectedLabel === label);
                structure.$.selector.node.classList.toggle(
                    'control-panel__selector_selected',
                    selectedLabel === label);
            }
        });
    }

    enable_controls() {
        this.descend(structure => {
            if (structure.$.panel) {
                structure.$.selector.active = true;
            }
            if (structure.$.control !== undefined) {
                structure.active = true;
            }
        });
    }

    json_stringify(spaces=4) {
        function replacer(key, value) {
            if (value.$ === undefined) {
                // Plain value returned from the json property of a Control
                // instance.
                return value;
            }

            if (key === "" || value.$.control === undefined) {
                // key === "" only happens once, at the top of the structure.
                let returning = undefined;
                for(const key of value.$.childOrder) {
                    if (returning === undefined) {
                        returning = {};
                    }
                    returning[key] = value[key];
                }
                return returning;
                // Return undefined for empty structural elements.
            }

            // The code can only reach this point if value.$.control isn't
            // undefined. Therefore, value is a Control instance.
            return value.json;
        }
        return JSON.stringify(this._structure, replacer, spaces);
    }

    get_values() { return this.descend((structure, path, values) => {
        if (path.length === 0) {
            // Top of the structure; create the top of the value structure.
            return {};
        }

        const name = path[path.length - 1];

        if (structure.$.control === undefined) {
            // Not a control; create new value structure node.
            values[name] = {};
            return values[name];
        }

        if (structure.$.control !== "button") {
            values[name] = structure.json;
        }
        return false;
    })}

    set_values(rootSettings) { this.descend((structure, path, settings) => {
        if (path.length === 0) {
            // Top of the structure; descend structure with same settings.
            return settings;
        }

        const name = path[path.length - 1];

        if (structure.$.control === undefined) {
            // Not a control; descend structure and settings.
            return settings[name];
        }

        if (structure.$.control !== "button") {
            // console.log('Set', path, settings[name]);
            structure.set_value(settings[name]);
        }
        return false;
    }, rootSettings); }
}

class ControlPanelManager {
    constructor(controlPanel, structure, databaseName) {
        this._controlPanel = controlPanel;
        this._structure = structure;
        this._databaseName = databaseName;

        this._fadeTimeout = null;
        this._databaseVersion = 1;
        this._objectStoreKey = 0;
        this._everLoaded = false;
    }

    _show_result(outcome, detail) {
        this._structure.result.outcome.$.piece.node.textContent = outcome;
        this._structure.result.detail.$.piece.node.textContent = (
            detail === undefined ? "" : detail);

        const resultNode = this._structure.result.$.piece.node;
        resultNode.classList.remove("control-panel__result-stale");
        if (this._fadeTimeout !== null) {
            clearTimeout(this._fadeTimeout);
        }
        if (detail === undefined) {
            this._fadeTimeout = setTimeout(
                () => resultNode.classList.add("control-panel__result-stale"),
                1000);
        }
    }

    load() {
        this._structure.result.$.piece.node.classList.add(
            "control-panel__result");

        this._structure.copy.listener = this.copy_to_clipboard.bind(this);
        this._structure.paste.listener = this.paste_from_clipboard.bind(this);
        this._structure.save.listener = this.save_to_browser.bind(this, true);
        this._structure.load.listener = this.load_from_browser.bind(this);

        this._structure.reset.listener = () => {
            this._controlPanel.set_values(this._controlPanel.defaultValues);
            this.save_to_browser(true);
        };

        this._structure.saveAutomatically.listener = this._automatic_save.bind(
            this);

        this.load_from_browser();
        return this;
    }

    copy_to_clipboard() {
        if (navigator.clipboard === undefined) {
            this._show_result("Copy failed", "No clipboard access");
            return;
        }

        navigator.clipboard.writeText(this._controlPanel.json_stringify())
        .then(ok => this._show_result("Copied OK", ok))
        .catch(error => this._show_result("Copy failed", error));
    }

    paste_from_clipboard() {
        if (navigator.clipboard === undefined) {
            this._show_result("Paste failed", "No clipboard access");
            return;
        }

        navigator.clipboard.readText()
        .then(text => {
            let settings;
            try {
                settings = JSON.parse(text);
            }
            catch {
                this._show_result("Paste isn't JSON", text);
                settings = undefined;
            }
            if (settings !== undefined) {
                this._controlPanel.set_values(settings);
                this._show_result("Paste OK");
            }
        })
        .catch(error => this._show_result("Paste failed", error));
    }

    save_to_browser(showResult) {
        this._open_object_store("readwrite").catch(() => {}).then(store => {
            const putRequest = store.put(
                this._controlPanel.get_values(), this._objectStoreKey);
            putRequest.onsuccess = event => {
                if (showResult) {
                    this._show_result(
                        "Saved OK.",
                        // Only set a detail if the key isn't as expected.
                        event.target.result === this._objectStoreKey ?
                        undefined :
                        event.target.result
                    );
                }
            };
        });
    }

    load_from_browser() {
        this._open_object_store("readonly").catch(() => {}).then(store =>
            store.get(this._objectStoreKey).onsuccess = event => {
                this._show_result("Loaded OK.");
                // , JSON.stringify( event.target.result, undefined, 4));
                this._controlPanel.set_values(event.target.result);
                this._everLoaded = true;
            }
        )
    }

    _open_object_store(mode) { return new Promise((resolve, reject) => {
        // Code is inside the Promise constructor but `this` is still the
        // ControlPanelManager instance because we're also inside a lambda.
        if (!window.indexedDB) {
            this._show_result("No database access", window.indexedDB);
            reject(window.indexedDB);
            return;
        }
        const request = window.indexedDB.open(
            this._databaseName, this._databaseVersion);
        request.onerror = event => {
            this._show_result(`Failed to open database`, event.target.error);
            reject(event.target.error);
            return;
        };

        let justUpgraded = false;
        request.onupgradeneeded = event => {
            // Object store has the same name as the database.
            const database = event.target.result;
            database.createObjectStore(this._databaseName);
            justUpgraded = true;
        };

        request.onsuccess = event => {
            const database = event.target.result;

            const get_store = () => {
                const transaction = database.transaction(
                    [this._databaseName], mode);
                transaction.onerror = event => {
                    this._show_result("Transaction failed", event.target.error);
                }
                resolve(transaction.objectStore(this._databaseName));
            }

            if (justUpgraded) {
                const transaction = database.transaction(
                    [this._databaseName], "readwrite");
                transaction.onerror = event => {
                    this._show_result("Create failed", event.target.error);
                };
                transaction.objectStore(this._databaseName).add(
                    this._controlPanel.get_values(), this._objectStoreKey);
                transaction.oncomplete = get_store;
            }
            else {
                get_store();
            }
        };
    });}

    _automatic_save(checked) {
        // The values at the point of saveAutomatically must be saved,
        // whatever its setting. If automatic save has just been switched
        // off, don't inform the user because it could cause confusion.
        if (this._everLoaded) {
            this.save_to_browser(checked);
        }

        // If the save-automatically box is ticked, set the control panel
        // manager listener to a lambda that silently saves all settings in the
        // database. Otherwise, the manager listener to null.
        this._controlPanel.managerListener = (
            checked ? this.save_to_browser.bind(this, false) : null);

        // If saving automatically, deactivate the save and load buttons.
        this._structure.save.active = !checked;
        this._structure.load.active = !checked;
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
    },

    manager: function(path, structure) {
        const manager = new ControlPanelManager(
            this, structure, path[path.length - 1]);
        manager.load();
    }

};
