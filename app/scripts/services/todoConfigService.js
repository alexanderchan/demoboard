// let's make a modal called `myModal`
angular.module('todomvc').factory('todoConfigService', function (btfModal) {
    'use strict';
    var STORAGE_ID = 'taskboard';
    var settings = {};

    var todoConfigService = {
        get: get,
        save: save,
        settings: settings,
        sessionSettings: {} // used only for the active session
    };

    activate();

    function activate() {
        todoConfigService.settings = get();
    }

    function get() {
        return JSON.parse(localStorage.getItem(STORAGE_ID) || '{}');
    }

    function save() {
        localStorage.setItem(STORAGE_ID, JSON.stringify(todoConfigService.settings));
    }

  return todoConfigService;
});
