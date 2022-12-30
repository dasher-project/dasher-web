// (c) 2022 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

import { Result } from "./result.js";

export class Base {
    #status;
    #resultRoot;

    constructor() {
        this.#resultRoot = new Result();
    }

    get status() {return this.#status;}
    set status(status) {
        this.showStatus(status);
        this.#status = status;
    }

    // Somebody might decide to rewrite the above as properties whose handling
    // can be overridden in a subclass. They might find useful the following SO
    // about getter and setter inheritance:
    // https://stackoverflow.com/a/34456245/7657675

    showStatus(newStatus) {
        throw new TypeError("showStatus() must be implemented in subclass.");
    }
    showAssertion(assertion, pathMessages) {
        throw new TypeError("showAssertion() must be implemented in subclass.");
    }

    #showAssertionTree(result, pathMessages) {
        this.showAssertion(result, pathMessages);
        if (result.assertions == undefined) return;
        const messages = pathMessages.slice();
        messages.push(...result.messages);
        for(let index = 0; index < result.assertions.length; index += 1) {
            messages.push(index);
            this.#showAssertionTree(result.assertions[index], messages);
            messages.pop();
        }
    }

    run(...testFunctions) {
        for(const testFunction of testFunctions) {
            this.status = "Start " + testFunction.name;
            try {
                this.#resultRoot.sub(testFunction);
            }
            catch (error) {
                if (this.#resultRoot.failed) {
                    this.status = "Stopped " + testFunction.name;
                    break;
                }
                // If the code reaches this point then the test function threw
                // an error but the result isn't a fail. Seems like a bug in the
                // test code, so re-throw.
                throw error;
            }
            this.status = "Finish " + testFunction.name;
        }

        this.#showAssertionTree(this.#resultRoot, []);
    }
}

const numberType = typeof(0);
const stringType = typeof("");

export class Console extends Base {
    showStatus(newStatus) { console.log(newStatus); }

    #printMessages(messages) {
        if (messages.length <= 0) return "";
        const printMessage = [];
        for(const message of messages) {
            if (typeof(message) === numberType) {
                printMessage.push(`[${message}]`);
            }
            else {
                const str = (
                    typeof(message) === stringType
                    ? message : message.toString() );
                if (/\s/.test(str)) {
                    printMessage.push('"', str, '"');
                }
                else {
                    if (printMessage.length > 0) printMessage.push(".");
                    printMessage.push(str);
                }
            }
        }
        printMessage.push(" ");
        return printMessage.join("");
    }

    showAssertion(assertion, pathMessages) {
        if (assertion.failed || pathMessages.length <= 3) console.log(
            this.#printMessages(pathMessages).concat(
                this.#printMessages(assertion.messages)
                , assertion.passed === undefined ? "Pass-fail undefined"
                : assertion.passed ? "Passed" : "Failed"
                , "."));
    }
}
