// (c) 2021 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

// Unit testing module
//
// The module has the following classes.
//
// -   TestResult records the results of a test or test suite. A test or test
//     suite will be represented by a test function that receives an instance of
//     this class as its parameter. The class has methods by which the test
//     function can do the following.
//     -   Assert conditions as it runs.
//     -   Start a sub-test, as part of a test suite.
// -   TestAssertion records the results of a single assertion within a test, or
//     records the result of a sub-test. TestAssertion is an Error subclass so
//     that it can be thrown and so that it can store a stack trace.
// -   TestRun runs a test function and displays the status and test results.
//     Actual display is handled by subclasses.
// -   TestRunConsole is a TestRun subclass that displays status and results by
//     logging to the console.
// -   TestRunWebPage is a TestRunConsole subclass that also displays status and
//     results in a web page (work in progress).
//
// By default, TestResult throws an error that includes a stack trace when an
// assertion fails. Chrome developer tools, for example, facilitate navigating
// to the code from which an uncaught error was thrown.
//
// Approaches to testing arrays:
// -   Inline approach adds one assertion per array element to the test result.
// -   Breadth sub-test approach, adds a sub-test for each assertion that is
//     made on each element.
//
// TOTH the exemplary Python unittest module, see
// https://docs.python.org/library/unittest.html

const stringType = typeof("");
const functionType = typeof(function () {});
function stringArray(items) {
    return (items === undefined) ? undefined
    : items.map(item =>
        (typeof(item) === functionType) ? item.name
        : (typeof(item) === stringType) ? item.slice()
        : "" + item
    );
}

const defaultErrorMessageJoiner = "\n";

export class TestAssertion extends Error {
    constructor(messages, ...parameters) {
        if (messages === undefined) {
            super(...parameters);
            this._messages = undefined;
        }
        else {
            super(messages.join(defaultErrorMessageJoiner), ...parameters);
            this._messages = messages.slice();
        }

        // Explicit initial property values.
        this._passed = undefined;
        this._subTest = undefined;

        // Default values.
        // Non-default values haven't been tested, oh the irony.
        this._errorMessageJoiner = defaultErrorMessageJoiner;
    }

    get passed() {
        return (
            this.subTest === undefined ? this._passed : this.subTest.passed);
    }
    set passed(passed) {this._passed = passed;}

    get subTest() {return this._subTest;}
    set subTest(subTest) {this._subTest = subTest;}

    get messages() {return this._messages.slice();}
    set messages(messages) {
        this._messages = stringArray(messages);
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
            , `assertTypeEqual(${left},${right},...)`
            + ` ${leftType} === ${rightType}.`
        ];
        return this;
    }

    assertInstanceOf(left, right, ...messages) {
        this.passed = (left instanceof right);
        const rightDescription = (
            right.name === undefined ? right.toString() : right.name);
        this.messages = [
            ...messages, `assertInstanceOf(${left},${rightDescription},...).`];
        return this;
    }

    assertTrue(value, ...messages) {
        this.passed = (value === true);
        this.messages = [...messages, `assertTrue(${value},...).`];
        return this;
    }

    assertFalse(value, ...messages) {
        this.passed = (value === false);
        this.messages = [...messages, `assertFalse(${value},...).`];
        return this;
    }

    assertUndefined(value, ...messages) {
        this.passed = (value === undefined);
        this.messages = [...messages, `assertUndefined(${value},...).`];
        return this;
    }

    assertNotUndefined(value, ...messages) {
        this.passed = (value !== undefined);
        this.messages = [...messages, `assertNotUndefined(${value},...).`];
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

    assertResult(testResult, ...messages) {
        // This seems a bit shaky. The passed property of the assertion doesn't
        // get set here. The property getter will descend into the subTest
        // whenever it is accessed.
        this.subTest = testResult;
        this.messages = [...messages, `assertResult(${testResult.name},...).`];
        return this
    }

}

export class TestResult {
    constructor(...names) {
        this._names = stringArray(names);

        this._assertions = [];

        this._summary = undefined;

        // Default values.
        // Non-default values haven't been tested, oh the irony.
        this._throwOnFail = true;
        this._nameJoiner = ".";
    }

    get assertions() {return this._assertions;}

    get failed() {
        if (this._assertions.length === 0) return undefined;
        return this._assertions.some(assertion => !assertion.passed);
    }
    get passed() {
        if (this._assertions.length === 0) return undefined;
        return !this.failed
    }

    get throwOnFail() {return this._throwOnFail;}
    set throwOnFail(throwOnFail) {this._throwOnFail = throwOnFail;}

    get names() {return this._names.slice();}
    get name() {return this._names.join(this.nameJoiner);}

