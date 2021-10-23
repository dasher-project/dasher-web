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
//     TestAssertion is an Error subclass so that it can be thrown and so that
//     it can store a stack trace.
//
// By default, TestResult throws an error that includes a stack trace when an
// assertion fails. Chrome developer tools, for example, facilitate navigating
// to the code from which an uncaught error was thrown.
//
// TOTH the exemplary Python unittest module, see
// https://docs.python.org/library/unittest.html

const defaultErrorMessageJoiner = "\n";

export class TestAssertion extends Error {
    constructor(passed, messages, ...parameters) {
        if (messages === undefined) {
            super(...parameters);
            this._messages = undefined;
        }
        else {
            super(messages.join(defaultErrorMessageJoiner), ...parameters);
            this._messages = messages.slice();
        }

        this._passed = passed;

        // Default values.
        // Non-default values haven't been tested, oh the irony.
        this._errorMessageJoiner = defaultErrorMessageJoiner;
    }

    get passed() {return this._passed;}
    set passed(passed) {this._passed = passed;}

    get messages() {return this._messages;}
    set messages(messages) {
        this._messages = (
            messages === undefined ? undefined : messages.slice());
        this._set_message();
    }
    _set_message() {
        this.message = (
            this.messages === undefined ? ""
            : this.messages.join(this.errorMessageJoiner)
        );
    }

    get errorMessageJoiner() {return this._errorMessageJoiner;}
    set errorMessageJoiner(errorMessageJoiner) {
        this._errorMessageJoiner = errorMessageJoiner;
        this._set_message();
    }

    assertTypeEqual(left, right, ...messages) {
        const leftType = typeof(left);
        const rightType = typeof(right);
        this.passed = (leftType === rightType);
        this.messages = [...messages
            , `assertTypeEqual(${left},${right},...)` +
            ` ${leftType} === ${rightType}.`
        ];
        return this;
    }

    assertInstanceOf(left, right, ...messages) {
        this.passed = (left instanceof right);
        this.messages = [
            ...messages,
            `assertInstanceOf(${left},${right},...)` +
            ` ${left} instanceof ${right.name}.`
        ];
        return this;
    }

    assertTrue(value, ...messages) {
        this.passed = (value === true);
        this.messages = [...messages, `assertTrue(${value},...)`];
        return this;
    }

    assertFalse(value, ...messages) {
        this.passed = (value === false);
        this.messages = [...messages, `assertFalse(${value},...)`];
        return this;
    }

    assertUndefined(value, ...messages) {
        this.passed = (value === undefined);
        this.messages = [...messages, `assertUndefined(${value},...)`];
        return this;
    }

    assertNotUndefined(value, ...messages) {
        this.passed = (value !== undefined);
        this.messages = [...messages, `assertNotUndefined(${value},...)`];
        return this;
    }

    assertComparable(left, right, ...messages) {
        this.assertTypeEqual(left, right, ...messages,
            "assertComparable requires assertTypeEqual.");
        if (!this.passed) return this;

        this.passed = (left === right || left < right || left > right);
        this.messages = [...messages,
            `assertComparable(${left},${right},...)`
            + " at least one must be true: equal, greater than, less than."];
        return this;
    }

    assertEqual(left, right, ...messages) {
        this.assertComparable(left, right, ...messages,
            "assertEqual requires assertComparable.");
        if (!this.passed) return this;

        this.passed = (left === right);
        this.messages = [...messages, `assertEqual(${left},${right},...).`];
        return this;
    }

    assertNotEqual(left, right, ...messages) {
        this.assertComparable(left, right, ...messages,
            "assertNotEqual requires assertComparable.");
        if (!this.passed) return this;

        this.passed = (left !== right);
        this.messages = [...messages, `assertNotEqual(${left},${right},...).`];
        return this;
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
        if ((!this.passed) || (errorType === undefined)) {
            return [this, return_];
        }

        return [this.assertInstanceOf(
            caught, errorType, ...messages, "Threw expected error type."
        ), return_];
    }

    assertEqualArrays(left, right, ...messages) {
        this.assertEqual(left.length, right.length, ...messages,
            "assertEqualArrays same length.");
        if (!this.passed) {
            return this;
        }

        for(let index=0; index < left.length; index++) {
            this.assertEqual(
                left[index], right[index],
                ...messages, `assertEqualArrays [${index}].`);
            if (!this.passed) return this;
        }

        this.messages = [
            ...messages, `assertEqualArrays(${left},${right},...).`
        ];
        return this;

        // Zero-length arrays will be handled OK. The assertion of same length
        // will pass; the for loop will be skipped leaving the passed result
        // intact.
    }

