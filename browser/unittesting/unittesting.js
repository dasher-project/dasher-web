// (c) 2021 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

export class TestAssertion {
    constructor(passed, messages, error) {
        this._passed = passed;
        this._messages = messages;
        this._error = error;
    }

    get passed() {return this._passed;}
    get messages() {return this._messages;}
    get error() {return this._error;}

    joinedMessages(joiner) {
        return (
            this._messages === undefined ? undefined
            : this._messages.join(joiner)
        );
    }
}

export class TestCase {

    constructor() {
        this._assertions = [];

        // Default values.
        // Non-default values haven't been tested, oh the irony.
        this._throwOnFail = true;
        this._errorMessageJoiner = "\n";
    }

    get assertions() {return this._assertions;}

    get passed() {
        if (this._assertions.length === 0) return undefined;
        return !this.failed
    }
    get failed() {
        if (this._assertions.length === 0) return undefined;
        return this._assertions.some(assertion => !assertion.passed);
    }

    get throwOnFail() {return this._throwOnFail;}
    set throwOnFail(throwOnFail) {this._throwOnFail = throwOnFail;}

    get errorMessageJoiner() {return this._errorMessageJoiner;}
    set errorMessageJoiner(errorMessageJoiner) {
        this._errorMessageJoiner = errorMessageJoiner;
    }

    get lastError() {
        for (const index = this._assertions.length - 1; index >= 0; index--) {
            const assertion = this._assertions[index];
            if (assertion.error !== undefined) {
                return assertion.error;
            }
        }
        return undefined;
    }

    _popAssertion() {
        const lastAssertion = this._assertions.pop();
        if (lastAssertion.passed) {
            return true;
        }
        this._assertions.push(lastAssertion);
        return false;
    }

    // Rules for assert...() methods are as follows.
    //
    // -   Must call assertTruthy() at least once.
    // -   Must only add one assertion. If calling another assert...() method,
    //     must remove the assertions for any assertions that pass except one.
    //     The _popAssertion() method facilitates that.

    assertTruthy(value, ...messages) {
        if (!!value) {
            this._assertions.push(new TestAssertion(true));
            return value;
        }
    
        // Create an Error instance to get a stack trace.
        const error = new Error(messages.join(this.errorMessageJoiner));
        this._assertions.push(new TestAssertion(false, messages, error));

        if (this._throwOnFail) {
            throw error;
        }
        return value;
    }
    
    assertTypeEqual(left, right, ...messages) {
        const leftType = typeof(left);
        const rightType = typeof(right);
        this.assertTruthy(leftType === rightType, ...messages,
            `Different types in assertTypeEqual(${left},${right},...)` +
            ` ${leftType} !== ${rightType}.`);
        return [left, right];
    }
    
    assertEqual(left, right, ...messages) {
        this.assertTruthy(left === right, ...messages,
            `Different values in assertEqual(${left},${right},...).`);
        return [left, right];
    }
    
    assertNotEqual(left, right, ...messages) {
        this.assertTypeEqual(left, right, ...messages,
            `Different types in assertNotEqual(${left},${right},...).`);
        if (this._popAssertion()) {
            this.assertTruthy(left !== right, ...messages,
                `Equal values in assertNotEqual(${left},${right},...).`);
        }
        return [left, right];
    }
    
    assertFalse(value, ...messages) {
        return this.assertEqual(value, false, ...messages)[0];
    }
    
    assertTrue(value, ...messages) {
        return this.assertEqual(value, true, ...messages)[0];
    }
    
    assertUndefined(value, ...messages) {
        return this.assertEqual(value, undefined, ...messages)[0];
    }
    
    assertNotUndefined(value, ...messages) {
        this.assertTruthy(value !== undefined, ...messages);
        return value;
    }
    
