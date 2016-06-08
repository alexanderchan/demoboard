// let's make a modal called `myModal`
angular.module('todomvc').factory('editTaskModalService', function (btfModal) {
  'use strict';
  return btfModal({
    controller: 'TodoTaskModalCtrl',
//    controllerAs: 'modal',
    templateUrl: 'templates/editTaskModal.html'
  });
});
