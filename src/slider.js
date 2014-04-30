/**
 * @fileOverview Slider plugin
 * @author Juan Andrade <juandavidandrade@gmail.com>
 */

/* global bite, Prefixr */

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
      itemsContainer,

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
       * Validates if the slider should include the pager
       * @type {Boolean}
       */
      hasPager = false,

      /**
       * Validates if the component is sliding
       * @type {Boolean}
       */
      isSliding = false,

      /**
       * timer interval
       * @type {Number}
       */
      intervalID,

      /**
       * Current breakpoint
       */
      breakpoint,

      /**
       * Private Constants
       * @type {Enum}
       */
      CLASSES = {
        main: 'bite-slider-init',
        built: 'bite-slider-built'
      },

      /**
       * Default settings
       * @type {Enum}
       */
      SETTINGS = {
        // DOM references
        collection: '.bite-slider-items',
        viewport: 'bite-slider-viewport',
        items: 'li',
        prevBtn: 'bite-prev-btn',
        nextBtn: 'bite-next-btn',
        clone: 'bite-slider-clone',
        active: 'bite-active',
        pager: 'bite-slider-pager',
        // logic
        time: 0.5,
        single: false,
        showPager: true,
        arrows: !bite.utils.touch(),
        infinite: true,
        delta: 50,
        forceTouch: false,
        auto: false,
        duration: 3000,
        vertical: false,
        // responsive
        breakpoints: [
          { width: 220,
           items: 3
          },
          { width: 460,
           items: 4
          },
          { width: 768,
           items: 3
          },
          { width: 900,
           items: 4
          },
          { width: 1024,
           items: 5
          },
          { width: 1200,
           items: 12
          }
        ]
      };

    /**
     * @construcs bite.Slider
     */
    (function() {
      SETTINGS = bite.utils.extend(SETTINGS, options);

      element = (typeof selector === 'string') ? document.querySelector(selector) : selector;

      if (element.classList.contains(CLASSES.main)) {
        return;
      }

      element.classList.add(CLASSES.main);

      itemsContainer = element.querySelector(SETTINGS.collection);

      // create viewport
      viewport = document.createElement('div');
      viewport.classList.add(SETTINGS.viewport);
      viewport.appendChild(itemsContainer);
      // add viewport to main container
      element.appendChild(viewport);

      items = itemsContainer.querySelectorAll(SETTINGS.items);

      numItems = items.length;

      index = (SETTINGS.infinite) ? 1 : 0;
      
      init();

      if (SETTINGS.auto) {
        startTimer();
      }
    }());

    function init() {
      

      var images = itemsContainer.querySelectorAll('img');
      
      numImages = images.length;

      if (numImages > 0) {
        for (var i = numImages - 1; i >= 0; i--) {
          images[i].addEventListener('load', checkLoadedImages);
          if (SETTINGS.forceTouch) {
            images[i].addEventListener(bite.UIEvent.START, preventImageDragging);
          }
        }
      } else {
        buildComponent();
      }
    }

    var numImages,
      currentImage = 0;

    function checkLoadedImages(e) {
      currentImage++;
      if (currentImage >= numImages) {
        buildComponent();
      }
    }

    function buildComponent() {

      defaultSize = items[0].offsetWidth;

      element.classList.add(CLASSES.built);

      resizeItems();
      
      isSliding = false;

      window.addEventListener(bite.UIEvent.RESIZE, resizeItems);
      element.addEventListener("mousewheel", mousewheelHandler, false);
    }

    /**
     * Add DOM listeners
     * @private
     */
    function addEventListeners() {
      if (bite.utils.touch() || SETTINGS.forceTouch) {
        viewport.addEventListener(bite.UIEvent.START, startHandler, false);
        viewport.addEventListener(bite.UIEvent.MOVE, moveHandler, false);
        viewport.addEventListener(bite.UIEvent.END, endHandler, false);
      }

      if (SETTINGS.infinite) {
        viewport.addEventListener(Prefixr.transitionend, transitionEndHandler, false);
      }
      
      if (SETTINGS.arrows) {
        prevBtn.addEventListener(bite.UIEvent.CLICK, prevBtn_clickHandler, false);
        nextBtn.addEventListener(bite.UIEvent.CLICK, nextBtn_clickHandler, false);
      }
      
      if (!bite.utils.touch()) {
        document.body.addEventListener(bite.UIEvent.END, releaseDragging, false);
        
        if (SETTINGS.showPager && hasPager) {
          pager.addEventListener(bite.UIEvent.CLICK, function(e) {
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
      var c = SETTINGS.breakpoints.length,
        i = 0,
        curBreakpoint = -1;

      while (i < c) {
        if (SETTINGS.breakpoints[i].width >= winSize) {
          curBreakpoint = SETTINGS.breakpoints[i].items;
          break;
        }
        i++;
      }

      return curBreakpoint;
    }

    /**
     * Creates a link
     * @param  {String} className The associated class
     * @param  {String} content   the data
     * @return {HTMLElement}
     */
    function createButton(className, content) {
      var a = document.createElement('a');
      a.href = '#';
      a.className = className;
      a.innerHTML = content;
      return a;
    }

    /**
     * Creates a DOM element
     * @param  {String} className The class
     * @param  {String} content   The data
     * @return {HTMLElement}
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
        prevBtn = element.appendChild(createButton(SETTINGS.prevBtn, '&lt;'));
        nextBtn = element.appendChild(createButton(SETTINGS.nextBtn, '&gt;'));
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
        pager = element.appendChild(createElement(SETTINGS.pager, '', 'ul'));
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

    var defaultSize = 0;
    /**
     * Resize carousel items
     */
    function resizeItems() {
      var curBreakpoint = getBreakpoint(window.innerWidth),
        i = 0,
        clones = element.querySelectorAll('.' + SETTINGS.clone),
        numItems = items.length;

      // get new carousel width
      size = element.offsetWidth;

      // no breakpoint detected, handle automatically items
      if (curBreakpoint < 0) {
        var maxItems = Math.floor(element.offsetWidth / defaultSize);
        curBreakpoint = maxItems;
      }

      if (SETTINGS.single) {
        curBreakpoint = 1;
      } else {
        if (size/curBreakpoint < defaultSize) {
          curBreakpoint = Math.floor(element.offsetWidth / defaultSize);
        }
      }
      
      // disable carousel
      if (curBreakpoint >= numItems) {
        // remove pager
        if (typeof pager !== 'undefined') {
          pager.innerHTML = '';
        }

        // remove cloned elements
        bite.dom.remove(clones);
        index = 0;
        curBreakpoint = numItems;
      }

      for ( ; i < numItems; i++ ) {
        items[i].style.width = size/curBreakpoint + 'px';
      }

      for (i = clones.length - 1; i >= 0; i--) {
        clones[i].style.width = size/curBreakpoint + 'px';
      }
      
      if (!SETTINGS.vertical) {
        itemsContainer.style.width = (SETTINGS.infinite) ? ((numItems+4)*100) + '%' : (numItems*100) + '%';
      }

      numSteps = numItems / curBreakpoint;


      if (SETTINGS.vertical) {
        // set viewport height
        viewport.style.height = items[0].offsetHeight + 'px';
        size = items[0].offsetHeight;
      
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
        var clones = element.querySelectorAll('.' + SETTINGS.clone);
      
        bite.dom.remove(clones);

        var sliceA = Array.prototype.slice.call(items).slice(0, curBreakpoint),
          slicePrepend = Array.prototype.slice.call(items).slice(-curBreakpoint),
          clonedAppend = bite.dom.clone(sliceA, SETTINGS.clone),
          clonedPrepend = bite.dom.clone(slicePrepend, SETTINGS.clone);
        
        // add clones
        bite.dom.append(itemsContainer, clonedAppend);
        bite.dom.prepend(itemsContainer, clonedPrepend);
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
      
      if (bite.utils.touch() || SETTINGS.forceTouch) {
        // remove drag&drop handlers
        viewport.removeEventListener(bite.UIEvent.START, startHandler, false);
        viewport.removeEventListener(bite.UIEvent.MOVE, moveHandler, false);
        viewport.removeEventListener(bite.UIEvent.END, endHandler, false);
      }

      if (SETTINGS.infinite) {
        viewport.removeEventListener(Prefixr.transitionend, transitionEndHandler, false);
      }
      
      // fix for desktop dragging
      if (!bite.utils.touch() && SETTINGS.forceTouch) {
        document.body.removeEventListener(bite.UIEvent.END, releaseDragging, false);
      }
      
      // remove arrows
      if (SETTINGS.arrows && prevBtn) {
        prevBtn.removeEventListener(bite.UIEvent.CLICK, prevBtn_clickHandler, false);
        nextBtn.removeEventListener(bite.UIEvent.CLICK, nextBtn_clickHandler, false);
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
        itemsContainer.style[Prefixr.transform] = 'translate3d(' + pos + 'px, 0, 0)';
      } else {
        itemsContainer.style[Prefixr.transform] = 'translate3d(0, ' + pos + 'px, 0)';
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
      itemsContainer.style[Prefixr.transition] = 'all ' + time + 's';
    }

    /**
     * Update pager
     */
    function setActivePage(pageIndex) {
      if (page === pageIndex) {
        return;
      }
      if (pager.querySelector('.' + SETTINGS.active)) {
        pager.querySelector('.' + SETTINGS.active).classList.remove(SETTINGS.active);  
      }

      page = pageIndex;
      
      if (typeof pager.querySelectorAll('li')[pageIndex] !== 'undefined') {
        pager.querySelectorAll('li')[pageIndex].querySelector('a').classList.add(SETTINGS.active);
      }
    }

    /**
     * Gets the current position
     * @return {Number}
     */
    function getCurrentPosition() {
      // Detect current position
      var posType = !SETTINGS.vertical ? 'x' : 'y';

      return bite.utils.getTranslateCoordinate(itemsContainer.style[Prefixr.transform], posType);
    }

    /** ------------------------------------------
     * Event Handlers
     * ------------------------------------------ */

    /**
     * Disables image dragging
     * @event
     */
    function preventImageDragging(e) {
      e.preventDefault();
    }

    /**
     * Allows to navigate through the mouse wheel
     * @event
     */
    function mousewheelHandler(e) {
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
    }

    /**
     * Animation ended
     */
    function transitionEndHandler() {
      var pos = getCurrentPosition();
      
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
      // get selected page index
      var pagerIndex = bite.dom.index(e.target.parentNode, element.querySelector('.' + SETTINGS.pager));

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
     * Move collection
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
        
        // is user scrolling the document? (lock slider)
        if (isScrolling) {
          return;
        }

        e.preventDefault();
        e.stopPropagation();
      
        changeTransition(0);
        
        // get current position
        var pos = getCurrentPosition();

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
    return {
      next: next,
      prev: prev,
      goTo: goTo
    };
  };

}(window.bite = window.bite || {}));