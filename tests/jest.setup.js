const util = require("node:util");

if (typeof globalThis.structuredClone !== "function") {
  if (typeof util.structuredClone === "function") {
    globalThis.structuredClone = util.structuredClone;
  } else {
    globalThis.structuredClone = (value) => JSON.parse(JSON.stringify(value));
  }
}

global.console = {
  log: jest.fn(),
  debug: console.debug,
  trace: console.trace,
  //
}
