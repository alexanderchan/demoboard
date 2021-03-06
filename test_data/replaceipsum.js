var fs = require('fs');
var ipsum = require('lorem-ipsum');
var moment = require('moment')
var path = require('path')

function getRandomNearByDateString() {
  // range of days from -9 - + 9 with a weighting of more in the future
  const days = Math.floor(Math.random() * 14 ) * (Math.random() < .2 ? -1 : 1)

  return moment().add(days, 'days').format('YYYY-MM-DD HH:MM:SS')
}

fs.readFile(path.resolve(__dirname, 'tasks_source.xml'), 'utf8', function(err, data){
    if (err) {
        console.error(err);
        return;
    }

    var lines = data.split('\n');
    //console.log(lines.length);

    lines.forEach(function(line){
        var output = ipsum({
            count: 1                      // Number of words, sentences, or paragraphs to generate.
            , units: 'sentences'            // Generate words, sentences, or paragraphs.
            , sentenceLowerBound: 5         // Minimum words per sentence.
            , sentenceUpperBound: 15        // Maximum words per sentence.
            , paragraphLowerBound: 3        // Minimum sentences per paragraph.
            , paragraphUpperBound: 7        // Maximum sentences per paragraph.
            , format: 'plain'               // Plain text or html
        //, words: ['ad', 'dolor',  ]  // Custom word dictionary. Uses dictionary.words (in lib/dictionary.js) by default.
            , random: Math.random           // A PRNG function. Uses Math.random by default
        });
        // replace any title or body text with the new ipsum generated
        var newLine = line.replace(/(title|Body)(=')(.*?)'/ig, '$1=\''+output+'\'')
                          .replace(/(DueDate)(=')(.*?)'/ig, '$1=\''+getRandomNearByDateString()+'\'')

        console.log(newLine);
    });


});
