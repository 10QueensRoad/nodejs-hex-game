var jwtSecret = 'hex game secret private key';
var response = {};
var playersConnected = {};
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
var participants = new Participants();

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/client/views/index.html')
});

app.use('/resources', express.static(__dirname + "/client/resources"));

io.sockets.on('connection', function (socket) {
    var side = undefined;

    function isPlayer() {
        return side === 'blue' || side === 'red';
    }

    function resetGame() {
        participants = new Participants();
        playersConnected = _.transform(playersConnected, function(result, value, key) { result[key] = false; });
        hexGame = new game.HexGame(); //Reset game
        io.sockets.emit('gameStatus', hexGame.gameStatus());
    }

    socket.emit('gameStatus', hexGame.gameStatus());

    socket.on('join_as_player', function () {
        console.log('join as player');
        if (participants.allPlayersJoined()) {
            socket.emit('error', { message: 'Game already in progress' });
        } else {
            var player = participants.playerJoins();
            side = player.side;
            playersConnected[side] = true;
            socket.emit('player_joined', _.extend({}, player, {gameStatus: hexGame.gameStatus()}));
            if (playersConnected['red'] && playersConnected['blue']) {
                try {
                    gameStatistics.gameStarted();
                    hexGame.start();
                } catch (exception) {
                    console.log(exception);
                    hexGame = new game.HexGame();
                    hexGame.start();
                }
		io.sockets.emit('gameStatus', hexGame.gameStatus());
            }
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

function Participants() {

    var players = [{
        side: 'red',
        token: null
    }, {
        side: 'blue',
        token: null
    }];

    this.viewerJoins = function() {
        return jwt.sign({side: 'viewer'}, jwtSecret, { expiresInMinutes: 60 });
    };

    this.playerJoins = function() {
        if (!this.allPlayersJoined()) {
            var player = _.findWhere(players, {token: null});
            var token = jwt.sign({side: player.side}, jwtSecret, { expiresInMinutes: 15 });
            player.token = token;
            return player;
        }
    };

    this.allPlayersJoined = function() {
        return !_.findWhere(players, {token: null});
    };

    this.players = function() {
        return players;
    };
}
