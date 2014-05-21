'use strict';

/**** Angular controllers ****/

angular.module('hexGame.controllers', [])
    .controller('HexController', function($scope, boardConfiguration, gameStaticData, serverCommunicationService, d3TransitionsService, $window) {
        $scope.side = undefined;
        $scope.hasError = false;
        var errorSide = undefined;
        var serverConnection = undefined;
        var currentGameStatus = undefined;
        $scope.cells = [];
        $scope.pawns = [];
        $scope.boardTitle = [];
        $scope.winningPath = [];
        var movesToDisplayWhenLoginAsViewer = undefined;
        var winningPathToDisplayWhenLoginAsViewer = undefined;

        //Server events handlers
        var handleGameStatusUpdate = function(serverResponse) {
            $scope.$apply(function() {
                if (!serverResponse.isError) {
                    $scope.hasError = false;
                    addPawn(serverResponse.move);
                    addWinningPath(serverResponse.winningPath);
                    console.log('currentStatus is',JSON.stringify(serverResponse.currentStatus));
                    var previousStatus = currentGameStatus;
                    currentGameStatus = serverResponse.currentStatus;
                    if (previousStatus != 'waitingForPlayers'
                        && currentGameStatus == 'waitingForPlayers') {
                        gameReset();
                    }
                    //TODO: handle game reset (with possibly auto-join as viewer)
                } else {
                    $scope.hasError = true;
                    errorSide = serverResponse.side;
                }
            });
        };

        //Connect as viewer initially
        serverConnection = serverCommunicationService.connectAsViewer(
            [['gameStatus', handleGameStatusUpdate]],
            function(serverResponse) {
                currentGameStatus = serverResponse.fullStatus.currentStatus;
                movesToDisplayWhenLoginAsViewer = serverResponse.fullStatus.moves;
                winningPathToDisplayWhenLoginAsViewer =serverResponse.fullStatus.winningPath;
            },
            function() {
                $scope.hasError = true;
                //TODO get errorSide from serverResponse;
                $scope.showError();
            });
            
        $scope.showError = function() { //TODO: remove?
            return $scope.hasError && errorSide == $scope.side;
        };

        $scope.canJoinAsPlayer = function() {
            return currentGameStatus == 'waitingForPlayers' && !$scope.side;
        };

        $scope.loginAsPlayer = function() {
            if (!$scope.canJoinAsPlayer()) {
                return;
            }
            serverConnection.loginAsPlayer(function(serverResponse) {
                $scope.side = serverResponse.side;
                currentGameStatus = serverResponse.gameStatus.currentStatus;
                addCells();
                addBoardLetters();
                // TODO: extract as a service?
                $window.onbeforeunload = function(e) {
                    return 'Reloading this page will reset the game. Are you sure you want to reload this page?';
                };
            }, function(error) {
            	//TODO: display error message (game must already be in progress)
            });
        };

        $scope.isPlayer = function() {
            return $scope.side == 'red' || $scope.side == 'blue';
        };
        
        $scope.loginAsViewer = function() {
        	$scope.side = 'viewer';
        	addCells();
            addBoardLetters();
            addPawns(movesToDisplayWhenLoginAsViewer); //TODO request current state to server if this is missing
        	addWinningPath(winningPathToDisplayWhenLoginAsViewer); //TODO same
        };
        
        $scope.isViewer = function() {
            return $scope.side == 'viewer';
        };

        $scope.handleBoardClick = function(x, y) {
            if ($scope.isPlayerTurn()) {
                serverConnection.emitEvent('moveRequest', {x: x, y: y});
            }
        };

        $scope.logout = function() {
            if ($scope.isPlayer()) {
                serverConnection.emitEvent('logout');
            }
            gameReset();
        };

        var strEndsWith = function(str, suffix) {
            if (!angular.isDefined(str) || !angular.isDefined(suffix)) return false;
            return str.indexOf(suffix, str.length - suffix.length) !== -1;
        };

        $scope.getWinningSide = function() {
            if (!angular.isDefined(currentGameStatus) || !strEndsWith(currentGameStatus, "Won")) {
                return undefined;
            }
            return currentGameStatus.substring(0, currentGameStatus.length - "Won".length);
        };
        
        $scope.isPlayerTurn = function() {
        	if (!angular.isDefined(currentGameStatus) || !angular.isDefined($scope.side)
        		|| !strEndsWith(currentGameStatus, "Turn")) {
                return false;
            }
            return currentGameStatus.substring(0, currentGameStatus.length - "Turn".length)
            	== $scope.side;
        };

        $scope.showGameScreen = function() {
            $scope.aboutScreenSelected = false;
            $scope.gameScreenSelected = true;
        };

        $scope.showAboutScreen = function() {
            $scope.aboutScreenSelected = true;
            $scope.gameScreenSelected = false;
        };
        
        //Data management functions
        var addPawn = function(pawn) {
        	if (angular.isObject(pawn)
        		&& _.where($scope.pawns, pawn).length == 0) {
        		$scope.pawns.push(pawn);
        	}
        };
        var addPawns = function(pawns) {
        	if (angular.isArray(pawns)) {
        		_.forEach(pawns, function(pawn) { addPawn(pawn); });
        	}
        };
        var addWinningPath = function(winningPath) {
        	if (angular.isArray(winningPath) && $scope.winningPath.length == 0) {
                console.log('winningPath is', JSON.stringify(winningPath));
                $scope.winningPath.push.apply($scope.winningPath, winningPath);
            }
        };
        var addCells = function() {
        	if (angular.isArray(gameStaticData.boardCells)
        		&& $scope.cells.length == 0) {
        		$scope.cells.push.apply($scope.cells, gameStaticData.boardCells);
        	}
        };
        var addBoardLetters = function() {
        	if (angular.isArray(gameStaticData.boardTitle)
        		&& $scope.boardTitle.length == 0) {
                $scope.boardTitle.push.apply($scope.boardTitle, gameStaticData.boardTitle);
            }
        };

        /* Transitions function */
        var gameReset = function() {
            $scope.cells.length = 0;
            $scope.boardTitle.length = 0;
            $scope.pawns.length = 0;
            $scope.winningPath.length = 0;
            _.delay(function() {
                $scope.$apply(function() {
                    $scope.side = undefined;
                    movesToDisplayWhenLoginAsViewer = undefined;
                    winningPathToDisplayWhenLoginAsViewer = undefined;
                });
            }, d3TransitionsService.boardFadeOutAnimationTotalDuration());
        };

        $scope.gameScreenSelected = true;
    });