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

  this.keycodes = {
    up    : 38, 
    down  : 40, 
    left  : 37,
    right : 39, 
    enter : 13, 
    esc   : 27,
    tab   : 9,
    shift : 16,
    del   : 8,  // mac, still need backspace
    space : 32
  };

  this.info = {};
  this._isPreviewing = false;
  $('body').on('keyup', this.input, $.proxy(this.onKeyUp, this));
  // $('body').on('keyup', this.output, $.proxy(this.onSelectItem, this));
}

MultiComplete.prototype = {
  
  warn: function(stuff){
    if (console && console.warn) { console.warn("mutli-autocomplete:",stuff) ;}
  },

  goForward: function(str, start) {
    // find the next space in the array starting at 
    var returnIndex = strLen = str.length;
    for (var i = start; i < strLen; i++) {
      if (str[i] === " ") {
        returnIndex = i;
        break;
      }
    }
    return returnIndex;
  },

  goBackward: function(str, start) {
    // find the next space in the array going backwards in the array
    var returnIndex = 0;
    for (var i = start - 1; i >= 0; i--) {
      if (str[i] === " ") {
        returnIndex = i + 1;
        break;
      }
    }
    return returnIndex;
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
      // console.log(startIndex,endIndex, currentWord);
      if (this.markersRegex.test(firstCharOfWord)) {
        this.info.activeMarker = firstCharOfWord;
        this.beginFiltering(firstCharOfWord, currentWord.substr(1));
        this.navPreview(evt.keyCode);
      } else {
        this.clearPreview();
      }

      // console.log(this.info);
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
    var modifier;
    if (keyCode === this.keycodes.up) {
      modifier = -1;
      this._isPreviewing = true;
    } else if (keyCode === this.keycodes.down) {
      modifier = 1;
      this._isPreviewing = true;
    } else {
      this._isPreviewing = false;
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
    var newVal = val.slice(0, this.info.start) + this.info.activeMarker + str + val.slice(this.info.end, val.length - 1);
    this.$input.val(newVal);
    console.log(newVal);
  },

  onSelectItem: function(evt) {
    if (evt.keyCode === this.keycodes.enter) {
      var newVal = $(this).find('.active').text();
      this.replaceInPlace(newVal);
    }
  }

};

if (typeof exports === "object") {
  module.exports = MultiComplete;
}
