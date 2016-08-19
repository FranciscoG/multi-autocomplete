/* global describe, expect, it, MultiComplete, datasets, beforeEach, afterEach */
describe("Multicomplete suite", function() {

  var  mc;

    beforeEach(function(){
      var fixture = '<ul id="preview-container"></ul><input type="text" id="chatInput" placeholder="enter a chat message" autocomplete="off" maxlength="255" />';
      document.body.insertAdjacentHTML(
            "afterbegin", 
            fixture);

        mc = new MultiComplete({
          input: "#chatInput",
          output: "#preview-container",
          datasets : datasets,
          fuzzyFilter : false,
          beforeReplace: function(marker, str) {
            if (marker === ":") {
              return ":" + str + ":";
            }
            if (marker === "@") {
              return "@" + str;
            }
            if (marker === "/") {
              return "/" + str;
            }
          },
          getActiveText: function(elem) {
            return elem.querySelector("span").textContent;
          },
          outputTemplate : function(marker, str) {
            if (marker === ":") {
              return "emoji: <span>"+str+"</span>";
            }
            if (marker === "@") {
              return "mention: <span>"+str+"</span>";
            }
            if (marker === "/") {
              return "command: <span>"+str+"</span>";
            }
          }
        });
    });

    afterEach(function(){
      mc = null;
    });

    it("Should throw an error when input option is not given", function(){
        expect( function(){ mc = new MultiComplete({datasets : datasets}); } ).toThrow(new Error("input option not provided or element is missing"));
    });

    it("Should throw an error when input given but DOM elemenet does not exist", function(){
        expect( function(){ mc = new MultiComplete({input: "#nullInput", datasets : datasets}); } ).toThrow(new Error("input option not provided or element is missing"));
    });

    it("Should throw an error when no datasets provided", function(){
        expect( function(){ mc = new MultiComplete({input: "#chatInput"}); } ).toThrow(new Error("no datasets provided or error loading them"));
    });

    it("Should make regex from the markers in the datasets", function(){
        expect(mc.markersRegex).toEqual(/[@:\/]/i);
    });

    it("testCharAndFilter should return an array with", function(){
      expect(mc.testCharAndFilter(":","sm")).toEqual(["smiley", "smile"]);
      expect(mc.testCharAndFilter("/","b")).toEqual(["ban"]);
      expect(mc.testCharAndFilter("@","m")).toEqual(["mountain", "moe"]);
    });

    it("makeRegex should properly escape regex characters", function(){
      expect(mc.makeRegex("@:/")).toEqual(/[@:\/]/i);
      expect(mc.makeRegex("@(:/")).toEqual(/[@\(:\/]/i);
      expect(mc.makeRegex("):/")).toEqual(/[\):\/]/i);
      expect(mc.makeRegex("*+$")).toEqual(/[\*\+\$]/i);
      expect(mc.makeRegex("X?{=")).toEqual(/[X\?\{=]/i);
      expect(mc.makeRegex("@^\\")).toEqual(/[@\^\\]/i);
    });

    it("getNextSpace should return the correct next space given a string and starting index", function() {
      expect(mc.getNextSpace("string", 0)).toEqual(6);
      expect(mc.getNextSpace("", 0)).toEqual(0);
      expect(mc.getNextSpace("the string is long and winding", 15)).toEqual(18);
      expect(mc.getNextSpace("a middle word", 2)).toEqual(8);
    });

    it("getPrevSpace should return the correct previous space given a string and starting index", function(){
      expect(mc.getPrevSpace("string", 5)).toEqual(0);
      expect(mc.getPrevSpace("what's up @doc", 11)).toEqual(10);
      expect(mc.getPrevSpace("I'm :smiley: face", 8)).toEqual(4);
    });

    it("findPositions should return the correct array of indexes given a string and starting index", function(){
      expect(mc.findPositions("what's up @doc", 11)).toEqual([10,14]);
      expect(mc.findPositions("the :smiley: is long and winding", 7)).toEqual([4,12]);
    });

    it("filteredData should filter for given word", function(){
      document.getElementById("chatInput").value = ":cat";
      
      var event = document.createEvent('HTMLEvents');
      event.initEvent('keyup', true, false);
      document.getElementById("chatInput").dispatchEvent(event);
      
      expect(mc.info.filteredData).toEqual(["cat"]);
    });

    it("Should extract the a word when a marker is detected", function(){
      document.getElementById("chatInput").value = "hello I am a @mountain goat";
      document.getElementById("chatInput").setSelectionRange(16, 16);
      
      var event = document.createEvent('HTMLEvents');
      event.initEvent('keyup', true, false);
      document.getElementById("chatInput").dispatchEvent(event);

      expect(mc.info.fullStr).toEqual("@mountain");
    });

    it("Should fuzzy filter data properly", function(){
      mc.opts.fuzzyFilter = true;
      document.getElementById("chatInput").value = ":m";

      var event = document.createEvent('HTMLEvents');
      event.initEvent('keyup', true, false);
      document.getElementById("chatInput").dispatchEvent(event);

      expect(mc.info.filteredData).toEqual(["smiley", "open_mouth", "smile", "unamused", "mask", "thumbsup", "thumbsdown"]);
    });

});