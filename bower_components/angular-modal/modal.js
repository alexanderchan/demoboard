/*
 * @license
 * angular-modal v0.4.0
 * (c) 2013 Brian Ford http://briantford.com
 * License: MIT
 */
(function(){
'use strict';

angular.module('btford.modal', []).
factory('btfModal', function ($animate, $compile, $rootScope, $controller, $q, $http, $templateCache) {
  return function modalFactory (config) {
    if (!(!config.template ^ !config.templateUrl)) {
      throw new Error('Expected modal to have exacly one of either `template` or `templateUrl`');
    }

    var template      = config.template,
        controller    = config.controller || angular.noop,
        controllerAs  = config.controllerAs,
        container     = angular.element(config.container || document.body),
        element       = null,
        html,
        scope;

    if (config.template) {
      var deferred = $q.defer();
      deferred.resolve(config.template);
      html = deferred.promise;
    } else {
      html = $http.get(config.templateUrl, {
        cache: $templateCache
      }).
      then(function (response) {
        return response.data;
      });
    }

    var closedDeferred = null;
    function activate (locals) {
      closedDeferred = $q.defer();

      // Prefer to
      html.then(function (html) {
        if (!element) {
          attach(html, locals);
        }
      });

      return closedDeferred.promise;
    }

    function deactivate (data) {
      var deferred = closedDeferred;
      if (element) {
        $animate.leave(element).then(function () {
          scope.$destroy();
          element = null;
          deferred.resolve(data);
        });
      } else {
        deferred.resolve(data);
      }
      return deferred.promise;
    }

    function attach (html, locals) {
      element = angular.element(html);
      if (element.length === 0) {
        throw new Error('The template contains no elements; you need to wrap text nodes')
      }
      $animate.enter(element, container);
      scope = $rootScope.$new();
      if (locals) {
        for (var prop in locals) {
          scope[prop] = locals[prop];
        }
      }
      var ctrl = $controller(controller, { $scope: scope });
      if (controllerAs) {
        scope[controllerAs] = ctrl;
      }
      $compile(element)(scope);
    }


    function active () {
      return !!element;
    }

    return {
      activate: activate,
      deactivate: deactivate,
      active: active
    };
  };
});

}());
