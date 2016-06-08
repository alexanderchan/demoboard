(function(){
    'use strict';
    angular.module('todomvc').directive('todoBackground', ['todoConfigService', function (todoConfigService) {

        function link(scope, elem, attrs) {

            scope.settings = todoConfigService.settings;

            function setBackground() {
                elem.css('background-color', scope.settings.backgroundColor);
            }

            scope.$watch('settings.backgroundColor', setBackground);
            
            setBackground();
        }

        return  {
            restrict: 'EA',
            scope: {},
            link: link
        };
    }]);
})();
