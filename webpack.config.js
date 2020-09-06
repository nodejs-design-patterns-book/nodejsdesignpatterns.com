'use strict'

const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const ManifestPlugin = require('webpack-manifest-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: './src/js/index.js',

  output: {
    filename: '[name].[chunkhash].js',
    path: path.resolve(__dirname, 'src/_includes/assets')
  },

  plugins: [
    new webpack.ProgressPlugin(),
    new ManifestPlugin(),
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: 'style.[chunkhash].css'
    })
  ],

  module: {
    rules: [
      {
        test: /.(js|jsx)$/,
        include: [path.resolve(__dirname, 'src/js')],
        loader: 'babel-loader',

        options: {
          plugins: ['syntax-dynamic-import'],

          presets: [
            [
              '@babel/preset-env',
              {
                modules: false
              }
            ]
          ]
        }
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader'
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true
              // options...
            }
          }
        ]
      }
    ]
  },

  optimization: {
    splitChunks: {
      cacheGroups: {
        vendors: {
          priority: -10,
          test: /[\\/]node_modules[\\/]/
        }
      },

      chunks: 'async',
      minChunks: 1,
      minSize: 30000,
      name: true
    }
  }
}
