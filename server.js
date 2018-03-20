var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io').listen(http);
var Rogue = require('./Rogue.js');

app.use('/js',express.static(__dirname + '/js'));
app.use('/assets',express.static(__dirname + '/assets'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
    console.log('a user connected');
    var dungeon;

    socket.on('disconnect', function() {
        console.log('user disconnected.');
    });
    socket.on('request', function(data) {
        switch(data) {
            case 'new game':
                dungeon = new Rogue.Dungeon();
                socket.emit('dungeon', dungeon.getCurrentFloor());
                break;
            case 'tileNames':
                socket.emit('tileNames', dungeon.getCurrentFloor().generateTileNames());
                break;
            case 'mapAlphaValues':
                socket.emit('mapAlphaValues', dungeon.mapAlphaValues());
                break;
            case 'floor down':
                dungeon.gotoFloor(dungeon.floorNumber + 1);
                socket.emit('dungeon', dungeon.getCurrentFloor());
                break;
            case 'floor up':
                dungeon.gotoFloor(dungeon.floorNumber - 1);
                socket.emit('dungeon', dungeon.getCurrentFloor());
                break;
            default:
                console.log('Bad request.\n' + data);
        }
    });
    socket.on('move', function(positions) {
        dungeon.getCurrentFloor().setPlayerPosition(positions[0], positions[1]);
        socket.emit('mapAlphaValues', dungeon.mapAlphaValues());
    });
})

http.listen(3000, function() {
    console.log('Listening on port 3000.');
});
