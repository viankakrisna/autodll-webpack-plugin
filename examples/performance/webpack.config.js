const webpack = require('webpack');
const path = require('path');
const AutoDllPlugin = require('autodll-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: [
    "babel-polyfill",
    './src/index.js'
  ],
  devtool: 'source-map',
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/'
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env', 'react']
          }
        }
      }
    ]
  },

  devServer: {
    hot: true,
    historyApiFallback: true
  },

  plugins: [
    new AutoDllPlugin({
      debug: true,
      inject: true,
      filename: '[name]_[hash].js',
      path: './dll',
      entry: {
        vendor: [
          'babel-polyfill',
          'react',
          'react-dom',
          'moment',
          'styled-components',
          'polished',
          'redux',
          'react-redux',
          'react-bootstrap',
          'immutable',
          'react-router-dom',
          'axios',
          'react-helmet',
          'react-a11y',
          'draft-js',
          'howler',
          'react-motion',
          'react-player',
          'pixi.js'
        ]
      }
    }),
    new webpack.HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({
      inject: true,
      template: './src/index.html',
    })
  ]
};