'use strict';

/**** Angular controllers ****/

angular.module('hexGame.controllers', [])
    .controller('HexController', function($scope, boardConfiguration, gameStaticData, serverCommunicationService, d3TransitionsService) {
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
                    if (angular.isDefined(serverResponse.move)) {
                        var newPawn = serverResponse.move;
                        console.log('CurrentStatus is',JSON.stringify(serverResponse.currentStatus));
                        $scope.pawns.push(newPawn);
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
                $scope.cells.push.apply($scope.cells, gameStaticData.boardCells);
                $scope.boardTitle.push.apply($scope.boardTitle, gameStaticData.boardTitle);
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
            }, (boardConfiguration.animations.boardTitle ? 1 : 0) * boardConfiguration.animations.shortDuration
                + (boardConfiguration.animations.boardCells ? 1 : 0) * d3TransitionsService.boardCellsAnimationTotalDuration()
                + boardConfiguration.animations.singleElementDelay);
        };
    });