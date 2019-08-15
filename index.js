// (c) 2018 Jim Hawkins. MIT licensed, see https://opensource.org/licenses/MIT

class Index {
    constructor(parent) {
        this._parent = parent;
        this._characters = "abcdefghijklmnopqrstuvwxyz".split("");
    }

    _create(
        tag, attributes, text, parent, nameSpace='http://www.w3.org/2000/svg'
    ) {
        const element = document.createElementNS(nameSpace, tag);
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
    _createHTML(tag, attributes, text, parent) {
        return this._create(
            tag, attributes, text,
            parent === undefined ? this._parent : parent,
            'http://www.w3.org/1999/xhtml'
        );
    }

    load() {
        const div = this._createHTML('div');
        const xTextNode = this._createHTML('span', {}, "X", div).firstChild;
        this._createHTML('span', {}, ",", div);
        const yTextNode = this._createHTML('span', {}, "Y", div).firstChild;
        const setXY = (x, y) => {
            xTextNode.nodeValue = x.toFixed().toString();
            yTextNode.nodeValue = y.toFixed().toString();
        }

        const rectHeight = 30;
        const svgHeight = rectHeight * this._characters.length;
        this._createHTML('span', {}, ` ${svgHeight}`, div);
        this._svg = this._create(
            'svg', {
                viewBox:
                    `${svgHeight * -0.5} ${svgHeight * -0.5}` +
                    ` ${svgHeight} ${svgHeight}`,
                height:svgHeight}, undefined, this._parent
        );
        this._create('line', {
            x1:"0", y1:"-50%", x2:"0", y2:"50%",
            stroke:"black", "stroke-width":"1px"
        });
        this._create('line', {
            x1:"-50%", y1:"0", x2:"50%", y2:"0",
            stroke:"black", "stroke-width":"1px"
        });

        // Next bit of code is in a timeout to ensure that the browswer can
        // render the svg before it is called.
        setTimeout(() => {
            const bbox = this._svg.getBoundingClientRect();
            this._createHTML(
                'span', {},
                ` bbox:(${bbox.x}, ${bbox.y}, ${bbox.width}, ${bbox.height})`,
                div
            );

            const pointerLine = this._create('line', {
                x1:"0", y1:"0", x2:"0", y2:"0",
                stroke:"red", "stroke-width":"1px"
            });
    
            const xAdjust = -1 * (bbox.x + (bbox.width * 0.5));
            const yAdjust = bbox.y + (bbox.height * 0.5);
            this._svg.addEventListener('pointermove', (event) => {
                const x = xAdjust + event.clientX;
                const y = yAdjust - event.clientY;
                pointerLine.setAttribute('x2', x.toString());
                pointerLine.setAttribute('y2', (-1 * y).toString());
                setXY(x, y);
            }, {capture:true});
        
        }, 0);

        let yPosition = -0.5 * svgHeight;
        for(const [index, character] of this._characters.entries()) {
            this._create('rect', {
                x:5, y:yPosition, width:rectHeight, height:rectHeight,
                fill:(index % 2 === 0 ? "lightgray" : "lightblue")
            });
            this._create('text', {
                x:10, y:yPosition + rectHeight / 2.0, fill:"black"
            }, character );
            yPosition += rectHeight;
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
