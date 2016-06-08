angular.module('todomvc').filter('todoDueDateFilter', function(lodash, moment) {
    'use strict';
    return function( todos, dateFilter ) {
        if (dateFilter) { 
            var dueDate = null;
            if (/today/i.test(dateFilter)) {
                dueDate = moment().endOf('day').toDate();
            } else if (/next week/i.test(dateFilter)) {
                dueDate =  moment().endOf('day').add('7', 'days').toDate();
            } else if (/tomorrow/i.test(dateFilter)) {
                dueDate =  moment().endOf('day').add('1', 'days').toDate();
                // If a weekend day
                if (moment(dueDate).day() === 6 || moment(dueDate).day() === 0) {
                    dueDate =  moment().endOf('day').weekday(8).toDate();
                }
            } else if (/monday/i.test(dateFilter)) {
                dueDate =  moment().endOf('day').weekday(8).toDate();
            } else if (!dateFilter || /any|all/i.test(dateFilter)) {
                return todos;
            } else {
                //return todos;
                dueDate = dateFilter;
            }

            return lodash.filter( todos, function ( todo ) {
                if (todo.dueDate <= dueDate) {
                    return true;
                } else {
                    return false;                
                }
            });
        } else {
            return todos;
        }
    };
});
