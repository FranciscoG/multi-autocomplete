/* global jQuery */
function MultiComplete(options){
  'use strict';

  if (!(this instanceof MultiComplete)) {
    return new MultiComplete(options);
  }

  /**
   * Default options
   * @type {Object}
   */
  var defaults = {
    outputDom : "li",
    activeClass : "active",
    fuzzyFilter : true,
    beforeReplace: null,
    getActiveText : null,
    outputTemplate : null
  };

  /**
   * merge options and defaults where user options will
   * override internal defaults
   * @type {Object}
   */
  this.opts = $.extend(defaults, options);

  /**
   * Caching jQuery selectors and checking for 
   * required options
   */
  
  this.$input = $(this.opts.input);
  if (!this.opts.input || !this.$input.length) {
    this.warn("input not set or doesn't exist");
    return;
  }
  
  this.$output = $(this.opts.output);
  if (!this.opts.output || !this.$output.length) {
    this.warn("preview container not set or doesn't exist");
    return;
  }
  
  if (!this.opts.datasets) {
    this.warn("datasets missing");
    return;
  }

  var markers = "";
  for (var key in this.opts.datasets) {
    markers += key;
  }
  this.markersRegex = new RegExp("["+markers+"]", "i");

  /**
   * Caching important DOM nodes when we need to use
   * straight up Javascript instead of jQuery
   * @type {[type]}
   */
  this.inputNode = this.$input.get(0);
  this.outputNode = this.$output.get(0);

  this.keys = {
    up        : 38,
    down      : 40,
    left      : 37,
    right     : 39,
    enter     : 13,
    esc       : 27,
    tab       : 9,
    shift     : 16,
    backspace : 8,
    del       : 46,
    space     : 32
  };

  this.info = {};
  this._isPreviewing = false;
  this.ignoreKey = false;

  $(this.opts.input).on('keyup', $.proxy(this.onKeyUp, this));
  $(this.opts.input).on('keydown', $.proxy(this.onKeyDown, this));
}

