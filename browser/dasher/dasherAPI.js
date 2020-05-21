export default class DasherAPI {
    constructor() {
    }
    testAPI(){
      this.testWebASM();
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
