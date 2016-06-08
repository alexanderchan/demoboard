angular.module('todomvc').animation('.edited-item', function($log) {
    'use strict';    
    function fadeElement(element, done) {
        
        $log.info(element);

        element.css('background-color', 'blue');        
        done();
        
        return function(isCancelled) {
            $(element).stop();
        };
    }

    function fadeClassElement(element, className, done) {
        fadeElement(element, done);
    }

    var animation = {
            leave: fadeElement,
            removeClass: fadeClassElement,
            addClass: fadeClassElement
    };

    return animation;
});
