angular.module('todomvc').factory('todoChrono', function(chrono) {
    'use strict';
    // Setup chrono with some new parsers
    // Simply setup next week to one week from today
    chrono.parsers.NextWeekParser = function(text, ref, opt) {

        // Create a chrono's base parser
        var parser = chrono.Parser(text, ref, opt); 

        // Extend the parser with our pattern
        parser.pattern = function () { return /next week/i; }; // Provide search pattern
        parser.extract = function(text, index) { 
            // Chrono will find all indexes of the text that match our pattern.
            // We need to check and return the result 
            var mentionedText = text.substr(index).match(parser.pattern())[0];

            var numberOfDaysToAdd = 7;
            /*
               var today = new Date();
               var nextWeek = new Date();
               nextWeek.setDate(today.getDate() + numberOfDaysToAdd); 
               */ 

            var nextWeek = 
                new Date((new Date()).getTime() + numberOfDaysToAdd*24*60*60*1000);

            return new chrono.ParseResult({
                referenceDate : ref,
                text : mentionedText,
                index: index,
                start: {
                    day: nextWeek.getDate(), 
                    month: nextWeek.getMonth(),
                    year: ref.getFullYear(), // But we aren't sure about the year
                    impliedComponents: ['year'] 
                }
            });
        };

        return parser;
    };


    chrono.parsers.NextMonthParser = function(text, ref, opt) {
        // Create a chrono's base parser
        var parser = chrono.Parser(text, ref, opt); 

        // Extend the parser with our pattern
        parser.pattern = function () { return /next month/i; }; // Provide search pattern
        parser.extract = function(text, index) { 
            // Chrono will find all indexes of the text that match our pattern.
            // We need to check and return the result 
            var mentionedText = text.substr(index).match(parser.pattern())[0];

            var numberOfDaysToAdd = 28;

            var nextMonth = 
                new Date((new Date()).getTime() + numberOfDaysToAdd*24*60*60*1000);

            return new chrono.ParseResult({
                referenceDate : ref,
                text : mentionedText,
                index: index,
                start: {
                    day: nextMonth.getDate(), 
                    month: nextMonth.getMonth(),
                    year: ref.getFullYear(), // But we aren't sure about the year
                    impliedComponents: ['year'] 
                }
            });
        };

        return parser;
    };

    return chrono;
});
