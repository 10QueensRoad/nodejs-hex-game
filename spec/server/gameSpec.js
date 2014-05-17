var game = require(__dirname + '/../../main/server/js/game');
var PlayerTurn = game.PlayerTurn;
var Gameplay = game.Gameplay;
var HexGame = game.HexGame;
var Move = game.Move;
var GameStatus = game.GameStatus;

describe('A newly created PlayerTurn', function() {
    var playerTurn;

    beforeEach(function() {
        playerTurn = new PlayerTurn();
    });

    it('should identify the current player as "red"', function() {
        expect(playerTurn.current()).toBe('red');
    });
    it('should identify the next player as "blue"', function() {
        expect(playerTurn.next()).toBe('blue');
    });
});

describe('A PlayerTurn after one call to next()', function() {
    var playerTurn;

    beforeEach(function() {
        playerTurn = new PlayerTurn();
        playerTurn.next();
    });

    it('should identify the current player as "blue"', function() {
        expect(playerTurn.current()).toBe('blue');
    });
    it('should identify the next player as "red"', function() {
        expect(playerTurn.next()).toBe('red');
    });
});

describe('A newly created Gameplay', function() {
    var gameplay;

    beforeEach(function() {
        gameplay = new Gameplay();
    });

    it('should return a status of "waitingForPlayers"', function() {
        expect(gameplay.currentStatus()).toBe('waitingForPlayers');
    });
    it('should throw an exception when getting the current player', function() {
        expect(gameplay.currentPlayer).toThrow('invalid action when waitingForPlayers');
    });
    it('should throw an exception when triggering the next player', function() {
        expect(gameplay.nextPlayer).toThrow('invalid action when waitingForPlayers');
    });
    it('should throw an exception when triggering the "won" event', function() {
        expect(gameplay.won).toThrow('invalid action when waitingForPlayers');
    });
});

describe('A Gameplay that has started at red turn', function() {
    var gameplay;

    beforeEach(function() {
        gameplay = new Gameplay();
        gameplay.started();
    });

    it('should return a status of "redTurn"', function() {
        expect(gameplay.currentStatus()).toBe('redTurn');
    });
    it('should identify the current player as "red"', function() {
        expect(gameplay.currentPlayer()).toBe('red');
    });
    it('should throw an exception when triggering the "started" event', function() {
        expect(gameplay.started).toThrow('invalid action when redTurn');
    });
});

describe('A Gameplay that has started and red turn has passed', function() {
    var gameplay;

    beforeEach(function() {
        gameplay = new Gameplay();
        gameplay.started();
        gameplay.nextPlayer();
    });

    it('should return a status of "blueTurn"', function() {
        expect(gameplay.currentStatus()).toBe('blueTurn');
    });
    it('should identify the current player as "blue"', function() {
        expect(gameplay.currentPlayer()).toBe('blue');
    });
    it('should throw an exception when triggering the "started" event', function() {
        expect(gameplay.started).toThrow('invalid action when blueTurn');
    });
});

describe('A Gameplay that has been won for red', function() {
    var gameplay;

    beforeEach(function() {
        gameplay = new Gameplay();
        gameplay.started();
        gameplay.won();
    });

    it('should return a status of "redWon"', function() {
        expect(gameplay.currentStatus()).toBe('redWon');
    });
    it('should throw an exception when getting the current player', function() {
        expect(gameplay.currentPlayer).toThrow('invalid action when redWon');
    });
    it('should throw an exception when triggering the next player', function() {
        expect(gameplay.nextPlayer).toThrow('invalid action when redWon');
    });
    it('should throw an exception when triggering the "won" event', function() {
        expect(gameplay.won).toThrow('invalid action when redWon');
    });
    it('should throw an exception when triggering the "started" event', function() {
        expect(gameplay.started).toThrow('invalid action when redWon');
    });
});

describe('A newly created HexGame', function() {
    var hexGame;

    beforeEach(function() {
        hexGame = new HexGame();
    });

    it('should return a waitingForPlayers gameStatus with no last move', function() {
        expect(hexGame.gameStatus().currentStatus).toBe('waitingForPlayers');
        expect(hexGame.gameStatus().move).toBeUndefined();
    });
    it('should throw an exception when making a move', function() {
        expect(hexGame.move).toThrow('invalid action when waitingForPlayers');
    });
});

