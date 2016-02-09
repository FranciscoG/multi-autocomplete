var mc_autpo = require('../../dist/multi-autocomplete.js');
var datasets = require('../testdata.js');

var mc = new MultiComplete({
  input: "#chatInput",
  previewContainer: "#preview-container",
  datasets : datasets
});

describe("A suite", function() {
  it("contains spec with an expectation", function() {
    expect(true).toBe(true);
  });
});