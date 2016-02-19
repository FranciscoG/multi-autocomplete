// TODO: Figure all this testing stuff out

var mc_autpo = require('../../dist/multicomplete.js');
var datasets = require('../testdata.js');
var $ = require('../jquery-2.2.0.min.js');

var inputElem = document.createElement('input');
inputElem.type = text;
inputElem.id = "chatInput";

var outputElem = document.createElement('ul');
outputElem.id = "preview-container";

var mc = new MultiComplete({
  input: "#chatInput",
  output: "#preview-container",
  datasets : datasets,
  fuzzyFilter : false
});

describe("A suite", function() {
  it("contains spec with an expectation", function() {
    expect(mc.getNextSpace(0, "happy")).toBe(4);
  });
});