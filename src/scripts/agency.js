/*!
 * Start Bootstrap - Agnecy Bootstrap Theme (http://startbootstrap.com)
 * Code licensed under the Apache License v2.0.
 * For details, see http://www.apache.org/licenses/LICENSE-2.0.
 */

// jQuery for page scrolling feature - requires jQuery Easing plugin
jQuery(function () {
  jQuery('a.page-scroll').bind('click', function (event) {
    var $anchor = jQuery(this)
    jQuery('html, body')
      .stop()
      .animate(
        {
          scrollTop: jQuery($anchor.attr('href')).offset().top
        },
        1500,
        'easeInOutExpo'
      )
    event.preventDefault()
  })
})

// Highlight the top nav as scrolling occurs
jQuery('body').scrollspy({
  target: '.navbar-fixed-top',
  offset: 100
})

// Closes the Responsive Menu on Menu Item Click
jQuery('.navbar-collapse ul li a').click(function () {
  jQuery('.navbar-toggle:visible').click()
})

jQuery('#buy a').on('click', function (event) {
  ga && ga('send', 'event', 'buy-link', 'click', event.target.href)
})

jQuery('#sample a').on('click', function (event) {
  ga && ga('send', 'event', 'download-link', 'click', event.target.href)
})

jQuery('#author a').on('click', function (event) {
  ga && ga('send', 'event', 'author-link', 'click', event.target.href)
})

jQuery('#journey a').on('click', function (event) {
  ga && ga('send', 'event', 'journey-link', 'click', event.target.href)
})

jQuery('#navbar a').on('click', function (event) {
  ga && ga('send', 'event', 'navbar-link', 'click', event.target.href)
})