MultiComplete.prototype = {
  
  warn: function(stuff){
    if (console && console.warn) { console.warn("mutlicomplete:",stuff) ;}
  },

  getNextSpace: function(str, start) {
    var returnIndex = str.substring(start, str.length).indexOf(' ');
    return returnIndex < 0 ? str.length : returnIndex;
  },

  getPrevSpace: function(str, end) {
    var returnIndex =  str.substring(0, end).lastIndexOf(' ');
    return returnIndex < 0 ? 0 : returnIndex + 1;
  },

  findPositions: function(val, cursorPos) {
    var leftChar = val[cursorPos - 1];
    
    var startIndex;
    var endIndex;

    if (val[cursorPos] === " ") {
      endIndex = cursorPos;
    } else {
      endIndex = this.getNextSpace(val, cursorPos);
    }

    if (leftChar === " ") {
      startIndex = cursorPos;
    } else {
      startIndex = this.getPrevSpace(val, cursorPos);
    }
    return [startIndex, endIndex];
  },

  stopKeys: function(e){
    var self = this;
    this.ignoreKey = true;
    e.preventDefault();
    setTimeout(function(){self.ignoreKey=false;},1);
  },

  onKeyDown: function(e){
    var elem = this.inputNode;
    var pos;

    if (this.ignoreKey) {
      // e.stopImmediatePropagation();
      e.preventDefault();
      return false;
    }

    if (e.keyCode === this.keys.up || e.keyCode === this.keys.down) {
        pos = this.info.end;
        this.setCursorPosition(pos);
        this.stopKeys(e);
    }

    if (e.keyCode === this.keys.right && this._isPreviewing) {
      pos = this.info.end;
      if (pos >= this.info.val.length - 1) {
        this.$input.val(this.$input.val() + ' ');
      }
      this.setCursorPosition(pos + 1);
      this.stopKeys(e);
    }

    // if (this._isPreviewing && e.keyCode === this.keys.enter) {
    //   // this.stopKeys();
    //   e.preventDefault();
    //   e.stopImmediatePropagation();
    //   console.log("test");
    // }

  },

  onKeyUp : function(evt) {
    var val = this.inputNode.value;

    if (val) {
      var cursorPos = this.inputNode.selectionStart;
      var currentIndexes = this.findPositions(val, cursorPos);
      var currentWord = val.substring(currentIndexes[0],currentIndexes[1]);

      this.info = {
        start: currentIndexes[0], 
        end: currentIndexes[1],
        fullStr: currentWord,
        filterStr : currentWord.substr(1),
        val: val
      };

      var firstCharOfWord = currentWord.charAt(0);
      if (this.markersRegex.test(firstCharOfWord)) {
        this.info.activeMarker = firstCharOfWord;
        this.beginFiltering(firstCharOfWord, currentWord.substr(1));
        this.navPreview(evt.keyCode);
      } else {
        this.clearPreview();
      }

      return;
    }

    if (!val || !this.info.activeMarker) {
      this.clearPreview();
    }
  },

  clearPreview: function() {
    this.$output.empty();
    this.$output.hide();
    this._isPreviewing = false;
  },

  beginFiltering: function(marker, filterStr){
    if (!this.opts.datasets[marker] || this._isPreviewing) {
      return; 
    }
    var dataToFilter = this.opts.datasets[marker];
    var filteredData = this.getFilteredData(filterStr, this.opts.fuzzyFilter, dataToFilter);
    if (filteredData.length > 0) {
      this.addToPreview(filteredData);
    } else {
      this.clearPreview();
    }
  },

  getFilteredData: function(filterStr, fuzzyFilter, fullArray) {
    return $.grep(fullArray, function(el){
      if (fuzzyFilter) {
        return el.indexOf(filterStr) >= 0;
      } else {
        return el.indexOf(filterStr) === 0;
      }
    });
  },

  addToPreview: function(filteredData) {
    this.clearPreview();
    this._isPreviewing = true;
    var self = this;

    var tmpFrag = document.createDocumentFragment();
    $.each(filteredData, function(i, el){
      var item = document.createElement(self.opts.outputDom);
      
      if (typeof self.opts.outputTemplate === 'function') {
        item.innerHTML = self.opts.outputTemplate(self.info.activeMarker, el);
      } else {
        item.textContent = el;
      }
      
      if (i === 0) { item.classList.add(self.opts.activeClass); }
      tmpFrag.appendChild(item);
    });
    this.$output.append(tmpFrag).slideDown(200);
  },

  navPreview: function(keyCode) {
    var modifier;
    if (keyCode === this.keys.up) {
      modifier = -1;
      this._isPreviewing = true;
    } else if (keyCode === this.keys.down) {
      modifier = 1;
      this._isPreviewing = true;
    } else {
      this._isPreviewing = false;
      return; // do nothing if up/down not pressed
    }

    var $collection = this.$output.children();
    var activeIndex = this.$output.find('.' + this.opts.activeClass).index();
    var newItem = activeIndex + modifier;

    var childLen = $collection.length;
    if (newItem < 0) {
      newItem = childLen - 1;
    } else if (newItem > childLen - 1) {
      newItem = 0;
    }

    $collection.removeClass(this.opts.activeClass).eq(newItem).addClass(this.opts.activeClass);
    var $newActive = this.$output.find('.' + this.opts.activeClass);
    this.scrollOutput($newActive);

    var newText;
    if (typeof this.opts.getActiveText === "function") {
      newText = this.opts.getActiveText($newActive);
    } else {
      newText = $newActive.text();
    }
  
    this.replaceInPlace(newText);
  },

  scrollOutput: function($elem){
    if ($elem.length) {
      $elem.get(0).scrollIntoView(false);
    }
  },

  replaceInPlace: function(str){
    var val = this.info.val;
    if (typeof this.opts.beforeReplace === 'function') {
      str = this.opts.beforeReplace(this.info.activeMarker, str);
    }
    var newVal = val.slice(0, this.info.start) + str + val.slice(this.info.end, val.length - 1);
    this.info.end = this.info.start + str.length + 1;
    this.$input.val(newVal);
    this.setCursorPosition(this.info.end);
  },

  setCursorPosition: function(pos){
    var range;
    var elem = this.inputNode;
    if (elem.createTextRange) {
        range = elem.createTextRange();
        range.move('character', pos);
        range.select();
    } else {
        elem.focus();
        if (elem.selectionStart !== undefined) {
            elem.setSelectionRange(pos, pos);
        }
    }
  }
};

if (typeof exports === "object") {
  module.exports = MultiComplete;
}
