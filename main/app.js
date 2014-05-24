var jwtSecret = 'hex game secret private key';
var response = {};
var port = 3000;

_ = require('./client/resources/js/lib/lodash-2.4.1');

_(process.argv)
	.map(function (arg) { return arg.indexOf('port=') == 0 ?
			arg.substring('port='.length, arg.length) : undefined })
	.filter(function(port) { return !_.isUndefined(port); })
	.at([0])
	.forEach(function(finalPort) { if (!_.isUndefined(finalPort)) port = finalPort; });
console.log('port ', port);

var express = require('express')
    , app = express()
    , favicon = require('serve-favicon')
    , server = require('http').createServer(app)
    , jwt = require('jsonwebtoken')
    , game = require('./server/js/game')
    , socketioJwt = require('socketio-jwt')
    , io = require('socket.io').listen(server, { log: false });

app.use(favicon(__dirname + "/client/resources/images/favicon.ico"));

var hexGame = new game.HexGame();
var gameStatistics = new game.GameStatistics();

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/client/views/index.html')
});

app.use('/resources', express.static(__dirname + "/client/resources"));
//Expose files under views, mainly for spiking now
app.use('/', express.static(__dirname + "/client/views"));

io.sockets.on('connection', function (socket) {
    var side = undefined;

    function isPlayer() {
        return side === 'blue' || side === 'red';
    }

    function resetGame() {
        side = undefined;
        hexGame = new game.HexGame(); //Reset game
        io.sockets.emit('gameStatus', hexGame.gameStatus());
    }

    socket.emit('gameStatus', hexGame.gameStatus());

    socket.on('join_as_player', function () {
        console.log('join as player');
        if (hexGame.allPlayersJoined()) {
            socket.emit('error', { message: 'Game already in progress' });
        } else {
            side = hexGame.playerJoins();
            socket.emit('player_joined', {side: side});
            if (hexGame.allPlayersJoined()) {
                try {
                    gameStatistics.gameStarted();
                    hexGame.start();
                } catch (exception) {
                    console.log(exception);
                    resetGame();
                }
		io.sockets.emit('gameStatus', hexGame.gameStatus());
            }
            socket.emit('gameStatus', hexGame.gameStatus());
        }
    });

    socket.on('moveRequest', function (moveRequest) {
        if (!isPlayer()) {
            return;
        }
        var gameStatus;
        try {
            gameStatus = hexGame.placePawn(new game.Pawn(moveRequest.x, moveRequest.y, side));
            response.isError = false;
            if (gameStatus.winningPath) {
                gameStatistics.gameFinished(hexGame.fullStatus());
                io.sockets.emit('gameStatistics', gameStatistics.stats());
            }
        } catch (exception) {
            console.log('!! ' + exception);
            // Compatibility with existing implementation. May need to be revised.
            gameStatus = hexGame.gameStatus();
            response.isError = true;
            response.errorSide = side;
        }
        io.sockets.emit('gameStatus', gameStatus);
    }).on('logout', function(logoutRequest) {
        if (isPlayer()) {
            console.log("notification: --------------------------- " + side, 'logged out, resetting game');
            resetGame();
        }
    }).on('disconnect', function(){
        // Problem: Once a player "connects", they will continue to be connected even if they
        // quit a game and become a viewer. We don't want this player to terminate a game in
        // progress if this is the case.
        if (isPlayer()) {
            console.log("notification: --------------------------- " + side, " disconnected, resetting game");
            resetGame();
        }
    });
});

server.listen(port);