    assertCompareArrays(comparator, left, right, ...messages) {
        this.assertEqual(left.length, right.length, ...messages,
            "assertCompareArrays same length.");
        if (!this.passed) {
            return this;
        }

        for(let index=0; index < left.length; index++) {
            this.assertTrue(
                comparator(left[index], right[index], index),
                ...messages, `assertCompareArrays [${index}].`);
            if (!this.passed) return this;
        }

        this.messages = [
            ...messages, `assertCompareArrays(${left},${right},...).`
        ];
        return this;

        // Zero-length arrays will be handled OK same as they are by the
        // assertEqualArrays() method, above.
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

    get lastFail() {
        for (let index = this._assertions.length - 1; index >= 0; index--) {
            const assertion = this._assertions[index];
            if (!assertion.passed) return assertion;
        }
        return undefined;
    }

    // Rules for assert...() methods are as follows.
    //
    // -   Must create a new TestAssertion instance, in order to generate a
    //     stack trace even if the assertion passes. The new TestAssertion()
    //     call should be on the best line to which navigation should be
    //     facilitated.
    // -   Must call an assert...() method on the new instance.
    // -   Must push exactly one TestAssertion instance onto the _assertions
    //     array.
    // -   Must throw a TestAssertion if an assertion fails.
    //
    // The push and throw requirement can be met by calling
    // this._resultAssertion() for example.

    _resultAssertion(assertion) {
        this._assertions.push(assertion);
        if (this.throwOnFail && !assertion.passed) {
            throw assertion;
        }
        return assertion;
    }

    assertTypeEqual(left, right, ...messages) {
        this._resultAssertion(
            new TestAssertion().assertTypeEqual(left, right, ...messages));
        return [left, right];
    }

    assertInstanceOf(left, right, ...messages) {
        this._resultAssertion(
            new TestAssertion().assertInstanceOf(left, right, ...messages));
        return [left, right];
    }

    assertComparable(left, right, ...messages) {
        this._resultAssertion(
            new TestAssertion().assertComparable(left, right, ...messages));
        return [left, right];
    }
    
    assertEqual(left, right, ...messages) {
        this._resultAssertion(
            new TestAssertion().assertEqual(left, right, ...messages));
        return [left, right];
    }

    assertNotEqual(left, right, ...messages) {
        this._resultAssertion(
            new TestAssertion().assertNotEqual(left, right, ...messages));
        return [left, right];
    }

    assertTrue(value, ...messages) {
        this._resultAssertion(
            new TestAssertion().assertTrue(value, ...messages));
        return value;
    }

    assertFalse(value, ...messages) {
        this._resultAssertion(
            new TestAssertion().assertFalse(value, ...messages));
        return value;
    }

    assertUndefined(value, ...messages) {
        this._resultAssertion(
            new TestAssertion().assertUndefined(value, ...messages));
        return value;
    }

    assertNotUndefined(value, ...messages) {
        this._resultAssertion(
            new TestAssertion().assertNotUndefined(value, ...messages));
        return value;
    }

    assertThrows(function_, errorType, ...messages) {
        const [assertion, return_] = new TestAssertion().assertThrows(
            function_, errorType, ...messages);
        this._resultAssertion(assertion);
        return return_;
    }

    assertTypeError(function_, ...messages) {
        const [assertion, return_] = new TestAssertion().assertThrows(
            function_, TypeError, ...messages);
        this._resultAssertion(assertion);
        return return_;
    }

    assertEqualArrays(left, right, ...messages) {
        this._resultAssertion(
            new TestAssertion().assertEqualArrays(left, right, ...messages));
        return [left, right];
    }

    assertCompareArrays(comparator, left, right, ...messages) {
        this._resultAssertion(
            new TestAssertion().assertCompareArrays(
                comparator, left, right, ...messages));
        return [left, right];
    }
}

export class TestRun {
    constructor() {
        this._results = {};
        this.status = "Self testing";
        this.runSelfTests();

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

    runSelfTests() {
        // Run tests on the framework itself, using its own functionality.
        // Create two TestResult objects so that one can make assertions about
        // the other. Any test failures here will throw.
        const t1 = new TestResult();
        const t2 = new TestResult();

        t2.assertEqual("Self testing", this.status, "runSelfTests: status.");

        t2.assertUndefined(t1.lastFail,
            "runSelfTests: No fails before any assertions.");
        t2.assertUndefined(t1.passed,
            "runSelfTests: Passed undefined before any assertions.");
        t2.assertUndefined(t1.failed,
            "runSelfTests: Failed undefined before any assertions.");
        t2.assertTrue(t2.passed,
            "runSelfTests: Passed OK after three assertions");
        t2.assertFalse(t2.failed,
            "runSelfTests: Didn't fail after three assertions");

        t1.assertTypeEqual(2, 3, "runSelfTests: assertTypeEqual.");
        t1.assertInstanceOf(
            t1, TestResult, "runSelfTests: assertInstanceOf.");

        t2.assertUndefined(t1.lastFail,
            "runSelfTests: No fails if all assertions have passed.");

        const assertionCount = t2.assertions.length;
        t2.assertThrows(
            // The assertFalse here will fail and throw.
            () => t1.assertFalse(true, "runSelfTests: Deliberate fail."),
            TestAssertion
        );
        t2.assertEqual(
            assertionCount + 1, t2.assertions.length,
            "runSelfTests: assertThrows adds one assertion.");
        t2.assertNotUndefined(t1.lastFail,
            "runSelfTests: Failed assertion after assertFalse dummy.");

        t1.assertComparable(1, 4, "runSelfTests: assertComparable numbers.");
        t2.assertThrows(
            () => t1.assertComparable("1", 4,
                "runSelfTests: Deliberate fail assertComparable."),
            TestAssertion
        );

        // Nested assertThrows. The inner should fail and throw a TestAssertion,
        // because its function doesn't throw. The outer should catch it and
        // pass.
        t2.assertThrows(
            () => {
                t2.assertThrows(
                    () => { let noOperation; },
                    undefined,
                    "runSelfTests: Deliberate lack of throw."
                );
            },
            TestAssertion,
            "runSelfTests: inner assertThrows fail caught by outer."
        );

        t1.assertThrows(
            () => { let undefined_; const length = undefined_.length; },
            undefined,
            "runSelfTests: assertThrows with undefined error type."
        );
        t1.assertTypeError(
            () => { let undefined_; const length = undefined_.length; },
            "runSelfTests: undefined.length TypeError."
        );

        t1.assertThrows(
            () => t1.assertNotEqual(
                "2", 2,
                "runSelfTests: Deliberate fail different types inequality."
            ),
            TestAssertion
        );

        t1.assertNotEqual(3, 2, "runSelfTests: assertNotEqual.");
        t1.assertEqual(3, 3, "runSelfTests: assertEqual.");

        t1.assertThrows(
            () => t1.assertEqual(
                "2", 2,
                "runSelfTests: Deliberate fail different types equality."
            ),
            TestAssertion
        );

        t1.assertEqualArrays([], [], "runSelfTests: assertEqualArrays empty.")
        const leftNumbers = [1, 2];
        const rightNumbers = [1, 0];
        t2.assertThrows(
            () => t1.assertEqualArrays(leftNumbers, rightNumbers),
            TestAssertion,
            "runSelfTests: Deliberate fail assertEqualArrays unequal numbers."
        );
        rightNumbers[1] = leftNumbers[1];
        t1.assertEqualArrays(leftNumbers, rightNumbers,
            "runSelfTests: assertEqualArrays numbers.");

        t1.assertCompareArrays(undefined, [], [],
            "runSelfTests: assertCompareArrays empty.")

        class Instance {
            constructor(a, b, c) { this.a = a; this.b = b; this.c = c;}
        }
        const leftInstances = [
            new Instance(1, 2, 3), new Instance(4, 5, 6)];
        const rightInstances = [
            new Instance(1, 2, 4), new Instance(4, 5)];

        t2.assertThrows(
            () => t1.assertComparable(leftInstances[0], rightInstances[0],
                "runSelfTests: assertComparable deliberate fail"
                + " for instances."
            ),
            TestAssertion
        );
        t2.assertThrows(
            () => t1.assertNotEqual(leftInstances[0], rightInstances[0],
                "runSelfTests: assertNotEqual deliberate fail"
                + " for instances."
            ),
            TestAssertion
        );

        t1.assertCompareArrays(
            (left, right) => (left.a === right.a && left.b === right.b),
            leftInstances, rightInstances,
            "runSelfTests: assertCompareArrays."
        )

        return [t1, t2];
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
                    throw testResult.lastFail;
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

    runSelfTests() {
        try {
            super.runSelfTests();
        }
        catch (error) {
            console.log(`runSelfTests failed ${error.toString()}`);
            throw error;
        }
    }

    get verbose() {return this._verbose;}
    set verbose(verbose) {this._verbose = verbose;}

    showStatus(status) {
        console.log(status);
    }

    showResult(name, testResult) {
        console.log([
            `Test "${name}" `,
            (testResult.failed) ? "failed."
            : `assertions:${testResult.assertions.length} passed.`
        ].join(""));

        if (testResult.failed || this.verbose) {
            testResult.assertions.forEach((assertion, index) => {
                if (assertion.messages !== undefined) {
                    console.log(
                        `Assertion ${index + 1} `
                        , assertion.passed ? "passed" : "failed"
                        , `: ${assertion.messages.join(" ")}`
                    );
                }
            });
        }

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