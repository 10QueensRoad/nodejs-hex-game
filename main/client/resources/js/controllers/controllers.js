'use strict';

/**** Angular controllers ****/

angular.module('hexGame.controllers', [])
    .controller('HexController', function($scope, $window, $location,
    	boardConfiguration, gameStaticData, d3TransitionsService) {
        $scope.side = undefined;
        $scope.hasError = false;
        var errorSide = undefined;
        var serverConnection = undefined;
        var currentGameStatus = undefined;
        $scope.cells = [];
        $scope.pawns = [];
        $scope.boardTitle = [];
        $scope.winningPath = [];
        var movesToDisplayWhenLoginAsViewer = [];
        var winningPathToDisplayWhenLoginAsViewer = [];
        var isProjectorView = angular.isDefined($location.search().projectorView);
        var socket = io.connect();

        socket.on('gameStatus', function(serverResponse) {
            $scope.$apply(function() {
                if (!serverResponse.isError) {
                    $scope.hasError = false;
                    addPawnToArray(angular.isDefined($scope.side) ? $scope.pawns : movesToDisplayWhenLoginAsViewer,
                        serverResponse.pawn);
                    addWinningPathToArray(
                        angular.isDefined($scope.side) ? $scope.winningPath : winningPathToDisplayWhenLoginAsViewer,
                        serverResponse.winningPath);
                    console.log('currentStatus is',JSON.stringify(serverResponse.currentStatus));
                    var previousStatus = currentGameStatus;
                    currentGameStatus = serverResponse.currentStatus;
                    if (previousStatus != 'waitingForPlayers'
                        && $scope.isWaitingForPlayers()) {
                        gameReset();
                    }
                } else {
                    $scope.hasError = true;
                    errorSide = serverResponse.side;
                }
            });
        });

        socket.on('playerJoined', function (serverResponse) {
            $scope.$apply(function () {
                $scope.side = serverResponse.side;
                addCells();
                addBoardLetters();
                // TODO: extract as a service?
                $window.onbeforeunload = function(e) {
                    return 'Reloading this page will reset the game. Are you sure you want to reload this page?';
                };
                $scope.showGameScreen();
            });
        });

        socket.on('error', function () {
            $scope.hasError = true;
            //TODO get errorSide from serverResponse;
            $scope.showError();
        });
        
        $scope.showError = function() { //TODO: remove?
            return $scope.hasError && errorSide == $scope.side;
        };
        
        $scope.isWaitingForPlayers = function() {
            return currentGameStatus == 'waitingForPlayers';
        };

        $scope.waitingForBluePlayer = function() {
          return currentGameStatus == 'waitingForPlayers' && $scope.side === 'red';
        };

        $scope.waitingForRedPlayer = function() {
          return currentGameStatus == 'waitingForPlayers' && $scope.side === 'blue';
        };

        $scope.isGameInProgress = function() {
            return angular.isDefined($scope.getTurnSide());
        };

        $scope.canJoinAsPlayer = function() {
            return $scope.isWaitingForPlayers() && !$scope.side && !$scope.isProjectorView();
        };

        $scope.loginAsViewer = function() {
        	$scope.side = 'viewer';
        	addCells();
            addBoardLetters();
            addPawns(movesToDisplayWhenLoginAsViewer);
            addWinningPathToArray($scope.winningPath, winningPathToDisplayWhenLoginAsViewer);
            $scope.showGameScreen();
        };

        $scope.loginAsPlayer = function() {
            if (!$scope.canJoinAsPlayer()) {
                return;
            }
            socket.emit('joinAsPlayer');
        };

        $scope.isPlayer = function() {
            return $scope.side == 'red' || $scope.side == 'blue';
        };

        $scope.isViewer = function() {
            return $scope.side == 'viewer';
        };

        $scope.handleBoardClick = function(x, y) {
            if ($scope.isPlayerTurn()) {
                socket.emit('moveRequest', {x: x, y: y});
            }
        };

        $scope.logout = function() {
        	if ($scope.isProjectorView()) {
        		return;
        	}
            if ($scope.isPlayer()) {
                socket.emit('logout');
            }
            gameReset();
        };

        var strEndsWith = function(str, suffix) {
            if (!angular.isDefined(str) || !angular.isDefined(suffix)) return false;
            return str.indexOf(suffix, str.length - suffix.length) !== -1;
        };
        
        var capitalizeFirstLetter = function(value) {
        	return (angular.isString(value) ?
        		value.charAt(0).toUpperCase() + value.slice(1) : undefined);
        };

        var extractSideFromCurrentGameStatus = function(suffixToRemove) {
            if (!angular.isDefined(currentGameStatus) || !strEndsWith(currentGameStatus, suffixToRemove)) {
                return undefined;
            }
            return currentGameStatus.substring(0, currentGameStatus.length - suffixToRemove.length);
        };
        
        $scope.getWinningSide = function() {
        	return extractSideFromCurrentGameStatus("Won");
        };
        
        $scope.getWinningText = function() {
        	var winningText = capitalizeFirstLetter($scope.getWinningSide());
            return (angular.isDefined(winningText) ?
            	winningText + " won the game!!!" : undefined);
        };
        
        $scope.getTurnSide = function() {
        	return extractSideFromCurrentGameStatus("Turn");
        };
        
        $scope.getTurnText = function() {
        	return capitalizeFirstLetter($scope.getTurnSide());
        };
        
        $scope.isPlayerTurn = function() {
            return $scope.getTurnSide() == $scope.side;
        };

        $scope.showGameScreen = function() {
            $scope.aboutScreenSelected = false;
            $scope.gameScreenSelected = true;
        };

        $scope.showAboutScreen = function() {
            $scope.aboutScreenSelected = true;
            $scope.gameScreenSelected = false;
        };
        
        $scope.isProjectorView = function() {
            return isProjectorView;
        };

        //Data management functions
        var addPawnToArray = function(pawnsArray, pawn) {
        	if (angular.isObject(pawn)
        		&& _.where(pawnsArray, pawn).length == 0) {
                pawnsArray.push(pawn);
        	}
        };
        var addPawns = function(pawns) {
        	if (angular.isArray(pawns)) {
        		_.forEach(pawns, function(pawn) { addPawnToArray($scope.pawns, pawn); });
        	}
        };
        var addWinningPathToArray = function(winninPathArray, winningPath) {
        	if (angular.isArray(winningPath) && winninPathArray.length == 0) {
                console.log('winningPath is', JSON.stringify(winningPath));
                winninPathArray.push.apply(winninPathArray, winningPath);
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
            if ($scope.isViewer() && !$scope.isWaitingForPlayers()) {
                //If game is in progress, keep the pawns and winning path to redraw them when rejoining as viewer
                movesToDisplayWhenLoginAsViewer.length = 0;
                if ($scope.pawns.length > 0) {
                    movesToDisplayWhenLoginAsViewer.push.apply(movesToDisplayWhenLoginAsViewer, $scope.pawns);
                }
                winningPathToDisplayWhenLoginAsViewer.length = 0;
                if ($scope.winningPath.length > 0) {
                    winningPathToDisplayWhenLoginAsViewer.push.apply(
                        winningPathToDisplayWhenLoginAsViewer, $scope.winningPath);
                }
            } else {
                movesToDisplayWhenLoginAsViewer.length = 0;
                winningPathToDisplayWhenLoginAsViewer.length = 0;
            }
            $scope.pawns.length = 0;
            $scope.winningPath.length = 0;
            _.delay(function() {
                $scope.$apply(function() {
                    $scope.side = undefined;
                    $scope.aboutScreenSelected = false;
                    $scope.gameScreenSelected = false;
                    if ($scope.isProjectorView()) {
                		$scope.loginAsViewer();
                	}
                });
            }, d3TransitionsService.boardFadeOutAnimationTotalDuration());
        };

        $scope.gameScreenSelected = true;

        if ($scope.isProjectorView()) {
            $scope.loginAsViewer();
        }
        
    });
