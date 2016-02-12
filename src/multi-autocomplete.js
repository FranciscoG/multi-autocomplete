/* global jQuery */
function MultiComplete(options){
  'use strict';

  if (!(this instanceof MultiComplete)) {
    return new MultiComplete(options);
  }

  /**
   * User defined options, required
   */
  
  this.input = options.input;
  this.$input = $(options.input)
  if (!options.input || !this.$input.length) {
    this.warn("input not set or doesn't exist");
    return;
  }

  this.output = options.output;
  this.$output = $(options.output);
  if (!options.output || !this.$output.length) {
    this.warn("preview container not set or doesn't exist");
    return;
  }

  if (!options.datasets) {
    this.warn("datasets missing");
    return;
  }
  this.datasets = options.datasets;
  var markers = "";
  for (var key in this.datasets) {
    markers += key;
  }
  this.markersRegex = new RegExp("["+markers+"]", "i");

  /**
   * User defined options, optional (with defaults)
   */
  this.outputDom = options.outputDom || "li";
  this.activeClass = options.activeClass || "active";

  /**
   * This is a callback function that will be run immediately after
   * data is filtered so you can do something else to it before sending
   * it to the screen preview container
   * @type {Function}
   */
  this.callback = options.callback;

  /**
   * Runs this function on the string before putting it back into 
   * the input
   * @type {Function}
   */
  this.beforeReplace = options.beforeReplace;

  this.keycodes = {
    up    : 38, 
    down  : 40, 
    left  : 37,
    right : 39, 
    enter : 13, 
    esc   : 27,
    tab   : 9,
    shift : 16,
    del   : 8, // mac Delete, win BackSpace
    winDel: 46, // windows delete
    space : 32
  };

  this.info = {};
  this._isPreviewing = false;
  $('body').on('keyup', this.input, $.proxy(this.onKeyUp, this));
  $('body').on('keydown', this.input, $.proxy(this.onKeyDown, this));
}

MultiComplete.prototype = {
  
  warn: function(stuff){
    if (console && console.warn) { console.warn("mutli-autocomplete:",stuff) ;}
  },

  goForward: function(str, start) {
    var returnIndex = str.substring(start, str.length).indexOf(' ');
    return returnIndex < 0 ? str.length : returnIndex;
  },

  goBackward: function(str, end) {
    var returnIndex =  str.substring(0, end).lastIndexOf(' ');
    return returnIndex < 0 ? 0 : returnIndex + 1;
  },

  onKeyDown: function(evt){
    var keys = evt.keyCode === this.keycodes.up || evt.keyCode === this.keycodes.down;
    if (this._isPreviewing && keys) {
      console.log("prevent");
      evt.preventDefault();
      return false;
    }
  },

  onKeyUp : function(evt) {
    var val = this.$input.val();

    if (val) {
      var cursorPos = this.$input.get(0).selectionStart;
      var leftChar = val[cursorPos - 1];
      
      var startIndex;
      var endIndex;

      if (val[cursorPos] === " ") {
        endIndex = cursorPos;
      } else {
        endIndex = this.goForward(val, cursorPos);
      }

      if (leftChar === " ") {
        startIndex = cursorPos;
      } else {
        startIndex = this.goBackward(val, cursorPos);
      }

      var currentWord = val.substring(startIndex,endIndex);
      this.info = {
        start: startIndex, 
        end: endIndex,
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
    this._isPreviewing = false;
  },

  beginFiltering: function(marker, filterStr){
    if (!this.datasets[marker]) { return; }
    // we don't want to filter when we're still traversing the preview list
    if (this._isPreviewing) { return; }

    var dataToFilter = this.datasets[marker];
    var filteredData = $.grep(dataToFilter, function(el){
      return el.indexOf(filterStr) >= 0;
    });
    if (typeof this.callback === "function") {
      filteredData = this.callback(filteredData);
    }
    this.addToPreview(filteredData);
  },

  addToPreview: function(filteredData) {
    this.clearPreview();
    var itemDom = this.outputDom;

    var tmpFrag = document.createDocumentFragment();
    $.each(filteredData, function(i, el){
      var item = document.createElement(itemDom);
      item.textContent = el;
      if (i === 0) { item.classList.add("active"); }
      tmpFrag.appendChild(item);
    });
    this.$output.append(tmpFrag);
  },

  navPreview: function(keyCode) {
    // console.log(this.info);
    var modifier;
    if (keyCode === this.keycodes.up) {
      modifier = -1;
      this._isPreviewing = true;
      this.$output.get(0).focus();
    } else if (keyCode === this.keycodes.down) {
      modifier = 1;
      this._isPreviewing = true;
      this.$output.get(0).focus();
    } else {
      this._isPreviewing = false;
      this.$input.get(0).focus();
      return; // do nothing if up/down not pressed
    }

    var $collection = this.$output.children();
    var activeIndex = this.$output.find('.' + this.activeClass).index();
    var newItem = activeIndex + modifier;

    var childLen = $collection.length;
    if (newItem < 0) {
      newItem = childLen - 1;
    } else if (newItem > childLen - 1) {
      newItem = 0;
    }

    $collection.removeClass('active').eq(newItem).addClass(this.activeClass);
    var newText = this.$output.find('.' + this.activeClass).text();
    this.replaceInPlace(newText);
  },

  replaceInPlace: function(str){
    var val = this.info.val;
    if (typeof this.beforeReplace === "function") {
      str = this.beforeReplace(str);
    }
    var newVal = val.slice(0, this.info.start) + this.info.activeMarker + str + val.slice(this.info.end, val.length - 1);
    this.info.end = this.info.start + str.length + 1;
    this.$input.val(newVal);
    this.setCursorPosition(this.info.end);
    console.log(this.info.end, newVal);
  },

  setCursorPosition: function(pos){
    var range;
    var elem = this.$input.get(0);
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
