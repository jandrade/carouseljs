/**
 * Define input events based on touch support
 */
var UIEvent = ('ontouchstart' in window) ? {
  START: 'touchstart',
  MOVE: 'touchmove',
  END: 'touchend',
  CLICK: 'touchstart'
} : {
  START: 'mousedown',
  MOVE: 'mousemove',
  END: 'mouseup',
  CLICK: 'click'
};

var Utils = {
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

/**
 * handle events invoking directly a method inside the DOM Element
 */
if (!Element.prototype.addEventListener) {
  Element.prototype.addEventListener = function(type, handler, useCapture) {
    if (this.attachEvent) {
      this.attachEvent('on' + type, function(event) {
        event.preventDefault = function() {
          event.returnValue = false;
          return false;
        };

        event.stopPropagation = function() {
          window.event.cancelBubble = true;
          return false;
        };

        event.target = event.srcElement;
        event.currentTarget = event.srcElement;


        handler(event);
      });
    }
    return this;
  };
}

if (!Element.prototype.removeEventListener) {
  Element.prototype.removeEventListener = function(type, handler, useCapture) {
    if (this.detachEvent) {
      this.detachEvent('on' + type, handler);
    }
    return this;
  };
}