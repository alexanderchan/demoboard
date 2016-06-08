(function() {
    'use strict';

    angular.module('todomvc')

    .controller('CalendarCtrl', ['$scope', '$filter', '$log', 'uiCalendarConfig', 
                                '$compile','todoSharePointStore', '$state', '$stateParams', 'statusBoardMapping', 
                                'todoConfigService', 'todoUsersService', 'editTaskModalService', 'moment',
                                CalendarCtrl]);

    function CalendarCtrl($scope, $filter, $log, uiCalendarConfig, $compile, todoSharePointStore, $state, $stateParams, statusBoardMapping, todoConfigService, todoUsersService, editTaskModalService, moment){
        var boardListByColumn = {};

        activate();

        $scope.uiConfig = {
            calendar:{
                height: 550,
                editable: true,
                header: {
                    left: '',
                    center: 'title',
                    right: 'prev,next, today, month,agendaWeek,agendaDay'
                },
                weekends: false,
                /*weekNumbers: true,*/
                eventClick: $scope.alertOnEventClick,
                eventDrop: $scope.alertOnDrop,
                eventResize: $scope.alertOnResize,
                eventRender: $scope.eventRender,
                dayClick: addEvent,

                allDayText: 'Tasks',
                minTime: '08:00:00',
                maxTime: '18:00:00'
            }
        };


        function activate() {
            /* alert on eventClick */
            $scope.alertOnEventClick = function( event, jsEvent, view){
                $log.info(event.title + ' was clicked ');
                var params = {
                    defaultUser: $scope.userToFilter,
                    task: event.task
                };

                editTaskModalService.activate(params).then(function(data){
                    //copyTaskToEvent(event.task, event);
                    event.title = getTitle(event, event.task);
                    //event.start = event.task.dueDate;
                    event.end = moment(event.task.dueDate).toDate();
                    event.start = moment(event.task.dueDate).toDate();
                    //event.end = moment(event.task.dueDate);
                    applyFilter(); 
                });

            };
            /* alert on Drop */
            $scope.alertOnDrop = function(event, delta, revertFunc, jsEvent, ui, view){
                //$log.info('Event Dropped to make dayDelta ' + delta);
                $log.info('Event Dropped to make event ' + event.start);
                //$log.info('Event Dropped to make event ' + event.end);
                event.task.dueDate = event.start;
                todoSharePointStore.saveTask(event.task).then(function() {
                    //$log.info('saved task');
                });

            };
            /* alert on Resize */
            $scope.alertOnResize = function(event, delta, revertFunc, jsEvent, ui, view ){
                $log.info('Event Resized to make dayDelta ' + delta);
            };


            boardListByColumn = _.indexBy(statusBoardMapping, 'board');

            /* Render Tooltip */
            $scope.eventRender = function( event, element, view ) { 
                element.attr({'tooltip': event.title,
                             'tooltip-append-to-body': true});
                             $compile(element)($scope);
            };




            /* event source that contains custom events on the scope */
            $scope.events = [ ];
            $scope.rawScreens = [];
            $scope.sessionSettings = todoConfigService.sessionSettings;

            todoSharePointStore.getTasks().then(function(data) {
            //    $scope.rawScreens = data;
            //    applyFilter();
                //
                if (data) {
                    _.each(data, function(task) {
                        var event = {};
                        copyTaskToEvent(task, event);
                        $scope.rawScreens.push(event);
                        //$scope.events.push(event);
                    });
                    applyFilter();
                }
            });

            $scope.eventSources = [$scope.events];
        }

        $scope.$on('$stateChangeSuccess', function () {
            applyFilter();
        });

        $scope.$watch('sessionSettings.searchFilter', function () {
            applyFilter();
        });


        function copyTaskToEvent(task, event, allDayEvent) {
            if (!event) {
                event = {};
            }
            event.id = task.id;
            event.title = getTitle(event, task);
            event.user = task.user;
            event.start = moment(task.dueDate).toDate();
            //event.end = moment(task.dueDate).endOf('day').toDate();
            event.dueDate = task.dueDate;
            if (allDayEvent !== undefined) {
                event.allDay = allDayEvent;
            } else {
                event.allDay = true;
            }
            //event.allDay = true;
            event.task = task;
            event.editable = true;

            return event;
        }

        function getTitle(event, task) {
            return (task.user ? task.user.searchTerms: '') + ': ' +  task.title;
        }

        function applyFilter(){
            var filteredEvents = filterEvents($scope.rawScreens);
            $scope.events.length = 0;
            _.each(filteredEvents, function(event) {
                if (typeof event.task.column !== 'undefined') {
                    if (boardListByColumn[event.task.column].backgroundColor) {
                        event.backgroundColor = boardListByColumn[event.task.column].backgroundColor;
                    }
                    if(!boardListByColumn[event.task.column].nocalendar) {
                        $scope.events.push(event);
                    }
                }
            });

            $scope.events.editable = true;
        }

        function filterEvents(allEvents) {
            if (!allEvents) {
                return [];
            }
            // original array is watched so we have to do some expensiev operations, must be a better way to do this
            var due = $state.params.date || '';

            $scope.dueDateFilter = due;

            if ( $state.params.tags === 'All' ) {
                $scope.tagsFilter = null;
            } else {
                $scope.tagsFilter = $state.params.tags;
            }

            var userName = $state.params.user || null;
            $scope.userNameToFilter = userName;
            $scope.userToFilter = todoUsersService.findUser(userName);
            
            var filteredEvents = $filter('todoDueDateFilter')($filter('filter')(allEvents, {user: $scope.userToFilter, title: $scope.sessionSettings.searchFilter }), $scope.dueDateFilter);

            if ($scope.tagsFilter) {
                filteredEvents = _.filter(filteredEvents, { task: { 'classifications': [$scope.tagsFilter] } });
            }

            return filteredEvents;
        }

        function addEvent(dayDate, allDay, event, view){
            editTaskModalService.activate({ dueDate: dayDate, tagsFilter: $state.params.tags }).then(function(task){
                var event = {};
                //var allDayEvent = false;
                //allDayEvent = !dayDate.hasTime();
                copyTaskToEvent(task, event, allDay);
                $scope.rawScreens.push(event);
                applyFilter();
            });
        }
    }

})();
