/**
 * @fileOverview jQuery integration
 * @author Juan Andrade <juandavidandrade@gmail.com>
 */

/* global jQuery, $, Utils, Prefixr */

(function(bite, $) {
  'use strict';

  $.fn.slider = function(options) {
    return this.each(function(index, item) {
      return new bite.Slider(item, options);
    });
  };

})(window.bite = window.bite || {}, jQuery || $);