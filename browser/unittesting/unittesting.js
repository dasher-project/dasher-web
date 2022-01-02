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

    // Instead of this getter, there should maybe be a TestAssertion subclass
    // for a sub-test.
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

}

export class TestResult {
    constructor(...names) {
        this._names = stringArray(names);

        this._assertions = [];
        this._assertionCount = this._assertions.length;

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
    //
    //
    // In a compound assertion:
    //
    // -   The last assertion doesn't get a suffix.
    // -   There will be at most one failed assertion.

    _resultAssertion(assertion, ...suffix) {
        if (Object.is(assertion.subTest, this)) {
            // Remove circular result assertion.
            assertion.subTest = undefined;
        }

        assertion.name = [
            ...this.names, this._assertionCount.toString(), ...suffix
        ].join(this.nameJoiner);

        this._assertions.push(assertion);

        if (
            this.throwOnFail
            && (!assertion.passed)
            && assertion.subTest === undefined
        ) {
            throw assertion;
        }
        return assertion;
    }

    _assertTypeEqual(left, right, suffix, ...reasons) {
        const leftType = typeof(left);
        const rightType = typeof(right);

        const assertion = new TestAssertion([...reasons,
            `assertTypeEqual(${left},${right},...)`
            + ` ${leftType} === ${rightType}.`
        ]);

        assertion.passed = (leftType === rightType);

        this._resultAssertion(assertion, ...suffix);

        return assertion.passed;
    }
    assertTypeEqual(left, right, ...reasons) {
        this._assertionCount += 1;
        this._assertTypeEqual(left, right, [], ...reasons);
        return [left, right];
    }

    _assertInstanceOf(left, right, suffix, ...reasons) {
        const rightDescription = (
            right.name === undefined ? right.toString() : right.name);
        const assertion = new TestAssertion([...reasons,
            `assertInstanceOf(${left},${rightDescription},...).`
        ]);
        assertion.passed = (left instanceof right);
        this._resultAssertion(assertion, ...suffix);
        return assertion.passed;
    }
    assertInstanceOf(left, right, ...reasons) {
        this._assertionCount += 1;
        this._assertInstanceOf(left, right, [], ...reasons);
        return [left, right];
    }

    _assertComparable(left, right, suffix, ...reasons) {
        if (!this._assertTypeEqual(
            left, right,
            [...suffix, "typeEqual"],
            ...reasons, "assertComparable requires assertTypeEqual."
        )) {
            return false;
        }
        const assertion = new TestAssertion([...reasons,
            `assertComparable(${left},${right},...)`
            + " at least one must be true: equal, greater than, less than."
        ]);

        assertion.passed = (left === right || left < right || left > right);
        this._resultAssertion(assertion, ...suffix);
        return assertion.passed;
    }
    assertComparable(left, right, ...reasons) {
        this._assertionCount += 1;
        this._assertComparable(left, right, [], ...reasons);
        return [left, right];
    }

    _assertEquality(sense, left, right, suffix, ...reasons) {
        const name = ["assert", sense ? "" : "Not", "Equal"].join("");
        if (!this._assertComparable(
            left, right,
            [...suffix, "assertComparable"],
            ...reasons, `${name} requires assertComparable.`
        )) {
            return false;
        }
        const assertion = new TestAssertion([
            ...reasons,
            `${name}(${left},${right},...).`]);
        assertion.passed = (sense ? (left === right) : (left !== right));
        this._resultAssertion(assertion, ...suffix);
        return assertion.passed;
    }
    assertEqual(left, right, ...reasons) {
        this._assertionCount += 1;
        this._assertEquality(true, left, right, [], ...reasons);
        return [left, right];
    }
    assertNotEqual(left, right, ...reasons) {
        this._assertionCount += 1;
        this._assertEquality(false, left, right, [], ...reasons);
        return [left, right];
    }

    _assertStrictEquality(asserted, value, suffix, ...reasons) {
        const prefix = [
            "assert",
            (asserted === undefined) ? "Undefined("
            : (asserted === true) ? "True("
            : (asserted === false) ? "False("
            : `StrictEquality(${asserted},`
        ].join("");

        const assertion = new TestAssertion([...reasons,
            `${prefix}${value},...)`
        ]);
        assertion.passed = (value === asserted);
        this._resultAssertion(assertion, ...suffix);
        return assertion.passed;
    }
    assertStrictEquality(asserted, value, ...reasons) {
        this._assertionCount += 1;
        this._assertStrictEquality(asserted, value, [], ...reasons);
        return value;
    }
    assertTrue(value, ...reasons) {
        return this.assertStrictEquality(true, value, ...reasons);
    }
    assertFalse(value, ...reasons) {
        return this.assertStrictEquality(false, value, ...reasons);
    }
    assertUndefined(value, ...reasons) {
        return this.assertStrictEquality(undefined, value, ...reasons);
    }

    _assertNotUndefined(value, suffix, ...reasons) {
        const assertion = new TestAssertion([
            ...reasons, `assertNotUndefined(${value},...).`]);
        assertion.passed = (value !== undefined);
        this._resultAssertion(assertion, ...suffix);
        return assertion.passed;
    }
    assertNotUndefined(value, ...reasons) {
        this._assertionCount += 1;
        this._assertNotUndefined(value, [], ...reasons);
        return value;
    }

    _assertThrows(function_, errorType, suffix, ...reasons) {
        let returned;
        let caught;
        try {
            returned = function_();
            caught = undefined;
        }
        catch (error) {
            caught = error;
        }

        const threw = this._assertNotUndefined(
            caught,
            // If errorType wasn't given, this is the last assertion and
            // therefore doesn't get an additional suffix.
            (errorType === undefined ? suffix : [...suffix, 'notUndefined']),
            ...reasons, "Threw an error."
        );

        if ((!threw.passed) || (errorType === undefined)) {
            return [threw.passed, returned];
        }

        // The next assertion will be the last if the code reaches this point.
        return [this._assertInstanceOf(
            caught, errorType, suffix, ...reasons, "Threw expected error type."
        ), returned];
    }
    assertThrows(function_, errorType, ...reasons) {
        this._assertionCount += 1;
        const [passed, returned] = this._assertThrows(
            function_, errorType, [], ...reasons);
        return returned;
    }
    assertTypeError(function_, ...reasons) {
        return this.assertThrows(function_, TypeError, ...reasons)
    }

    assertEqualArrays(left, right, ...reasons) {
        this._assertionCount += 1;

        if (this._assertEquality(true, left.length, right.length,
            ["length"], ...reasons, "assertEqualArrays same length."
        )) {
            for(let index=0; index < left.length; index++) {
                const suffix = [ `[${index}]` ];
                if (!this._assertEquality(
                    true, left[index], right[index], suffix,
                    ...reasons, `assertEqualArrays ${suffix[0]}.`
                )) {
                    break;
                }
            }
        }

        return [left, right];

        // Zero-length arrays will be handled OK. The assertion of same length
        // will pass; the for loop will be skipped leaving the passed result
        // intact.
        //
        // This assert function doesn't follow the convention that the last
        // assertion in a compound assertion doesn't get a suffix.
    }

    assertCompareArrays(comparator, left, right, ...reasons) {
        this._assertionCount += 1;

        if (this._assertEquality(true, left.length, right.length,
            ["length"], ...reasons, "assertCompareArrays same length."
        )) {
            for(let index=0; index < left.length; index++) {
                const suffix = [ `[${index}]` ];
                if (!this._assertStrictEquality(true,
                    comparator(left[index], right[index], index), suffix,
                    ...reasons, `assertCompareArrays ${suffix[0]}.`
                )) {
                    break;
                }
            }
        }

        return [left, right];
    }

    _assertResult(testResult, suffix, ...reasons) {
        const assertion = new TestAssertion([
            ...reasons, `assertResult(${testResult.name},...).`]);
        if (Object.is(testResult, this)) {
            // Asserting the result of this test in itself results in a circular
            // structure.
            throw new Error(`Circular assertResult ${reasons}`);
        }
        // This seems a bit shaky. The passed property of the assertion doesn't
        // get set here. The property getter will descend into the subTest
        // whenever it is accessed.
        assertion.subTest = testResult;

        this._resultAssertion(assertion, ...suffix);
        return assertion.passed;
    }
    assertResult(testResult, ...reasons) {
        this._assertionCount += 1;
        this._assertResult(testResult, [], ...reasons);
        return testResult;
    }

    assertSubTest(testFunction, ...reasons) {
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

        this.assertResult(childResult, ...reasons);

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
    t.assertResult(tGreater, "Breadth assert > 1 all.");
    t.lastAssertion.showIfPassed = true;
    const tEven = t.child("tEven");
    t.assertResult(tEven, "Breadth assert even all.");
    t.lastAssertion.showIfPassed = true;
    [2, 4, 6, 200].forEach((evenNumber, index) => {
        tGreater.assertTrue(evenNumber > 1, "Breadth assert > 1", evenNumber);
        tGreater.lastAssertion.showIfPassed = true;
        tEven.assertEqual(
            evenNumber % 2, 0, "Breadth assert even", evenNumber);
        tEven.lastAssertion.showIfPassed = true;
    });

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
            testResult.passed === undefined ? "pass-fail undefined"
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
            assertion.passed === undefined ? "pass-fail undefined"
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