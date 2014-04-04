/**
 * Adds css prefixes depending on user's browser
 * @return {Object} CSS prefixed properties
 * @author Juan David Andrade <juandavidandrade@gmail.com>
 */
var Prefixr = (function() {
  var _cssProperties = {
    textShadow: "textShadow",
    borderRadius: "borderRadius",
    transform: "transform",
    transitionDuration: "transitionDuration",
    boxShadow: "boxShadow",
    transition: "transition"
  };

  var _vendorsArray = ['', 'webkit', 'Webkit', 'moz', 'Moz', 'o', 'ms', 'Ms'],
      _eventsArray = {
        'WebkitTransition': 'webkitTransitionEnd',
        'MozTransition': 'transitionend',
        'transition': 'transitionend'
      };

  (function() {
    var i,
      tempProp,
      vendorsLength = _vendorsArray.length;

    //  looping into css properties object  
    for (var prop in _cssProperties) {
      //  looping into vendor types
      for (i = 0; i <= vendorsLength; ++i) {
        _cssProperties[prop] = null;
        tempProp = prop;
        //  capitalize CSS property
        if (_vendorsArray[i] !== '') {
          tempProp = prop.replace(/(^[a-z]{0,1})([\w])/g, replaceKey);
        }
        //  property found
        if (typeof document.documentElement.style[_vendorsArray[i] + tempProp] !== 'undefined') {
          _cssProperties[prop] = _vendorsArray[i] + tempProp;
          break;
        }
      }
    }

    _cssProperties.transitionend = _eventsArray[_cssProperties.transition];

  }());

  function replaceKey(m, key, value) {
    return key.toString().toUpperCase() + value;
  }

  return _cssProperties;
}());