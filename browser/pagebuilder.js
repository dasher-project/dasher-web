// Copyright 2019 VMware, Inc.  
// SPDX-License-Identifier: BSD-2-Clause


/*

** DON'T EDIT THIS COPY. **

This is a copy of a file from the Captive Web View project.  
It's like way easier to get the browser to load the copy from here.  
The original is included by the captive-web-view sub-module, see also:  
https://github.com/vmware/captive-web-view/tree/master/forAndroid/captivewebview/src/main/assets/library

*/


export default class PageBuilder {
    constructor(nodeOrTag, ...addNodeParameters) {
        if (typeof(nodeOrTag) === typeof("")) {
            this._node = PageBuilder.add_node(nodeOrTag, ...addNodeParameters);
        }
        else {
            this._node = nodeOrTag;
        }
    }

    get node() {
        return this._node;
    }

    static add_node(tag, text, parent, append) {
        const textNode = (text === undefined ? undefined
                          : document.createTextNode(text));
        const element = tag ? document.createElement(tag) : undefined;
        if (element && textNode) {
            element.appendChild(textNode);
        }
        
        return PageBuilder.into(parent, element ? element : textNode, append);
    }
    add_node(tag, text, append) {
        return PageBuilder.add_node(tag, text, this.node, append);
    }
    
    static into(parent, child, append) {
        if (parent && child) {
            if (append === undefined || append) {
                parent.appendChild(child);
            }
            else {
                parent.insertBefore(child, parent.firstChild);
            }
        }
        return child;
    }
    into(child, append) {
        return PageBuilder.into(this.node, child, append);
    }
    
    static add_button(text, parent, append) {
        const button = PageBuilder.add_node('button', text, parent, append);
        button.type = 'button';
        button.classList.add('cwv-button');
        button.addEventListener(
            'mousedown', () => button.classList.add('cwv-button_down'));
        button.addEventListener(
            'mouseup', () => button.classList.remove('cwv-button_down'));
        // Chrome logs a warning if touch event handlers aren't marked as
        // 'passive'.
        button.addEventListener(
            'touchstart', () => button.classList.add('cwv-button_down'),
            {'passive': true});
        button.addEventListener(
            'touchend', () => button.classList.remove('cwv-button_down'),
            {'passive': true});
        return button;
    }
    add_button(text, append) {
        return PageBuilder.add_button(text, this.node, append);
    }
    
    static prevent_focus(node) {
        node.addEventListener("mousedown", (event) => {
            // Some or all of the next three lines prevent focus from moving to
            // the node when it is clicked or tapped.
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
        });
    }
    prevent_focus() {
        PageBuilder.prevent_focus(this.node);
    }
    
    static add_progress(parent, append, ...styles) {
        const child = new CaptiveProgress(parent, append, ...styles);
        return child;
    }
    add_progress(append, ...styles) {
        return PageBuilder.add_progress(this.node, append, ...styles);
    }
    
    static add_input(identifier, label, parent, append, inputType) {
        const child = new CaptiveInput(identifier, label);
        if (inputType !== undefined) {
            child.inputType = inputType;
        }
        PageBuilder.into(parent, child.node, append);
        return child;
    }
    add_input(identifier, label, append, inputType) {
        return PageBuilder.add_input(
            identifier, label, this.node, append, inputType);
    }
    
    static add_anchor(href, text, parent, append) {
        const anchor = PageBuilder.add_node('a', text);
        anchor.setAttribute('href', href);
        anchor.classList.add('cwv-anchor');
        PageBuilder.into(parent, anchor, append);
        return anchor;
    }
    add_anchor(href, text, append) {
        return PageBuilder.add_anchor(href, text, this.node, append);
    }
    
    static add_css_file(filename) {
        const node = document.createElement('link');
        node.href = filename;
        node.rel = "stylesheet";
        document.head.appendChild(node);
        return node;
    }
    