describe('A HexGame that has been started', function() {
    var hexGame;
    var redMove = new Move(3, 6, 'red');
    var blueMove = new Move(3, 7, 'blue');

    beforeEach(function() {
        hexGame = new HexGame();
        hexGame.start();
    });

    it('should throw an exception when starting again', function() {
        expect(hexGame.start).toThrow('invalid action when redTurn');
    });
    it('should return a redTurn gameStatus with no last move', function() {
        expect(hexGame.gameStatus().currentStatus).toBe('redTurn');
        expect(hexGame.gameStatus().move).toBeUndefined();
    });
    it('should accept a move by red, confirming the move and swapping to blue turn', function() {
        var gameStatus = hexGame.move(redMove);
        expect(gameStatus.currentStatus).toBe('blueTurn');
        expect(gameStatus.move).toBe(redMove);
    });
    it('should ignore a move by blue, returning a redTurn gameStatus with no last move', function() {
        var gameStatus = hexGame.move(blueMove);
        expect(gameStatus.currentStatus).toBe('redTurn');
        expect(gameStatus.move).toBeUndefined();
    });
});

describe('A HexGame that has been started, after red placing a move', function() {
    var hexGame;
    var redMove = new Move(3, 6, 'red');
    var blueCorrectMove = new Move(3, 7, 'blue');
    var blueIncorrectMove = new Move(3, 6, 'blue');

    beforeEach(function() {
        hexGame = new HexGame();
        hexGame.start();
        hexGame.move(redMove);
    });

    it('should return a blueTurn gameStatus with the last move by red', function() {
        expect(hexGame.gameStatus().currentStatus).toBe('blueTurn');
        expect(hexGame.gameStatus().move).toBe(redMove);
    });
    it('should accept a correct move by blue, confirming the move and swapping to red turn', function() {
        var gameStatus = hexGame.move(blueCorrectMove);
        expect(gameStatus.currentStatus).toBe('redTurn');
        expect(gameStatus.move).toBe(blueCorrectMove);
    });
    it('should ignore an incorrect move by blue, returning blueTurn gameStatus and last move by red', function() {
        var gameStatus = hexGame.move(blueIncorrectMove);
        expect(gameStatus.currentStatus).toBe('blueTurn');
        expect(gameStatus.move).toBe(redMove);
    });
    it('should ignore a move by red, returning a blueTurn gameStatus and last move by red', function() {
        var gameStatus = hexGame.move(redMove);
        expect(gameStatus.currentStatus).toBe('blueTurn');
        expect(gameStatus.move).toBe(redMove);
    });
});

describe('A newly created Gameplay', function() {
    var gameplay;

    beforeEach(function() {
        gameplay = new Gameplay();
    });

    it('should return a status of "waitingForPlayers"', function() {
        expect(gameplay.currentStatus()).toBe('waitingForPlayers');
    });
    it('should throw an exception when getting the current player', function() {
        expect(gameplay.currentPlayer).toThrow('invalid action when waitingForPlayers');
    });
    it('should throw an exception when triggering the next player', function() {
        expect(gameplay.nextPlayer).toThrow('invalid action when waitingForPlayers');
    });
});


describe('A newly constructed Move', function() {
    var move;

    beforeEach(function() {
        move = new Move(5, 8, 'purple');
    });

    it('should represent a coordinate (x,y) and color', function() {
        expect(move.x).toBe(5);
        expect(move.y).toBe(8);
        expect(move.color).toBe('purple');
    });
});

describe('A newly constructed GameStatus', function() {
    var gameStatus;
    var expectedMove;

    beforeEach(function() {
        expectedMove = new Move();
        gameStatus = new GameStatus('status marker', expectedMove);
    });

    it('should represent a given current status and move', function() {
        expect(gameStatus.currentStatus).toBe('status marker');
        expect(gameStatus.move).toBe(expectedMove);
    });
});