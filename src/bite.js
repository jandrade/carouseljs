/**
 * @fileOverview Core of Bite library
 * @author Juan Andrade <juandavidandrade@gmail.com>
 */

/* global console */

(function(bite) {
  'use strict';

  bite.utils = {
		index: function(el, parent) {
			var nodeList = Array.prototype.slice.call(document.querySelector(parent).children);
			return nodeList.indexOf(el);
		},

		clone: function (elems, className) {
			var clonedNodes = [],
				clonedNode;
			for (var i = 0, len = elems.length; i < len; ++i) {
				clonedNode = elems[i].cloneNode(true);
				clonedNode.classList.add(className);
				clonedNodes.push(clonedNode);
			}

			return clonedNodes;
		},

		append: function(parent, children) {
			for (var i = 0, len = children.length; i < len; ++i) {
				parent.appendChild(children[i]);
			}
		},

		prepend: function(parent, children) {
			for (var i = children.length - 1; i >= 0; i--) {
				parent.insertBefore(children[i], parent.firstChild);
			}
		},

		remove: function(elems) {
			for (var i = elems.length - 1; i >= 0; i--) {
				elems[i].parentNode.removeChild(elems[i]);
			}
		},

		/**
     * Extends an object with another object
     * @param  {Object} dest 
     * @param  {Object} src  
     * @return {Object}      Merged object
     */
    extend: function (dest, src) {
      var i;
      
      for(i in src) {
        dest[i] = src[i];
      }
      return dest;
    },
		/**
		* matches a translate3D coordinate (from translate3D CSS3 property)
		* @param value {String} The translate3D property string: 'translate3D(10px,0,-50px)'
		* @param coordinate {String} The coordinate needed: 'x' || 'y' || 'z'
		* @returns {Number}  Gets the selected coordinate value
		*/
		getTranslateCoordinate: function(value, coordinate) {
		var coordinateValue = 0,
			arrMatches = value.toString().match(/([0-9\-]+)+(?![3d]\()/gi);

			//  matches all the 3D coordinates (from translate3D CSS3 property)
			if (arrMatches && arrMatches.length) {
				//  Gets the array position: [x, y, z]
				var coordinatePosition = coordinate === 'x' ? 0 : coordinate === 'y' ? 1 : 2;
				coordinateValue = parseFloat(arrMatches[coordinatePosition]);
			}

			return coordinateValue;
		},
		touch: function() {
			return ('ontouchstart' in window);
		}
  };

})(window.bite = window.bite || {});