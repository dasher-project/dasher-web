// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

/*
This script gets run by inclusion in a script tag in the index.html file. It has
to have type="module" because it imports other modules.
*/

import UserInterface from './dasher/userinterface.js'

document.body.onload = () => {
    const ui = new UserInterface(
        document.getElementById('user-interface')
    ).load('loading', 'small-print');
}
