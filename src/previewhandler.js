(function(){
  'use strict';

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
    this.opts = $.extend(true, {}, defaults, options);

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
       * Caching jQuery selectors and checking for 
       * required options
       */
      
      this.$input = $(this.opts.input);
      if (!this.opts.input || !this.$input.length) {
        this.warn("input option not provided or element is missing");
        return;
      }
      
      this.$output = $(this.opts.output);
      if (!this.opts.output || !this.$output.length) {
        this.warn("preview container not provided or element is missing");
        return;
      }
      
      /**
       * Caching important DOM nodes when we need to use
       * straight up Javascript instead of jQuery
       * @type {[type]}
       */
      this.inputNode = this.$input.get(0);
      this.outputNode = this.$output.get(0);
      this.outputNode.tabIndex = 0;

      this.$input.on('keydown', $.proxy(this.onInputKeydown, this));

      $(document).on('keyup', $.proxy(this.modifierKeysUp, this));
      $(document).on('keydown', $.proxy(this.modifierKeysDown, this));

      this.$output.on('click', this.opts.outputDom, $.proxy(this.onClickPick, this));
      this.$output.on('keyup', $.proxy(this.outputKeyup, this));
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
            this.clearPreview();
            e.preventDefault();
            return false;
          }
          break;
        case this.keys.enter:
          if (this.states.isPreviewing) {
            this.useActiveText();
            e.preventDefault();
            e.stopImmediatePropagation();
            return false;
          }
          this.clearPreview();
          break;
        case this.keys.esc:
          if (this.states.isPreviewing) {
            this.clearPreview();
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

    clearPreview: function() {
      this.$output.empty();
      this.$output.hide();
      this.states.isPreviewing = false;
    },

    addToPreview: function(filteredData) {
      if (this.states.hasCancelled) {
        return false;
      }
      this.clearPreview();
      this.states.isPreviewing = true;
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

        item.tabIndex = 0;
        tmpFrag.appendChild(item);
      });

      this.$output.append(tmpFrag).slideDown(200);
      this.$collection = this.$output.children();
    },

    navPreview: function(incrementBy) {
      var activeIndex = this.$output.find('.' + this.opts.activeClass).index();
      var newItem = activeIndex + incrementBy;

      var childLen = this.$collection.length;
      if (newItem < 0) {
        newItem = childLen - 1;
      } else if (newItem > childLen - 1) {
        newItem = 0;
      }

      this.$collection.removeClass(this.opts.activeClass).eq(newItem).addClass(this.opts.activeClass);
      this.useActiveText();
    },

    // probably should rename this to differ from the option
    getActiveText: function(andScroll){
      var $newActive = this.$output.find('.' + this.opts.activeClass);
      if (andScroll) {
        this.scrollOutput($newActive);
      }
      var newText;
      if (typeof this.opts.getActiveText === "function") {
        newText = this.opts.getActiveText($newActive);
      } else {
        newText = $newActive.text();
      }
      return newText;
    },

    useActiveText: function(){
      var newText = this.getActiveText(true);
      this.replaceInPlace(newText);
    },

    onClickPick: function(e){
      var newText;
      if (typeof this.opts.getActiveText === "function") {
        newText = this.opts.getActiveText($(e.target));
      } else {
        newText = $(e.target).text();
      }

      this.replaceInPlace(newText);
      this.clearPreview();
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
      this.states.inputHasFocus = true;
    }

  };

  /* global define */
  (function(root, factory) {
    if (typeof define === 'function' && define.amd) {
      return define([], factory);
    } else if (typeof module === 'object' && module.exports) {
      return module.exports = factory();
    } else {
      return root.PreviewHandler = factory();
    }
  })(this, function() {
    return PreviewHandler;
  });


}).call(this);