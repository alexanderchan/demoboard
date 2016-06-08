(function(angular){
'use strict';
    angular
        .module('todomvc')
        .directive('todoDate', TodoDate);

    function TodoDate() {
        var link = function(scope, elem, attrs) {
            scope.hello = 'hi there';
        };

        return {
            templateUrl: 'js/templates/todoDate.html',
            restrict: 'EA',
            link: link
        }; 
    }

})(angular);
