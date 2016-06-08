// let's make a modal called `myModal`
angular.module('todomvc').factory('todoAdminService', function (btfModal) {
  'use strict';
  return btfModal({
    controller: 'todoAdminCtrl',
//    controllerAs: 'modal',
    templateUrl: 'templates/todoAdmin.html'
  });
});
