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

      breakpoint,

      BREAKPOINTS = [
          { s: 220,
            w: 1
          },
          { s: 580,
            w: 4
          },
          { s: 768,
            w: 3
          },
          { s: 900,
            w: 4
          },
          { s: 1024,
            w: 5
          },
          { s: 1200,
            w: 7
          }
        ],

      hasPager = false,

      isSliding = false,

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
        duration: 3000,
        vertical: false
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

     /*
      itemsWrapper.style.width = (itemsWrapper.querySelectorAll(SETTINGS.items).length * 100) + "%";
    */
      element.style.visibility = 'visible';

      if (SETTINGS.auto) {
        startTimer();
      }
    }());

    function init() {
      resizeItems();
      $(window).on('resize', resizeItems);

      element.addEventListener("mousewheel", function(e) {
        if (isSliding) {
         // e.preventDefault();
          return;
        }

        //console.log("ee: ", e);

        /*if (e.deltaY > 0) {
          next();
        } else {
          prev();
        }*/
      }, false);
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
        viewport.addEventListener(Prefixr.transitionend, transitionEndHandler, false);
      }
      
      if (SETTINGS.arrows) {
        prevBtn.addEventListener(UIEvent.CLICK, prevBtn_clickHandler, false);
        nextBtn.addEventListener(UIEvent.CLICK, nextBtn_clickHandler, false);
      }
      
      if (!Utils.touch()) {
        document.body.addEventListener(UIEvent.END, releaseDragging, false);
        
        if (SETTINGS.showPager && hasPager) {
          console.log("has pager: ", element.querySelector('.slider-pager'));
          element.querySelector('.slider-pager').addEventListener(UIEvent.CLICK, function(e) {
            e.preventDefault();
            console.log("clicked!!!!");
            if (e.target.nodeName === 'A') {
              pager_clickHandler(e);
            }            
          }, false);
        }
      }
    }

    /**
     * Gets the current breakpoint, according to the window width
     * @param  {Number} size - Current window width
     * @return {Number} Returns the current breakpoint
     */
    function getBreakpoint(winSize) {
      var c = BREAKPOINTS.length,
        curBreakpoint;

      while (c-- > 0) {
        if (winSize > BREAKPOINTS[c].s) {
          curBreakpoint = BREAKPOINTS[c].w;
          break;
        }
      }

      return curBreakpoint;
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
      
      if (typeof pager == 'undefined') {
        pager = $(TEMPLATES.pager).appendTo(element);
      }

      pager.append(items);

      setActivePage(0);
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
      var curBreakpoint = getBreakpoint($(window).width());
      
      $(items).width($(element).outerWidth(true)/curBreakpoint);
      
      itemsWrapper.style.width = ($(element).outerWidth(true) * (numItems+4/curBreakpoint)) + 'px';

      // get new carousel width
      size = $(element).outerWidth(true);
      
      
      numSteps = numItems / curBreakpoint;

      // add items to simulate the infinite scrolling effect
      if (SETTINGS.infinite) {
        $(itemsWrapper).find('.slider-clone').remove();
        var sliceAppend = $(items).slice(0, curBreakpoint).clone().addClass('slider-clone');
        var slicePrepend = $(items).slice(-curBreakpoint).clone().addClass('slider-clone');
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

    
      // new breakpoint detected
      if (curBreakpoint === breakpoint) {
        return;
      }

      breakpoint = curBreakpoint;

      // viewport larger than total items (disable slider)
      if (curBreakpoint >= numItems) {
        hasPager = false;
        // remove navigation
        removeNavigation();
        return;
      }

      hasPager = true;
      
      // create pagination
      if (SETTINGS.showPager) {
        // remove pager
        $(element).find('.slider-pager').html('');
        buildPager();
      }

      // create arrows
      if (SETTINGS.arrows && typeof prevBtn === 'undefined') {
        buildArrows();
        // enable event listeners
        addEventListeners();  
      }
      
    }

    function resizeItems2() {
      // If the slider container has a static width (fixed), stop repainting
      if (SETTINGS.single && typeof size !== 'undefined' && size === $(element).width()) {
        return;
      }

      var maxItems = Math.floor($(element).outerWidth(true) / $(items[0]).outerWidth(true));

      // Slider have the same slides per page
      if (!SETTINGS.single && (maxItems === 0 || maxItems === SETTINGS.slides)) {
        viewport.style.width = ((SETTINGS.slides * $(items[0]).outerWidth(true))) + 'px';
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

      if (!SETTINGS.vertical) {
        // set viewport width
        viewport.style.width = size + 'px';  
      } else {
        setTimeout(function() {
          // set viewport height
          viewport.style.height = $(items[0]).outerHeight() + 'px';
          size = ((SETTINGS.slides * $(items[0]).outerHeight(true)));
        }, 1000);
      }
      

      // Single view, expand items to the container width
      if (SETTINGS.single) {
        for (var i = 0 ; i < numItems; i++) {
          items[i].style.width = size + 'px';
        }

        SETTINGS.slides = 1;
      }

      // viewport larger than total items (disable slider)
      if (!SETTINGS.single && maxItems >= numItems) {
        $(itemsWrapper).find('.slider-clone').remove();
        changeTransition(0);
        goTo(0);
        hasPager = false;
        return;
      }

      hasPager = true;

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
        //$(element).find('.slider-pager').html('');
      }

      if (Utils.touch() || SETTINGS.forceTouch) {
        // remove drag&drop handlers
        viewport.removeEventListener(UIEvent.START, startHandler, false);
        viewport.removeEventListener(UIEvent.MOVE, moveHandler, false);
        viewport.removeEventListener(UIEvent.END, endHandler, false);
      }

      if (SETTINGS.infinite) {
        viewport.removeEventListener(Prefixr.transitionend, transitionEndHandler, false);
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
      isSliding = true;

      if (!SETTINGS.vertical) {
        itemsWrapper.style[Prefixr.transform] = 'translate3d(' + pos + 'px, 0, 0)';
      } else {
        itemsWrapper.style[Prefixr.transform] = 'translate3d(0, ' + pos + 'px, 0)';
      }

      if (SETTINGS.showPager && hasPager) {
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
      $(pager.find('li').get(pageIndex)).find('a').addClass('active');
    }

    /**
     * Animation ended
     */
    function transitionEndHandler() {
      console.log("transition end!!");
      // Detect current position
      var pos = !SETTINGS.vertical ? Utils.getTranslateCoordinate(itemsWrapper.style[Prefixr.transform], 'x') : Utils.getTranslateCoordinate(itemsWrapper.style[Prefixr.transform], 'y');
     
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

      isSliding = false;
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
      initialPos = SETTINGS.vertical ? initialCoords.y : initialCoords.x;
      
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
        var currentDragPosX = e.touches ? e.touches[0].pageX : e.clientX,
          currentDragPosY = e.touches ? e.touches[0].pageY : e.clientY,
          diffX = Math.abs(currentDragPosX - initialCoords.x),
          diffY = Math.abs(currentDragPosY - initialCoords.y),
          currentDragPos = SETTINGS.vertical ? currentDragPosY : currentDragPosX,
          isScrolling = SETTINGS.vertical ? diffX > diffY : diffX < diffY;
        
        // user is scrolling window? (stop slider)
        if (isScrolling) {
          return;
        }

        e.preventDefault();
        e.stopPropagation();
      
        changeTransition(0);
        var pos = SETTINGS.vertical ? Utils.getTranslateCoordinate(itemsWrapper.style[Prefixr.transform], 'y') : Utils.getTranslateCoordinate(itemsWrapper.style[Prefixr.transform], 'x');

          

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
      var currentDragPosX = e.changedTouches ? e.changedTouches[0].pageX : e.clientX,
        currentDragPosY = e.changedTouches ? e.changedTouches[0].pageY : e.clientY,
        currentDragPos = SETTINGS.vertical ? currentDragPosY : currentDragPosX;

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