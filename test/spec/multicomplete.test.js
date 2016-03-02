describe("Multicomplete suite", function() {

  var  mc;

    beforeEach(function(){
      var fixture = '<input id="chatInput" type="text" />';
      document.body.insertAdjacentHTML(
            'afterbegin', 
            fixture);

        mc = new MultiComplete({
            input: "#chatInput",
            datasets : datasets
        });
    });

    afterEach(function(){
      mc.opts.fuzzyFilter = false;
    });

    it('Should return the correct next space given a string and starting index', function() {
      expect(mc.getNextSpace('string', 0)).toEqual(6);
      expect(mc.getNextSpace('', 0)).toEqual(0);
      expect(mc.getNextSpace('the string is long and winding', 15)).toEqual(18);
      expect(mc.getNextSpace('a middle word', 2)).toEqual(8);
    });

    it('Should return the correct previous space given a string and starting index', function(){
      expect(mc.getPrevSpace('string', 5)).toEqual(0);
      expect(mc.getPrevSpace("what's up @doc", 11)).toEqual(10);
      expect(mc.getPrevSpace("I'm :smiley: face", 8)).toEqual(4);
    });

    it('Should return the correct array of indexes given a string and starting index', function(){
      expect(mc.findPositions("what's up @doc", 11)).toEqual([10,14]);
      expect(mc.findPositions('the :smiley: is long and winding', 7)).toEqual([4,12]);
    });

    it('Should filter for given word', function(){
      $('#chatInput').val(':cat');
      $('#chatInput').trigger('keyup');
      expect(mc.info.filteredData).toEqual(['cat']);
    });

    it('Should extract the a word when a marker is detected', function(){
      $('#chatInput').val('hello I am a @mountain goat');
      document.getElementById('chatInput').setSelectionRange(16, 16);
      $('#chatInput').trigger('keyup');
      expect(mc.info.fullStr).toEqual('@mountain');
    });

    it('Should fuzzy filter data properly', function(){
      mc.opts.fuzzyFilter = true;
      $('#chatInput').val(':m');
      $('#chatInput').trigger('keyup');
      expect(mc.info.filteredData).toEqual(["smiley", "open_mouth", "smile", "unamused", "mask", "thumbsup", "thumbsdown"]);
    });

});