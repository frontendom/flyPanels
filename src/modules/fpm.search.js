(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([], factory(root));
	} else if (typeof exports === 'object') {
		module.exports = factory(root);
	} else {
		root.fpm_search = factory(root);
	}
})(typeof global !== 'undefined' ? global : this.window || this.global, function (root) {

	'use strict';

	//
	// Variables
	//

	var fpm_search = {}; // Object for public APIs
	var supports = !!document.querySelector && !!root.addEventListener; // Feature test
	var settings, eventTimeout;
	var el;

	// Default settings
	var defaults = {
		saveQueryCookie: false,
		searchPanel: document.querySelector('.offcanvas [data-panel="search"]'),
		onInit: function () {},
		onDestroy: function () {},
		onEmptySearchResult: function () {},
		onSearchError: function () {},
		onSearchSuccess: function () {},
	};


	//
	// Methods
	//

	var executeSearch = function (query) {
		searchError('hide');
		settings.searchPanel.querySelector('.flypanels-searchresult').innerHTML = '';
		settings.searchPanel.querySelector('.resultinfo .query').innerHTML = query;
		settings.searchPanel.querySelector('.resultinfo .num').innerHTML = 0;
		var jsonURL = settings.searchPanel.querySelector('.searchbox').getAttribute('data-searchurl');
		jsonURL = jsonURL + '&q=' + query;

		var request = new XMLHttpRequest();
		request.open('GET', jsonURL, true);

		request.onload = function () {
			if (request.status >= 200 && request.status < 400) {
				// Success!
				var response = parseJSON(request.response);
				if (response !== false) {
					var foundResults = response.Items.length;
					if (foundResults > 0) {
						if (settings.saveQueryCookie === true) {
							cookies.set('searchQuery', query, null, '/');
						}
						var output = buildResultsList(response.Items);

						// Render html
						settings.searchPanel.querySelector('.resultinfo .query').innerHTML = query;
						settings.searchPanel.querySelector('.resultinfo .num').innerHTML = foundResults;
						settings.searchPanel.querySelector('.flypanels-searchresult').innerHTML = output;
						searchProgress('hide');
						settings.searchPanel.querySelector('.resultinfo').style.display = 'block';
						settings.searchPanel.querySelector('.flypanels-searchresult').style.display = 'block';
						hook('onSearchSuccess');
					} else {
						hook('onEmptySearchResult');
						if (settings.saveQueryCookie === true) {
							cookies.remove('searchQuery', '/');
						}
						searchProgress('hide');
						searchError('show');
					}
				} else {
					hook('onEmptySearchResult');
					if (settings.saveQueryCookie === true) {
						cookies.remove('searchQuery', '/');
					}
					searchProgress('hide');
					searchError('show');
				}
			} else {
				// We reached our target server, but it returned an error
				searchError('show');
				searchProgress('hide');
				hook('onSearchError');
			}
		};
		request.onerror = function () {
			// There was a connection error of some sort
			searchError('show');
		};
		request.send();
	};

	var buildResultsList = function (results) {
		var output = '<ul>';
		for (var i in results) {
			if (results[i].Type === 'Page') {
				output += '<li><a href="' + results[i].LinkUrl + '"><span class="link">' + results[i].Header + '</span>  <span class="type"><i class="fa page"></i></span></a>';
			} else {
				output += '<li><a href="' + results[i].LinkUrl + '"><span class="link">' + results[i].Header + '</span>  <span class="type"><i class="fa doc"></i></span></a>';
			}
		}
		output += '</ul>';
		return output;
	};

	var parseJSON = function (jsonString) {
		try {
			var o = JSON.parse(jsonString);
			// Handle non-exception-throwing cases:
			// Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
			// but... JSON.parse(null) returns 'null', and typeof null === "object",
			// so we must check for that, too.
			if (o && typeof o === 'object' && o !== null) {
				return o;
			}
		} catch (e) {}
		console.warn('Error parsing JSON file');
		return false;
	};

	var searchError = function (state) {
		if (state === 'hide') {
			settings.searchPanel.querySelector('.errormsg').style.display = 'none';
		} else {
			settings.searchPanel.querySelector('.errormsg').style.display = 'block';
		}
	};

	var searchProgress = function (state) {
		if (state === 'hide') {
			settings.searchPanel.querySelector('.loading').style.display = 'none';
		} else {
			settings.searchPanel.querySelector('.loading').style.display = 'block';
		}
	};

	var cookies = {
		get: function (sKey) {
			if (!sKey) {
				return null;
			}
			return decodeURIComponent(document.cookie.replace(new RegExp('(?:(?:^|.*;)\\s*' + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, '\\$&') + '\\s*\\=\\s*([^;]*).*$)|^.*$'), '$1')) || null;
		},
		set: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
			if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) {
				return false;
			}
			var sExpires = '';
			if (vEnd) {
				switch (vEnd.constructor) {
				case Number:
					sExpires = vEnd === Infinity ? '; expires=Fri, 31 Dec 9999 23:59:59 GMT' : '; max-age=' + vEnd;
					break;
				case String:
					sExpires = '; expires=' + vEnd;
					break;
				case Date:
					sExpires = '; expires=' + vEnd.toUTCString();
					break;
				}
			}
			document.cookie = encodeURIComponent(sKey) + '=' + encodeURIComponent(sValue) + sExpires + (sDomain ? '; domain=' + sDomain : '') + (sPath ? '; path=' + sPath : '') + (bSecure ? '; secure' : '');
			return true;
		},
		remove: function (sKey, sPath, sDomain) {
			if (!this.has(sKey)) {
				return false;
			}
			document.cookie = encodeURIComponent(sKey) + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT' + (sDomain ? '; domain=' + sDomain : '') + (sPath ? '; path=' + sPath : '');
			return true;
		},
		has: function (sKey) {
			if (!sKey) {
				return false;
			}
			return (new RegExp('(?:^|;\\s*)' + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, '\\$&') + '\\s*\\=')).test(document.cookie);
		},
		keys: function () {
			var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, '').split(/\s*(?:\=[^;]*)?;\s*/);
			for (var nLen = aKeys.length, nIdx = 0; nIdx < nLen; nIdx++) {
				aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]);
			}
			return aKeys;
		}
	};

	var isAndroid = function () {
		if (navigator.userAgent.toLowerCase().indexOf('android') > -1) {
			return true;
		} else {
			return false;
		}
	};

	var isIOS = function () {
		if ((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPad/i)) || (navigator.userAgent.match(/iPod/i))) {
			return true;
		} else {
			return false;
		}
	};

	/**
	 * Callback hooks.
	 * Usage: In the defaults object specify a callback function:
	 * hookName: function() {}
	 * Then somewhere in the plugin trigger the callback:
	 * hook('hookName');
	 */
	var hook = function (hookName) {
		if (settings[hookName] !== undefined) {
			// Call the user defined function.
			// Scope is set to the jQuery element we are operating on.
			settings[hookName].call(el);
		}
	};

	/**
	 * Merge defaults with user options
	 * @private
	 * @param {Object} defaults Default settings
	 * @param {Object} options User options
	 * @returns {Object} Merged values of defaults and options
	 */
	var extend = function (defaults, options) {
		var extended = {};
		forEach(defaults, function (value, prop) {
			extended[prop] = defaults[prop];
		});
		forEach(options, function (value, prop) {
			extended[prop] = options[prop];
		});
		return extended;
	};

	/**
	 * A simple forEach() implementation for Arrays, Objects and NodeLists
	 * @private
	 * @param {Array|Object|NodeList} collection Collection of items to iterate
	 * @param {Function} callback Callback function for each iteration
	 * @param {Array|Object|NodeList} scope Object/NodeList/Array that forEach is iterating over (aka `this`)
	 */
	var forEach = function (collection, callback, scope) {
		if (Object.prototype.toString.call(collection) === '[object Object]') {
			for (var prop in collection) {
				if (Object.prototype.hasOwnProperty.call(collection, prop)) {
					callback.call(scope, collection[prop], prop, collection);
				}
			}
		} else {
			for (var i = 0, len = collection.length; i < len; i++) {
				callback.call(scope, collection[i], i, collection);
			}
		}
	};

	/**
	 * Destroy the current initialization.
	 * @public
	 */
	fpm_search.destroy = function () {

		// If plugin isn't already initialized, stop
		if (!settings) {
			return;
		}

		// Remove init class for conditional CSS
		document.documentElement.classList.remove(settings.initClass);

		// @todo Undo any other init functions...

		// Remove event listeners
		document.removeEventListener('click', eventHandler, false);

		// Reset variables
		settings = null;
		eventTimeout = null;
		hook('onDestroy');
	};

	/**
	 * Initialize Plugin
	 * @public
	 * @param {Object} options User settings
	 */
	fpm_search.init = function (options) {
		// feature test
		if (!supports) {
			return;
		}

		// Destroy any existing initializations
		fpm_search.destroy();

		// Merge user options with defaults
		settings = extend(defaults, options || {});

		el = document.querySelector(settings.container);

		if (isAndroid() || isIOS()) {
			document.querySelector('.flypanels-searchresult').classList.add('touch');
		}
		settings.searchPanel.querySelector('.searchbutton').addEventListener('click', function (event) {
			event.preventDefault();
			searchProgress('show');
			executeSearch(settings.searchPanel.querySelector('.searchbox input').value);
		});

		settings.searchPanel.querySelector('.searchbox input').addEventListener('keydown', function (event) {
			if (event.which === 13) {
				searchProgress('show');
				executeSearch(this.value);
				this.blur();
			}
		});

		if (cookies.has('searchQuery') === true && settings.saveQueryCookie === true) {
			executeSearch(cookies.get('searchQuery'));
		}

		hook('onInit');
	};

	//
	// Public APIs
	//

	return fpm_search;
});
