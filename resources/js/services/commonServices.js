'use strict';

/**** Common angular services ****/

angular.module('hexGame.commonAngularServices', [])
    .service('serverCommunicationService', function($http) {
        this.connectAsViewer = function(eventHandlers, successCallback, errorCallback) {
            var serverConnection = new ServerConnection();
            $http.post('/viewer', {})
                .success(function(serverResponse) {
                    serverConnection.connectToServerEventsWithListeners(serverResponse.token, eventHandlers);
                    successCallback(serverResponse);
                })
                .error(errorCallback);
            return serverConnection;
        };

        function ServerConnection() {
            if (this === undefined) {
                return new ServerConnection();
            }
            var thisConnection = this,
                token = undefined,
                socket = undefined,
                eventHandlerDescriptors = undefined;

            this.connectToServerEventsWithListeners = function(tokenFromServer, registerEventHandlerDescriptors) {
                eventHandlerDescriptors = registerEventHandlerDescriptors;
                this.connectToServerEvents(tokenFromServer);
            };

            this.connectToServerEvents = function(tokenFromServer) {
                token = tokenFromServer;
                socket = io.connect('', {
                    'force new connection': true,
                    query: token ? 'token=' + token : undefined
                });
                _.forEach(eventHandlerDescriptors, function(eventHandlerDescriptor) {
                    var eventType = eventHandlerDescriptor[0];
                    var eventHandlerFunction = eventHandlerDescriptor[1];
                    socket.on(eventType, function (serverResponse) {
                        eventHandlerFunction(serverResponse);
                    });
                });
            };

            this.emitEvent = function(eventType, data) {
                socket.emit(eventType, _.assign(data, {token: token}));
            };

            this.loginAsPlayer = function(color, successCallback, errorCallback) {
                $http.post('/' + color, {})
                    .success(function(serverResponse) {
                        thisConnection.connectToServerEvents(serverResponse.token);
                        successCallback();
                    })
                    .error(errorCallback);
            };
        }
    });
