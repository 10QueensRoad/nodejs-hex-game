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
var participants = new Participants();

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/client/views/index.html')
});

app.use('/resources', express.static(__dirname + "/client/resources"));

app.post('/joinAsPlayer', function (req, res) {
    console.log('/joinAsPlayer')
    if (participants.allPlayersJoined()) {
        return res.send(403, 'Game already in progress');
    }

    var player = participants.playerJoins();
    res.json(_.extend({}, player, {gameStatus: hexGame.gameStatus()}));
});

app.post('/viewer', function (req, res) {
    console.log('/viewer');
    var viewerToken = participants.viewerJoins();
    res.json({token: viewerToken, fullStatus: hexGame.fullStatus()});
});

io.set('authorization', socketioJwt.authorize({
    secret: jwtSecret,
    handshake: true
}));

io.sockets.on('connection', function (socket) {
    var side = socket.handshake.decoded_token.side;
    var currentToken = socket.handshake.query.token;
    console.log("notification: --------------------------- " + side, 'connected');
    if (side !== 'blue' && side !== 'red') {
        return;
    }
    playersConnected[side] = true;
    if (playersConnected['red'] && playersConnected['blue']) {
        try {
            hexGame.start();
        } catch (exception) {
            console.log(exception);
        }
		io.sockets.emit('gameStatus', hexGame.gameStatus());
    }
    function resetGame() {
        participants = new Participants();
        playersConnected = _.transform(playersConnected, function(result, value, key) { result[key] = false; });
        hexGame = new game.HexGame(); //Reset game
        io.sockets.emit('gameStatus', hexGame.gameStatus());
    }
    socket.on('moveRequest', function (moveRequest) {
        if ((!playersConnected['red'] || !playersConnected['blue']) ||
            !participants.isPlayer(moveRequest.token)) {
            return;
        }
        var gameStatus;
        try {
            gameStatus = hexGame.placePawn(new game.Pawn(moveRequest.x, moveRequest.y, side));
            response.isError = false;
        } catch (exception) {
            console.log('!! ' + exception);
            // Compatibility with existing implementation. May need to be revised.
            gameStatus = hexGame.gameStatus();
            response.isError = true;
            response.errorSide = side;
        }
        io.sockets.emit('gameStatus', gameStatus);
    }).on('logout', function(logoutRequest) {
        if (participants.isPlayer(currentToken)) {
            console.log("notification: --------------------------- " + side, 'logged out, resetting game');
            resetGame();
        }
    }).on('disconnect', function(){
        // Problem: Once a player "connects", they will continue to be connected even if they
        // quit a game and become a viewer. We don't want this player to terminate a game in
        // progress if this is the case.
        if (participants.isPlayer(currentToken)) {
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

    this.isPlayer = function(token) {
        return !!_.findWhere(players, {token: token})
    };

    this.players = function() {
        return players;
    };
}
