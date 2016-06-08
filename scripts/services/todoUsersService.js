/**
 * Services that persists and retrieves TODOs from localStorage
*/
angular.module('todomvc').factory('todoUsersService', function ($filter, $q, listConfig) {
'use strict';

    var todoUsersService = {};

    todoUsersService.getShortName = function( name ) {
            return $filter('todoUserShort')( name );
    };


    var users =  listConfig.users;

    users = _.sortBy(users, function(user) { 
        return user.name; 
    });

        
    todoUsersService.findUser = function( patternStr ) {
        var pattern = new RegExp(patternStr, 'i');
        return _.find(users, function ( user ) {
            if ( pattern.test(user.name) ){
                return true;
            } else {
                return false;
            }            
        });
    };

    //var currentUser;


    /*todoUsersService.getCurrentUser = function(){
        var userPromise = $q.defer();
        if (!currentUser) {
            currentUser = users[0];//$http.then this back from sharepoint
            userPromise.resolve(currentUser);
        } else {
            userPromise.resolve(currentUser);
        }
        return userPromise.promise;
    };
*/
    todoUsersService.getUsers = function getUsers(){
        return users;
    };

    return todoUsersService;

});