    static add_transcript(parent, asFieldSet, append) {
        const child = new Transcript(asFieldSet);
        PageBuilder.into(parent, child.node, append);
        return child;
    }
    add_transcript(asFieldSet, append) {
        return PageBuilder.add_transcript(this.node, asFieldSet, append);
    }

    static remove_childs(parent, beforeChild) {
        let child = parent.firstChild;
        if (beforeChild === undefined) {
            beforeChild = null;
        }
        while(child !== beforeChild ) {
            parent.removeChild(child);
            child = parent.firstChild;
        }
    }

    remove_childs(beforeChild) {
        return PageBuilder.remove_childs(this.node, beforeChild);
    }

    static add_classes(element, ...classNames) {
        element.classList.add(...classNames);
        return element;
    }
    add_classes(...classNames) {
        PageBuilder.add_classes(this.node, ...classNames);
        return this;
    }
    
    remove() {
        this.node.parentNode.removeChild(this.node);
    }

    sum_CSS_properties(...cssProperties) {
        const computed = window.getComputedStyle(this.node);
        return cssProperties.reduce(
            (accumulated, cssProperty) => accumulated + parseFloat(
                computed.getPropertyValue(cssProperty)
            ), 0.0);
    }
}

class Transcript extends PageBuilder {
    constructor(asFieldSet) {
        super(PageBuilder.add_classes(
            document.createElement(
                asFieldSet ? 'fieldset' : 'div'), 'cwv-transcript'));
        const title = this.add_node(asFieldSet ? 'legend': 'h3');
        title.classList.add('cwv-transcript__title');
        title.append("Log");
            
        // this.add_node('h3', "Transcript", this.node)
        // .classList.add('cwv-transcript__title');

        const buttonClear = this.add_button("Clear");
        buttonClear.classList.add('cwv-transcript__clear');

        // this._log = new PageBuilder('div', undefined, this.node);
        this._log = this.add_node('div');
        this._log.classList.add('cwv-transcript__log');

        buttonClear.onclick = () => PageBuilder.remove_childs(this._log);
    }

    add(line, tag='div') {
        const div = document.createElement(tag);
        div.classList.add('cwv-transcript__log_line');
        div.append(line);
        this._log.append(div);
        return div;
    }
}

class CaptiveInput extends PageBuilder {
    constructor(identifier, label) {
        super(PageBuilder.add_classes(
            document.createElement('div'), 'cwv-input'));

        this._labelNode = PageBuilder.add_classes(
            this.add_node('label', label), 'cwv-input__label');

        this._inputNode = PageBuilder.add_classes(
            this.add_node('input'), 'cwv-input__input');
        this._inputNode.setAttribute('id', identifier);
        this._inputNode.setAttribute('type', 'text');
        this._inputNode.setAttribute('autocomplete', 'off');
        this._inputNode.setAttribute('size', 15);
        
        this._labelNode.setAttribute('for', identifier);
    }
    
    get inputNode() {
        return this._inputNode;
    }
    
    get inputType() {
        return this._inputNode.getAttribute('type');
    }
    set inputType(inputType) {
        return this._inputNode.setAttribute('type', inputType);
    }
    
    get value() {
        return this._inputNode.value;
    }
    set value(value) {
        this._inputNode.value = String(value);
    }
}


class CaptiveProgress extends PageBuilder {
    constructor(parent, append) {
        super('div', undefined, parent, append);
        this.node.style.padding = 0;
        this.node.style.margin = 0;
        // Style the whole progress bar as a __step element, until a value has
        // been set. 
        this.node.classList.add('cwv-progress', 'cwv-progress__step');

        this._steps = [];
        this._value = undefined;
        this._oldValue = undefined;

        // ToDo: Make it configurable, or read it from the style.
        this._transitionMillis = 300;
        this._transitionTimeOut = null;
    }

