exports.PlayerTurn = PlayerTurn;
exports.Gameplay = Gameplay;
exports.HexGame = HexGame;
exports.Pawn = Pawn;
exports.GameBoard = GameBoard;
exports.GameStatus = GameStatus;
exports.FullStatus = FullStatus;
exports.GameStatistics = GameStatistics;

DEFAULT_GAME_BOARD_SIZE = 11;

function PlayerTurn() {
    var players = ['red', 'blue'];
    var currentPlayerIndex = 0;

    this.current = function() {
        return players[currentPlayerIndex];
    };

    this.next = function() {
        currentPlayerIndex = (currentPlayerIndex + 1) % 2;
        return this.current();
    };
}

function GameBoard(size) {
    var pawns = [];
    var lastPawn;

    _.times(size, function() {
        pawns.push([]);
    });

    function assertCellExists(pawnPlacementRequest) {
        if (pawnPlacementRequest.x < 0
            || pawnPlacementRequest.y < 0
            || pawnPlacementRequest.x > size - 1
            || pawnPlacementRequest.y > size - 1) {
            throw 'move is out of bounds';
        }
    }

    function assertCellIsOpen(pawnPlacementRequest) {
        if (pawnAt(pawnPlacementRequest.x, pawnPlacementRequest.y)) {
            throw 'duplicate move';
        }
    }

    function pawnAt(x, y) {
        if (pawns[x] && pawns[x][y]) {
            return pawns[x][y];
        }
    }

    this.neighboursOf = function(pawn) {
        var potentialNeighbours = [
            pawnAt(pawn.x, pawn.y + 1),
            pawnAt(pawn.x, pawn.y - 1),
            pawnAt(pawn.x + 1, pawn.y),
            pawnAt(pawn.x - 1, pawn.y),
            pawnAt(pawn.x + 1, pawn.y + 1),
            pawnAt(pawn.x - 1, pawn.y - 1)
        ];

        return _.filter(potentialNeighbours, function(potentialNeighbour) {
            return potentialNeighbour
                && potentialNeighbour.color === pawn.color;
        });
    };

    this.addPawn = function(pawnPlacementRequest) {
        assertCellExists(pawnPlacementRequest);
        assertCellIsOpen(pawnPlacementRequest);
        pawns[pawnPlacementRequest.x][pawnPlacementRequest.y] = pawnPlacementRequest;
        lastPawn = pawnPlacementRequest;
    };

    this.lastPawn = function() {
        return lastPawn;
    };


    this.allPawns = function() {
        // Compress arrays and eliminate empties.
        return _.compact(_.flatten(pawns));
    }
}

function Gameplay() {
    var playerTurn = null;
    var wonBy = null;

    function assertInPlay() {
        if (!playerTurn || wonBy) {
            throw 'invalid action when ' + currentStatus();
        }
    }

    function currentStatus() {
        if (wonBy) {
            return wonBy + 'Won';
        }
        if (playerTurn) {
            return playerTurn.current() + 'Turn';
        }
        return 'waitingForPlayers';
    }

    this.started = function() {
        if (playerTurn) {
            throw 'invalid action when ' + currentStatus();
        }
        playerTurn = new PlayerTurn();
    };

    this.won = function() {
        assertInPlay();
        wonBy = playerTurn.current();
    };

    this.currentPlayer = function() {
        assertInPlay();
        return playerTurn.current();
    };

    this.nextPlayer = function() {
        assertInPlay();
        return playerTurn.next();
    };

    this.currentStatus = function() {
        return currentStatus();
    };
}

