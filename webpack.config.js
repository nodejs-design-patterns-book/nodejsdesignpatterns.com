'use strict'

import path from 'node:path'
import * as url from 'node:url'
import webpack from 'webpack'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import { WebpackManifestPlugin } from 'webpack-manifest-plugin'
import { CleanWebpackPlugin } from 'clean-webpack-plugin'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const config = {
  mode: process.env.NODE_ENV || 'development',
  entry: './src/js/index.js',

  output: {
    filename: '[name].[chunkhash].js',
    path: path.resolve(__dirname, 'src/_includes/assets')
  },

  plugins: [
    new webpack.ProgressPlugin(),
    new WebpackManifestPlugin({
      fileName: path.resolve(__dirname, 'src/_includes/assets/manifest.json'),
      publicPath: '/'
    }),
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: 'style.[chunkhash].css'
    })
  ],

  devtool: 'source-map',

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
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: '/assets/'
            }
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: true
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true
            }
          }
        ]
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
          outputPath: '/fonts/'
        }
      }
    ]
  },

  optimization: {
    //   // splitChunks: {
    //   //   cacheGroups: {
    //   //     vendors: {
    //   //       priority: -10,
    //   //       test: /[\\/]node_modules[\\/]/
    //   //     }
    //   //   },

    //   chunks: 'async',
    //   minChunks: 1,
    //   minSize: 30000,
    //   name: true
    // }
  }
}

export default config
