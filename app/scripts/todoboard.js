(function(){
    'use strict';
    angular.module('todomvc', ['ui.sortable', 'ui.date', 'ui.router', 'ui.calendar', 'ngDragDrop', 'btford.modal', 'selectize', 'colorpicker.module'])
    .factory('listConfig', ['$location', function($location){
        //--------------------------------------------------------------
        // Board Configuration
        //--------------------------------------------------------------
        var LIST_NAME = 'DOR'; //
        var TEAM_ROOM_URL = 'http://teamroom.todoboard.com/GProjectISIT/TODOBOARDXSolution/'; // $location.protocol + '://' + $location.host + '/external3/IngeniusLabIdeas/';
        var CLASSIFICATION_FIELD_NAME = 'Classification';//'Problem_x0020_Solving_x0020__x00'; //'PS_x0020__x002f__x0020_Improveme';, 'Classification' for DOR

        var users =  [
            {
            name: 'Alexander Chan',
            searchTerms: 'AC',
            id: '13514',
            image: 'images/team/alex.jpg',
            admin: true // enable admin functionality
        },
        {
            name: 'Ben Parry',
            searchTerms: 'BP',
            id: '111',
            image: 'images/team/ben_parry.jpg'
        },
        {
            name: 'Vincent Van Gogh',
            searchTerms: 'VG VVG',
            id: '109',
            image: 'images/team/van_gogh.jpeg'
        },
        {
            name: 'Marie Curie',
            searchTerms: 'MC',
            id: '17282'
        },
        {
            name: 'Han Solo',
            searchTerms: 'HS',
            id: '124649'
        },
        {
            name: 'Luke Skywalker',
            searchTerms: 'NR',
            id: '125'
        },
        {
            name: 'R2 D2',
            searchTerms: 'R2',
            id: '112' //??
        },

        {
            name: 'Indiana Jones',
            searchTerms: 'IJ',
            id: '124283',
            image: 'images/team/indiana_jones.png'
        }
        ];


        //--------------------------------------------------------------
        // End Board Configuration
        //--------------------------------------------------------------
        return {
            listName: LIST_NAME,
            sharePointUrl: TEAM_ROOM_URL + '/Lists/' + LIST_NAME, //+ '/active.aspx'
            listUrl: TEAM_ROOM_URL + '/_vti_bin/Lists.asmx',
            userUrl: TEAM_ROOM_URL + '/_vti_bin/UserProfileService.asmx',
            classificationFieldName: CLASSIFICATION_FIELD_NAME,
            teamRoomUrl: TEAM_ROOM_URL,
            users: users
        };
    }])
    .constant('statusBoardMapping',
              [
                  {
                  board: '0',
                  name: 'To Do',
                  statuses: [ 'Not Started'],
                  backgroundColor: '#535353'
              },
              {
                  board: '1',
                  name: 'Work in Progress',
                  statuses: ['In Progress'],
                  backgroundColor: '#3a87ad'
              },
              {
                  board: '2',
                  name: 'Blocked/Waiting',
                  statuses: ['Deferred', 'Waiting on someone else'],
                  backgroundColor: '#e48000'
              },
              {
                  board: '3',
                  name: 'Done',
                  statuses: ['Completed'],
                  backgroundColor: '#008800',
                  nocalendar: true
              }
              ]
             )
    .value('moment', window.moment)
    .value('chrono', window.chrono)
    .value('lodash', window._)
    .value('_', window._)
    .value('multiline', window.multiline)
    .value('x2js', new window.X2JS())
    .constant('toastr', window.toastr) //constants are initialized before config..
    .config(function(toastr) {

        toastr.options = {
            'closeButton': true,
            'positionClass': 'toast-bottom-right'
        };
    })
    .config(function($stateProvider, $urlRouterProvider) {

        // Default route
        $urlRouterProvider.otherwise('/date/Any');

        $stateProvider
        .state('date', {
            url:'/date/:date?localmode&tags&config', // localmode is used by the sharepointstore to determine whether to use local test data
            views: {
                'main': {
                    templateUrl: 'todoboard.html',
                    controller: 'todoBoardCtrl'
                },

                'navigation': {
                    templateUrl: 'templates/navbar.html',
                    controller: 'todoBoardCtrl'
                }
            },
            onEnter: ['$stateParams', 'todoAdminService', function($stateParams, todoAdminService) {
                if ($stateParams.config) {
                    todoAdminService.activate();
                }
            }]
        })
        .state('date.user', {
            url: '/user/:user',
            parent: 'date'
        })

        .state('date.calendar', {
            url: '/user/:user/calendar',
            parent: 'date',
            views: {
                'main@': {
                    templateUrl: 'templates/calendar.html',
                    controller: 'CalendarCtrl'
                },
                'navigation': {
                    templateUrl: 'templates/navbar.html',
                    controller: 'todoBoardCtrl'
                }
            }
        });
    });

})();
