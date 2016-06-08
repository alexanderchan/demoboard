/*jslint bitwise: true, eqeqeq: true, camelcase: false */


angular.module('todomvc').factory('todoSharePointStore',
    function($http, $log, $q, $state, $filter, x2js, _, statusBoardMapping, moment, todoUsersService, listConfig, multiline, toastr) {
    'use strict';
    var LOCAL_MODE = true

    var LIST_URL = listConfig.listUrl;
    var USER_URL = listConfig.userUrl;
    var CLASSIFICATION_FIELDNAME = listConfig.classificationFieldName;//'Problem_x0020_Solving_x0020__x00'; //'PS_x0020__x002f__x0020_Improveme';, 'Classification' for DOR
    var DEFAULT_COLUMN = 0;
        // Probably we should also map the other required fields which are:
        // Title, Body (Detailed description), Status, Due Date, Assigned To, SortOrder, Modified



    var CLASSIFICATION_FIELDNAME_OWS = '_ows_' + CLASSIFICATION_FIELDNAME;
    var headers = {
        'Content-Type': 'application/soap+xml; charset=utf-8',
        'Accept': '*/*'
    };

    var SUCCESS_CODE = '0x00000000';
    var SORT_INCREMENT = 1000;
    var TAG_SPLIT = ';#';
    var todoSharePointStore = {};

    todoSharePointStore.tasks = [];

    todoSharePointStore.resetTaskSortOrderKeepingSortOrder = resetTaskSortOrderKeepingSortOrder;
    todoSharePointStore.resetTaskSortOrder = resetTaskSortOrder;
    todoSharePointStore.saveTask = saveTask;
    todoSharePointStore.saveSortOrder = saveSortOrder;
    todoSharePointStore.getMaxSortOrder = getMaxSortOrder;
    todoSharePointStore.addMissingSortOrder = addMissingSortOrder;

    todoSharePointStore.getNextMaxSortOrder = function(column) {
        return getMaxSortOrder(column) + SORT_INCREMENT;
    };

    todoSharePointStore.getTempGuid = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    };

    // Returns a promise with an array of allowed classifications
    todoSharePointStore.getClassifications = function() {

        var GET_LIST_DETAILS_XML = multiline.stripIndent(function(){/*!@preserve
                                        <?xml version="1.0" encoding="utf-8"?>
                                        <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
                                        <soap12:Body>

                                            <GetList xmlns="http://schemas.microsoft.com/sharepoint/soap/">
                                            <listName><%= listName %></listName>
                                            </GetList>

                                        </soap12:Body>
                                        </soap12:Envelope>
                                        */
        $log.info();
        });

        var getListDetailsXML  = _.template(GET_LIST_DETAILS_XML, {
            listName: listConfig.listName,
        });

            var config = {
                method: 'POST',
                url: LIST_URL,
                headers: headers,
                data: getListDetailsXML
            };


            var localConfig = {
                method: 'GET',
                headers: headers
            };

            if ($state.params.localmode === 'true' || LOCAL_MODE){
                localConfig.url = 'test_data/list_header.xml';
                config = localConfig;
            }

            return $http(config).then(function(result){
                            //var listPropertiesDoc = $(result);

                            var listPropertiesDoc = $($.parseXML(result.data)); // a jquery wrapped xml document
                            var choicesElements = listPropertiesDoc.find('Field[Name="' + CLASSIFICATION_FIELDNAME + '"]').find('CHOICE');

                            var allowedClassification = [];
                            _.each(choicesElements, function(element) {
                                allowedClassification.push(element.textContent);
                            });

                            //var listProperties = x2js.xml_str2json(result.data);
                            // Long array of properties
                            //var properties = currentUserParsedData.Envelope.Body.GetUserProfileByNameResponse.GetUserProfileByNameResult.PropertyData
                            //console.log(currentUserParsedData);
                            todoSharePointStore.classifications = allowedClassification;
                            return allowedClassification;
                        }).catch(function(error) {
                            //toastr.error('Could not read allowed classifications');
                            return null;
                        });

    };

    todoSharePointStore.classifications = [];
    todoSharePointStore.getClassifications().then(function(classifications){
        todoSharePointStore.classifications = classifications;
    });


    var currentUser;

    // Read the current user name from sharepoint and then find the related user
    todoSharePointStore.getCurrentUser = function() {

        var CURRENT_USER_XML = multiline.stripIndent(function(){/*!@preserve
                        <?xml version="1.0" encoding="utf-8"?>
                        <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
                        <soap12:Body>

                        <GetUserProfileByName xmlns="http://microsoft.com/webservices/SharePointPortalServer/UserProfileService">
                        <AccountName></AccountName>
                        </GetUserProfileByName>

                        </soap12:Body>
                        </soap12:Envelope>
        */
        $log.info();
        });

        if (currentUser) {
        var userPromise = $q.defer();
            userPromise.resolve(currentUser);
            return userPromise.promise;
        } else {

            var config = {
                method: 'POST',
                url: USER_URL,
                headers: headers,
                data: CURRENT_USER_XML
            };


            var localConfig = {
                method: 'GET',
                headers: headers
            };

            if ($state.params.localmode === 'true' || LOCAL_MODE){
                localConfig.url = 'test_data/userData.xml';
                config = localConfig;
            }

            return $http(config).then(function(result){
                            var currentUserParsedData = x2js.xml_str2json(result.data);
                            // Long array of properties
                            var properties = currentUserParsedData.Envelope.Body.GetUserProfileByNameResponse.GetUserProfileByNameResult.PropertyData;
                            //console.log(currentUserParsedData);
                            var firstNameProp = _.find(properties, { 'Name':'FirstName'});
                            if ( firstNameProp ) {
                                currentUser = todoUsersService.findUser(firstNameProp.Values.ValueData.Value.__text);
                            } else {
                                throw 'Could not find name';
                            }
                            return currentUser;
                        }).catch(function(error) {
                            currentUser = todoUsersService.getUsers()[0];
                            return currentUser;
                        });

        }

    };
    // initialize the current user right away
    todoSharePointStore.getCurrentUser().then(function setupCurrentUser(user){
            currentUser = user;
    });


    todoSharePointStore.findStatusByColumn = function findStatusByColumn(column) {
        var statusBoard = _.find(statusBoardMapping, { board: column });
        return statusBoard ? statusBoard.statuses[0] : null;
    };


    todoSharePointStore.flattenTags = function flattenTags(tags) {
        var flatTags = '';
        if (_.isArray(tags)) {
            flatTags = TAG_SPLIT + tags.join(TAG_SPLIT) + TAG_SPLIT; // format is ;#tag;#anothertag;#
        }
        return flatTags;
    };

            var NEW_TASK_XML = multiline.stripIndent(function(){/*!@preserve
                    <?xml version="1.0" encoding="utf-8"?>
                    <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
                    <soap12:Body>
                        <UpdateListItems xmlns="http://schemas.microsoft.com/sharepoint/soap/">
                        <listName><%= listName %></listName>
                        <updates>
                        <Batch OnError="Continue" ListVersion="0" >
                        <Method ID="<%= methodId %>" Cmd="<%= cmd %>">
                            <Field Name="Title"><![CDATA[<%= title %>]]></Field>
                            <Field Name="ID"><%= id %></Field>
                            <Field Name="AssignedTo"><%= userId %></Field>
                            <Field Name="DueDate"><%= dueDate %></Field>
                            <Field Name="Body"><![CDATA[<%= description %>]]></Field>
                            <Field Name="SortOrder"><%= sortOrder %></Field>
                            <Field Name="Status"><%= status %></Field>
                            <Field Name="<%= classificationFieldName %>"><![CDATA[<%= flatTags %>]]></Field>
                        </Method>

                        </Batch>
                        </updates>
                        </UpdateListItems>
                    </soap12:Body>
                    </soap12:Envelope>
            */$log.info();});


            var UPDATE_SORTORDER_STATUS_XML = multiline.stripIndent(function(){/*!@preserve
                    <?xml version="1.0" encoding="utf-8"?>
                    <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
                    <soap12:Body>
                        <UpdateListItems xmlns="http://schemas.microsoft.com/sharepoint/soap/">
                        <listName><%= listName %></listName>
                        <updates>
                        <Batch OnError="Continue" ListVersion="0" >
                        <Method ID="<%= methodId %>" Cmd="<%= cmd %>">
                            <Field Name="ID"><%= id %></Field>
                            <Field Name="SortOrder"><%= sortOrder %></Field>
                            <Field Name="Status"><%= status %></Field>
                        </Method>

                        </Batch>
                        </updates>
                        </UpdateListItems>
                    </soap12:Body>
                    </soap12:Envelope>
            */$log.info();});

    function getMaxSortOrder(column) {
        var maxTask = _(todoSharePointStore.tasks).where({ column: column }).max( 'sortOrder' ).value();
        // if the collection is empty, lodash returns -Infinity
        return  _.isObject(maxTask) ? maxTask.sortOrder : 0;
    }

    function saveSortOrder() {
        var savedTaskPromises = [];
        _.each(todoSharePointStore.tasks, function(task) {
                var savePromise = saveTask(task);
                savedTaskPromises.push(savePromise);
        });

        return $q.all(savedTaskPromises);
    }

    function saveTask(task) {
        var ACTION_UPDATE = 'Update';
        var ACTION_CREATE = 'New';

        var sharePointAction = ACTION_UPDATE;
        var id = task.id;

        // take the first status if there is nothing else
        if (!task.status) {
            task.column = DEFAULT_COLUMN;
            task.status = statusBoardMapping[DEFAULT_COLUMN].statuses[0];
        }

        if (!task.id) {
            task.id = '$temp' + todoSharePointStore.getTempGuid();
            sharePointAction = ACTION_CREATE;
            task.sortOrder = getMaxSortOrder( task.column ) + SORT_INCREMENT;
        }

        // problem if update hasn't come back, need a way to queue up changes for any temporary objects that don't have an id

        var userId = task.user ? task.user.id : null;

        var flatTags = todoSharePointStore.flattenTags(task.classifications);

        var listXML = '';

        if (task.moved === true) {
            listXML = UPDATE_SORTORDER_STATUS_XML;
        } else {
            listXML = NEW_TASK_XML;
        }

        var newTaskXML = _.template(listXML, {
                id: id,
                methodId: 1, // counter starts at 1
                cmd: sharePointAction,
                listName: listConfig.listName,
                title: task.title,
                userId: userId,
                description: task.description,
                status: task.status,
                sortOrder: task.sortOrder,
                dueDate: moment(task.dueDate).format('YYYY-MM-DD'),
                classificationFieldName: CLASSIFICATION_FIELDNAME,
                flatTags: flatTags
        });

                // Server config
        var config = {
            method: 'POST',
            url: LIST_URL,
            headers: headers,
            data: newTaskXML
        };

        var localConfig = {
            method: 'GET',
            headers: headers
        };

        if ($state.params.localmode === 'true' || LOCAL_MODE){
            if ( sharePointAction === ACTION_UPDATE ) {
                localConfig.url = 'test_data/save_update_single.xml';
            } else {
                localConfig.url = 'test_data/save_new_task.xml';
            }
            config = localConfig;
        }


        if (sharePointAction === ACTION_CREATE) {
            todoSharePointStore.tasks.unshift(task);
        }
        task.saving = true;
        // get the list of users
        return $http(config).then(function(result){
                // parse all of the data

                var parsedData = x2js.xml_str2json(result.data);
                if ( parsedData ) {
                    var errorCode = parsedData.Envelope.Body.UpdateListItemsResponse.UpdateListItemsResult.Results.Result.ErrorCode;
                    if (errorCode !== SUCCESS_CODE) {
                        var errorText = parsedData.Envelope.Body.UpdateListItemsResponse.UpdateListItemsResult.Results.Result.ErrorText;
                        throw errorText;
                    }
                    if ( sharePointAction === ACTION_CREATE ){
                        var rowData = parsedData.Envelope.Body.UpdateListItemsResponse.UpdateListItemsResult.Results.Result.row;
                        if (!($state.params.localmode || LOCAL_MODE)) { // in local mode we have to keep the id
                            task.id = rowData._ows_ID;
                        }
                    }
                    if ( task.moved === true ) {
                        //toastr.info('"' + task.title + '" changed status to ' + task.status);
                        task.moved = false;
                    } else {
                        //toastr.info('Saved task: ' + task.title );
                    }
                    task.saving = false;
                } else {
                    task.error = true;
                    toastr.error('Could not save task, invalid response' );
                }

        }).catch(function(error) {
                toastr.error(error, 'Could not save task', { timeOut: 0 });
                //$log.error(error);
        });
    }

    // returns a promise of the data
    todoSharePointStore.getTasks = getTasks;

    function getTasks() {

        if (todoSharePointStore.tasks.length > 0) {
            var dataPromise = $q.defer();
            dataPromise.resolve(todoSharePointStore.tasks);
            return dataPromise.promise;
        }
        // The entire XML soap message for GetListItems
        var  GET_TASK_XML = multiline.stripIndent(function(){/*!@preserve
                    <?xml version="1.0" encoding="utf-8"?>
                    <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
                    <soap12:Body>
                        <GetListItems xmlns="http://schemas.microsoft.com/sharepoint/soap/">
                        <listName><%= listName %></listName>
                        <rowLimit>0</rowLimit>
                            <!--
                                <ViewFields>
                                    <FieldRef Name="ID" />
                                    <FieldRef Name="Title" />
                                    <FieldRef Name="Status" />
                                    <FieldRef Name="DueDate" />
                                    <FieldRef Name="Body" />
                                </ViewFields>
                                -->

                        <query>
                                    <Query>
                                        <OrderBy>
                                            <FieldRef Name="Modified" Ascending="FALSE"></FieldRef>
                                        </OrderBy>

                                        <Where>
                                            <Or>
                                            <And>
                                                <Eq>
                                                    <FieldRef Name="Status"></FieldRef>
                                                    <Value Type="Text">Completed</Value>
                                                </Eq>

                                                <Geq>
                                                    <FieldRef Name="Modified"></FieldRef>
                                                    <!--<Value Type="DateTime">2014-09-01 00:00:00</Value>-->
                                                    <Value Type="DateTime">
                                                        <Today OffsetDays="-7" />
                                                    </Value>
                                                </Geq>
                                            </And>

                                            <!-- <IsNull>
                                                <FieldRef Name="Status"></FieldRef>
                                            </IsNull> -->


                                            <Neq>
                                                <FieldRef Name="Status"></FieldRef>
                                                <Value Type="Text">Completed</Value>
                                            </Neq>

                                            </Or>
                                        </Where>
                                    </Query>
                        </query>

                        </GetListItems>
                    </soap12:Body>
                    </soap12:Envelope>
                    */ $log.info();
        });

        var getTaskXML = _.template( GET_TASK_XML, {
            listName: listConfig.listName
        });

        // Server config
        var config = {
            method: 'POST',
            url: LIST_URL,
            headers: headers,
            data: getTaskXML
        };

        var localConfig = {
            method: 'GET',
            url: 'test_data/tasks_full.xml',
            headers: headers
        };

        if ($state.params.localmode === 'true' || LOCAL_MODE){
            config = localConfig;
        }

        //var users = todoUsersService.getUsers();

        // get the list of users
        return $http(config).then(function(result){
                // parse all of the data
                var parsedData = x2js.xml_str2json(result.data);

                if (parsedData.Envelope.Body.GetListItemsResponse.GetListItemsResult.listitems.data) {
                    var tasks = parsedData.Envelope.Body.GetListItemsResponse.GetListItemsResult.listitems.data.row;

                    var assignedToRegex = /(.*)\;#(.*)/i;
                    var users = todoUsersService.getUsers();

                    todoSharePointStore.tasks = [];

                    _.forEach(tasks, function(parsedTask) {
                        var task = {};

                        var userMatch = assignedToRegex.exec(parsedTask._ows_AssignedTo);
                        if ( userMatch ) {
                            task.userId = userMatch[1];
                            task.userNameFull = userMatch[2];
                            task.user = _.find(users, { id: task.userId });
                            if (!task.user) {
                                $log.info('Could not find ' + task.userId + ' : ' + task.userNameFull );
                            }
                        }

                        task.dueDate = moment(parsedTask._ows_DueDate).toDate();
                        task.id = parsedTask._ows_ID;
                        task.title = parsedTask._ows_Title;
                        task.status = parsedTask._ows_Status;

                        if (isNaN(parsedTask._ows_SortOrder)) {
                            task.sortOrder = null;
                        } else {
                            task.sortOrder = parseFloat(parsedTask._ows_SortOrder);
                        }

                        if ( parsedTask[CLASSIFICATION_FIELDNAME_OWS] ) {
                            // Split at the separator ;# and then remove all blanks with compact
                            task.classifications = _.compact(parsedTask[CLASSIFICATION_FIELDNAME_OWS].split(TAG_SPLIT));
                        }

                        // Find the board with the corresponding status in the list
                        var statusBoard = _.find(statusBoardMapping, { statuses: [ task.status ] });
                        if (statusBoard) {
                            task.column = statusBoard.board;
                        }
                        task.description = parsedTask._ows_Body;
                        todoSharePointStore.tasks.push(task);
                    });

                    //todoSharePointStore.tasks = tasks;
                    //resetTaskSortOrderKeepingSortOrder(); // in case there are some missing sort orders
                    //todoSharePointStore.tasks = rebaseTaskSortOrder(tasks);
                    // move the tasks into a normalized model
                    return todoSharePointStore.tasks;
                }
        }).catch(function(error){
            toastr.error('Could not read tasks from server.');
        });
    }

    /* Set task sort order based on existing sortOrder
     * Useful if the existing sort order needs to be kept
     */
    function resetTaskSortOrderKeepingSortOrder() {

        // Sort by column, sort order, date due
        var sortedTasks = _(todoSharePointStore.tasks)
                    .sortBy(['dueDate'])
                    .sortBy(['column', 'sortOrder']).value();

        _.each(sortedTasks, function(task) {
            task.sortOrder = null;
        });

        return updateSortOrder(sortedTasks);
    }

    function addMissingSortOrder() {
        /* it should keep existing sort numbers unless
         * it should add if the prev === next
         * it should add sort numbers to null values
         */
    /* Need to keep existing sortOrder and just add numbers to missing tasks
     */

        // Sort by column, sort order, date due
        var sortedTasks = _(todoSharePointStore.tasks)
                    .sortBy(['dueDate'])
                    .sortBy(['column', 'sortOrder']).value();
        var keepSortOrderValue = true;

        return updateSortOrder( sortedTasks, keepSortOrderValue );

    }

    /* Completely reset the sortorder by dueDate.
     *
     */
    function resetTaskSortOrder() {

        // Sort by column, sort order, date due
        var sortedTasks = _(todoSharePointStore.tasks)
                    .sortBy(['dueDate'])
                    .sortBy(['column']).value();

        _.each(sortedTasks, function(task) {
            task.sortOrder = null;
        });

        return updateSortOrder(sortedTasks);
    }

    function updateSortOrder(sortedTasks, keepSortOrderValue) {
        // Then, for each group of columns, index

        var taskLists = [];
        _.forEach(statusBoardMapping, function(statusBoard) {
            taskLists[statusBoard.board] = _.where(sortedTasks, { column : statusBoard.board });
        });

        _.forEach(taskLists, function(tasks) {
            _.forEach(tasks, function(task, index) {
                if (keepSortOrderValue === true && task.sortOrder) {
                    // Check if the current and the next have the same value, if so recalculate the current
                    // otherwise it can stay where it is
                    if (tasks[index + 1] && task.sortOrder === tasks[index + 1].sortOrder) {
                        task.sortOrder = null;
                        calcSortOrder(tasks, task, index);
                    }
                } else if (keepSortOrderValue === true && !task.sortOrder) {
                    calcSortOrder(tasks, task, index);
                } else {
                    calcSortOrder(tasks, task, index);
                }
            });
        });

        return sortedTasks;

    }

    function calcSortOrder(tasks, task, index) {
        var prevIndex = index - 1;
        var nextIndex = index + 1;

        var prev = tasks[prevIndex];
        var next = tasks[nextIndex];

        // Determine the new sortorder given the prev and next values
        var prevSort = null;
        var nextSort = null;

        if (prev && prev.sortOrder) {
            prevSort = prev.sortOrder;
        } else {
            prevSort = 0; // normally this should happen at the top or if somehow there was no sort number for the prev
        }

        if (next && next.sortOrder) {
            nextSort = next.sortOrder;
        } else {
            nextSort = null;
        }

        var DEFAULT_INSERTION = 1000;
        var sortOrder;
        // If there is no next, just add 1000 to the previous
        if ( nextSort === null ) {
            sortOrder = prevSort + DEFAULT_INSERTION;
        } else {
            // insert this halfway between prev and next
            sortOrder = ( nextSort - prevSort ) / 2 + prevSort;

            // It's possible that the space between is 0 so we need more space
            if (( sortOrder === prevSort ) || (sortOrder === nextSort )) {
                // resort and reset the numbering from previous upwards
            }
        }

        if ( sortOrder !== task.sortOrder ) {
            task.sortOrder = sortOrder;
            task.moved = true;
            return true;
        } else {
            return false;
        }
        // check for the previous and next in the column
    }

    return todoSharePointStore;

    });
