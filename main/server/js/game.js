exports.PlayerTurn = PlayerTurn;
exports.Gameplay = Gameplay;
exports.HexGame = HexGame;
exports.Move = Move;
exports.GameStatus = GameStatus;

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

function HexGame() {
    var gameplay = new Gameplay();
    var cells = [];

    function isCorrectPlayersTurn(moveRequest) {
        return gameplay.currentPlayer() == moveRequest.color;
    }

    function isCellOpen(moveRequest) {
        return !_.find(cells, function(cell) {
            return cell.x === moveRequest.x && cell.y === moveRequest.y;
        });
    }

    this.start = function() {
        gameplay.started();
    };

    this.move = function(moveRequest) {
        if (isCorrectPlayersTurn(moveRequest) && isCellOpen(moveRequest)) {
            cells.push(moveRequest);
            gameplay.nextPlayer();
        }
        return this.gameStatus();
    };

    this.gameStatus = function() {
        return new GameStatus(gameplay.currentStatus(), _.last(cells));
    };
}

function Move(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
}

function GameStatus(currentStatus, move) {
    this.currentStatus = currentStatus;
    this.move = move;
}

// Ensure Move constructor properly populates the object.
// Ensure PlayerTurn repeatedly returns "red" for current player.
// Ensure PlayerTurn returns "blue" for next player, then for current player.
// Ensure PlayerTurn returns "red" for next next player, then for current player.
// Ensure HexGame returns Move with the same data when called with a "red" move.
// Ensure HexGame returns false when called with a "blue" move.
// Ensure HexGame returns false when called with a "red", then "red" move.
// Ensure HexGame returns Move when called with a "blue" move, then a "red" move.
// Ensure HexGame returns Move with the same data when called with a "red", then "blue" move.


