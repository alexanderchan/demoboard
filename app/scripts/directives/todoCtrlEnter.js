(function(){
    'use strict';

    /**
     * Directive that executes an expression when the element it is applied to gets
     * an `escape` keydown event.
     */
    angular.module('todomvc').directive('todoCtrlEnter', function () {
        var ENTER_KEY = 13;
        var LINE_FEED = 10;
        return function (scope, elem, attrs) {
            function handleKeydown(event) {
                if (event.ctrlKey && ( (event.keyCode === ENTER_KEY) || (event.keyCode === LINE_FEED) )) {
                    scope.$apply(attrs.todoCtrlEnter);
                }
            }

            elem.on('keydown', handleKeydown);

            elem.on('$destroy', function onDestroy(){
                elem.off('keydown', handleKeydown);        
            });

        };
    });
})();
