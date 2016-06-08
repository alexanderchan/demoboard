(function(){
    'use strict';

    /**
     * Directive that executes an expression on keypress 
     */
    angular.module('todomvc').directive('todoEnter', function () {
        var ENTER_KEY = 13;
        var LINE_FEED = 10;
        return function (scope, elem, attrs) {
            function onKeyDown(event) {
                if (( (event.keyCode === ENTER_KEY) || (event.keyCode === LINE_FEED) )) {
                    scope.$apply(attrs.todoEnter);
                }
            }            

            elem.on('keydown', onKeyDown);
            elem.on('$destroy', function cleanUp(){
                elem.off('keydown', onKeyDown);
            });
        };
    });
})();
