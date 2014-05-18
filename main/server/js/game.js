exports.PlayerTurn = PlayerTurn;
exports.Gameplay = Gameplay;
exports.HexGame = HexGame;
exports.Move = Move;
exports.GameBoard = GameBoard;
exports.GameStatus = GameStatus;

DEFAULT_GAME_BOARD_SIZE = 11;

function PlayerTurn() {
    var players = ['red', 'blue'];
    var currentPlayerIndex = 0;

    this.current = function() {
        return players[currentPlayerIndex];
    };

    this.next = function() {
        currentPlayerIndex = (currentPlayerIndex + 1) % 2
        return this.current();
    };
}

function GameBoard(size) {
    var pawns = [];
    var lastMove;

    _.times(size, function() {
        pawns.push([]);
    });

    function assertCellExists(moveRequest) {
        if (moveRequest.x < 0
            || moveRequest.y < 0
            || moveRequest.x > size - 1
            || moveRequest.y > size - 1) {
            throw 'move is out of bounds';
        }
    }

    function assertCellIsOpen(moveRequest) {
        if (pawns[moveRequest.x][moveRequest.y]) {
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

    this.addMove = function(moveRequest) {
        assertCellExists(moveRequest);
        assertCellIsOpen(moveRequest);
        pawns[moveRequest.x][moveRequest.y] = moveRequest;
        lastMove = moveRequest;
    };

    this.lastMove = function() {
        return lastMove;
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

    var CONNECTION = {
        NO_CONNECTION: {
            updateConnection: function(move) {
                // There's no connection, nothing to update!
            }
        },
        A: {
            updateConnection: function(move) {
                if (move.connectedTo === CONNECTION.NO_CONNECTION) {
                    move.connectedTo = CONNECTION.A;
                    updateConnections(move);
                } else if (move.connectedTo === CONNECTION.B) {
                    move.connectedTo = CONNECTION.BOTH;
                    updateConnections(move);
                }
            }
        },
        B: {
            updateConnection: function(move) {
                if (move.connectedTo === CONNECTION.NO_CONNECTION) {
                    move.connectedTo = CONNECTION.B;
                    updateConnections(move);
                } else if (move.connectedTo === CONNECTION.A) {
                    move.connectedTo = CONNECTION.BOTH;
                    updateConnections(move);
                }
            }
        },
        BOTH: {
            updateConnection: function(move) {
                if (move.connectedTo !== CONNECTION.BOTH) {
                    move.connectedTo = CONNECTION.BOTH;
                    updateConnections(move);
                }
            }
        }
    };

    function isCorrectPlayersTurn(moveRequest) {
        return gameplay.currentPlayer() == moveRequest.color;
    }

    // This should be refactored soon.
    function updatePaths(move) {
        move.connectedTo = CONNECTION.NO_CONNECTION;
        // Step 1: Mark move as being connectedTo if it is along a wall.
        // "red" has the north-south wall. They want to make contact with x=0 or x=max
        // "blue" has the east-west wall. They want to make contact with y=0 or y=max.
        if (move.color === 'red') {
            if (move.x === 0) {
                move.connectedTo = CONNECTION.A;
            } else if (move.x === gameBoardSize - 1) {
                move.connectedTo = CONNECTION.B;
            }
        } else if (move.color === 'blue') {
            if (move.y === 0) {
                move.connectedTo = CONNECTION.A;
            } else if (move.y === gameBoardSize - 1) {
                move.connectedTo = CONNECTION.B;
            }
        }
        updateConnections(move);
    }

    function updateConnections(move) {
        var neighbours = gameBoard.neighboursOf(move);
        _.each(neighbours, function(neighbour) {
            // The less well connected node should take the same value as the more well-connected
            // node, then we should call updateConnections for the updated node. If both nodes are
            // equally well-connected, don't bother.
            move.connectedTo.updateConnection(neighbour);
            neighbour.connectedTo.updateConnection(move);
        });
    }

    this.start = function() {
        gameplay.started();
    };

    this.move = function(moveRequest) {
        // This is currently the only "condition" that will silently fail the move instead
        // of throwing an exception. Maybe we should make it throw an exception, too.
        if (isCorrectPlayersTurn(moveRequest)) {
            gameBoard.addMove(moveRequest);
            // This should possibly refactored to a class that deals with updating paths.
            updatePaths(gameBoard.lastMove());
            if (gameBoard.lastMove().connectedTo === CONNECTION.BOTH) {
                gameplay.won();
            } else {
                gameplay.nextPlayer();
            }
        }
        return this.gameStatus();
    };

    this.gameStatus = function() {
        return new GameStatus(gameplay.currentStatus(), gameBoard.lastMove());
    };
}

function Move(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
}

function GameStatus(currentStatus, move, winningPath) {
    this.currentStatus = currentStatus;
    this.move = move;
    this.winningPath = winningPath;
}