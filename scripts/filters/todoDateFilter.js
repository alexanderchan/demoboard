angular.module('todomvc').filter('todoDate', function(moment) {
    'use strict';
    return function( input ) {

            // Show the nearby dates as names
            if ( (moment(input).toDate() >= moment().startOf('day').toDate()) && (moment(input).toDate() <= moment().endOf('day').toDate()) ) {
                return 'Today';
            } else if ( (moment(input).toDate() >= moment().endOf('day').toDate()) && (moment(input).toDate() <= moment().add(6, 'day').endOf('day').toDate()) ) {
                //} else if ((timeFromNow > 0) && (timeFromNow <= moment.duration(7, 'days').asMilliseconds())){ 
                //console.log(input);
                return moment(input).format('ddd');
            }
           return moment(input).format('D MMM');
    };
});
