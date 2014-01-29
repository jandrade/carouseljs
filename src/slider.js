/**
 * @fileOverview Slider plugin
 * @author Juan Andrade <juandavidandrade@gmail.com>
 */

/* global jQuery, $, Utils, Prefixr */

(function($) {
  'use strict';

  /**
   * Represents a Slider instance
   * @constructor
   * @return {Object} Exposed methods
   */
  var Slider = function(selector, options) {

    /**
     * Slider container
     * @type {HTMLElement}
     */
    var element,

      /**
       * Items container (strip)
       * @type {HTMLElement}
       */
      itemsWrapper,

      /**
       * Slider viewport
       * @type {HTMLElement}
       */
      viewport,

      /**
       * Items collection
       * @type {NodeList}
       */
      items,

      /**
       * Previous button
       * @type {HTMLAnchorElement}
       */
      prevBtn,

      /**
       * Next button
       * @type {HTMLAnchorElement}
       */
      nextBtn,

      /**
       * Slider pagination
       * @type {HTMLElement}
       */
      pager,

      /**
       * Total of items
       * @type {Number}
       */
      numItems,

      /**
       * Steps to reach the end of the slider
       * @type {Number}
       */
      numSteps,

      /**
       * Current Item
       * @type {Number}
       */
      index = 0,

      /**
       * Transition size
       * @type {Number}
       */
      size,

      /**
       * Initial drag position
       * @type {Number}
       */
      initialPos = 0,

      /**
       * Previous drag position
       * @type {Number}
       */
      lastPos = 0,

      /**
       * Initial dragging coordinates (x,y)
       */
      initialCoords = {
        x: 0,
        y: 0
      },

      /**
       * Dragging enabled
       * @type {Boolean}
       */
      isDragging = false,

      /**
       * timer interval
       * @type {Number}
       */
      intervalID,

      /**
       * Default settings
       * @type {Enum}
       */
      SETTINGS = {
        wrapper: '.slider-mask',
        viewport: '.slider-viewport',
        items: 'li',
        prevBtn: '.prev-btn',
        nextBtn: '.next-btn',
        slides: 0,
        time: 0.5,
        single: false,
        pager: '.slider-pager li',
        showPager: true,
        arrows: !Utils.touch(),
        infinite: true,
        delta: 50,
        forceTouch: false,
        auto: false,
        duration: 3000
      },
      TEMPLATES = {
        pager: '<ul class="slider-pager"></ul>',
        pagerItem: '<li><a href="#">1</a></li>',
        prevButton: '<a href="#" class="prev-btn">&lt;</a>',
        nextButton: '<a href="#" class="next-btn">&gt;</a>'
      };

    /**
     * @construcs jda.Carousel
     */
    (function() {

      SETTINGS = $.extend(SETTINGS, options);
      
      element = $(selector)[0];

      if ($(selector).hasClass('sliderjs')) {
        return;
      }

      $(selector).addClass('sliderjs');

      itemsWrapper = element.querySelector(SETTINGS.wrapper);

      var tempViewport = $('<div class="slider-viewport"></div>').html(itemsWrapper).appendTo(element);

      viewport = tempViewport[0];

      items = itemsWrapper.querySelectorAll(SETTINGS.items);

      numItems = items.length;
      init();

      itemsWrapper.style.width = (itemsWrapper.querySelectorAll(SETTINGS.items).length * 100) + "%";

      element.style.visibility = 'visible';
      
      if (SETTINGS.auto) {
        startTimer();
      }
    }());

    function init() {
      resizeItems();
      $(window).on('resize', resizeItems);
    }

    /**
     * Add DOM listeners
     * @private
     */
    function addEventListeners() {
      if (Utils.touch() || SETTINGS.forceTouch) {
        viewport.addEventListener(UIEvent.START, startHandler, false);
        viewport.addEventListener(UIEvent.MOVE, moveHandler, false);
        viewport.addEventListener(UIEvent.END, endHandler, false);
      }

      if (SETTINGS.infinite) {
        viewport.addEventListener(Prefixr.transitionend, transitionEndHandler, true);
      }
      
      if (SETTINGS.arrows) {
        prevBtn.addEventListener(UIEvent.CLICK, prevBtn_clickHandler, false);
        nextBtn.addEventListener(UIEvent.CLICK, nextBtn_clickHandler, false);
      }
      
      if (!Utils.touch()) {
        document.body.addEventListener(UIEvent.END, releaseDragging, false);
        
        if (SETTINGS.showPager) {
          pager.find('a').off(UIEvent.CLICK).on(UIEvent.CLICK, pager_clickHandler);
        }
      }
    }

    /**
     * Add arrows to slider
     */
    function buildArrows() {
      if (SETTINGS.arrows) {
        $(TEMPLATES.prevButton + TEMPLATES.nextButton).appendTo(element);
      }

      prevBtn = element.querySelector(SETTINGS.prevBtn);
      nextBtn = element.querySelector(SETTINGS.nextBtn);
    }

    /**
     * Add pagination to slider
     */
    function buildPager() {
      var i = 0,
        items = '';

      for ( ; i < numSteps; i++ ) {
        items += TEMPLATES.pagerItem;
      }

      pager = $(TEMPLATES.pager).appendTo(element).append(items).find('li');
    }

    /**
     * Rotate slides
     */
    function startTimer() {
      intervalID = setTimeout(next, SETTINGS.duration);
    }

    /**
     * Resize carousel items
     */
    function resizeItems() {
      // If the slider container has a static width (fixed), stop repainting
      if (SETTINGS.single && typeof size !== 'undefined' && size === $(element).width()) {
        return;
      }

      // reset viewport width (ios7 fix)
      if (navigator.userAgent.match(/iPhone/i)) {
        $(viewport).width('auto');
      }

      var maxItems = Math.floor($(viewport).outerWidth(true) / $(items[0]).outerWidth(true));
      
      // Slider have the same slides per page
      if (!SETTINGS.single && maxItems === SETTINGS.slides) {
        return;
      }

      // remove navigation
      removeNavigation();

      SETTINGS.slides = maxItems;

      if (maxItems >= numItems) {
        SETTINGS.slides = numItems;
      }
      
      // get new carousel width
      if (!SETTINGS.single) {
        size = ((SETTINGS.slides * $(items[0]).outerWidth(true)));
      } else {
        size = $(element).width();
      }

      // set viewport width
      viewport.style.width = size + 'px';

      // Single view, expand items to the container width
      if (SETTINGS.single) {
        for (var i = 0 ; i < numItems; i++) {
          items[i].style.width = size + 'px';
        }

        SETTINGS.slides = 1;
      }
      
      // viewport larger than total items (disable slider)
      if (!SETTINGS.single && maxItems >= numItems) {
        return;
      }

      numSteps = (SETTINGS.single) ? numItems : numItems / SETTINGS.slides;

      // create arrows
      if (SETTINGS.arrows) {
        buildArrows();
      }

      // create pagination
      if (SETTINGS.showPager) {
        buildPager();
      }

      // enable event listeners
      addEventListeners();

      // add items to simulate the infinite scrolling effect
      if (SETTINGS.infinite) {
        $(itemsWrapper).find('.slider-clone').remove();
        var sliceAppend = $(items).slice(0, SETTINGS.slides).clone().addClass('slider-clone');
        var slicePrepend = $(items).slice(-SETTINGS.slides).clone().addClass('slider-clone');
        $(itemsWrapper).append(sliceAppend).prepend(slicePrepend);
        index = 1;
      } else {
        index = 0;
      }

      // disable transition
      changeTransition(0);
      // maintain slide position
      goTo(-size * index);
    
      // restart transition time (500ms)
      setTimeout(changeTransition, SETTINGS.time*1000, SETTINGS.time);
    }

    /**
     * Remove event listeners, arrows and pagination buttons
     */
    function removeNavigation() {
      // remove pager
      if (SETTINGS.showPager) {
        $(element).find('.slider-pager').remove();
      }

      if (Utils.touch() || SETTINGS.forceTouch) {
        // remove drag&drop handlers
        viewport.removeEventListener(UIEvent.START, startHandler, false);
        viewport.removeEventListener(UIEvent.MOVE, moveHandler, false);
        viewport.removeEventListener(UIEvent.END, endHandler, false);
      }

      if (SETTINGS.infinite) {
        viewport.removeEventListener(Prefixr.transitionend, transitionEndHandler, true);
      }
      
      // fix for desktop dragging
      if (!Utils.touch() && SETTINGS.forceTouch) {
        document.body.removeEventListener(UIEvent.END, releaseDragging, false);
      }

      // remove arrows
      if (SETTINGS.arrows && prevBtn && nextBtn) {
        prevBtn.removeEventListener(UIEvent.CLICK, prevBtn_clickHandler, false);
        nextBtn.removeEventListener(UIEvent.CLICK, nextBtn_clickHandler, false);
        $(prevBtn).remove();
        $(nextBtn).remove();
      }
    }

    /**
     * Go to next item
     */
    function next() {
      var position;

      if (SETTINGS.infinite) {
        index = (index + 1) % (numSteps + 2);
      } else {
        index = (index + 1 < numSteps - 1) ? index + 1 : numSteps - 1;
      }

      position = index;

      // is last page
      if (SETTINGS.infinite && (index-1) % numSteps < 1) {
        position -= (index-1) % numSteps;
      }

      goTo(-size * position);
    }

    /**
     * Go to prev item
     */
    function prev() {
      var position,
        tempSteps = Math.ceil(numSteps);

      if (SETTINGS.infinite) {
        index = (index - 1 + tempSteps) % tempSteps;
      } else {
        index = (index - 1 >= 0) ? index - 1 : 0;
      }

       position = index;

      // is first page
      if (SETTINGS.infinite && index === 0) {
        position += tempSteps % 1;
      }
      
      goTo(-size * position);
    }

    /**
     * Go to a selected index
     * @param  {Number} pos - New position
     */
    function goTo(pos) {
      itemsWrapper.style[Prefixr.transform] = 'translate3d(' + pos + 'px, 0, 0)';
      if (SETTINGS.showPager) {
        var newPage = (SETTINGS.infinite) ? Math.ceil(index-1): Math.ceil(index);
        setActivePage(newPage);
      }

      if (SETTINGS.auto) {
        clearInterval(intervalID);
        startTimer();
      }
    }

    /**
     * Change transition time
     * @param  {Number} time - The transition time
     */
    function changeTransition(time) {
      itemsWrapper.style[Prefixr.transition] = 'all ' + time + 's';
    }

    /**
     * Update pager
     */
    function setActivePage(pageIndex) {
      pager.find('a').removeClass('active');
      $(pager.get(pageIndex)).find('a').addClass('active');
    }

    /**
     * Animation ended
     */
    function transitionEndHandler() {
      // Detect current position
      var pos = Utils.getTranslateCoordinate(itemsWrapper.style[Prefixr.transform], 'x');
     
      // start
      if (pos > -size) {
        changeTransition(0);
        index = Math.ceil(numSteps);
        goTo(-size * numSteps);
      }
      // end
      if (-pos >= Math.floor(size * (numSteps+1))) {
        changeTransition(0);
        index = 1;
        goTo(-size * index);
      }

      setTimeout(changeTransition, 0, SETTINGS.time);
    }

    /**
     * Previous button clicked
     * @event
     */
    function prevBtn_clickHandler(e) {
      e.preventDefault();
      prev();
    }

    /**
     * Next button clicked
     * @event
     */
    function nextBtn_clickHandler(e) {
      e.preventDefault();
      next();
    }

    /**
     * Pager button clicked
     * @event
     */
    function pager_clickHandler(e) {
      e.preventDefault();
      var link = $(e.target),
        pagerIndex = link.closest('ul').find('li').index(link.closest('li'));

      index = pagerIndex+1;

      goTo(-size * index);
    }

    /**
     * Start dragging
     * @event
     */
    function startHandler(e) {
      initialCoords.x =  e.touches ? e.touches[0].pageX : e.clientX;
      initialCoords.y =  e.touches ? e.touches[0].pageY : e.clientY;

      isDragging = true;
      initialPos = initialCoords.x;
      
      lastPos = initialPos;
    }

    /**
     * Move wrapper
     * @event
     */
    function moveHandler(e) {
      if (!isDragging) {
        return;
      } else {
        var currentDragPos = e.touches ? e.touches[0].pageX : e.clientX,
          currentDragPosY = e.touches ? e.touches[0].pageY : e.clientY,
          isScrolling = Math.abs(currentDragPos - initialCoords.x) < Math.abs(currentDragPosY - initialCoords.y);
        
        // user is scrolling window? (stop slider)
        if (isScrolling) {
          return;
        }

        e.preventDefault();
        e.stopPropagation();
      
        changeTransition(0);
        var pos = Utils.getTranslateCoordinate(itemsWrapper.style[Prefixr.transform], 'x');
          

        goTo(pos - lastPos + currentDragPos);
        lastPos = currentDragPos;
      }
    }

    /**
     * Stop dragging
     * @event
     */
    function endHandler(e) {
      e.stopPropagation();
      
      if (!isDragging) {
        return;
      }
      var currentDragPos = e.changedTouches ? e.changedTouches[0].pageX : e.clientX;
      isDragging = false;

      changeTransition(SETTINGS.time);

      // move to next item
      if (initialPos - currentDragPos > SETTINGS.delta) {
        next();
        // move to prev item
      } else if (initialPos - currentDragPos < -SETTINGS.delta) {
        prev();
        // go to current item
      } else {
        goTo(-size * index);
      }
    }

    /**
     * Stop dragging (body)
     * @event
     */
    function releaseDragging(e) {
      e.preventDefault();
      
      if (!isDragging) {
        return;
      }
      isDragging = false;
      changeTransition(SETTINGS.time);
      goTo(-size * index);
    }

    // public methods and properties
    return element;
  };

  $.fn.slider = function(options) {
    return this.each(function(index, item) {
      return new Slider(item, options);
    });
  };

}(jQuery || $));