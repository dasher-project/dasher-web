module.exports = {
  server: {
    command: 'cd ../browser && python3 -m http.server -b localhost',
    port: 8000,
    launchTimeout: 20000,
  },
}
