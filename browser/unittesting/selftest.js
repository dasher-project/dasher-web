// (c) 2022 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

import * as assert from './assert.js'
import * as result from './result.js'

export default function selfTest(t) {
    t.sub(basicSelfTests);
}

function basicSelfTests(t) {
    function thrower() {throw new Error("Throw from named thrower");}
    t(assert.Throw, thrower);

    class CustomError extends Error {}
    const thrownCustom = t( assert.Throw, () => {
        throw new CustomError("Throw from anonymous");
    });
    t(assert.Instance, thrownCustom, CustomError, "Instance");

    const testResultFail = new result.Result("fail-catcher");
    const trFail = testResultFail.value;
    const thrownEqual = t(assert.Throw, () => {
        trFail(assert.Equal, 1, 2, "should-throw");
    }, "failed-assert-throws");
    t(assert.Instance,
        thrownEqual, assert.Equal, "failed-assert-throws-instance");

    const zero0 = t(assert.NotUndefined, 0, "NotUndefined");
    const [left, right] = t(assert.Equal, zero0, 0, "Equal");
    const [zero1, one] = t(assert.NotEqual, 0, 1, "NotEqual");
}
