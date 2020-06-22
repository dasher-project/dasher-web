// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT
//
/*
 * The purpose of this file is to interface with the
 * c/c++ libraries that were compiled and loaded using WebASM.
 * See webasm directory.
*/
import MessageStore from './messageStore.js'

export default class DasherWebASM {
    constructor() {
      this.messageStore = new MessageStore();
    }
    testAPI(){
      //this.testWebASM();
      this.messageStore.test();
    }
    testWebASM(){
      var result = Module.ccall(
          'myFunction',	// name of C function
          null,	// return type
          null,	// argument types
          null	// arguments
      );
    }
}
