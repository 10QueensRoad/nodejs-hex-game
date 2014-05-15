'use strict';

/**** Angular controllers ****/

angular.module('hexGame.controllers', [])
    .controller('HexController', function($scope, boardConfiguration, gameStaticData, serverCommunicationService) {
        $scope.gameActions = '';
        $scope.side = undefined;
        $scope.hasError = false;
        var playerStatus = {};
        var errorSide = undefined;
        var serverConnection = undefined;
        $scope.cells = [];
        $scope.pawns = [];
        $scope.boardTitle = [];

        //Server events handlers
        var handleMoveResponse = function(serverResponse) {
            $scope.$apply(function() {
                if (!serverResponse.isError) {
                    $scope.hasError = false;
                    $scope.gameActions = serverResponse.info;
                    if (angular.isDefined(serverResponse.x)
                        && angular.isDefined(serverResponse.y)
                        && angular.isDefined(serverResponse.color)) {
                        var newPawn = { x: serverResponse.x,
                            y: serverResponse.y,
                            color: serverResponse.color };
                        if (_.where($scope.pawns, newPawn).length == 0) {
                            $scope.pawns.push(newPawn);
                        } else {
                            console.log('Received duplicate'); //TODO to remove when proved it's fixed
                        }
                    }
                } else {
                    $scope.hasError = true;
                    errorSide = serverResponse.side;
                }
                playerStatus = serverResponse.playerStatus;
            });
        };
        var handlePlayerStatusUpdate = function(serverResponse) {
            $scope.$apply(function() {
                playerStatus = serverResponse;
            });
        };

        //Connect as viewer initially
        serverConnection = serverCommunicationService.connectAsViewer(
            [['moveResponse', handleMoveResponse],
                ['playerStatus', handlePlayerStatusUpdate]],
            function(serverResponse) {
                    $scope.delayShow = true;
                    playerStatus = serverResponse.playerStatus;
            },
            function() {
                $scope.hasError = true;
                errorSide = $scope.side = 'viewer';
                $scope.showError();
            });

        $scope.canJoinAsPlayer = function(color) {
            var hasPlayer = color == 'red' ? playerStatus.hasRedPlayer : playerStatus.hasBluePlayer;
            return !hasPlayer && !$scope.side;
        };

        $scope.isPlayer = function() {
            return (playerStatus.hasRedPlayer || playerStatus.hasBluePlayer) && $scope.side;
        };

        $scope.showError = function() {
            return $scope.hasError && errorSide == $scope.side;
        };

        $scope.loginAsPlayer = function(color) {
            serverConnection.loginAsPlayer(color, function() {
                $scope.side = color;
                $scope.cells = gameStaticData.getBoardCells();
                $scope.boardTitle = gameStaticData.getBoardTitle();
            });
        };

        $scope.handleBoardClick = function(x, y) {
            if ((playerStatus.hasRedPlayer || playerStatus.hasBluePlayer) && $scope.side) {
                serverConnection.emitEvent('moveRequest', {x: x, y: y});
            }
        };

        $scope.logout = function() {
            serverConnection.emitEvent('logout');
            $scope.cells.length = 0;
            $scope.boardTitle.length = 0;
            $scope.pawns.length = 0;
            _.delay(function() {
                $scope.$apply(function() {
                    $scope.side = undefined;
                });
            }, (boardConfiguration.animations ? 2750 : 0));
        };
    });