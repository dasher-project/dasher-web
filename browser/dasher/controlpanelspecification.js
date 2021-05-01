// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

export default {
    $:{$:{"after":"panel", "html":"fieldset"}},

    "main": {
        $: {"order": 0, "label":null},
        "prediction": {$:{"order": 0, "control":"select"}},
         "behaviour": {$:{"order": 1, "control":"select"}}
    },

    "navigator": {
        $: {"order": 1, "after":"navigator"}
    },

    "colour": {
        $: {"order": 2},
        "fill": {
            $: {"order": 0, "html": "div",
                $: {"control": "color", "after":"colour"}
            },
            // See https://en.wikipedia.org/wiki/Web_colors if you need a hint.
                "capital":{$:{"order": 0, "value": "#ffff00"}},
                "numeral":{$:{"order": 1, "value": "#f08080"}},
                  "space":{$:{"order": 2, "value": "#d3d3d3"}},
            "punctuation":{$:{"order": 3, "value": "#32cd32"}},
            "contraction":{$:{"order": 4, "value": "#fbb7f0"}}
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
        $: {"order": 3, $:{"html":"div"}},

        "horizontal":{$:{"order": 1, "control":"number",
                         "value": "0.2", "label":"Left-Right"}},
          "vertical":{$:{"order": 2, "control":"number",
                         "value": "0.2", "label":"Up-Down"}}
    },

    "speech":{
        $: {"order": 4},

        "stop": {$:{
            "order": 0, "control": "checkbox", "label": "Speak on stop"}},
        "voice": {$:{
            "order": 1, "control":"select", "label": null}}
    },

    "manage":{
        $: {"order": 5},

        "settings": {
            $:{"after":"manager"},
            "copy": {$:{
                "order": 0, "control": "button", "label": "Copy settings"}},
            "paste": {$:{
                "order": 1, "control": "button", "label": "Paste settings"}},
            "reset": {$:{
                "order": 2, "control": "button", "label": "Defaults"}},
            "result": {
                $:{"order": 3, "html":"div"},
                "outcome": {$:{"order": 0, "html":"span", "label":""}},
                "detail": {$:{"order": 1, "html":"pre"}}
            },
            "divider":{$:{
                "order": 4, "html": "div"}},
            "saveSettings": {$:{
                "order": 5, "html": "span",
                "label":"Save settings in browser"}},
            "saveAutomatically": {$:{
                "order": 6, "control": "checkbox", "value": true,
                "label": "Automatically"}},
            "save": {$:{
                "order": 7, "control": "button", "label": "Save now"}},
            "load": {$:{
                "order": 8, "control": "button", "label": "Load now"}},
        }
    },
    "display": {
        $: {"order": 6},

        "popup":{$:{
            "order": 0, "control": "button"}}
    },
    "message": {
        $: {"order": 7},

        "add":{$:{
            "order": 0, "control": "button"}},
        "show":{$:{
            "order": 1, "control": "button"}},
        "divider":{$:{
            "order": 2, "html": "div"}},
        "import":{$:{
            "order": 3, "control": "button"}},
        "export":{$:{
            "order": 4, "control": "button"}}
    },
    "developer": {
        $: {"order": 8},

        "pointer":{$:{
            "order": 0, "control": "button"}},
        "random":  {$:{
            "order": 1, "control": "button", "label": "Go Random"}},
        "showDiagnostic": {$:{
            "order": 2, "control": "checkbox", "label": "Show diagnostic"}},
        "frozen": {$:{
            "order": 3, "control": "checkbox"}},
        "diagnostic":{$:{
            "order": 4, "html": "div"}},
        "divider":{$:{
            "order": 5, "html": "div"}},
        "x": {$:{
            "order": 6, "control": "number", "value":"0"}},
        "y": {$:{
            "order": 7, "control": "number", "value":"0"}},
        "advance":{$:{
            "order": 8, "control": "button"}},
        "keyHandler": {$:{
            "order": 9, "control": "checkbox", "label": "Key handler"}},

    }
};
