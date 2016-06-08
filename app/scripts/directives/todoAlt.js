(function(){
    'use strict';

    /**
     * Quick way to increment the date of the current task by 1     
     */
    angular.module('todomvc').directive('todoAltKey', function () {
        return function (scope, elem, attrs) {
            elem.bind('keydown', function (event) {
                if (event.altKey &&  (event.keyCode === 18)) { // 18 is ascii 1
                    scope.$apply(attrs.todoAltKey);
                }
            });
        };
    });
})();
