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
  this.markers = new RegExp("["+markers+"]", "i");

  /**
   * User defined options, optional (with defaults)
   */
  this.outputDom = options.outputDom || "li";
  
  this.keycodes = {
    up    : 38, 
    down  : 40, 
    left  : 37,
    right : 39, 
    enter : 13, 
    esc   : 27,
    tab   : 9,
    shift : 16,
    del   : 8
  };

  this.info = {};
  $('body').on('keyup', options.input, this.onKeyUp.bind(this));

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
      if (this.markers.test(firstCharOfWord)) {
        this.info.activeMarker = firstCharOfWord;
        this.beginFiltering(firstCharOfWord, currentWord.substr(1));
        this.bindPreview(evt.keyCode);
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
    document.querySelector(this.output).innerHTML = "";
  },

  beginFiltering: function(marker, filterStr){
    if (!this.datasets[marker]) { return; }

    var dataToFilter = this.datasets[marker];
    var filteredData = dataToFilter.filter(function(el,i,r){
      return el.indexOf(filterStr) >= 0;
    });
    this.addToPreview(filteredData);
  },

  addToPreview: function(filteredData) {
    var prev = document.querySelector(this.output);
    this.clearPreview();
    var itemDom = this.outputDom;

    var tmpFrag = document.createDocumentFragment();
    filteredData.forEach(function(el,i){
      var item = document.createElement(itemDom);
      item.textContent = el;
      if (i === 0) { item.classList.add("active"); }
      tmpFrag.appendChild(item);
    });
    prev.appendChild(tmpFrag);
  },

  bindPreview: function(keyCode) {
    var $activeItem = this.$output.find('.active');
    var newItem;

    if (keyCode === this.keycodes.up) {
      $activeItem.removeClass('active');
      newItem = $activeItem.index() - 1;
    } else if (keyCode === this.keycodes.down) {
      $activeItem.removeClass('active');
      newItem = $activeItem.index() + 1;
    }

    var childLen = this.$output.children().length - 1;
    if (newItem < 0) {
      newItem = childLen;
    } else if (newItem >= childLen) {
      newItem = 0;
    }
    console.log(newItem);
    this.$output.children().eq(newItem).addClass('active');
  },

  replaceInPlace: function(str){
    var val = this.info.val;
    var newVal = val.slice(0, this.startPosition) +  str + val.slice(this.lastCursorPos, val.length - 1);
    console.log(newVal);
  }

};

if (typeof exports === "object") {
  module.exports = MultiComplete;
}
