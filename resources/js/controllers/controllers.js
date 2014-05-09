'use strict';

/**** Angular controllers ****/

angular.module('hexGame.controllers', [])
    .controller('HexController', function($scope, coordinatesRange, serverCommunicationService) {
        $scope.gameActions = '';
        $scope.side = undefined;
        $scope.hasError = false;
        var playerStatus = {};
        var errorSide = undefined;
        var serverConnection = undefined;

        //Create game board
        var createCells = function() {
            var twoDimRange = _.flatten(
                coordinatesRange.map(function(firstDim) {
                    return coordinatesRange.map(function (secondDim) { return [firstDim, secondDim]; });
                }), true);

            return _.reduce(twoDimRange, function(cells, coordsPair) {
                cells.push({
                    x: coordsPair[0],
                    y: coordsPair[1]
                });
                return cells;
            }, []);
        };
        $scope.cells = createCells();
        $scope.pawns = [];

        //Server events handlers
        var handleMoveResponse = function(serverResponse) {
            $scope.$apply(function() {
                if (!serverResponse.isError) {
                    $scope.hasError = false;
                    $scope.gameActions = serverResponse.info;
                    if (angular.isDefined(serverResponse.x)
                        && angular.isDefined(serverResponse.y)
                        && angular.isDefined(serverResponse.color)) {
                            $scope.pawns.push({
                                x: serverResponse.x,
                                y: serverResponse.y,
                                color: serverResponse.color
                            });
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
            });
        };

        $scope.handleBoardClick = function(x, y) {
            if ((playerStatus.hasRedPlayer || playerStatus.hasBluePlayer) && $scope.side) {
                serverConnection.emitEvent('moveRequest', {x: x, y: y});
            }
        };

        $scope.logout = function() {
            serverConnection.emitEvent('logout', {});
            $scope.side = undefined;
        };
    });