angular.module('todomvc').filter('todoUserFilter', function(lodash) {
    'use strict';
    return function( todos, user ) {
        if (user) {
            return lodash.filter( todos, function ( todo ) {
                if ((todo.user) && (todo.user.id === user.id)) {
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