    assertThrows(function_, errorType, ...messages) {
        let return_;
        let caught;
        try {
            return_ = function_();
            caught = undefined;
        }
        catch (error) {
            caught = error;
        }
        this.assertNotUndefined(caught, ...messages, "Didn't throw.");
        if (this._popAssertion()) {
            this.assertTrue(
                (errorType === undefined) || (caught instanceof errorType), 
                ...messages, `${caught} isn't instanceof ${errorType}`
            );
        }
    }
    
    assertTypeError(function_, ...messages) {
        return this.assertThrows(function_, TypeError, ...messages);
    }
}

export class TestRun {
    constructor() {
        this._results = {};
        this.status = "TestRun tests";
        this.runTestRunTests(new TestCase());

        // Default values.
        this._stopOnFail = true;

        this.status = "Ready"
    }

    get stopOnFail() {return this._stopOnFail;}
    set stopOnFail(stopOnFail) {this._stopOnFail = stopOnFail;}

    get status() {return this._status;}
    set status(status) {
        this.showStatus(status);
        this._status = status;
    }
    // showStatus() can be overridden in a subclass.
    showStatus(status) {}

    get results() {return this._results;}
    // showResult() can be overridden in a subclass.
    showResult(name, testCase) {}

    // Somebody might decide to rewrite the above as properties whose handling
    // can be overridden in a subclass. They might find useful the following SO
    // about getter and setter inheritance:
    // https://stackoverflow.com/a/34456245/7657675

    runTestRunTests(t) {
        let caught = false;
        try {
            t.assertTruthy(false, "runTestRunTests dummy assertion.");
        }
        catch {
            caught = true;
        }
        t.assertTruthy(caught, "runTestRunTests didn't catch.")
    }

    run(tests) {
        this.status = "Running ...";
        const testEntries = Object.entries(tests);
        this.status = `Running tests: ${testEntries.length}`
        let stopped = false;
        for (const [name, test] of testEntries) {
            const testCase = new TestCase();
            let testError;
            try {
                test(testCase);
            }
            catch(error) {
                testError = error;
            }
            this.results[name] = testCase;
            this.showResult(name, testCase);
            if (testCase.failed) {
                if (testCase.throwOnFail) {
                    this.status = `Thrown out by: ${name}`;
                    throw testCase.lastError;
                }
                if (this.stopOnFail) {
                    stopped = true;
                    break;
                }
            }
            else {
                if (testError !== undefined) {
                    // If the code reaches this point then the test case says it
                    // passed but also threw an error. That seems like a bug in
                    // the test case code. Rethrow the error out of the unit
                    // test framework.
                    this.status = `Apparent error in test: ${name}`;
                    throw testError;
                }
            }
        }
        this.status = stopped ? "Stopped" : "Finished";
    }
}

export class TestRunConsole extends TestRun {
    showStatus(status) {
        console.log(status);
    }

    showResult(name, testCase) {
        if (testCase.passed) {
            console.log(
                `Test "${name}" assertions:${testCase.assertions.length}`
                + " passed.");
        }
        else {
            console.log(`Test "${name}" failed.`);
            testCase.assertions.forEach((assertion, index) => {
                const message = assertion.joinedMessages("\n");
                if (message !== undefined) {
                    console.log(`Assertion ${index + 1}: ${message}`);
                }
            });
            console.log(testCase);
        }
    }
}

export class TestRunWebPage extends TestRunConsole {
    constructor(statusElement, uiElement, smallPrintElement) {
        super();

        const t = new TestCase();
        t.assertNotUndefined(statusElement);
        t.assertNotUndefined(uiElement);
        t.assertNotUndefined(smallPrintElement);

        this._statusElement = statusElement;
    }

    showStatus(status) {
        super.showStatus(status);

        // Status can be shown from the super() constructor, which runs before
        // the status element has been set.
        if (this._statusElement) this._statusElement.textContent = status;
    }

    showResult(name, testCase) {
        super.showResult(name, testCase);

        // ToDo insert it into the web page.
    }
}