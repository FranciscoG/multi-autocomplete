(function(){
  "use strict";

  /**
   * In this part of the lib I'm using jQuery for backwards 
   * browser compatibility, mainly for these:
   *
   * $.extend  - instead of using Object.assign
   * $.proxy   - instead of function.bind()
   * $.grep    - instead of Array.filter
   * $.on      - instead of addEventListener and event delegation
   * $         - instead of querySelector and querySelectorAll
   *
   * I'm considering maybe just adding a polyfills.js and converting 
   * this all to vanilla JS.  But for now I'm sticking to jQuery
   * I really don't want to deal with all the things jQuery fixes
   */

  /* global jQuery */

  function PreviewHandler(options){
    if (!(this instanceof PreviewHandler)) {
      return new PreviewHandler(options);
    }

    /**
     * Default options
     * @type {Object}
     */
    var defaults = {
      output: null, // will be required 
      input: null, // will be required 
      outputDom : "li",
      activeClass : "active",
      beforeReplace: null,
      getActiveText : null,
      outputTemplate : null
    };

    /**
     * merge options and defaults where user options will
     * override internal defaults
     * @type {Object}
     */
    this.opts = Object.assign({},  defaults, options);

    this.keys = {
      up        : 38,
      down      : 40,
      left      : 37,
      right     : 39,
      enter     : 13,
      esc       : 27,
      tab       : 9,
      shiftKey  : 16,
      backspace : 8,
      del       : 46,
      space     : 32,
      ctrl      : 17
    };

    this.states = {
      isPreviewing : false,
      inputHasFocus: false,
      hasCancelled: false
    };

    this.modKeys = {
      ctrlDown : false,
      shiftDown : false
    };

  }

  PreviewHandler.prototype = {
    
    init: function(){
      /**
       * Caching important DOM nodes when we need to use
       * straight up Javascript instead of jQuery
       * @type {[type]}
       */
      
      this.inputNode = document.querySelector(this.opts.input);
      this.outputNode = document.querySelector(this.opts.output);

      var reqs = this.checkRequirements();
      if (!reqs) {
        return;
      }
      
     
      this.outputNode.tabIndex = 0;

      this.inputNode.addEventListener('keydown', this.onInputKeydown.bind(this));

      document.addEventListener('keyup', this.modifierKeysUp.bind(this));
      document.addEventListener('keydown', this.modifierKeysDown.bind(this));

      this.outputNode.addEventListener('click', this.onClickPick.bind(this));
      this.outputNode.addEventListener('keydown', this.outputKeyup.bind(this));
    },

    checkRequirements: function(){
      var result = true;
      if (!this.opts.input || !this.inputNode) {
        this.warn("input option not provided or element is missing");
        result = false;
      }
      if (!this.opts.output || !this.outputNode) {
        this.warn("preview container not provided or element is missing");
        result = false;
      }
      return result;
    },

    warn: function(stuff){
      throw new Error(stuff);
    },

    modifierKeysDown: function(e) {
      if (e.keyCode === this.keys.ctrl) {
        this.modKeys.ctrlDown = true;
      }
      if (e.keyCode === this.keys.shiftKey) {
        this.modKeys.shiftKey = true;
      }
    },

    modifierKeysUp : function (e) {
      if (e.keyCode === this.keys.ctrl) {
        this.modKeys.ctrlDown = false;
      }
      if (e.keyCode === this.keys.shiftKey) {
        this.modKeys.shiftKey = false;
      }
    },

    outputKeyup: function(e){
      this.states.inputHasFocus = false;
      return this.handleKeys(e);
    },

    onInputKeydown: function(e){
      this.states.inputHasFocus = true;
      return this.handleKeys(e);
    },

    handleKeys: function(e) {
      switch (e.keyCode) {
        case this.keys.up:
          if (this.states.isPreviewing) {
            e.preventDefault();
            this.navPreview(-1);
            return false;
          }
          break;
        case this.keys.tab:
        case this.keys.down:
          // if preview Items lengh === 1 do like selecting word
          if (this.info.filteredDataLength === 1) {
            this.useActiveText();
            this.clearPreview(true);
            e.preventDefault();
            return false;
          } 

          if (this.states.isPreviewing) {
            e.preventDefault();
            this.navPreview(1);
            return false;
          }
          break;
        case this.keys.right:
          if (this.modKeys.ctrlDown || this.modKeys.shiftDown || e.shiftKey || e.ctrlKey) {
              return true;
          }
          if (this.states.isPreviewing) {
            this.useActiveText();
            this.clearPreview(true);
            e.preventDefault();
            return false;
          }
          break;
        case this.keys.enter:
          if (this.states.isPreviewing) {
            this.useActiveText();
            e.preventDefault();
            e.stopImmediatePropagation();
          }
          this.clearPreview();
          break;
        case this.keys.esc:
          if (this.states.isPreviewing) {
            this.clearPreview(true);
            this.states.isPreviewing = false;
            this.states.hasCancelled = true;
            return false;
          }
          break;
        case this.keys.space:
          this.states.hasCancelled = false;
          this.states.isPreviewing = false;
          this.clearPreview();
          break;
        default:
          this.states.isPreviewing = false;
          return true;
      }
      return true;
    },

    clearPreview: function(hide) {
      this.outputNode.innerHTML = "";
      this.states.isPreviewing = false;
      if (hide){
        this.outputNode.style.display = "none";
      }
    },

    addToPreview: function(filteredData) {
      console.log(filteredData);

      if (this.states.hasCancelled || filteredData.length === 0) {
        this.clearPreview(true);
        return false;
      }
      
      this.clearPreview();
      this.states.isPreviewing = true;
      var self = this;

      var tmpFrag = document.createDocumentFragment();
      filteredData.forEach(function(el, i, arr){
        var item = document.createElement(self.opts.outputDom);
        
        if (typeof self.opts.outputTemplate === "function") {
          item.innerHTML = self.opts.outputTemplate(self.info.activeMarker, el);
        } else {
          item.textContent = el;
        }
        
        if (i === 0) { item.classList.add(self.opts.activeClass); }

        item.tabIndex = 0;
        tmpFrag.appendChild(item);
      });

      this.outputNode.appendChild(tmpFrag);
      this.outputNode.style.display = "block";
      this.collection = this.outputNode.children;
    },

    getIndex: function(node) {
      var children = node.parentNode.childNodes;
      var num = 0;
      for (var i=0; i<children.length; i++) {
          if (children[i]===node) { return num; }
          if (children[i].nodeType===1) { num++; }
      }
      return -1;
    },

    navPreview: function(incrementBy) {
      var activeIndex = this.getIndex(this.outputNode.querySelector("." + this.opts.activeClass));
      var newItem = activeIndex + incrementBy;

      var childLen = this.collection.length;
      if (newItem < 0) {
        newItem = childLen - 1;
      } else if (newItem > childLen - 1) {
        newItem = 0;
      }

      var self = this;
      var collection = Array.prototype.slice.call(this.collection);
      collection.forEach(function(el,i,ar){
        el.classList.remove(self.opts.activeClass);
        if (i === newItem) {
          el.classList.add(self.opts.activeClass);
        }
      });
      this.useActiveText();
    },

    // probably should rename this to differ from the option
    getActiveText: function(andScroll){
      var newActive = this.outputNode.querySelector("." + this.opts.activeClass);
      if (andScroll) {
        this.scrollOutput(newActive);
      }
      var newText;
      if (typeof this.opts.getActiveText === "function") {
        newText = this.opts.getActiveText(newActive);
      } else {
        newText = newActive.textContent;
      }
      return newText;
    },

    useActiveText: function(){
      var newText = this.getActiveText(true);
      this.replaceInPlace(newText);
    },

    onClickPick: function(e){
      var clickedEl = e.target;
      if(clickedEl.tagName.toLowerCase() !== this.opts.outputDom.toLowerCase()) {
        return;
      }
      var newText;
      if (typeof this.opts.getActiveText === "function") {
        newText = this.opts.getActiveText( e.target );
      } else {
        newText = e.target.textContent;
      }

      this.replaceInPlace(newText);
      this.clearPreview(true);
    },

    scrollOutput: function(elem){
      if (elem) {
        elem.scrollIntoView(false);
      }
    },

    replaceInPlace: function(str){
      var val = this.info.val;
      if (typeof this.opts.beforeReplace === "function") {
        str = this.opts.beforeReplace(this.info.activeMarker, str);
      }
      var newVal = val.slice(0, this.info.start) + str + val.slice(this.info.end, val.length - 1);
      this.info.end = this.info.start + str.length + 1;
      this.inputNode.value = newVal + " ";
      this.setCursorPosition(this.info.end);
    },

    setCursorPosition: function(pos){
      var range;
      var elem = this.inputNode;
      if (elem.createTextRange) {
          range = elem.createTextRange();
          range.move("character", pos);
          range.select();
      } else {
          elem.focus();
          if (elem.selectionStart !== void(0)) { // void(0) always gives you undefined
              elem.setSelectionRange(pos, pos);
          }
      }
      this.states.inputHasFocus = true;
    }

  };

  /* global define */
  (function(root, factory) {
    if (typeof define === "function" && define.amd) {
      return define([], factory);
    } else if (typeof module === "object" && module.exports) {
      return module.exports = factory();
    } else {
      return root.PreviewHandler = factory();
    }
  })(this, function() {
    return PreviewHandler;
  });


}).call(this);
(function(){
  "use strict";

  function MultiComplete(options){

    if (!(this instanceof MultiComplete)) {
      return new MultiComplete(options);
    }

    /**
     * Default options
     * @type {Object}
     */
    this.defaults = {
      fuzzyFilter : true
    };

    /**
     * merge options and defaults where user options will
     * override internal defaults
     * @type {Object}
     */
    this.opts = Object.assign({},  this.defaults, options);

    this.init();
  }

  MultiComplete.prototype = {
    
    init: function() {
      /**
       * Caching important DOM nodes when we need to use
       * straight up Javascript instead of jQuery
       */
      this.inputNode = document.querySelector(this.opts.input);

      var reqs = this.checkRequirements();
      if (!reqs) {
        return;
      }

      /**
       * Create a regex from the markers for the dataset
       * to indicate when to start filtering data
       */
      this.getMarkers();

      /**
       * Setting some defaults internal variables
       */
      this.info = {
        filteredDataLength: 0
      };
      
      /**
       * Start listening for input keyup
       */
      this.inputNode.addEventListener('keyup', this.onInputKeyup.bind(this));


      /* global PreviewHandler */
      this.previewhandler = new PreviewHandler(this.opts);
      this.previewhandler.init();
    },

    checkRequirements: function(){
      var result = true;
      if (!this.opts.input || !this.inputNode) {
        this.warn("input option not provided or element is missing");
        result = false;
      }
      if (!this.opts.datasets) {
        this.warn("no datasets provided or error loading them");
        result = false;
      }
      return result;
    },

    getMarkers: function(){
      var markers = "";
      for (var key in this.opts.datasets) {
        if ({}.hasOwnProperty.call(this.opts.datasets, key)) {
          markers += key;
        }
      }
      this.markersRegex = this.makeRegex(markers);
    },

    /**
     * Takes the markers from the dataset object and creates a
     * regex to test input value and see if filtering needs to begin
     * Properly escapes any Regex-specific characters in case user
     * decides to use one of those as a marker
     * @param  {String} markers
     * @return {Regex}         
     */
    makeRegex: function(markers) {
      // some help from http://stackoverflow.com/a/5664273/395414
      var regString = markers.replace(/([()[{*+.$^\\|?])/g, "\\$1");
      return new RegExp("["+regString+"]", "i");
    },

    /**
     * Wrapper around new Error but possibly thinking about making
     * it just do console.warn instead, hence the function name
     * @param  {String} stuff The error/warn message
     * @return {Error}       
     */
    warn: function(stuff){
      throw new Error(stuff);
    },

    /**
     * Find the end of closest word given a starting index in a string
     * @param  {String} str   The full string to look through
     * @param  {Number} start The index in the string to start at
     * @return {Number}       The index of the next space
     */
    getNextSpace: function(str, start) {
      var returnIndex = str.substring(start, str.length).indexOf(" ");
      return (returnIndex < 0)? str.length : returnIndex + start;
    },

    /**
     * Find the beginning of the closest word in a string given a starting index    
     * @param  {String} str   The full string to look through
     * @param  {Number} end   The index in the string to start at
     * @return {Number}       The index of the beginning of the word 
     */
    getPrevSpace: function(str, end) {
      var returnIndex =  str.substring(0, end).lastIndexOf(" ");
      return returnIndex < 0 ? 0 : returnIndex + 1;
    },

    /**
     * Finds the starting and ending index of the closest word
     * to the cursor in the input. 
     * @param  {String} val       The whole current value of the input field
     * @param  {Number} cursorPos The current index of the cursor in the input
     * @return {Array}            Returns an array with the starting and ending values.  Array will always have length of 2
     */
    findPositions: function(val, cursorPos) {
      var startIndex;
      var endIndex;

      if (val[cursorPos] === " ") {
        endIndex = cursorPos;
      } else {
        endIndex = this.getNextSpace(val, cursorPos);
      }

      var leftChar = val[cursorPos - 1];
      if (leftChar === " ") {
        startIndex = cursorPos;
      } else {
        startIndex = this.getPrevSpace(val, cursorPos);
      }
      return [startIndex, endIndex];
    },

    testCharAndFilter: function(char, word) {
      if (this.markersRegex.test(char)) {
        this.info.activeMarker = char;
        return this.beginFiltering(char, word);
      } else {
        return [];
      }
    },

    onInputKeyup : function(evt) {
      var val = this.inputNode.value;
      
      if (val) {
        this.handleValue(val);
        return;
      }

    },

    handleValue: function(val){
      var cursorPos = this.inputNode.selectionStart;
      var currentIndexes = this.findPositions(val, cursorPos);
      var currentWord = val.substring(currentIndexes[0],currentIndexes[1]);

      this.info = {
        start: currentIndexes[0], 
        end: currentIndexes[1],
        cursorPos: cursorPos,
        fullStr: currentWord,
        filterStr : currentWord.substr(1),
        val: val
      };

      var firstCharOfWord = currentWord.charAt(0);
      var filtered = this.testCharAndFilter(firstCharOfWord, this.info.filterStr);
      
      this.sendToPreview(filtered);
    },

    /**
     * Sets which part of the dataset to look into to start filtereing
     * @param  {String} marker    The markey key in the dataset object
     * @param  {String} filterStr The string to use to as the filter seed
     * @return {Array}            An array of data
     */
    beginFiltering: function(marker, filterStr){
      if (!this.opts.datasets[marker]) {
        return []; 
      }
      var dataToFilter = this.opts.datasets[marker];
      var filteredData = this.getFilteredData(filterStr, this.opts.fuzzyFilter, dataToFilter);
      this.info.filteredDataLength = filteredData.length;
      this.info.filteredData = filteredData;
      return filteredData;
    },

    /**
     * Reduce an array to only elements that match data given
     * @param  {String} filterStr   The string to look for in the data
     * @param  {Bool} fuzzyFilter   Whether to do exact or "fuzzy" matching
     * @param  {Array} fullArray    The target array to filter through
     * @return {Array}              newly filtered array
     */
    getFilteredData: function(filterStr, fuzzyFilter, fullArray) {
      
      return fullArray.filter(function(el){
        if (fuzzyFilter === true) {
          return el.indexOf(filterStr) >= 0;
        } else {
          return el.indexOf(filterStr) === 0;
        }
      });
    },

    sendToPreview: function(filteredData) {
      this.previewhandler.info = this.info;
      this.previewhandler.addToPreview(filteredData);
    }

  };

  /* global define */
  (function(root, factory) {
    if (typeof define === "function" && define.amd) {
      return define([], factory);
    } else if (typeof module === "object" && module.exports) {
      return module.exports = factory();
    } else {
      return root.MultiComplete = factory();
    }
  })(this, function() {
    return MultiComplete;
  });

}).call(this);