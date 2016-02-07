/* global jQuery */
function MultiComplete(options){
  'use strict';

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

  this.currentText = "";
  this.lastCursorPos = 0;
  this.startPosition = null;

  $('body').on('keyup', options.input, this.onKeyUp.bind(this));

}

MultiComplete.prototype = {
  
  warn: function(stuff){
    if (console && console.warn) { console.warn("mutli-autocomplete:",stuff) ;}
  },

  onKeyUp : function(evt) {
    var val = this.$input.val();
    if (val) {
      var cursorPos = this.$input.get(0).selectionStart;

      if (cursorPos !== this.lastCursorPos || val === "" ) {

        this.lastCursorPos = cursorPos;
        var recentChar = val.charAt(cursorPos - 1);

        // console.log("cursorPos", cursorPos);
        // console.log("recentChar:", recentChar);

        if (this.markers.test(recentChar)) {
          this.markerKey = recentChar;
          this.startPosition = cursorPos - 1;
          this.shouldTrack = true;
        }

        if (this.shouldTrack) {
          this.beginFiltering();
        }

        if (recentChar === " " || val === "") {
          this.stopFiltering();
          this.startPosition = null;
        }

      }
    }
    
  },

  beginFiltering: function(){
    var val = this.$input.val();
    var filterStr;
    if (this.startPosition !== null) {
      filterStr = val.substring(this.startPosition, this.lastCursorPos);

      if (!/\s/.test(filterStr)) {
        this.findData(filterStr);
      } else {
        this.stopFiltering();
      }

    }
  },

  stopFiltering: function() {
    this.shouldTrack = false;
  },

  findData: function(filterStr){
    console.log(filterStr);
    var actualStr = filterStr.substr(1);
    var dataToFilter = this.datasets[this.markerKey];
    
    dataToFilter.forEach(function(el,i,r){
      if (el.indexOf(actualStr) >= 0) {
        console.log("found:", el);
      }
    });

  },

  replaceInPlace: function(str){
    var val = this.$input.val();
    var newVal = val.slice(0, this.startPosition) +  str + val.slice(this.lastCursorPos, val.length - 1);
    console.log(newVal);
  }

};


/*
  ideas:
  
  1. when marker is detected, save each keystroke to a variable until a space is detected 

  2. when marker is detected, save position index in string and then use substring to grab text using currect getSelelection index point
  
  issue:  If you started an unfinished item and went back to it, it doesn't detect it.  Have to add extra steps for this

  3. split string separated by space into array.  Iterate over earch item looking for markers

  issue: have to get position in string for future in-place replacement and that might be difficult especially if the same text occurs in multiple places in the string
 */
