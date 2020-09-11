'use strict'

const eleventyPackage = require('@11ty/eleventy/package.json')

module.exports = function () {
  return {
    url: 'https://nodejsdesignpatterns.com',
    name: 'Node.js Design Patterns',
    title: 'Node.js Design Patterns Third Edition by Mario Casciaro and Luciano Mammino',
    description: 'A book to learn how to design and implement production-grade Node.js applications using proven patterns and techniques',
    author: 'Luciano Mammino & Mario Casciaro, authors@nodejsdesignpatterns.com',
    copyright: 'Mario Casciaro, Luciano Mammino, Packt Publishing',
    lang: 'en',
    locale: 'en_US',
    image: '/img/node-js-design-patterns.jpg',
    image_width: 1260,
    image_height: 630,
    generator: `${eleventyPackage.name} v${eleventyPackage.version}`
  }
}
