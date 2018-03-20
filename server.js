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
            socket.emit('tileNames', dungeon.getCurrentFloor().generateTileNames());
        } else if (data === 'mapAlphaValues') {
            socket.emit('mapAlphaValues', dungeon.mapAlphaValues());
        }
    });
    socket.on('move', function(positions) {
        // Check if player can walk on the tile they are trying to walk towards
        // If player can't walk on destination tile, player stays on their current tile.
        // The player's turn still ends, but need to display text letting the player know they
        // can't go that direction and it is now the enemies turn
        var cf = dungeon.getCurrentFloor();
        if (cf.canWalk(positions[0], positions[1])) {
            // Player's vx and vy are +1 and -1 depending on direction the player wants to go
            // To move player the proper amount of pixels on map, need to multiply the vx/vy by
            // the size of the map sprites
            cf.setPlayerPosition(positions[0], positions[1]);
            
            if (cf.getMap()[positions[0]+","+positions[1]] == "+") {
                if (cf.openDoor(positions[0],positions[1])) {
                    // If successfully opened door, replace closed door texture with an open door.
                    socket.emit('open door', positions);
                }
            }
            socket.emit('move', positions);
            socket.emit('mapAlphaValues', dungeon.mapAlphaValues());
        }
    });
})

http.listen(3000, function() {
    console.log('Listening on port 3000.');
});