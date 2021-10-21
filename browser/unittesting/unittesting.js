// (c) 2021 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

// Unit testing module
//
// The module has the following classes.
//
// -   TestRun runs a suite of tests and displays the status and test results.
//     Actual display is handled by subclasses. Each test will be a function.
// -   TestRunConsole is a TestRun subclass that displays status and results by
//     logging to the console.
// -   TestRunWebPage is a TestRunConsole subclass that also displays status and
//     results in a web page (work in progress).
// -   TestResult records the results of a single test. TestRun creates a new
//     TestResult object for each test in the suite and passes it as a parameter
//     to the test function. TestResult has methods by which the test function
//     can assert conditions as it runs.
// -   TestAssertion records the results of a single assertion within a test.
//
// By default, TestResult throws an error that includes a stack trace when an
// assertion fails. Chrome developer tools, for example, facilitate navigating
// to the code from which an uncaught error was thrown.
//
// TOTH the exemplary Python unittest module, see
// https://docs.python.org/library/unittest.html


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

export class TestResult {
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
            this._assertions.push(new TestAssertion(
                true, messages.length === 0 ? undefined : messages));
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
            `assertTypeEqual(${left},${right},...)` +
            ` ${leftType} !== ${rightType}.`);
        return [left, right];
    }
    
    assertEqual(left, right, ...messages) {
        this.assertTruthy(left === right, ...messages,
            `assertEqual(${left},${right},...).`);
        return [left, right];
    }
    
    assertNotEqual(left, right, ...messages) {
        this.assertTypeEqual(left, right, ...messages,
            `Same types in assertNotEqual(${left},${right},...).`);
        if (this._popAssertion()) {
            this.assertTruthy(left !== right, ...messages,
                `assertNotEqual(${left},${right},...).`);
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
        return this.assertEqual(value, undefined, ...messages,
            `assertUndefined(${value})`)[0];
    }
    
    assertNotUndefined(value, ...messages) {
        this.assertTruthy(value !== undefined, ...messages,
            `assertNotUndefined(${value})`);
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
        this.assertNotUndefined(caught, ...messages, "Threw an error.");
        if (this._popAssertion()) {
            this.assertTrue(
                (errorType === undefined) || (caught instanceof errorType), 
                ...messages, `${caught} instanceof ${errorType}`
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
        this.runTestRunTests(new TestResult());

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
    showResult(name, testResult) {}

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
            const testResult = new TestResult();
            let testError;
            try {
                test(testResult);
            }
            catch(error) {
                testError = error;
            }
            this.results[name] = testResult;
            this.showResult(name, testResult);
            if (testResult.failed) {
                if (testResult.throwOnFail) {
                    this.status = `Thrown out by: ${name}`;
                    throw testResult.lastError;
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
    constructor() {
        super();

        // Default values.
        this._verbose = false;
    }

    get verbose() {return this._verbose;}
    set verbose(verbose) {this._verbose = verbose;}

    showStatus(status) {
        console.log(status);
    }

    showResult(name, testResult) {
        const texts = [
            `Test "${name}" `,
            (testResult.failed) ? "failed."
            : `assertions:${testResult.assertions.length} passed.`
        ];

        if (testResult.failed || this.verbose) {
            testResult.assertions.forEach((assertion, index) => {
                const message = assertion.joinedMessages(" ");
                if (message !== undefined) {
                    texts.push(
                        `\nAssertion ${index + 1} `
                        , assertion.passed ? "passed" : "failed"
                        , `: ${message}`
                    );
                }
            });
        }

        console.log(texts.join(""));

        if (testResult.failed || this.verbose) {
            // Use the console.log capability to generate an expandable log
            // message.
            console.log(testResult);
        }
    }
}

export class TestRunWebPage extends TestRunConsole {
    constructor(statusElement, uiElement, smallPrintElement) {
        super();

        const t = new TestResult();
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

    showResult(name, testResult) {
        super.showResult(name, testResult);

        // ToDo insert it into the web page.
    }
}