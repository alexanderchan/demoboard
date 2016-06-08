(function(){
'use strict';

angular.module('todomvc')
.controller('todoBoardCtrl', ['$scope', '$filter', '$log', 'todoSharePointStore', 'editTaskModalService',
                       'todoConfigService', 'todoAdminService', 'todoUsersService', 'listConfig', '$state', '$stateParams', 'statusBoardMapping',
            TodoBoardCtrl] );

function TodoBoardCtrl($scope, $filter, $log, todoSharePointStore, editTaskModalService,
                       todoConfigService, todoAdminService, todoUsersService, listConfig, $state, $stateParams, statusBoardMapping)
                       {

                           activate();

                           function activate() {                               
                               $scope.settings = todoConfigService.settings;
                               $scope.sessionSettings = todoConfigService.sessionSettings;
                               $scope.listConfig = listConfig;

                               $scope.users = todoUsersService.getUsers();
                               $scope.getShortName = todoUsersService.getShortName;
                               $scope.classifications = todoSharePointStore.classifications;

                               $scope.sortingLog = [];

                               $scope.currentUser = { admin: false };

                               todoSharePointStore.getCurrentUser().then(function(currentUser) {
                                   $scope.currentUser    = currentUser;
                               });

                               todoSharePointStore.getClassifications().then(function(classifications) {
                                   $scope.classifications = classifications;
                               });

                               applyConfig();

                               $scope.rawScreens = {};

                               $scope.columns = _.indexBy(statusBoardMapping, 'board');

                               $scope.sortableOptionsList = [];
                               _.each($scope.columns, function(column){
                                   $scope.sortableOptionsList.push(createOptions(column.board));
                               });

                               $scope.taskList = [];

                               $scope.$watch('sessionSettings.searchFilter', function(){
                                   applyFilter();
                               });


                               todoSharePointStore.getTasks().then(function(data) {
                                   $scope.rawScreens = data;
                                   applyFilter();
                                   console.log($scope.taskList);
                               });
                           }

                           function applyConfig() {
                               $scope.boardStyle = { 'background-color': $scope.settings.backgroundColor };
                           }
                           // Monitor the current route for changes and adjust the filter accordingly.
                           $scope.$on('$stateChangeSuccess', function () {
                               //console.log($state.params);
                               //    console.log($stateParams);
                               //var status = $scope.status = $stateParams.status || '';

                               var userName = $state.params.user || null;
                               var due = $state.params.date || '';

                               if ( $state.params.tags === true ) {
                                   $scope.tagsFilter = 'All';
                               } else {
                                   $scope.tagsFilter = $state.params.tags;
                               }

                               $scope.dueDateFilter = due;

                               $scope.userNameToFilter = userName;
                               $scope.userToFilter = todoUsersService.findUser(userName);

                               /*$scope.statusFilter = {
                                 'active':       { completed: false },
                                 'completed':    { completed: true },
                                 'all':    null
                                 }[status];*/

                               applyFilter();
                           });


                           function createOptions (listName) {
                               //var _listName = listName;
                               var options = {
                                   placeholder: 'placeholder',
                                   connectWith: '.apps-container',
                                   activate: function() {
                                       //console.log('list ' + _listName + ': activate');
                                   },
                                   beforeStop: function(event, ui){
                                       // on drop change the category if needed
                                       var movedTask = _.find($scope.rawScreens, { id: ui.helper[0].id });

                                       if (movedTask) {
                                           var newColumn = ui.helper.parent()[0].getAttribute('app-column');
                                           if (movedTask.column !== newColumn) {
                                               movedTask.column = newColumn;
                                               movedTask.status = todoSharePointStore.findStatusByColumn(newColumn) || movedTask.status;
                                               movedTask.moved = true;
                                           }

                                       }
                                   },
                                   start: function(event, ui) {
                                       ui.item.addClass('tilt');
                                       //console.log('list ' + _listName + ': start');
                                   },
                                   stop: function(event, ui) {
                                       ui.item.removeClass('tilt');
                                       var movedTask = _.find($scope.rawScreens, { id: ui.item[0].id });
                                       moveTask(movedTask);
                                       todoSharePointStore.saveTask(movedTask);
                                       applyFilter();
                                       // Add the moved task back to the master list
                                   }
                               };
                               return options;
                           }

                           /* 1000
                            * 2000
                            * 3000
                            * unsorted
                            * unsorted
                            * unsorted
                            */


                           function moveTask(movedTask) {
                               //if (movedTask) {
                               // need an unfiltered view of the taskList columns sorted by sortOrder, could even find previous by
                               var prevIndex = _.findIndex($scope.taskList[movedTask.column].tasks, { id: movedTask.id }) - 1;
                               var prev = $scope.taskList[movedTask.column].tasks[prevIndex];

                               var nextIndex = 0;
                               var next = null;
                               if (prev) {
                                   nextIndex = _.findIndex($scope.taskList[movedTask.column].allTasks, { id: prev.id }) + 1;
                               } else {
                                   nextIndex = 0;
                               }
                               next = $scope.taskList[movedTask.column].allTasks[nextIndex];

                               // Determine the new sortorder given the prev and next values
                               var prevSort = null;
                               var nextSort = null;

                               if (prev && prev.sortOrder) {
                                   prevSort = prev.sortOrder;
                               } else {
                                   prevSort = 0; // normally this should happen at the top or if somehow there was no sort number for the prev
                               }

                               if (next && next.sortOrder) {
                                   nextSort = next.sortOrder;
                               } else {
                                   nextSort = null;
                               }

                               var DEFAULT_INSERTION = 1000;
                               var sortOrder;
                               // If there is no next, just add 1000 to the previous
                               if ( nextSort === null ) {
                                   sortOrder = prevSort + DEFAULT_INSERTION;
                               } else {
                                   // insert this halfway between prev and next
                                   sortOrder = ( nextSort - prevSort ) / 2 + prevSort;

                                   // It's possible that the space between is 0 so we need more space
                                   if (( sortOrder === prevSort ) || (sortOrder === nextSort )) {
                                       // resort and reset the numbering from previous upwards
                                   }
                               }

                               if ( sortOrder !== movedTask.sortOrder ) {
                                   movedTask.moved = true;
                                   movedTask.sortOrder = sortOrder;
                                   return true;
                               } else {
                                   return false;
                               }
                               // check for the previous and next in the column
                               //}
                           }



                           function applyFilter() {

                               _.forEach($scope.columns, function(column, index){
                                   $scope.taskList[index] = {
                                       column: column.board,
                                       name: column.name,
                                       tasks: $filter('todoDueDateFilter')($filter('filter')($scope.rawScreens, {column: column.board, user: $scope.userToFilter, title: $scope.sessionSettings.searchFilter }), $scope.dueDateFilter),
                                       allTasks: $filter('filter')($scope.rawScreens, {column: column.board })
                                   };

                                   $scope.taskList[index].tasks = $filter('orderBy')($scope.taskList[index].tasks, 'sortOrder', false); // sort by dueDate descending:false
                                   $scope.taskList[index].allTasks = $filter('orderBy')($scope.taskList[index].allTasks, 'sortOrder', false); // sort by dueDate descending:false
                                   // finally if there is a dor filter, search by that as well
                                   if (($scope.tagsFilter) && $scope.tagsFilter !== 'All') {
                                       $scope.taskList[index].tasks = _.filter($scope.taskList[index].tasks, { classifications: [$scope.tagsFilter] });
                                   }

                               });

                           }




                           $scope.editSettings = function( ) {
                               $scope.sessionSettings.showSortOrder = true;
                               todoAdminService.activate().then(function(result){
                                   applyConfig();
                                   applyFilter();
                                   $scope.sessionSettings.showSortOrder = false;
                               });
                           };

                           $scope.showModal = function(params) {

                               params.defaultUser = $scope.userToFilter;

                               editTaskModalService.activate(params).then(function(data){
                                   if (data) {
                                       if (data.changed){
                                           applyFilter();
                                       }
                                   }
                               });
                           };

                           $scope.$watch('searchFilter', applyFilter);

                       }
})();
