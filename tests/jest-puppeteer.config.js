module.exports = {
  server: {
    command: 'cd ../browser && python3 -m http.server -b 127.0.0.1',
    port: 8000,
    launchTimeout: 90000,
  },
}
