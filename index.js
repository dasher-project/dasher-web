// (c) 2018 Jim Hawkins. MIT licensed, see https://opensource.org/licenses/MIT

class Index {
    constructor(parent) {
        this._parent = parent;
        this._characters = "abcdefghijklmnopqrstuvwxyz".split("");
    }

    _create(tag, attributes, text, parent) {
        const element = document.createElementNS(
            'http://www.w3.org/2000/svg', tag);
        if (attributes !== undefined) {
            for (const [key, value] of Object.entries(attributes)) {
                element.setAttribute(key, value);
            }
        }
        if (text !== undefined) {
            const textNode = document.createTextNode(text);
            element.appendChild(textNode);
        }

        (parent === undefined ? this._svg : parent).appendChild(element);
        return element;
    }

    load() {
        const height = 30;
        this._svg = this._create(
            'svg', {"height":height * this._characters.length}, undefined, 
            this._parent
        );
        let yPosition = 5;
        for(const [index, character] of this._characters.entries()) {
            this._create('rect', {
                x:5, y:yPosition, width:height, height:height,
                fill:(index % 2 === 0 ? "lightgray" : "lightblue")
            });
            this._create('text', {
                x:10, y:yPosition + height / 2.0, fill:"black"
            }, character );
            yPosition += height;
        }

    }
}

document.body.onload = () => {
    const ui = document.getElementById('user-interface');
    const textNode = document.createTextNode("Blibby");
    const element = document.createElement('div');
    element.appendChild(textNode);
    ui.appendChild(element);

    const index = new Index(ui).load();
}
