/**
 * Directive that executes an expression when the element it is applied to gets
 * an `escape` keydown event.
 */
angular.module('todomvc').directive('todoEscape', function () {
'use strict';
	var ESCAPE_KEY = 27;
	return function (scope, elem, attrs) {
        function handleEscape(event) {
			if (event.keyCode === ESCAPE_KEY) {
				scope.$apply(attrs.todoEscape);
			}
		}
		elem.on('keydown', handleEscape);

        elem.on('$destroy', function cleanup() {
            elem.off('keydown', handleEscape);            
        });
	};
});