function HexGame(gameBoardSize) {

    gameBoardSize = gameBoardSize || DEFAULT_GAME_BOARD_SIZE;
    var gameplay = new Gameplay();
    var gameBoard = new GameBoard(gameBoardSize);
    var winningPath;

    var CONNECTION = {
        NO_CONNECTION: {
            updateConnection: function(pawn) {
                // There's no connection, nothing to update!
            }
        },
        A: {
            updateConnection: function(pawn) {
                if (pawn.connectedTo === CONNECTION.NO_CONNECTION) {
                    pawn.connectedTo = CONNECTION.A;
                    updateImmediateConnections(pawn);
                } else if (pawn.connectedTo === CONNECTION.B) {
                    pawn.connectedTo = CONNECTION.BOTH;
                    updateImmediateConnections(pawn);
                }
            }
        },
        B: {
            updateConnection: function(pawn) {
                if (pawn.connectedTo === CONNECTION.NO_CONNECTION) {
                    pawn.connectedTo = CONNECTION.B;
                    updateImmediateConnections(pawn);
                } else if (pawn.connectedTo === CONNECTION.A) {
                    pawn.connectedTo = CONNECTION.BOTH;
                    updateImmediateConnections(pawn);
                }
            }
        },
        BOTH: {
            updateConnection: function(pawn) {
                if (pawn.connectedTo !== CONNECTION.BOTH) {
                    pawn.connectedTo = CONNECTION.BOTH;
                    updateImmediateConnections(pawn);
                }
            }
        }
    };

    function isCorrectPlayersTurn(pawnPlacementRequest) {
        return gameplay.currentPlayer() == pawnPlacementRequest.color;
    }

    function pawnIsOnWallA(pawn) {
        return ((pawn.color === 'red' && pawn.x === 0)
            || (pawn.color === 'blue' && pawn.y === 0));
    }

    function pawnIsOnWallB(pawn) {
        return ((pawn.color === 'red' && pawn.x === gameBoardSize - 1)
            || (pawn.color === 'blue' && pawn.y === gameBoardSize - 1));
    }

    function updatePathsStartingFrom(pawn) {
        if (pawnIsOnWallA(pawn)) {
            pawn.connectedTo = CONNECTION.A;
        } else if (pawnIsOnWallB(pawn)) {
            pawn.connectedTo = CONNECTION.B;
        } else {
            pawn.connectedTo = CONNECTION.NO_CONNECTION;
        }
        updateImmediateConnections(pawn);
    }

    function updateImmediateConnections(pawn) {
        var neighbours = gameBoard.neighboursOf(pawn);
        _.each(neighbours, function(neighbour) {
            if (pawn.connectedTo !== neighbour.connectedTo) {
                pawn.connectedTo.updateConnection(neighbour);
                neighbour.connectedTo.updateConnection(pawn);
            }
        });
    }

    function getWinningPath() {
        return _.where(gameBoard.allPawns(), {connectedTo: CONNECTION.BOTH});
    }

    this.start = function() {
        gameplay.started();
    };

    this.placePawn = function(pawnPlacementRequest) {
        // This is currently the only "condition" that will silently fail the move instead
        // of throwing an exception. Maybe we should make it throw an exception, too.
        if (isCorrectPlayersTurn(pawnPlacementRequest)) {
            gameBoard.addPawn(pawnPlacementRequest);
            // This should possibly refactored to a class that deals with updating paths.
            updatePathsStartingFrom(gameBoard.lastPawn());
            if (gameBoard.lastPawn().connectedTo === CONNECTION.BOTH) {
                gameplay.won();
                winningPath = getWinningPath();
            } else {
                gameplay.nextPlayer();
            }
        }
        return this.gameStatus();
    };

    this.fullStatus = function() {
        return new FullStatus(gameplay.currentStatus(), gameBoard.allPawns(), winningPath);
    };

    this.gameStatus = function() {
        return new GameStatus(gameplay.currentStatus(), gameBoard.lastPawn(), winningPath);
    };
}

function Pawn(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
}

function GameStatus(currentStatus, pawn, winningPath) {
    this.currentStatus = currentStatus;
    this.pawn = pawn;
    this.winningPath = winningPath;
}

function FullStatus(currentStatus, pawns, winningPath) {
    this.currentStatus = currentStatus;
    this.pawns = pawns;
    this.winningPath = winningPath;
}

function GameStatistics() {

    var stats = {
        gamesStarted: 0,
        wins: {},
        longestGame: null,
        shortestGame: null,
        longestWinningPath: null,
        shortestWinningPath: null,
        totalPawnsPlaced: 0
    };

    function addWinFor(side) {
        stats.wins[side] = stats.wins[side] || 0;
        ++stats.wins[side];
    }

    this.gameStarted = function() {
        ++stats.gamesStarted;
    };

    this.gameFinished = function(fullStatus) {
        addWinFor(fullStatus.currentStatus.slice(0, -'Won'.length));

        var pawnsPlaced = fullStatus.pawns.length;
        var winningPathLength = fullStatus.winningPath.length;
        stats.longestGame = Math.max(stats.longestGame || 0, pawnsPlaced);
        stats.shortestGame = Math.min(stats.shortestGame || pawnsPlaced, pawnsPlaced);
        stats.longestWinningPath = Math.max(stats.longestWinningPath || 0, winningPathLength);
        stats.shortestWinningPath = Math.min(stats.shortestWinningPath || winningPathLength, winningPathLength);
        stats.totalPawnsPlaced += pawnsPlaced;
    };

    this.stats = function() {
        return stats;
    };
}