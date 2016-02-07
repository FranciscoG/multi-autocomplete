/* global jQuery */
(function($){
  'use strict';

function MultiComplete(options){
  
  /**
   * User defined options, all required
   */
  
  this.input = $(options.input);
  if (!options.input || !this.input.length) {
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

  this.keycodes = {
    up : 38, 
    down : 40, 
    left : 37,
    right : 39, 
    enter : 13, 
    esc : 27,
    tab : 9,
    shift : 16
  };
}

MultiComplete.prototype = {
  log: function(stuff){
    if (console && console.log) { console.log(stuff) ;}
  }, 
  warn: function(stuff){
    if (console && console.warn) { console.warn("mutli-autocomplete:",stuff) ;}
  }
}

/*
  on each keyup:

  check if character is one of the initiators and that previous character is a space, 
    if so start saving from that position until the next space or end of line

    when that saved string gets to a certain character length, start filtering

    

 */


})(jQuery);
