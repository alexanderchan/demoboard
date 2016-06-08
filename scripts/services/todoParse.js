angular.module('todomvc').factory('todoParse', function(todoChrono, $log, moment, lodash, todoUsersService) {
    'use strict';
    return {

        parseTodoString: function ( newTodo, defUser ){
            if (!newTodo) {
                return;
            }
            var dueDate = null;
            var today = moment().hour(0).minute(0);
            var PRE_MATCH = '(by |on |due |\\W|)';
            var newTodoString = newTodo.replace(/tue(|s|\B)$/i,'tuesday')       // weird chrono bug doesn't recognize just tues
                                       .replace(/(so|mo|di|mi|do|fr|sa)$/i,'')  // no german two letter days
                                       .replace(/\B5\.\d\d\b/i,'');             // special case for BR5.XX
            var chronoMatch = todoChrono.parse(newTodoString);

            if ( chronoMatch && chronoMatch.length > 0 ) {
                var dateToUse = chronoMatch[chronoMatch.length - 1];
                var matchRegex = new RegExp(PRE_MATCH + dateToUse.text, 'i');
                newTodoString = newTodo.replace(matchRegex, ''); // remove the date parts from the original string
                dueDate = dateToUse.startDate;
                // for tasks, we try to make them in the future
                // an exception would be if the original date actually included the month
                // strange thing when the day is the same as the current date and after noon GMT so need to set time
                // to end of day
                if ( dueDate < today ) {
                    dueDate = moment(dueDate).add('month', 1);
                }
            } else {
                newTodoString = newTodo;
            }

            var user = defUser || null;
            var userMatchRegex = /@(\w+?)\b(\W?)/i; // Find the user pattern of non-greedy matching words after an @
            var userMatch = userMatchRegex.exec( newTodoString );
            var users = todoUsersService.getUsers();

            if (userMatch) {

                var userNameRegexp = new RegExp(userMatch[1], 'i');

                user = lodash.find(users, function(user) {
                    if ( userNameRegexp.exec( user.searchTerms ) || userNameRegexp.exec( user.name ) ) {
                        return true;
                    } else {
                        return false;
                    }
                });
            }

            if (user) {
                // remove the user from the
                newTodoString = newTodoString.replace(userMatchRegex, '');
            }
            //console.log(user);

            //$log.info(chronoMatch);

            return {
                    dueDate: dueDate,
                    newTodoString: newTodoString,
                    user: user
            };
        }

    };
});


