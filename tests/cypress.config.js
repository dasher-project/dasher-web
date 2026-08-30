const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://127.0.0.1:8000",
    specPattern: "cypress/integration/**/*.js",
    supportFile: "cypress/support/index.js",
    setupNodeEvents(on, config) {
      return config;
    },
  },
});
