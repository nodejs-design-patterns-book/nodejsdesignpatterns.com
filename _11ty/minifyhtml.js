'use strict'

const htmlmin = require('html-minifier')

const banner = `<!--
888b    888               888              d8b               8888888b.                    d8b                        8888888b.          888    888                                      
8888b   888               888              Y8P               888  "Y88b                   Y8P                        888   Y88b         888    888                                      
88888b  888               888                                888    888                                              888    888         888    888                                      
888Y88b 888  .d88b.   .d88888  .d88b.     8888 .d8888b       888    888  .d88b.  .d8888b  888  .d88b.  88888b.       888   d88P 8888b.  888888 888888 .d88b.  888d888 88888b.  .d8888b  
888 Y88b888 d88""88b d88" 888 d8P  Y8b    "888 88K           888    888 d8P  Y8b 88K      888 d88P"88b 888 "88b      8888888P"     "88b 888    888   d8P  Y8b 888P"   888 "88b 88K      
888  Y88888 888  888 888  888 88888888     888 "Y8888b.      888    888 88888888 "Y8888b. 888 888  888 888  888      888       .d888888 888    888   88888888 888     888  888 "Y8888b. 
888   Y8888 Y88..88P Y88b 888 Y8b.    d8b  888      X88      888  .d88P Y8b.          X88 888 Y88b 888 888  888      888       888  888 Y88b.  Y88b. Y8b.     888     888  888      X88 
888    Y888  "Y88P"   "Y88888  "Y8888 Y8P  888  88888P'      8888888P"   "Y8888   88888P' 888  "Y88888 888  888      888       "Y888888  "Y888  "Y888 "Y8888  888     888  888  88888P' 
                                           888                                                     888                                                                                  
                                          d88P                                                Y8b d88P                                                                                  
                                        888P"                                                  "Y88P"                                                                                   


> Hey, it seems you are a curious one and that you like to hack! :) 
> Maybe you should follow us on Twitter at @mariocasciaro & @loige

> Also, did you know that this website is open source?
> Check out https://github.com/nodejs-design-patterns-book/nodejsdesignpatterns.com

-->`

module.exports = function minifyhtml (config) {
  // Add HTML minification transform
  config.addTransform('htmlmin', function (content, outputPath) {
    if (outputPath.endsWith('.html')) {
      const minified = htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true
      })
      return minified.replace('<!doctype html>', '<!doctype html>' + banner)
    }

    return content
  })
}
