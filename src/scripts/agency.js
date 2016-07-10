/*!
 * Start Bootstrap - Agnecy Bootstrap Theme (http://startbootstrap.com)
 * Code licensed under the Apache License v2.0.
 * For details, see http://www.apache.org/licenses/LICENSE-2.0.
 */

// jQuery for page scrolling feature - requires jQuery Easing plugin
$(function() {
    $('a.page-scroll').bind('click', function(event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: $($anchor.attr('href')).offset().top
        }, 1500, 'easeInOutExpo');
        event.preventDefault();
    });
});

// Highlight the top nav as scrolling occurs
$('body').scrollspy({
    target: '.navbar-fixed-top',
    offset: 100
})

// Closes the Responsive Menu on Menu Item Click
$('.navbar-collapse ul li a').click(function() {
    $('.navbar-toggle:visible').click();
});


$('#buy a').on('click', function(event) {
  ga('send', 'event', 'buy-link', 'click', event.target.href);
});

$('#sample a').on('click', function(event) {
  ga('send', 'event', 'download-link', 'click', event.target.href);
});

$('#author a').on('click', function(event) {
  ga('send', 'event', 'author-link', 'click', event.target.href);
});

$('#journey a').on('click', function(event) {
  ga('send', 'event', 'journey-link', 'click', event.target.href);
});

$('#navbar a').on('click', function(event) {
  ga('send', 'event', 'navbar-link', 'click', event.target.href);
});