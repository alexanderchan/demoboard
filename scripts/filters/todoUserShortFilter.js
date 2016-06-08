angular.module('todomvc').filter('todoUserShort', function() {
    'use strict';
    return function( userName ) {
        var shortName = userName;
        // Take the first word as the short name
        if (userName) {
            shortName = /(\w*)\b/.exec(userName)[0];
        }
        return shortName;
    };
});