    get nameJoiner() {return this._nameJoiner;}
    set nameJoiner(nameJoiner) { this._nameJoiner = nameJoiner; }

    get lastAssertion() {
        if (this._assertions.length > 0) {
            return this._assertions[this._assertions.length - 1];
        }
        return undefined;
    }

    get lastFail() {
        for (let index = this._assertions.length - 1; index >= 0; index--) {
            const assertion = this._assertions[index];
            if (assertion.passed) continue;
            if (assertion.subTest === undefined) return assertion;
            return assertion.subTest.lastFail;
        }
        return undefined;
    }

    child(...names) {
        const child = new TestResult(...this.names, ...names);
        child.nameJoiner = this.nameJoiner;
        child.throwOnFail = this.throwOnFail;
        return child;
    }

    summarise(verboseDepth=0, depth=0) {
        const summary = new TestSummary(depth);
        for(let index=0; index < this.assertions.length; index++) {
            const assertion = this.assertions[index];
            const subTest = assertion.subTest;

            if (subTest === undefined) {
                if (assertion.passed) {
                    summary.passCount += 1;
                }
                continue;
            }

            if (assertion.passed) {
                summary.subPassCount += 1;
            }
            if (Object.is(subTest, this)) {
                // Avoid directly circular structures. ToDo add a parent list to
                // the descent and continue if the subTest matches any parent.
                continue;
            }

            summary.add(subTest.summarise(verboseDepth, depth + 1));
        }

        if (depth > verboseDepth) {
            this._summary = null;
            return summary;
        }

        this._summary = summary;
        return null;
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
    // -   Must throw a TestAssertion if an assertion fails and this.throwOnFail
    //     is true.
    //
    // The push and throw requirement can be met by calling
    // this._resultAssertion() for example.

    _resultAssertion(assertion) {
        if (Object.is(assertion.subTest, this)) {
            // Remove circular result assertion.
            assertion.subTest = undefined;
        }

        const assertionCount = this._assertions.push(assertion);
        assertion.name = [
            ...this.names, assertionCount.toString()].join(this.nameJoiner);
        if (
            this.throwOnFail
            && (!assertion.passed)
            && assertion.subTest === undefined
        ) {
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

    assertResult(testResult, ...messages) {
        if (Object.is(testResult, this)) {
            // Asserting the result of this test in itself results in a circular
            // structure.
            throw new Error(`Circular assertResult ${messages}`);
        }
        this._resultAssertion(
            new TestAssertion().assertResult(testResult, ...messages));
        return testResult;

    }

    assertSubTest(testFunction, ...messages) {
        const childResult = this.child(testFunction);
        let testReturn;
        let thrown;
        // If the test function throws, record the assertion and re-throw.
        try {
            testReturn = testFunction(childResult);
            thrown = undefined;
        }
        catch(error) {
            thrown = error;
        }
        this._resultAssertion(
            new TestAssertion().assertResult(childResult, ...messages));
        if (thrown !== undefined) {
            throw thrown;
        }
        return testReturn;
    }
}

class TestSummary {
    constructor(depth) {
        this._depth = depth;

        this.passCount = 0;
        this.subPassCount = 0;
    }

    get depth() {return this._depth;}

    add(summary) {
        if (summary === null) {
            return;
        }
        this.passCount += summary.passCount;
        this.subPassCount += summary.subPassCount;
    }
}

export class TestRun {
    constructor() {
        this.status = "Self testing";
        this.runSelfTests();

        this.status = "Ready"
    }

    get status() {return this._status;}
    set status(status) {
        this.showStatus(status);
        this._status = status;
    }
    // show...() methods should be overridden in subclasses.
    showStatus(status) {}
    showResult(testResult) {}
    showAssertion(testAssertion, index, testResult) {}

    // Somebody might decide to rewrite the above as properties whose handling
    // can be overridden in a subclass. They might find useful the following SO
    // about getter and setter inheritance:
    // https://stackoverflow.com/a/34456245/7657675

    runSelfTests() {
        // Run tests on the framework itself, using its own functionality.
        const t = new TestResult(selfTests);

        t.assertEqual("Self testing", this.status, "status.");
        const tFail = selfTests(t);
        t.summarise();
        tFail.summarise();

        this._show(t);
        this._show(tFail);

        return t;
    }

    run(testFunction) {
        this.status = "Start run ...";
        const testResult = new TestResult(testFunction.name);
        this.status = `Running ${testResult.name} ...`;
        let testError;
        let testReturn;
        try {
            testReturn = testFunction(testResult);
        }
        catch(error) {
            testError = error;
        }

        testResult.summarise(1);
        this._show(testResult);

        if (testResult.failed) {
            if (testResult.throwOnFail) {
                this.status = `Thrown out by: ${testResult.lastFail.name}`;
                throw testResult.lastFail;
            }
            this.status = `Test Failed ${testResult.lastFail.name}`;
        }
        else {
            if (testError !== undefined) {
                // If the code reaches this point then the test case says it
                // passed but also threw an error. That seems like a bug in
                // the test case code. Rethrow the error out of the unit
                // test framework.
                this.status = `Apparent error in test.`;
                throw testError;
            }
            this.status = `Test Passed ${testResult.name}`;
        }

        return testReturn;
    }

    _show(testResult) {
        this.showResult(testResult);
        for(let index=0; index < testResult.assertions.length; index++) {
            const assertion = testResult.assertions[index];
            this.showAssertion(assertion, index, testResult);

            const subTest = assertion.subTest;
            if (subTest != undefined) {
                this._show(subTest);
            }
        }
    }
}

export function selfTests(t) {
    // Create a second TestResult object so that assertions can be made about
    // it. Any test failures here will throw.
    const tFail = new TestResult("tFail");

    t.assertThrows(
        () => tFail.assertResult(tFail, "Deliberate circular assertResult."),
        Error, "Catch circular assertResult"
    );

    t.assertUndefined(
        tFail.lastFail, "lastFail undefined before any assertions.");
    t.assertUndefined(tFail.passed, "passed undefined before any assertions.");
    t.assertUndefined(tFail.failed, "failed undefined before any assertions.");

    // Next assertions are made on tFail to get it into a passed state.
    tFail.assertTypeEqual(2, 3, "assertTypeEqual.");
    tFail.assertInstanceOf(tFail, TestResult, "assertInstanceOf.");
    // Check the passed state.
    t.assertUndefined(tFail.lastFail,
        "No fails if all assertions have passed.");
    t.assertTrue(tFail.passed, "passed true after two assertions.");
    t.assertFalse(tFail.failed, "failed false after two assertions");

    const assertionCount = t.assertions.length;
    t.assertThrows(
        () => tFail.assertFalse(true, "Deliberate fail."), TestAssertion
    );
    t.assertEqual(
        assertionCount + 1, t.assertions.length,
        "assertThrows adds one assertion.");
    t.assertNotUndefined(tFail.lastFail,
        "Failed assertion after assertFalse dummy.");
    t.assertUndefined(
        tFail.lastFail.subTest,
        "lastFail.subTest undefined if last failed assertion"
        + " wasn't a sub-test."
    )
    t.assertTrue(tFail.failed, "failed true after failed assertion.");
    t.assertFalse(tFail.passed, "passed false after failed assertions");

    t.assertComparable(1, 4, "assertComparable numbers.");
    t.assertThrows(
        () => tFail.assertComparable(
            "1", 4, "Deliberate fail assertComparable."
        ), TestAssertion
    );

    // Nested assertThrows. The inner should fail and throw a TestAssertion,
    // because its function doesn't throw. The outer should catch it and
    // pass.
    t.assertThrows(
        () => {
            tFail.assertThrows(
                () => { let noOperation; },
                undefined,
                "Deliberate lack of throw."
            );
        },
        TestAssertion,
        "inner assertThrows fail caught by outer."
    );

    t.assertThrows(
        () => { let undefined_; const length = undefined_.length; },
        undefined,
        "assertThrows with undefined error type."
    );
    t.assertTypeError(
        () => { let undefined_; const length = undefined_.length; },
        "undefined.length TypeError."
    );

    t.assertThrows(
        () => tFail.assertNotEqual(
            "2", 2, "Deliberate fail different types inequality."
        ),
        TestAssertion
    );

    t.assertNotEqual(3, 2, "assertNotEqual numeric.");
    t.assertEqual(3, 3, "assertEqual numeric.");

    t.assertThrows(
        () => tFail.assertEqual(
            "2", 2, "Deliberate fail different types equality."
        ),
        TestAssertion
    );

    // Check that a sub-test that makes no assertions fails because its passed
    // property is undefined. Also check that the sub-test return value is
    // preserved, if it doesn't throw.
    tFail.throwOnFail = false;
    const selfSubTestNoAssertions_ = tFail.assertSubTest(
        selfSubTestNoAssertions,
        "assertSubTest deliberate fail no assertions."
    );
    // The last assertion in tFail should have a subTest with an undefined
    // passed property value.
    t.assertNotUndefined(
        tFail.lastAssertion.subTest,
        "assertSubTest has subTest even if no assertions."
    );
    t.assertUndefined(
        tFail.lastAssertion.subTest.passed,
        "assertSubTest passed undefined if no assertions."
    );
    t.assertEqual(selfSubTestNoAssertions_, selfSubTestNoAssertionsReturn,
        "assertSubTest return preserved after fail.");
    tFail.throwOnFail = true;

    // Check a sub-test that makes assertions OK.
    const stReturn = t.assertSubTest(selfSubTest, "assertSubTest");
    const lastAssertion = t.lastAssertion;
    // Check that the last assertion has a subTest that passed.
    t.assertTrue(lastAssertion.passed, "assertSubTest lastAssertion passed.");
    t.assertNotUndefined(lastAssertion.subTest, "assertSubTest subTest set.");
    t.assertEqual(stReturn, selfSubTestReturn,
        "assertSubTest return preserved after pass.");

    [2, 4, 6, 200].forEach((evenNumber, index) => {
        t.assertEqual(
            evenNumber % 2, 0, "Inline assert even", index, evenNumber);
        t.lastAssertion.showIfPassed = true;
    });

    const tGreater = t.child("tGreater");
    const tEven = t.child("tEven");
    [2, 4, 6, 200].forEach((evenNumber, index) => {
        tGreater.assertTrue(evenNumber > 1, "Breadth assert > 1", evenNumber);
        tGreater.lastAssertion.showIfPassed = true;
        tEven.assertEqual(
            evenNumber % 2, 0, "Breadth assert even", evenNumber);
        tEven.lastAssertion.showIfPassed = true;
    });
    t.assertResult(tGreater, "Breadth assert > 1 all.");
    t.lastAssertion.showIfPassed = true;
    t.assertResult(tEven, "Breadth assert even all.");
    t.lastAssertion.showIfPassed = true;

    t.assertEqualArrays([], [], "assertEqualArrays empty.")
    const leftNumbers = [1, 2];
    const rightNumbers = [1, 0];
    t.assertThrows(
        () => tFail.assertEqualArrays(leftNumbers, rightNumbers),
        TestAssertion,
        "Deliberate fail assertEqualArrays unequal numbers."
    );
    rightNumbers[1] = leftNumbers[1];
    t.assertEqualArrays(leftNumbers, rightNumbers,
        "assertEqualArrays numbers.");

    t.assertCompareArrays(undefined, [], [], "assertCompareArrays empty.")

    class Instance {
        constructor(a, b, c) { this.a = a; this.b = b; this.c = c;}
    }
    const leftInstances = [
        new Instance(1, 2, 3), new Instance(4, 5, 6)];
    const rightInstances = [
        new Instance(1, 2, 4), new Instance(4, 5)];

    t.assertThrows(
        () => tFail.assertComparable(leftInstances[0], rightInstances[0],
            "assertComparable deliberate fail for instances."
        ),
        TestAssertion
    );
    t.assertThrows(
        () => tFail.assertNotEqual(leftInstances[0], rightInstances[0],
            "assertNotEqual deliberate fail for instances."
        ),
        TestAssertion
    );

    t.assertCompareArrays(
        (left, right) => (left.a === right.a && left.b === right.b),
        leftInstances, rightInstances, "assertCompareArrays."
    );

    return tFail;
}

// Duff sub-test function that doesn't make any assertions.
const selfSubTestNoAssertionsReturn = "selfSubTestNoAssertionsReturn";
function selfSubTestNoAssertions(t) { return selfSubTestNoAssertionsReturn; }

// OK sub-test function.
const selfSubTestReturn = "selfSubTestReturn";
function selfSubTest(t) {
    t.assertNotEqual("three", "two", "assertNotEqual string.");
    t.assertEqual("four", "four", "assertEqual string.");
    return selfSubTestReturn;
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

    showResult(testResult) {
        console.log([
            `Test "${testResult.name}"`,
            ` assertions:${testResult.assertions.length}`,
            " ",
            testResult.passed === undefined ? "undefined"
            : testResult.failed ? "failed" : "passed", "."
        ].join(""));
    }

    showAssertion(assertion, index, testResult) {
        // Self tests are run and shown in the constructor, before subclass
        // properties can be set. This means that this.verbose could be
        // undefined here.  
        // ToDo: Add a default outside the class that is applied in case verbose
        // is undefined.
        if (
            assertion.passed && (!this.verbose) && (!assertion.showIfPassed
        )) return;
        console.log([
            // Hmm. The assertion.name will have the testResult name and an
            // index ordinal number so the first string is unnecessary and
            // commented out.  
            //`${testResult.name} assertion ${index + 1}`, " ",
            assertion.name, " ",
            assertion.passed === undefined ? "undefined"
            : assertion.passed ? "passed" : "failed",
            assertion.messages === undefined ? "."
            : [".", ...assertion.messages].join(" ")
        ].join(""));
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

    showResult(testResult) {
        super.showResult(testResult);

        // ToDo insert it into the web page.
    }

    showAssertion(assertion, index, testResult) {
        super.showAssertion(assertion, index, testResult);

        // ToDo insert it into the web page.
    }
 }