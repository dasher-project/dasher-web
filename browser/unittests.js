// (c) 2022 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

/*
This script gets run by inclusion in a script tag in the html file of the same
name. It has to have type="module" because it imports other modules.
*/

// import * as unittesting from './unittesting/unittesting.js'
import unitTests from './dasher/unittests.js'

import selfTest from './unittesting/selftest.js'
import {Console} from './unittesting/testrun.js'

document.body.onload = () => {
    new Console().run(selfTest, unitTests);

    // Good location for a breakpoint.
    return;

//     new unittesting.TestRunWebPage(
//         document.getElementById('loading'),
//         document.getElementById('user-interface'),
//         document.getElementById('small-print')
//     ).run(unitTests);
}
