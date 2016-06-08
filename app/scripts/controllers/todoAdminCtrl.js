angular.module('todomvc')
.controller('todoAdminCtrl', function ($scope, todoAdminService, todoUsersService, 
                                       todoConfigService,
                                       todoSharePointStore, moment, statusBoardMapping, todoParse, toastr) {
    'use strict';
  //var vm = this;
  $scope.cancel = cancel;
  $scope.save = save;
  $scope.resetSortOrder = resetSortOrder;
  $scope.safeResetSortOrder = safeResetSortOrder;
  $scope.saveSortOrder = saveSortOrder;
  $scope.addMissingSortOrder = todoSharePointStore.addMissingSortOrder;
  $scope.close = closeModal;

  var settingsBackup = {};
  activate();

  function activate() {
    settingsBackup  = angular.copy(todoConfigService.settings);
    $scope.settings = todoConfigService.settings;

    $scope.currentUser = { admin: false };

    todoSharePointStore.getCurrentUser().then(function(currentUser) {
        $scope.currentUser    = currentUser;
    });
    //$scope.backgroundColor = todoConfigService.settings.backgroundColor;
  }

  function saveSortOrder() {
    todoSharePointStore.saveSortOrder()
    .then(function() {
        toastr.info('Saved all tasks sort order');
    })
    .catch(function() {
        toastr.error('Not all task sort order saved');
    });
  }

  function resetSortOrder() {
    todoSharePointStore.resetTaskSortOrder();
  }

  function safeResetSortOrder() {
    todoSharePointStore.resetTaskSortOrderKeepingSortOrder();
  }

  function closeModal(result) {
        save(result);
  }

  function cancel(result) {        
        angular.copy(settingsBackup, todoConfigService.settings);
        todoAdminService.deactivate('cancelled');
  }

  function save(result) {        
        //todoConfigService.settings.backgroundColor = $scope.backgroundColor;        
        todoConfigService.save();
        todoAdminService.deactivate({ changed: true });
  }

});
