var jwtSecret = 'hex game secret private key';
var response = {};
var playerStatus = {};
var blueToken;
var redToken;

_ = require('./client/resources/js/lib/lodash-2.4.1');

var express = require('express')
    , app = express()
    , server = require('http').createServer(app)
    , jwt = require('jsonwebtoken')
    , game = require('./server/js/game')
    , socketioJwt = require('socketio-jwt')
    , io = require('socket.io').listen(server, { log: false });

var hexGame = new game.HexGame();

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/client/views/index.html')
});

app.use('/resources', express.static(__dirname + "/client/resources"));

app.post('/red', function (req, res) {
    var redSideProfile = {
        side: 'red'
    };
    redToken = jwt.sign(redSideProfile, jwtSecret, { expiresInMinutes: 60*5 });
    res.json({token: redToken});
    if (blueToken) {
        hexGame.start();
    }
});

app.post('/blue', function (req, res) {
    var blueSideProfile = {
        side: 'blue'
    };

    blueToken = jwt.sign(blueSideProfile, jwtSecret, { expiresInMinutes: 60*5 });
    res.json({token: blueToken});
    if (redToken) {
        hexGame.start();
    }
});

app.post('/viewer', function (req, res) {
    var blueSideProfile = {
        side: 'viewer'
    };

    var viewerToken = jwt.sign(blueSideProfile, jwtSecret, { expiresInMinutes: 60*60 });
    res.json({token: viewerToken, playerStatus: playerStatus});
});

io.set('authorization', socketioJwt.authorize({
    secret: jwtSecret,
    handshake: true
}));

io.sockets.on('connection', function (socket) {
    console.log("notification: --------------------------- " + socket.handshake.decoded_token.side, 'connected');
    var side = socket.handshake.decoded_token.side;
    if (side !== 'blue' && side !== 'red') {
        return;
    }
    if (side == 'blue') {
        playerStatus.hasBluePlayer = true;
    } else if (side == 'red') {
        playerStatus.hasRedPlayer = true;
    }
    io.sockets.emit('playerStatus', playerStatus);

    socket.on('moveRequest', function (moveRequest) {
        if ((!redToken || !blueToken) || (moveRequest.token != blueToken && moveRequest.token != redToken)) {
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

        // This should be returned as a gameStatus. Let's work out how to combine
        // the gameStatus and playerStatus in a meaningful way, if we need to return both at once.
        response.playerStatus = playerStatus;
        io.sockets.emit('moveResponse', _.extend({}, response, gameStatus));
    }).on('logout', function(logoutRequest) {
        if (logoutRequest.token == blueToken) {
            blueToken = undefined;
            playerStatus.hasBluePlayer = false;
        } else if(logoutRequest.token == redToken) {
            redToken = undefined;
            playerStatus.hasRedPlayer = false;
        }
        io.sockets.emit('playerStatus', playerStatus);
    });
});

server.listen(3000);
