const webpack = require('webpack');
const path = require('path');

const config = {
  entry: './client_mozolm.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js'
  },
  mode: 'development',
};

module.exports = config;
