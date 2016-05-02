## nothing to see here yet.

dependency: jQuery 

concept:

A Portable library that's intended to handle the intricacies of autocomplete filtering from, and to, a text input.  Most other libraries I found would only begin filtering at the first character in an input box.  I would like to be able to filter at any point in the input box based on multiple criteria (like how Slack does it).

I started developing it as part of the [DubX](https://github.com/sinfulBA/DubX-Script) plugin/extension for [Dubtrack.fm](http://dubtrack.fm) to autocomplete emojis and mentions but decided to separate it so I can improve and test



------

Breaking this down into 2 parts.  One separate mini-libraries takes in a dataset, listens for input and filters data accordingly and returns an array.  The other part handles outputing the filtered data to the screen and all the event related to selecting and placing that selection into the input.


# testing

`npm install gulp karma-cli -g`


http://www.bradoncode.com/blog/2015/02/27/karma-tutorial/
http://www.thetechnologystudio.co.uk/blog/using-gulp-and-karma-to-test-a-jquery-plugin/
https://www.youtube.com/watch?v=HqdZcNorTL0
http://www.tikalk.com/js/setup-karma-for-js-testing/
