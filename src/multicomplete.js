(function(){
  'use strict';

  /* global jQuery */
  function MultiComplete(options){

    if (!(this instanceof MultiComplete)) {
      return new MultiComplete(options);
    }

    /**
     * Default options
     * @type {Object}
     */
    var defaults = {
      input: null, // will be required 
      fuzzyFilter : true
    };

    /**
     * merge options and defaults where user options will
     * override internal defaults
     * @type {Object}
     */
    this.opts = $.extend(true, {}, defaults, options);

    /**
     * Caching jQuery selectors and checking for 
     * required options
     */
    
    this.$input = $(this.opts.input);
    if (!this.opts.input || !this.$input.length) {
      this.warn("input option not provided or element is missing");
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

    this.info = {
      filteredDataLength: 0
    };
    
    this.$input.on('keyup', $.proxy(this.onInputKeyup, this));
  }

  MultiComplete.prototype = {
    
    warn: function(stuff){
      if (console && console.warn) { console.warn("mutlicomplete:",stuff) ;}
    },

    getNextSpace: function(str, start) {
      var returnIndex = str.substring(start, str.length).indexOf(' ');
      return (returnIndex < 0)? str.length : returnIndex + start;
    },

    getPrevSpace: function(str, end) {
      var returnIndex =  str.substring(0, end).lastIndexOf(' ');
      return returnIndex < 0 ? 0 : returnIndex + 1;
    },

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

    onInputKeyup : function(evt) {
      var val = this.inputNode.value;
      
      if (val) {
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
        // console.log(this.info);

        var firstCharOfWord = currentWord.charAt(0);
        if (this.markersRegex.test(firstCharOfWord)) {
          this.info.activeMarker = firstCharOfWord;
          this.beginFiltering(firstCharOfWord, currentWord.substr(1));
        } else {
          this.clearPreview();
        }

        return;
      }

      // if (!val || !this.info.activeMarker) {
      //   this.clearPreview();
      // }
    },


    beginFiltering: function(marker, filterStr){
      if (!this.opts.datasets[marker]) {
        return; 
      }

      var dataToFilter = this.opts.datasets[marker];
      var filteredData = this.getFilteredData(filterStr, this.opts.fuzzyFilter, dataToFilter);
      this.info.filteredDataLength = filteredData.length;

      this.info.filteredData = filteredData;
      this.sendToPreview(filteredData);
    },

    getFilteredData: function(filterStr, fuzzyFilter, fullArray) {
      return $.grep(fullArray, function(el){
        if (fuzzyFilter === true) {
          return el.indexOf(filterStr) >= 0;
        } else {
          return el.indexOf(filterStr) === 0;
        }
      });
    },

    sendToPreview: function(x) {
      console.log(x, this.info);
    }

  };

  /* global define */
  (function(root, factory) {
    if (typeof define === 'function' && define.amd) {
      return define([], factory);
    } else if (typeof module === 'object' && module.exports) {
      return module.exports = factory();
    } else {
      return root.MultiComplete = factory();
    }
  })(this, function() {
    return MultiComplete;
  });

}).call(this);