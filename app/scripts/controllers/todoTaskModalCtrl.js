// typically you'll inject the modal service into its own
// controller so that the modal can close itself
angular.module('todomvc').controller('TodoTaskModalCtrl', function ($scope, editTaskModalService, todoUsersService, todoSharePointStore, moment, statusBoardMapping, todoParse) {

    'use strict';
    $scope.addDaysToTask = addDaysToTask;
    
    activate();

    function activate() {
        // Setup some default values
        if (!$scope.task) {
            
            $scope.task = {};

            if ($scope.dueDate) {
                $scope.task.dueDate = $scope.dueDate;
            } else {
                $scope.task = {
                    dueDate: moment().add(1, 'days').toDate() // default to tomorrow            
                };
            }

            // Take a default user passed in from what is the user filter, if not found, just take the current user from sharepoint
            $scope.task.user = $scope.defaultUser;
            if (!$scope.task.user) {
                todoSharePointStore.getCurrentUser().then(function(user) {
                    $scope.task.user = user;
                });
            }

            // default tags
            var tagIndex = _.indexOf(todoSharePointStore.classifications, $scope.tagsFilter);
            if (tagIndex >= 0) {
                var defaultTag = todoSharePointStore.classifications[tagIndex];
                if (defaultTag) {
                    $scope.task.classifications = [];
                    $scope.task.classifications.push(defaultTag);
                }
            }

        }


        // Cleanup some task descriptions
        if ( $scope.task.description ) {
            // clean html before display note this will be saved cleaned also!
            $scope.task.description = cleanHtml($scope.task.description);
            //$scope.task.description = $($scope.task.description).text();
        }
        
        $scope.boardList = statusBoardMapping; // add the list of boards

    }
 
    
 $scope.datePickerOptions = {
     dateFormat: 'D d M yy',
     beforeShowDay: $.datepicker.noWeekends,
     showAnim: false,
     showWeek: false,
     firstDay: 1,
     showOtherMonths: true,
     selectOtherMonths: true
//     numberOfMonths: 2
 };

 $scope.users = todoUsersService.getUsers();

 var oldTask = _.clone($scope.task);

  $scope.close = function(result) {
        save(result);
  };

  /* Classification and selectize setup */
  $scope.selectizeConfig = {
    create: false,
    selectOnTab: false,
    delimiter: ' '
  };


  $scope.classifications = todoSharePointStore.classifications;
  if (!todoSharePointStore.classifications) {
    $scope.classifications = $scope.task.classifications; // still allow the existing classifications if for some reason cannot find any
  }
  $scope.cancel = function(result) {
        //$scope.task = $scope.oldTask;
        if ($scope.task) {
        var task = $scope.task;
            task.title = oldTask.title;
            task.description = oldTask.description;
            task.user = oldTask.user;
            task.dueDate = oldTask.dueDate;
        }
        $scope.task.editing = false;
        editTaskModalService.deactivate('closed');
  };


  $scope.$watch('task.title', function(newValue) {
       var parsedTodo = todoParse.parseTodoString( newValue );
       if ( parsedTodo ) {
            $scope.task.dueDate = parsedTodo.dueDate || $scope.task.dueDate;
            $scope.task.user = parsedTodo.user || $scope.task.user;
       }
  });

  $scope.save = save;
  $scope.moveAndSave = moveAndSave;

  function moveAndSave(column) {
      if (!column) {
        return;
      }

      if (column !== $scope.task.column) {
        $scope.task.sortOrder = todoSharePointStore.getMaxSortOrder(column);
        $scope.task.column = column;
      }

      save();
  }
  
  function save(result) {        
        // add back manually to the column, the filter should be updated in the controller to do this correctly
        var parsedTodo = todoParse.parseTodoString( $scope.task.title );
        if ( parsedTodo ) {
            $scope.task.title = parsedTodo.newTodoString;
        }

        // the tasklist config is passed from the column that is being added to
        if (!$scope.task.column && $scope.taskList) {                
            if ( $scope.taskList.tasks ) {
                $scope.task.column = $scope.taskList.column;
            }
        }         


        // should do something more advanced like check if the current status is allowed in the column, then ok..
        $scope.task.status = todoSharePointStore.findStatusByColumn($scope.task.column);

        todoSharePointStore.saveTask($scope.task);
        $scope.task.editing = false;
        $scope.task.changed = true;
        editTaskModalService.deactivate($scope.task);
  }

  function addDaysToTask(days) {
      if (days) {
          $scope.task.dueDate = moment().endOf('day').add(days, 'days').toDate();
          var SATURDAY = 6;
          var SUNDAY = 0;
          var NEXT_MONDAY = 8;
          if (moment($scope.task.dueDate).day() === SATURDAY || moment($scope.task.dueDate).day() === SUNDAY) {
              $scope.task.dueDate = moment().endOf('day').weekday(NEXT_MONDAY).toDate();
          }          
      }
  }


  function toString(val){
        return val === null ? '' : val.toString();
  }

  function cleanHtml(value) {
    var cleanedString = toString(value);
        cleanedString = cleanedString.replace(/<(?:.|\n)*?>/gm, '') 
                     .replace(/&nbsp;/g, ' ')
                     .replace(/&amp;/g , '&')
                     .replace(/&lt;/g  , '<')
                     .replace(/&gt;/g  , '>')
                     .replace(/&#0*39;/g , '\'')
                     .replace(/&quot;/g, '"')
                     .trim();
    return cleanedString;
  }

  $scope.task.editing = true;
  this.closeMe = editTaskModalService.deactivate;
});
