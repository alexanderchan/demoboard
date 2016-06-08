/**
 * Relative Max height 
 */
angular.module('todomvc').directive('todoWindowMaxHeight', function ($window) {
    'use strict';
    return function (scope, elem, attrs) {
            var SUBTRACT_FROM_WINDOW_HEIGHT = 150;

            function recalcSize() {
                elem.css('max-height', $($window).height() - SUBTRACT_FROM_WINDOW_HEIGHT);            
            }
            
            recalcSize();

            $($window).resize(function() {
                recalcSize();
            });
		/*scope.$watch(attrs.todoFocus, function (newVal) {
			if (newVal) {
				$timeout(function () {
					elem[0].focus();
				}, 0, false);
			}
		});*/
	};
});
