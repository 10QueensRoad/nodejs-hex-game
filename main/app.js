var jwtSecret = 'hex game secret private key';
var response = {};
var playersConnected = {};
var playerTokens = {};
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

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/client/views/index.html')
});

app.use('/resources', express.static(__dirname + "/client/resources"));

app.post('/joinAsPlayer', function (req, res) {
	var color = !playerTokens['red'] ? 'red' : (!playerTokens['blue'] ? 'blue' : undefined);
	if (!color) {
		return res.send(403, 'Game already in progress');
	}
    var playerSideProfile = {
        side: color
    };
    playerTokens[color] = jwt.sign(playerSideProfile, jwtSecret, { expiresInMinutes: 15 });
    res.json({token: playerTokens[color], side: color, gameStatus: hexGame.gameStatus()});
});

app.post('/viewer', function (req, res) {
    var viewerProfile = {
        side: 'viewer'
    };

    var viewerToken = jwt.sign(viewerProfile, jwtSecret, { expiresInMinutes: 60 });
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
        hexGame.start();
		io.sockets.emit('gameStatus', hexGame.gameStatus());
    }
    function resetGame() {
        playerTokens = _.transform(playerTokens, function(result, value, key) { result[key] = undefined; });
        playersConnected = _.transform(playersConnected, function(result, value, key) { result[key] = false; });
        hexGame = new game.HexGame(); //Reset game
        io.sockets.emit('gameStatus', hexGame.gameStatus());
    }
    socket.on('moveRequest', function (moveRequest) {
        if ((!playersConnected['red'] || !playersConnected['blue']) || 
        	(!_.some(playerTokens, function(d) { return d === moveRequest.token; }))) {
            return;
        }
        var gameStatus;
        try {
            gameStatus = hexGame.move(new game.Move(moveRequest.x, moveRequest.y, side));
            response.isError = false;
        } catch (exception) {
            console.log('!! ' + exception);
            // Compatibility with existing implementation. May need to be revised.
            gameStatus = hexGame.gameStatus();
            response.isError = true;
        }

        io.sockets.emit('gameStatus', gameStatus);
    }).on('logout', function(logoutRequest) {
    	var color = _.findKey(playerTokens, function(d) { return d === logoutRequest.token; });
        if (color) {
            console.log("notification: --------------------------- " + color, 'logged out, resetting game');
            resetGame();
        }
    }).on('disconnect', function(){
        var color = _.findKey(playerTokens, function(d) { return d === currentToken; });
        if (color) {
            console.log("notification: --------------------------- " + color, " disconnected, resetting game");
            resetGame();
        }
    });
});

server.listen(port);
