const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io').listen(http);
const uuidv4 = require('uuid/v4');
const sqlite3 = require('sqlite3');
const Rogue = require('./Rogue.js');

app.use('/js',express.static(__dirname + '/js'));
app.use('/assets',express.static(__dirname + '/assets'));
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

var db = new sqlite3.Database('./db/data.sqlite3', function(err) {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the saves database.')
});

io.on('connection', function(socket) {
    console.log('a user connected');
    var uuid;
    var playerName;
    var dungeon;
    var seed;
    socket.on('disconnect', function() {
        console.log('user disconnected.');
        // Save the player's info
        db.run(`UPDATE saves SET x = $x, y = $y, currentFloor = $currentFloor, maxFloor = $maxFloor, map = $map, alpha = $alpha WHERE uuid = $uuid;`, {
            $uuid: uuid,
            $x: dungeon.getCurrentFloor().playerX,
            $y: dungeon.getCurrentFloor().playerY,
            $currentFloor: dungeon.floorNumber,
            $maxFloor: dungeon.floors.length - 1,
            $map: JSON.stringify(dungeon.getCurrentFloor().map),
            $alpha: JSON.stringify(dungeon.mapAlphaValues())
        });
    });
    socket.on('new game', function(name) {
        uuid = uuidv4();
        playerName = name;
        // Seed for the concurrent floors is based on the initial seed.
        // Choosing a random number 1,000,000 less than max int so player
        // has plenty of floors before they hit max int. Just needs to be a check
        // but this is quick and planning on just being the implementation during testing.
        seed = Math.floor(Math.random() * Math.floor(Number.MAX_SAFE_INTEGER - 1000000));
        dungeon = new Rogue.Dungeon(seed);
        socket.emit('dungeon', dungeon.getCurrentFloor());
        //  create table saves(uuid text primary key, name text, x integer, y integer, seed integer, currentFloor integer, maxFloor integer, map text, alpha text);
        db.run(`INSERT INTO saves VALUES ($uuid, $name, $x, $y, $seed, $currentFloor, $maxFloor, $map, $alpha)`, {
                    $uuid: uuid,
                    $name: name,
                    $x: dungeon.getCurrentFloor().playerX,
                    $y: dungeon.getCurrentFloor().playerY,
                    $seed: seed,
                    $currentFloor: dungeon.floorNumber,
                    $maxFloor: dungeon.floors.length - 1,
                    $map: JSON.stringify(dungeon.getCurrentFloor().map),
                    $alpha: JSON.stringify(dungeon.mapAlphaValues())
        });
        socket.emit('gameID', uuid);
    });
    socket.on('load game', function(loadID) {
        db.get(`SELECT * FROM saves WHERE uuid = $uuid;`, { $uuid: loadID },
        function(err, row) {
            if (err) {
                console.error(err.message);
            }
            uuid = loadID;
            playerName = row.name;
            seed = row.seed;
            dungeon = new Rogue.Dungeon(seed, row.currentFloor, row.maxFloor);
            dungeon.getCurrentFloor().map = JSON.parse(row.map);
            dungeon.setAlphaValues(JSON.parse(row.alpha));
            dungeon.getCurrentFloor().playerX = row.x;
            dungeon.getCurrentFloor().playerY = row.y;
            socket.emit('debug', 'player name = ' + playerName);
            socket.emit('debug', 'current floor = ' + dungeon.floorNumber);
            socket.emit('dungeon', dungeon.getCurrentFloor());
            socket.emit('gameID', uuid);
        });
    });
    socket.on('request', function(data) {
        switch(data) {
            case 'tileNames':
                socket.emit('tileNames', dungeon.getCurrentFloor().generateTileNames());
                break;
            case 'mapAlphaValues':
                socket.emit('mapAlphaValues', dungeon.mapAlphaValues());
                break;
            case 'floor down':
                dungeon.gotoFloor(dungeon.floorNumber + 1, "up");
                socket.emit('dungeon', dungeon.getCurrentFloor());
                break;
            case 'floor up':
                dungeon.gotoFloor(dungeon.floorNumber - 1, "down");
                socket.emit('dungeon', dungeon.getCurrentFloor());
                break;
            case 'save':
                // Save the player's info
                db.run(`UPDATE saves SET x = $x, y = $y, currentFloor = $currentFloor, maxFloor = $maxFloor, map = $map, alpha = $alpha WHERE uuid = $uuid;`, {
                    $uuid: uuid,
                    $x: dungeon.getCurrentFloor().playerX,
                    $y: dungeon.getCurrentFloor().playerY,
                    $currentFloor: dungeon.floorNumber,
                    $maxFloor: dungeon.floors.length - 1,
                    $map: JSON.stringify(dungeon.getCurrentFloor().map),
                    $alpha: JSON.stringify(dungeon.mapAlphaValues())
                });
                socket.emit('debug','save succesful');
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

process.on('SIGINT', function() {
    console.log('Shuting down...');
    db.close();
    process.exit();
});