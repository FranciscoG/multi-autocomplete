(function(){
  "use strict";

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
      activeClass : "active"
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

    this.init();
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

    addToPreview: function(filteredData, info) {
      // console.log(filteredData);
      console.log(this);
      this.info = info;

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
        
        if (typeof self.outputTemplateCB === "function") {
          item.innerHTML = self.outputTemplateCB(self.info.activeMarker + el);
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
      var collection = [].slice.call(this.collection);
      collection.forEach(function(el,i,ar){
        el.classList.remove(self.opts.activeClass);
        if (i === newItem) {
          el.classList.add(self.opts.activeClass);
        }
      });
      this.useActiveText();
    },

    // probably should rename this to differ from the option
    getHighlighted: function(andScroll){
      var newActive = this.outputNode.querySelector("." + this.opts.activeClass);
      if (andScroll) {
        this.scrollOutput(newActive);
      }
      var newText;
      if (typeof this.getActiveTextCB === "function") {
        newText = this.getActiveTextCB(newActive);
      } else {
        newText = newActive.textContent;
      }
      return newText;
    },

    useActiveText: function(){
      var newText = this.getHighlighted(true);
      this.replaceInPlace(newText);
    },

    onClickPick: function(e){
      var clickedEl = e.target;
      if(clickedEl.tagName.toLowerCase() !== this.opts.outputDom.toLowerCase()) {
        return;
      }
      var newText;
      if (typeof this.getActiveTextCB === "function") {
        newText = this.getActiveTextCB( e.target );
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

    /**
     * Replaces the text
     * @param  {str} str    the string to be replaced
     * @return {[type]}     [description]
     */
    replaceInPlace: function(str){
      var val = this.info.val;
      if (typeof this.beforeReplaceCB === "function") {
        str = this.beforeReplaceCB(this.info.activeMarker + str);
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
          if (elem.selectionStart !== void(0)) {
              elem.setSelectionRange(pos, pos);
          }
      }
      this.states.inputHasFocus = true;
    },

    beforeReplace: function(cb){
      this.beforeReplaceCB = cb || null;
    },
    getActiveText: function(cb){
      this.getActiveTextCB = cb || null;
    },
    outputTemplate: function(cb){
      this.outputTemplateCB = cb || null;
    },

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