    get value() {
        return this._value;
    }
    set value(newValue) {
        // Should be an array but a single number or string can also be passed.
        // Next code first turns the new value into an array, then forces each
        // element to be a float.
        this._value = (
            newValue.keys === undefined ? [newValue] : newValue
        ).map(arrayValue => parseFloat(arrayValue));
        const stepsChange = (this._value.length !== this._steps.length);
        // console.log(
        //     'vanilla setter', stepsChange, newValue.length, this._value.length,
        //     this._steps.length);

        // Style the whole progress bar as a __step if the value is empty.
        this.node.classList.toggle(
            'cwv-progress__step', this._value.length === 0);

        if (stepsChange) {
            while (this._value.length > this._steps.length) {
                const step = new PageBuilder(this.add_node('div'));
                step.node.classList.add('cwv-progress__step');
                Object.assign(step.node.style, {
                    display: 'inline-block', position: 'relative'});

                const span = step.add_node('span');
                Object.assign(span.style, {
                    padding: '0px', top: '0px', bottom: '0px', left: '0px',
                    position: 'absolute', width: '0px'
                })
                // The width of this element will be set to a calc() value to
                // show progress.

                this._steps.push(step);
            }

            // Could delete excess steps here but that mightn't be what's
            // required. It's kind of nice to allow a short array to be passed
            // in and it only sets the specified steps.

            const widthPercent = 100.0 / parseFloat(this._steps.length);
            // The following processing seems to require that the HTML has been
            // rendered to some extent, so it's in a timeout.
            setTimeout(() => this._steps.forEach(step => {
                const unavailableWidth = step.sum_CSS_properties(
                    'border-left-width', 'border-right-width',
                    'margin-left', 'margin-right');
                step.node.style.width = 
                    `calc(${widthPercent}% - ${unavailableWidth}px)`;
                const unavailableHeight = step.sum_CSS_properties(
                    'border-top-width', 'border-bottom-width',
                    'margin-top', 'margin-bottom');
                step.node.style.height = `calc(100% - ${unavailableHeight}px)`;
            }), 0);
        }

        // If a value application is already scheduled, it will pick up whatever
        // has just changed. If not, kick off a new one now.
        if (this._transitionTimeOut === null) {
            this._apply_values();
        }
    }

    _apply_values() {
        if (this._oldValue === undefined) {
            this._oldValue = [];
        }
        const difference = this._value.length - this._oldValue.length;
        //
        // Next line will truncate the old value array, if it is longer than the
        // new value.
        this._oldValue.splice(difference, difference * -1);
        let applyIndex = -1;
        if (this._oldValue.length < this._value.length) {
            // New value array is longer. Append one placeholder, and flag it as
            // the index to be applied.
            applyIndex = this._oldValue.length
            this._oldValue.push(null);
        }
        else {
            applyIndex = this._value.findIndex((value, index) => 
                value > this._oldValue[index]);
            if (applyIndex < 0) {
                // There doesn't seem to be a findIndex that starts from the
                // end, so do that long hand in a for loop.
                applyIndex = this._value.length - 1;
                for(;applyIndex >= 0; applyIndex--) {
                    if (this._value[applyIndex] < this._oldValue[applyIndex]) {
                        break;
                    }
                }
            }
        }
        if (applyIndex < 0) {
            // No value has changed, so no changes to apply.
            this._transitionTimeOut = null;
            return;
        }
        //
        // Otherwise at least one change was found. Apply it and go again after
        // a time out.
        this._steps[applyIndex].node.firstChild.style.width =
            `calc(${this._value[applyIndex]}%)`;
        this._oldValue[applyIndex] = this._value[applyIndex];
        this._transitionTimeOut =
            setTimeout(this._apply_values.bind(this), this._transitionMillis);
    }
    
    get valueSum() {
        return this._value.reduce((accumulated, value) => accumulated + value);
    }

    get stepSpans() {
        return this._steps.map(step => step.node.firstChild);
    }

    set_step_colour(colour) {
        this.stepSpans.forEach(span => {
            span.style['background-color'] = colour;
        });
    }
}

PageBuilder.add_css_file("pagebuilder.css");
