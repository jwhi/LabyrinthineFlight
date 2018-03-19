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
            if (data === 'new game') {
            dungeon = new Rogue.Dungeon();
            var map = dungeon.getCurrentFloor().getMap();
        
            var str = "";
            for (var y = 0; y < 30; y++) {
                for (var x = 0; x < 30; x++) {
                    str += map[x+","+y];
                }
                str += "\n";
            }
            console.log(str);
            socket.emit('Dungeon', dungeon);
        } else if (data === 'tileNames') {
            //console.log(floor);
            socket.emit('tileNames', dungeon.getCurrentFloor().generateTileNames());
        } else if (data === 'mapAlphaValues') {
            socket.emit('mapAlphaValues', dungeon.mapAlphaValues());
        }
    });
    socket.on('updatePlayerPosition', function(positions) {
        dungeon.updatePlayerPosition(positions[0],positions[1]);
    });
})

http.listen(3000, function() {
    console.log('Listening on port 3000.');
});