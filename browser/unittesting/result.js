// (c) 2022 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

import {Assertion, nameMessage} from './assert.js'

export class Result extends Assertion {
    #assertions;
    throwOnFail = true;

    constructor(...messages) {
        super(undefined, undefined, ...messages);
        this.#assertions = [];
    }

    // If there are no assertions then this result is undefined.  
    // If any assertion is already a fail then this result is a fail.  
    // Otherwise, if any assertion is undefined the this result is undefined.  
    // Otherwise, this result is a pass.
    get failed() {
        let failed = undefined;
        for(const assertion of this.#assertions) {
            if (assertion.failed === true) return true;
            if (assertion.failed === undefined) {
                failed = undefined;
            }
            else {
                if (failed === undefined) failed = false;
            }
        }
        return failed;
    }

    get passed() {
        const failed = this.failed;
        return (failed === undefined) ? undefined : !failed;
    }

    get value() {
        const value = this.add.bind(this);
        value.sub = this.sub.bind(this);
        return value;
    }

    get assertions() { return this.#assertions.slice(); }

    add(AssertionClass, ...parameters) {
        const assertion = new AssertionClass(...parameters);
        this.#assertions.push(assertion);

        // Next statement relies on undefined being falsey.
        if (this.throwOnFail && assertion.failed) throw assertion;

        return assertion.value;
    }

    sub(testFunction, ...messages) {
        return testFunction(
            this.add(Result, ...messages, nameMessage(testFunction)));
    }
}
