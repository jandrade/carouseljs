/**
 * @fileOverview Slider plugin
 * @author Juan Andrade <juandavidandrade@gmail.com>
 */

/* global Utils, Prefixr */

(function(bite) {
  'use strict';

  /**
   * Represents a Slider instance
   * @constructor
   * @return {Object} Exposed methods
   */
  bite.Slider = function(selector, options) {

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
       * Current page number
       * @type {Number}
       */
      page,
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
            w: 3
          },
          { s: 460,
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
            w: 12
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
        clone: '.slider-clone',
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
        viewport: '<div class="slider-viewport"></div>',
        pager: '<ul class="slider-pager"></ul>',
        pagerItem: '<li><a href="#">1</a></li>',
        prevButton: '<a href="#" class="prev-btn">&lt;</a>',
        nextButton: '<a href="#" class="next-btn">&gt;</a>'
      };

    /**
     * @construcs jda.Carousel
     */
    (function() {
      SETTINGS = bite.utils.extend(SETTINGS, options);
      element = (typeof selector === 'string') ? document.querySelector(selector) : selector;

      if (element.classList.contains('sliderjs')) {
        return;
      }

      element.classList.add('sliderjs');

      itemsWrapper = element.querySelector(SETTINGS.wrapper);

      viewport = document.createElement('div');
      viewport.classList.add('slider-viewport');
      viewport.appendChild(itemsWrapper);
      
      element.appendChild(viewport);

      items = itemsWrapper.querySelectorAll(SETTINGS.items);

      numItems = items.length;

      index = (SETTINGS.infinite) ? 1 : 0;
      
      init();

      element.style.visibility = 'visible';

      if (SETTINGS.auto) {
        startTimer();
      }
    }());

    function init() {
      resizeItems();
      
      window.addEventListener(UIEvent.RESIZE, resizeItems);

      isSliding = false;

      element.addEventListener("mousewheel", function(e) {
        if (isSliding) {
         // e.preventDefault();
          return;
        }
        e.preventDefault();
        e.stopPropagation();

     
        if (e.deltaY > 0) {
          next();
        } else {
          prev();
        }
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

      if (SETTINGS.forceTouch) {
        var images = itemsWrapper.querySelectorAll('img');

        for (var i = images.length - 1; i >= 0; i--) {
          images[i].addEventListener(UIEvent.START, function(e) {
            e.preventDefault();
          });
        };
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
          pager.addEventListener(UIEvent.CLICK, function(e) {
            e.preventDefault();
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

    function createButton(className, content) {
      var a = document.createElement('a');
      a.href = '#';
      a.className = className;
      a.innerHTML = content;
      return a;
    }

    /**
     * [createElement description]
     * @param  {[type]} className [description]
     * @param  {[type]} content   [description]
     * @return {[type]}           [description]
     *
     * <ul class="slider-pager"></ul>
     */
    function createElement(className, content, elementType) {
      var e = document.createElement(elementType || 'div');
      if (className !== '') {
        e.classList.add(className);  
      }
      
      if (typeof content !== 'undefined') {
        e.innerHTML = content;
      }

      return e;
    }

    /**
     * Add arrows to slider
     */
    function buildArrows() {
      if (SETTINGS.arrows) {
        prevBtn = element.appendChild(createButton('prev-btn', '&lt;'));
        nextBtn = element.appendChild(createButton('next-btn', '&gt;'));
      }
    }

    /**
     * Add pagination to slider
     */
    function buildPager() {
      var i = 0,
        pagerItems = '',
        fragment = document.createDocumentFragment();

      for ( ; i < numSteps; i++ ) {
        pagerItems = createElement('', '', 'li');
        pagerItems.appendChild(createButton('', '1'));
        fragment.appendChild(pagerItems);
      }
      
      if (typeof pager === 'undefined') {
        pager = element.appendChild(createElement('slider-pager', '', 'ul'));
      }

      pager.appendChild(fragment);

      page = undefined;

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
      var curBreakpoint = getBreakpoint(window.innerWidth),
        i = 0,
        clones = element.querySelectorAll(SETTINGS.clone),
        numItems = items.length;

      if (SETTINGS.single) {
        curBreakpoint = 1;
      }

      // disable carousel
      if (curBreakpoint > numItems) {
        // remove pager
        if (typeof pager !== 'undefined') {
          pager.innerHTML = '';
        }

        // remove cloned elements
        bite.utils.remove(clones);
        index = 0;
        curBreakpoint = numItems;
      }

      // get new carousel width
      size = element.offsetWidth;
      
      for ( ; i < numItems; i++ ) {
        items[i].style.width = size/curBreakpoint + 'px';
      }

      for (i = clones.length - 1; i >= 0; i--) {
        clones[i].style.width = size/curBreakpoint + 'px';
      }
      
      itemsWrapper.style.width = (SETTINGS.infinite) ? ((numItems+4)*100) + '%' : (numItems*100) + '%';

      numSteps = numItems / curBreakpoint;


      if (SETTINGS.vertical) {
        setTimeout(function() {
          // set viewport height
          viewport.style.height = items[0].offsetHeight + 'px';
          size = items[0].offsetHeight;
        }, 1000);
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

      // add items to simulate the infinite scrolling effect
      if (SETTINGS.infinite) {
        var clones = element.querySelectorAll(SETTINGS.clone);
      
        bite.utils.remove(clones);

        var sliceA = Array.prototype.slice.call(items).slice(0, curBreakpoint),
          slicePrepend = Array.prototype.slice.call(items).slice(-curBreakpoint),
          clonedAppend = bite.utils.clone(sliceA, 'slider-clone'),
          clonedPrepend = bite.utils.clone(slicePrepend, 'slider-clone');
        
        // add clones
        bite.utils.append(itemsWrapper, clonedAppend);
        bite.utils.prepend(itemsWrapper, clonedPrepend);
      }

      hasPager = true;
      
      // create pagination
      if (SETTINGS.showPager) {
        // remove pager
        if (typeof pager !== 'undefined') {
          pager.innerHTML = '';
        }
        
        buildPager();
      }

      // create arrows
      if (SETTINGS.arrows && typeof prevBtn === 'undefined') {
        buildArrows();
      }
      
      addEventListeners();  
      
    }

    /**
     * Remove event listeners, arrows and pagination buttons
     */
    function removeNavigation() {
      
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
      if (SETTINGS.arrows && prevBtn) {
        prevBtn.removeEventListener(UIEvent.CLICK, prevBtn_clickHandler, false);
        nextBtn.removeEventListener(UIEvent.CLICK, nextBtn_clickHandler, false);
        element.removeChild(prevBtn);
        element.removeChild(nextBtn);

        prevBtn = undefined;
        nextBtn = undefined;
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
      if (page === pageIndex) {
        return;
      }
      if (pager.querySelector('.active')) {
        pager.querySelector('.active').classList.remove('active');  
      }

      page = pageIndex;
      
      if (typeof pager.querySelectorAll('li')[pageIndex] !== 'undefined') {
        pager.querySelectorAll('li')[pageIndex].querySelector('a').classList.add('active');
      }
    }

    /**
     * Animation ended
     */
    function transitionEndHandler() {
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
      var pagerIndex = bite.utils.index(e.target.parentNode, '.slider-pager');

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
      e.preventDefault();
      
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

}(window.bite = window.bite || {}));