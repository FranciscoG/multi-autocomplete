/* global jQuery */
function MultiComplete(options){
  'use strict';

  if (!(this instanceof MultiComplete)) {
    return new MultiComplete(options);
  }

  /**
   * User defined options, all required
   */
  
  this.input = options.input;
  this.$input = $(options.input)
  if (!options.input || !this.$input.length) {
    this.warn("input not set or doesn't exist");
    return;
  }

  this.previewContainer = $(options.input);
  if (!options.previewContainer || !this.previewContainer.length) {
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

  $('body').on('keyup', options.input, this.onKeyUp.bind(this));

}

MultiComplete.prototype = {
  
  warn: function(stuff){
    if (console && console.warn) { console.warn("mutli-autocomplete:",stuff) ;}
  },

  goForward: function(arr, start) {
    // find the next space in the array starting at 
    var returnIndex = arr.length
    for (var i = start, len = arr.length; i < len; i++) {
      if (arr[i] === " ") {
        returnIndex = i;
        break;
      }
    }
    return returnIndex;

  },

  goBackward: function(arr, start) {
    // find the next space in the array going backwards in the array
    var returnIndex = 0;
    for (var i = start - 1; i >= 0; i--) {
      if (arr[i] === " ") {
        returnIndex = i;
        break;
      }
    }
    return returnIndex;
  },

  onKeyUp : function(evt) {
    var val = this.$input.val();

    if (val) {
      var cursorPos = this.$input.get(0).selectionStart;
      var valArr = val.split("");
      var leftChar = valArr[cursorPos - 1];
      
      var startIndex;
      var endIndex;

      if (valArr[cursorPos] === " ") {
        endIndex = cursorPos;
      } else {
        endIndex = mc.goForward(valArr, cursorPos);
      }

      if (leftChar === " ") {
        startIndex = cursorPos;
      } else {
        startIndex = mc.goBackward(valArr, cursorPos);
      }

      var currentWord = val.substring(startIndex,endIndex);

      // console.log(startIndex,endIndex, currentWord);
      if (this.markers.test(currentWord.charAt(0))) {
        this.beginFiltering(currentWord.charAt(0), currentWord.substr(1));
      }
      return;
    }
    
  },

  beginFiltering: function(marker, filterStr){
    if (!this.datasets[marker]) { return; }

    var dataToFilter = this.datasets[marker];
    dataToFilter.forEach(function(el,i,r){
      if (el.indexOf(filterStr) >= 0) {
        console.log("found:", el);
      }
    });
    console.log("-------");
  },

  replaceInPlace: function(str){
    var val = this.$input.val();
    var newVal = val.slice(0, this.startPosition) +  str + val.slice(this.lastCursorPos, val.length - 1);
    console.log(newVal);
  }

};

if (typeof exports === "object") {
  module.exports = MultiComplete;
}

/*
  ideas:
  
  1. when marker is detected, save each keystroke to a variable until a space is detected 

  2. when marker is detected, save position index in string and then use substring to grab text using currect getSelelection index point
  
  issue:  If you started an unfinished item and went back to it, it doesn't detect it.  Have to add extra steps for this

  3. split string separated by space into array.  Iterate over earch item looking for markers

  issue: have to get position in string for future in-place replacement and that might be difficult especially if the same text occurs in multiple places in the string

  4. split string into individual characters.  Starting at getSelection index, chech if index on each side (+1/-1) is a space.  if -1 is space, check for next space going forward (position direction).  Vice Versa if +1 is a space.  
 */
