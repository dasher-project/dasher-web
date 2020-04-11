// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

export default class BoxSpecification {
    constructor(template, parentBoxSpecification) {
        // Some of the following could be properties with getters but maybe
        // that's slower?

        this.cssClass = template.cssClass;
        this.messageCodePoints = (
            parentBoxSpecification.messageCodePoints.slice());
        if (template.codePoint !== null) {
            this.messageCodePoints.push(template.codePoint);
        }

        specification.ordinal = parentBoxSpecification.ordinal;
        if (template.cssClass === null) {
            specification.ordinal += 1;
        }

        this._childSpecifications = (
            template.childSpecifications === null ? null :
            template.childSpecifications.map(
                childTemplate => new BoxSpecification(childTemplate, this)
            )
        );


        // this.messageCodePoints = null;
        // this.displayText = null;
        // this.ordinal = null;
        this.weight = (
            this._childSpecifications === null ? 1 :
            this._childSpecifications.length);

        // this._codePoint = codePoint;
        // this._childSpecifications = childSpecifications;
        // this._factory = factory;
    }

    // get codePoint() {return this._codePoint;}
    // get childSpecifications() {return this._childSpecifications;}

    async specify_child_boxes(zoomBox, factory) {

        // If the template has childTemplates, use them somehow to generate
        // childSpecifications. Otherwise, use the factory.

        if (this._childSpecifications === null) {
            this._childSpecifications = await factory.specify_child_boxes(
                zoomBox);
        }
        return this._childSpecifications;
    }
}