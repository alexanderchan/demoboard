(function(){
    'use strict';    
    angular.module('todomvc').directive('todoSelectize', TodoSelectize);

    function TodoSelectize() {
        var link = function(scope, elem, attrs) {
            scope.$evalAsync(function(){
                elem.selectize({
                    delimiter: ',',
                    persist: false,
                    create: function(input) {
                        return {
                            value: input,
                            text: input
                        };
                    }
                });
            });
            //scope.hello = 'hi there';
        };

        return {
            restrict: 'EA',
            link: link
        };
    }

        $(function() {
            $('#seltest').selectize();
        });
})();
