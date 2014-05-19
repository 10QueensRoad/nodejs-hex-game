var game = require(__dirname + '/../../main/server/js/game');
var PlayerTurn = game.PlayerTurn;
var Gameplay = game.Gameplay;
var HexGame = game.HexGame;
var Pawn = game.Pawn;
var GameBoard = game.GameBoard;
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
        expect(hexGame.gameStatus().pawn).toBeUndefined();
    });
    it('should throw an exception when making a move', function() {
        expect(hexGame.placePawn).toThrow('invalid action when waitingForPlayers');
    });
});

describe('A HexGame that has been started', function() {
    var hexGame;
    var redPawn = new Pawn(3, 6, 'red');
    var bluePawn = new Pawn(3, 7, 'blue');

    beforeEach(function() {
        hexGame = new HexGame();
        hexGame.start();
    });

    it('should throw an exception when starting again', function() {
        expect(hexGame.start).toThrow('invalid action when redTurn');
    });
    it('should return a redTurn gameStatus with no last pawn', function() {
        expect(hexGame.gameStatus().currentStatus).toBe('redTurn');
        expect(hexGame.gameStatus().pawn).toBeUndefined();
    });
    it('should accept a move by red, confirming the pawn and swapping to blue turn', function() {
        var gameStatus = hexGame.placePawn(redPawn);
        expect(gameStatus.currentStatus).toBe('blueTurn');
        expect(gameStatus.pawn).toBe(redPawn);
    });
    it('should ignore a move by blue, returning a redTurn gameStatus with no last pawn', function() {
        var gameStatus = hexGame.placePawn(bluePawn);
        expect(gameStatus.currentStatus).toBe('redTurn');
        expect(gameStatus.pawn).toBeUndefined();
    });
});

describe('A HexGame that has been started, after red placing a pawn', function() {
    var hexGame;
    var redPawn = new Pawn(3, 6, 'red');
    var correctBluePawn = new Pawn(3, 7, 'blue');
    var incorrectBluePawn = new Pawn(3, 6, 'blue');

    beforeEach(function() {
        hexGame = new HexGame();
        hexGame.start();
        hexGame.placePawn(redPawn);
    });

    it('should return a blueTurn gameStatus with the last pawn by red', function() {
        expect(hexGame.gameStatus().currentStatus).toBe('blueTurn');
        expect(hexGame.gameStatus().pawn).toBe(redPawn);
    });
    it('should accept a correct move by blue, confirming the pawn and swapping to red turn', function() {
        var gameStatus = hexGame.placePawn(correctBluePawn);
        expect(gameStatus.currentStatus).toBe('redTurn');
        expect(gameStatus.pawn).toBe(correctBluePawn);
    });
    it('should throw an exception when blue attempts to duplicate the move', function() {
        expect(function() {
            hexGame.placePawn(incorrectBluePawn);
        }).toThrow('duplicate move');
    });
    it('should ignore a move by red, returning a blueTurn gameStatus and last pawn placed by red', function() {
        var gameStatus = hexGame.placePawn(redPawn);
        expect(gameStatus.currentStatus).toBe('blueTurn');
        expect(gameStatus.pawn).toBe(redPawn);
    });
});

