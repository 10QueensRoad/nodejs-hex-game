'use strict';

/**** Angular controllers ****/

angular.module('hexGame.controllers', [])
    .controller('HexController', function($scope, boardConfiguration, gameStaticData, serverCommunicationService, d3TransitionsService) {
        $scope.side = undefined;
        $scope.hasError = false;
        var playerStatus = {};
        var errorSide = undefined;
        var serverConnection = undefined;
        var currentGameStatus = undefined;
        $scope.cells = [];
        $scope.pawns = [];
        $scope.boardTitle = [];
        $scope.winningPath = [];

        //Server events handlers
        var handleMoveResponse = function(serverResponse) {
            $scope.$apply(function() {
                if (!serverResponse.isError) {
                    $scope.hasError = false;
                    if (angular.isDefined(serverResponse.move)
                        && _.where($scope.pawns, serverResponse.move).length == 0) {
                        var newPawn = serverResponse.move;
                        $scope.pawns.push(newPawn);
                    }
                    if (angular.isArray(serverResponse.winningPath) && $scope.winningPath.length == 0) {
                    	console.log('winningPath is', JSON.stringify(serverResponse.winningPath));
                        $scope.winningPath.push.apply($scope.winningPath, serverResponse.winningPath);
                    }
                    console.log('currentStatus is',JSON.stringify(serverResponse.currentStatus));
                    currentGameStatus = serverResponse.currentStatus;
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

        $scope.canJoinAsPlayer = function() {
            return (!playerStatus.hasRedPlayer || !playerStatus.hasBluePlayer) && !$scope.side;
        };

        $scope.isPlayer = function() {
            return (playerStatus.hasRedPlayer || playerStatus.hasBluePlayer) && $scope.side;
        };

        $scope.showError = function() {
            return $scope.hasError && errorSide == $scope.side;
        };

        $scope.loginAsPlayer = function() {
            var color;
            if (!playerStatus.hasRedPlayer) {
                color = 'red';
            } else if (!playerStatus.hasBluePlayer) {
                color = 'blue';
            } else {
                return;
            }
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

        var strEndsWith = function(str, suffix) {
            if (!angular.isDefined(str) || !angular.isDefined(suffix)) return false;
            return str.indexOf(suffix, str.length - suffix.length) !== -1;
        };

        $scope.getWinningSide = function() {
            if (!angular.isDefined(currentGameStatus) || !strEndsWith(currentGameStatus, "Won")) {
                return undefined;
            }
            return currentGameStatus.substr(0, currentGameStatus.length - "Won".length);
        };
    });