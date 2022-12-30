// (c) 2022 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

// Unit testing module

export function nameMessage(named) {
    const nameMax = 40;
    const nameOmission = "...";

    const nameStub = (nameMax - nameOmission.length) / 2;
    const nameStart = Math.ceil(nameStub);
    const nameEnd = 0 - Math.floor(nameStub);
    
    const name = named.name;
    if (name !== undefined && name.length > 0) return name;

    const str = named.toString().replace( /\s+/g, " " );
    if (str.length <= nameMax) return str;
    return str.slice(0, nameStart).concat(nameOmission, str.slice(nameEnd));
}

export class Assertion extends Error {
    #passed;
    #value;
    #messages;

    constructor(passed, value, ...messages) {
        super(messages === undefined ? messages : messages.join("\n"));
        // .map(reason =>
        //     reason.name === undefined ? ("" + reason) : reason.name
        //     ).join("\n") );

        this.#passed = passed;
        this.#value = value;
        this.#messages = (messages === undefined ? [] : messages.slice());
    }

    get failed() {
        return this.#passed === undefined ? undefined : !this.#passed;
    }
    get passed() {return this.#passed;}
    get value() {return this.#value;}
    get messages() {return this.#messages.slice();}
}

export class Equal extends Assertion {constructor(left, right, ...messages) {
    super(
        left === right, [left, right], ...messages, `Equal(${left},${right},)`);
} }

export class NotEqual extends Assertion {constructor(left, right, ...messages) {
    super(left !== right, [left, right],
        ...messages, `NotEqual(${left},${right},)`);
} }

export class Instance extends Assertion {constructor(obj, cls, ...messages) {
    super(obj instanceof cls, [obj, cls],
        ...messages, `Instance(${obj},${nameMessage(cls)},)`);
} }

export class Undefined extends Assertion {constructor(value, ...messages) { 
    super(value === undefined, value, ...messages, `Undefined(${value},)`);
} }

export class NotUndefined extends Assertion {constructor(value, ...messages) { 
    super(value !== undefined, value, ...messages, `NotUndefined(${value},)`);
} }

export class Throw extends Assertion {
    constructor(throwFunction, ...messages) {
        let caught;
        try {
            throwFunction();
            caught = null;
        }
        catch (error) {
            caught = error;
        }
        super(caught !== null, caught,
            ...messages, `Throw(${nameMessage(throwFunction)},)`);
    }
}