describe('A HexGame that has been started, after red placing a pawn', function() {
    var hexGame;
    var redPawn = new Pawn(3, 6, 'red');
    var correctBluePawn = new Pawn(3, 7, 'blue');
    var incorrectBluePawn = new Pawn(3, 6, 'blue');

    beforeEach(function() {
        hexGame = new HexGame();
        hexGame.start();
        hexGame.placePawn(redPawn);
    });

    it('should return a blueTurn gameStatus with the last pawn by red', function() {
        expect(hexGame.gameStatus().currentStatus).toBe('blueTurn');
        expect(hexGame.gameStatus().pawn).toBe(redPawn);
    });
    it('should accept a correct move by blue, confirming the pawn and swapping to red turn', function() {
        var gameStatus = hexGame.placePawn(correctBluePawn);
        expect(gameStatus.currentStatus).toBe('redTurn');
        expect(gameStatus.pawn).toBe(correctBluePawn);
    });
    it('should throw an exception when blue attempts to duplicate the move', function() {
        expect(function() {
            hexGame.placePawn(incorrectBluePawn);
        }).toThrow('duplicate move');
    });
    it('should ignore a move by red, returning a blueTurn gameStatus and last pawn by red', function() {
        var gameStatus = hexGame.placePawn(redPawn);
        expect(gameStatus.currentStatus).toBe('blueTurn');
        expect(gameStatus.pawn).toBe(redPawn);
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


describe('A newly constructed Pawn', function() {
    var pawn;

    beforeEach(function() {
        pawn = new Pawn(5, 8, 'purple');
    });

    it('should represent a coordinate (x,y) and color', function() {
        expect(pawn.x).toBe(5);
        expect(pawn.y).toBe(8);
        expect(pawn.color).toBe('purple');
    });
});

describe('A newly constructed GameStatus', function() {
    var gameStatus;
    var expectedPawn = new Pawn();
    var expectedWinningPath = [new Pawn()];

    beforeEach(function() {
        expectedPawn = new Pawn();
        gameStatus = new GameStatus('status marker', expectedPawn, expectedWinningPath);
    });

    it('should represent a given current status and pawn', function() {
        expect(gameStatus.currentStatus).toBe('status marker');
        expect(gameStatus.pawn).toBe(expectedPawn);
        expect(gameStatus.winningPath).toBe(expectedWinningPath);
    });
});

describe('A newly created GameBoard (11x11)', function() {
    var gameBoard;

    beforeEach(function() {
        gameBoard = new GameBoard(11);
    });

    it('should throw an exception when attempting to place a pawn out of bounds (x<0)', function() {
        expect(function() {
            gameBoard.addPawn(new Pawn(-1, 0, 'red'));
        }).toThrow('move is out of bounds');
    });
    it('should throw an exception when attempting to place a pawn out of bounds (x>10)', function() {
        expect(function() {
            gameBoard.addPawn(new Pawn(11, 0, 'red'));
        }).toThrow('move is out of bounds');
    });
    it('should throw an exception when attempting to place a pawn out of bounds (y<0)', function() {
        expect(function() {
            gameBoard.addPawn(new Pawn(0, -1, 'red'));
        }).toThrow('move is out of bounds');
    });
    it('should throw an exception when attempting to place a pawn out of bounds (y>10)', function() {
        expect(function() {
            gameBoard.addPawn(new Pawn(0, 11, 'red'));
        }).toThrow('move is out of bounds');
    });
});

describe('A GameBoard with a single Pawn at (5,5) for red', function() {
    var gameBoard;
    var originalPawn = new Pawn(5, 5, 'red');

    beforeEach(function() {
        gameBoard = new GameBoard(11);
        gameBoard.addPawn(originalPawn);
    });

    it('should throw an exception when attempting to add a pawn at the same location', function() {
        expect(function() {
            gameBoard.addPawn(new Pawn(5, 5, 'blue'));
        }).toThrow('duplicate move');
    });
    it('should not return a neighbour for a Pawn at the same position', function() {
        expect(gameBoard.neighboursOf(new Pawn(5, 5, 'red'))).toEqual([]);
    });
    it('should return a neighbour for a Pawn at (+1,0) offset', function() {
        expect(gameBoard.neighboursOf(new Pawn(6, 5, 'red'))).toEqual([originalPawn]);
    });
    it('should return a neighbour for a Pawn at (-1,0) offset', function() {
        expect(gameBoard.neighboursOf(new Pawn(4, 5, 'red'))).toEqual([originalPawn]);
    });
    it('should return a neighbour for a Pawn at (0,+1) offset', function() {
        expect(gameBoard.neighboursOf(new Pawn(5, 6, 'red'))).toEqual([originalPawn]);
    });
    it('should return a neighbour for a Pawn at (0,-1) offset', function() {
        expect(gameBoard.neighboursOf(new Pawn(5, 4, 'red'))).toEqual([originalPawn]);
    });
    it('should return a neighbour for a Pawn at (-1,-1) offset', function() {
        expect(gameBoard.neighboursOf(new Pawn(4, 4, 'red'))).toEqual([originalPawn]);
    });
    it('should return a neighbour for a Pawn at (+1,+1) offset', function() {
        expect(gameBoard.neighboursOf(new Pawn(6, 6, 'red'))).toEqual([originalPawn]);
    });
    it('should not return a neighbour for a Pawn at (+1,-1) offset', function() {
        expect(gameBoard.neighboursOf(new Pawn(6, 4, 'red'))).toEqual([]);
    });
    it('should not return a neighbour for a Pawn at (-1,+1) offset', function() {
        expect(gameBoard.neighboursOf(new Pawn(4, 6, 'red'))).toEqual([]);
    });
    it('should not return a neighbour for an adjacent Pawn of a different colour', function() {
        expect(gameBoard.neighboursOf(new Pawn(6, 5, 'blue'))).toEqual([]);
    });
});

describe('A GameBoard with red pawns at (5,5) and (5,4) for red and a pawn at (4,5) for blue', function() {
    var gameBoard;
    var pawn1 = new Pawn(5, 5, 'red');
    var pawn2 = new Pawn(5, 4, 'red');
    var pawn3 = new Pawn(4, 5, 'blue');

    beforeEach(function() {
        gameBoard = new GameBoard(11);
        gameBoard.addPawn(pawn1);
        gameBoard.addPawn(pawn2);
        gameBoard.addPawn(pawn3);
    });

    it('should return both red neighbours for a pawn at (4,4)', function() {
        expect(gameBoard.neighboursOf(new Pawn(4, 4, 'red'))).toEqual([pawn2, pawn1]);
    });
    it('should return one neighbour for a pawn at (6,4)', function() {
        expect(gameBoard.neighboursOf(new Pawn(6, 4, 'red'))).toEqual([pawn2]);
    });
    it('should return all pawns when getting all pawns', function() {
        expect(gameBoard.allPawns()).toEqual([pawn3, pawn2, pawn1]);
    });
});