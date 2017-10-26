/*!
 * Basic postMessage Support
 *
 * Copyright (c) 2013-2016 Dave Olsen, http://dmolsen.com
 * Licensed under the MIT license
 *
 * Handles the postMessage stuff in the pattern, view-all, and style guide templates.
 *
 */

function copyTextToClipboard(text) {
  var textArea = document.createElement("textarea");

  // Place in top-left corner of screen regardless of scroll position.
  textArea.style.position = 'fixed';
  textArea.style.top = 0;
  textArea.style.left = 0;

  // Ensure it has a small width and height. Setting to 1px / 1em
  // doesn't work as this gives a negative w/h on some browsers.
  textArea.style.width = '2em';
  textArea.style.height = '2em';

  // We don't need padding, reducing the size if it does flash render.
  textArea.style.padding = 0;

  // Clean up any borders.
  textArea.style.border = 'none';
  textArea.style.outline = 'none';
  textArea.style.boxShadow = 'none';

  // Avoid flash of white box if rendered for any reason.
  textArea.style.background = 'transparent';


  textArea.value = text;

  document.body.appendChild(textArea);

  textArea.select();

  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'successful' : 'unsuccessful';
    console.log('Copying text command was ' + msg);
  } catch (err) {
    console.log('Oops, unable to copy');
  }

  document.body.removeChild(textArea);
}

window.onload = function() {
	(function($){

		$('.pl-c-pattern .pl-c-pattern__codeSection > a.title').click(function(e) {
			e.preventDefault();
			$(this).parent().toggleClass('is-collapsed');
		});

		if ($('.pl-c-pattern').length == 0) {
			$('html.pl body').wrapInner("<div class='pl-c-pattern pl-c-pattern-single'></div>");
		}

		$('.pl-c-pattern .pl-c-pattern-shareLink').click(function(e) {
			e.preventDefault();
			var localUrl = window.location.href;
			var url = localUrl;
			if (url.indexOf('/', 7) !== -1)
				url = url.substring(0, url.indexOf('/', 7));
			url = url + "/?p=" + $(this).closest('.pl-c-pattern').attr('id');
			copyTextToClipboard(url);

			$(this).addClass('active').delay(2000).queue(function(next){
			    $(this).removeClass('active');
			    next();
			});
			
		});

		$('.pl-c-pattern .pl-c-pattern__codeClipboard').click(function(e) {
			e.preventDefault();
			var content = $(this).parent().find('code').text();
			copyTextToClipboard(content);

			$(this).addClass('active').delay(2000).queue(function(next){
			    $(this).removeClass('active');
			    next();
			});

		});

	})(jQuery); 
};

// alert the iframe parent that the pattern has loaded assuming this view was loaded in an iframe
if (self != top) {

	// handle the options that could be sent to the parent window
	//   - all get path
	//   - pattern & view all get a pattern partial, styleguide gets all
	//   - pattern shares lineage
	var path = window.location.toString();
	var parts = path.split("?");
	var options = {
		"event": "patternLab.pageLoad",
		"path": parts[0]
	};

	patternData = document.getElementById('pl-pattern-data-footer').innerHTML;
	patternData = JSON.parse(patternData);
	options.patternpartial = (patternData.patternPartial !== undefined) ? patternData.patternPartial : "all";
	if (patternData.lineage !== "") {
		options.lineage = patternData.lineage;
	}

	var targetOrigin = (window.location.protocol == "file:") ? "*" : window.location.protocol + "//" + window.location.host;
	parent.postMessage(options, targetOrigin);

	// find all links and add an onclick handler for replacing the iframe address so the history works
	var aTags = document.getElementsByTagName('a');
	for (var i = 0; i < aTags.length; i++) {
		aTags[i].onclick = function (e) {
			var href = this.getAttribute("href");
			var target = this.getAttribute("target");
			if ((target !== undefined) && ((target == "_parent") || (target == "_blank"))) {
				// just do normal stuff
			} else if (href && href !== "#") {
				e.preventDefault();
				window.location.replace(href);
			} else {
				e.preventDefault();
				return false;
			}
		};
	}

}

// watch the iframe source so that it can be sent back to everyone else.
function receiveIframeMessage(event) {

	// does the origin sending the message match the current host? if not dev/null the request
	if ((window.location.protocol != "file:") && (event.origin !== window.location.protocol + "//" + window.location.host)) {
		return;
	}

	var path;
	var data = {};
	try {
		data = (typeof event.data !== 'string') ? event.data : JSON.parse(event.data);
	} catch (e) {}

	if ((data.event !== undefined) && (data.event == "patternLab.updatePath")) {

		if (patternData.patternPartial !== undefined) {

			// handle patterns and the view all page
			var re = /(patterns|snapshots)\/(.*)$/;
			path = window.location.protocol + "//" + window.location.host + window.location.pathname.replace(re, '') + data.path + '?' + Date.now();
			window.location.replace(path);

		} else {

			// handle the style guide
			path = window.location.protocol + "//" + window.location.host + window.location.pathname.replace("styleguide\/html\/styleguide.html", "") + data.path + '?' + Date.now();
			window.location.replace(path);

		}

	} else if ((data.event !== undefined) && (data.event == "patternLab.reload")) {

		// reload the location if there was a message to do so
		window.location.reload();

	}

}
window.addEventListener("message", receiveIframeMessage, false);