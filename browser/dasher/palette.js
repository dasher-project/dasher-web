// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

import BoxSpecification from "./box_specification.js";

class Blank {
    constructor(childSpecifications, palette, parentBoxSpecification) {
        this._childSpecifications = childSpecifications;
        this._palette = palette;
    }


    set_weight(codePoint, weight) {
        const path = self._palette.indexMap.get(codePoint);
        // Some extra code could be needed to support code points that are in
        // the prediction, but aren't in the palette. Specifically:
        // -   Track the last index that is in a childSpecification but doesn't
        //     have a group.
        // -   Get the ordinal out of a childSpecification.
        //
        // For now, just put a default cssClass on them.
        let target;
        if (path === undefined) {
            const template = new Template(
                codePoint, null, palette.display_text(codePoint), "capital");
            const specification = new BoxSpecification(template, );
            specification.ordinal = this._childSpecifications[0].ordinal;
            this._childSpecifications.push(specification);
            target = specification;
        }
        else {
            let target = this._childSpecifications[path[0]];
            let index = 1;
            for(const index of path) {
                target = target.childSpecifications[index];
            }
            target.weight = weight;
        }
    }

}

const baseGroupDefinitions = [
    {
        "name": null,
        "firstPoint": "a".codePointAt(0), "lastPoint": "z".codePointAt(0)
    }, {
        "name": "capital",
        "firstPoint": "A".codePointAt(0), "lastPoint": "Z".codePointAt(0)
    }, {
        "name": "numeral",
        "firstPoint": "0".codePointAt(0), "lastPoint": "9".codePointAt(0)
    }, {
        "name": "contraction","texts": [ "'", "-" ]
    }, {
        "name": "punctuation", "texts": [ ",", ".", "&", "!", "?" ]
    }, {
        "name": "space", "texts": [ " ", "\n" ]
    }
];

const baseSequenceStubCSS = "sequence";

// TOTH:
// https://ux.stackexchange.com/questions/91255/how-can-i-best-display-a-blank-space-character
const baseDisplayTextDefinitions = [
    {leftText:" ", rightCodePoint:0x23b5}, // Space mapped to under-bracket.
    {leftText:"\n", rightCodePoint:0xb6}   // Newline mapped to pilcrow.
];
// Palette.displayTextLeft = Palette.displayTextMap.map(
//     pair => pair[0].codePointAt(0));

class Template {
    constructor(codePoint, childTemplates, displayText, cssClass) {
        this.codePoint = codePoint;
        this.childTemplates = childTemplates;
        this.displayText = displayText;
        this.cssClass = cssClass;
    }
}

export default class Palette {

    constructor() {
        // Create an object for easy mapping from group name to group object.
        // this.characterGroupMap = {};
        // Palette.characterGroups.forEach(group => {
        //     Palette.characterGroupMap[group.name] = group;
        // });

        // Fill in basic attributes for groups: texts and codePoints.
        this.codePoints = [];
        this._groups = this.groupDefinitions.map(definition => {
            const group = {
                definition: definition,
                name: definition.name === null ? null : definition.name.slice()
            };

            if ("texts" in definition) {
                group.texts = definition.texts.slice();
                group.codePoints = group.texts.map(text => text.codePointAt(0));
            }
            else {
                group.texts = [];
                group.codePoints = [];
                for (
                    let codePoint = definition.firstPoint;
                    codePoint <= definition.lastPoint;
                    codePoint++
                ) {
                    group.texts.push(String.fromCodePoint(codePoint));
                    group.codePoints.push(codePoint);
                }
            }
            this.codePoints.push(...group.codePoints);

            return group;
        });

        this._mapPointToDisplayPoint = new Map();
        this.displayTextDefinitions.forEach(({leftText, rightCodePoint}) => {
            this._mapPointToDisplayPoint.set(
                leftText.codePointAt(0), rightCodePoint);
        });

        this._templates = [];
        this._groups.forEach(group => {
            const childTemplates = group.codePoints.map(codePoint => {
                // Create specification for the code point.
                // const specification = new BoxSpecification(codePoint, null);
                return new Template(
                    codePoint, null, this.display_text(codePoint), null);
                // specification.displayText = this.display_text(codePoint);
                // return specification;
            });

            if (group.name === null) {
                this._templates.push(...childTemplates);
            }
            else {
                this._templates.push(new Template(
                    null, childTemplates, null, group.name));
                // const specification = new BoxSpecification(
                //     null, childTemplates);
                // specification.cssClass = group.name;

                // // Assume each child has a weight of 1, in the template.
                // specification.weight = childSpecifications.length;
                // this._templates.push(specification);
            }
        });
        // console.log(this._templates);

        this._indexMap = new Map();
        this._templates.forEach((template, index) => {
            // console.log(index, template);
            if (template.codePoint === null) {
                template.childTemplates.forEach(
                    (childTemplate, childIndex) => this._indexMap.set(
                        childTemplate.codePoint, [index, childIndex]
                    )
                );
            }
            else {
                this._indexMap.set(template.codePoint, [index]);
            }
        });
        console.log(this._indexMap);
    }

    // Getter to be overridden in subclasses.
    get sequenceStubCSS() {return baseSequenceStubCSS;}

    // Getter to be overridden in subclasses.
    get groupDefinitions() {return baseGroupDefinitions;}

    // Getter to be overridden in subclasses.
    get displayTextDefinitions() {return baseDisplayTextDefinitions;}

    display_text(codePoint) {
        // const displayTextIndex = (
        //     codePoint === null ? undefined :
        //     Palette.displayTextLeft.indexOf(codePoint));
        // return (
        //     displayTextIndex === undefined ? null :
        //     String.fromCodePoint(
        //         displayTextIndex >= 0 ?
        //         Palette.displayTextMap[displayTextIndex][1] :
        //         codePoint
        //     )
        // );

        const mappedPoint = this._mapPointToDisplayPoint.get(codePoint);
        return String.fromCodePoint(
            mappedPoint === undefined ? codePoint : mappedPoint);
    }

    sequence_CSS(ordinal, index) {
        return [
            this.sequenceStubCSS, (ordinal % 2).toFixed(), (index % 2).toFixed()
        ].join("-");
    }

    get_blank(boxSpecification) {
        // ToDo: Change so that it returns a clone of something already
        // allocated in the constructor. But set the things that need to be set:
        // -   ordinal, and therefore CSS class.
        // -   message code points.
        // -   ?factory

        const childSpecifications = this._templates.map((template, index) => {
            const specification = new BoxSpecification(
                template, boxSpecification);
            //     boxSpecification.messageCodePoints,
            //     boxSpecification.ordinal);
            if (template.codePoint !== null) {
                specification.cssClass = this.sequence_CSS(
                    boxSpecification.ordinal, index);
                // specification.messageCodePoints.push(template.codePoint);
                // specification.ordinal += 1;
            }

            return specification;
        })

        return new Blank(childSpecifications, this);
    }

    template() {
        const returning = [];
        for (const group of Palette.characterGroups) {
            const template = {
                "cssClass": group.name, "childSpecifications": []
            };
            returning.push(template);
            group.codePoints.forEach(
                codePoint => template.childSpecifications.push({
                    "codePoint": codePoint
                }));
        }
        return returning;

        // could optimise by making a map of code points to groups, to speed up
        // the weight population later. Also, the childspecifications and
        // returning arrays could be shallow copies of a pre-gen.

    }
}
