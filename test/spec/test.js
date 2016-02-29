// TODO: Figure all this testing stuff out
var mocha = require('mocha');
var jsdom = require('mocha-jsdom')
var chai = require('chai');
var should = chai.should;
var expect = chai.expect;

var MultiComplete = require('../../src/multicomplete.js');
var datasets = require('../testdata.js');


describe("A suite", function() {

  var $;
  jsdom();

  before(function () {
    $ = require('jquery')
    $('body').append('<input type="text" id="chatInput" />');
  });

  it("test suite should work dammit", function() {
    
    var mc = new MultiComplete({
      input: "#chatInput",
      fuzzyFilter : false,
      datasets : datasets
    });

    var x = mc.getNextSpace(0, "happy")
    x.should.equal(4);
  });

});