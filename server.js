const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io').listen(http);
const uuidv4 = require('uuid/v4');
const sqlite3 = require('sqlite3');
const Rogue = require('./Rogue.js');

const PORT = 3000;

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

    function save() {
        // Save the player's info
        if (dungeon && uuid) {
            db.run(`UPDATE saves SET playerData = $playerData, mapData = $mapData WHERE uuid = $uuid;`, {
                $uuid: uuid,
                $playerData: JSON.stringify({name: playerName, x: dungeon.getCurrentFloor().playerX, y: dungeon.getCurrentFloor().playerY}),
                $mapData: JSON.stringify({seed: seed, currentFloor: dungeon.floorNumber, maxFloor: dungeon.floors.length - 1, map: dungeon.getCurrentFloor().map, fov: dungeon.mapAlphaValues(), enemies: dungeon.getCurrentFloor().enemies})
            });
        }
        socket.emit('debug','save succesful');
    }

    socket.on('disconnect', function() {
        console.log('user disconnected.');
        // Save the player's info
        save();
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
        //  create table saves(uuid text primary key, playerData text, mapData text);
        
        db.run(`INSERT INTO saves VALUES ($uuid, $playerData, $mapData)`, {
                    $uuid: uuid,
                    $playerData: JSON.stringify({name: playerName, x: dungeon.getCurrentFloor().playerX, y: dungeon.getCurrentFloor().playerY}),
                    $mapData: JSON.stringify({seed: seed, currentFloor: dungeon.floorNumber, maxFloor: dungeon.floors.length - 1, map: dungeon.getCurrentFloor().map, fov: dungeon.mapAlphaValues(), enemies: dungeon.getCurrentFloor().enemies})
        });
        socket.emit('playerInfo', {name: playerName, saveID: uuid});
    });
    socket.on('load game', function(loadID) {
        db.get(`SELECT * FROM saves WHERE uuid = $uuid;`, { $uuid: loadID },
        function(err, row) {
            if (err || !row) {
                if (err) { console.error(err.message); return; }
                socket.emit('missing','load');
            } else {
                var playerData = JSON.parse(row.playerData);
                var mapData = JSON.parse(row.mapData);
                uuid = loadID;
                playerName = playerData.name;
                seed = mapData.seed;
                dungeon = new Rogue.Dungeon(seed, mapData.currentFloor, mapData.maxFloor);
                dungeon.getCurrentFloor().map = mapData.map;
                dungeon.getCurrentFloor().enemies = mapData.enemies;
                dungeon.setAlphaValues(mapData.fov);
                dungeon.getCurrentFloor().playerX = playerData.x;
                dungeon.getCurrentFloor().playerY = playerData.y;
                socket.emit('dungeon', dungeon.getCurrentFloor());
                socket.emit('playerInfo', {name: playerName, saveID: uuid});
            }
        });
    });
    socket.on('request', function(data) {
        switch(data) {
            case 'tileNames':
                socket.emit('tileNames', dungeon.getCurrentFloor().generateTileNames());
                break;
            case 'floor down':
                dungeon.gotoFloor(dungeon.floorNumber + 1, "up");
                socket.emit('dungeon', dungeon.getCurrentFloor());
                break;
            case 'floor up':
                dungeon.gotoFloor(dungeon.floorNumber - 1, "down");
                socket.emit('dungeon', dungeon.getCurrentFloor());
                break;
            case 'name':
                if (name) {
                    socket.emit('name', playerName);
                } else {
                    socket.emit('missing', 'name');
                }
                break;
            case 'save':
                save();
                break;
            default:
                console.log('Bad request.\n' + data);
        }
    });
    socket.on('playerTurn', function(playerTurnData) {
        // TODO: Player's turn will consist of player's position, items used, enemy attacked, any object interactions on the map (trap, books, etc.)
        // TODO: World turn will calculate and send any buffs to the player that continue next player turn, enemy damage/attacks/movement, world updates that happen in response to player or enemy (enemies opening doors, setting off traps, secret passages opening), and the new FOV for the player
        if (dungeon) {
            var updatedMapTiles = {};
            if (playerTurnData.x && playerTurnData.y) {
                dungeon.getCurrentFloor().setPlayerPosition(playerTurnData.x, playerTurnData.y);
                dungeon.getCurrentFloor().enemies.forEach(function(element) {
                    if (element.health > 0) {
                        enemy = new Rogue.Enemy(element.name, element.x, element.y);
                        element.path = enemy.calculateMove(playerTurnData.x, playerTurnData.y, dungeon.getCurrentFloor().map);
                        var moveTo = element.path.shift();
                        if (moveTo) {
                            element.x = moveTo.x;
                            element.y = moveTo.y;
                            if(element.x == playerTurnData.x && element.y == playerTurnData.y) {
                                element.health = 0;
                            }
                        } else {
                            element.x = playerTurnData.x;
                            element.y = playerTurnData.y;
                            element.health = 0;
                        }
                        if (dungeon.getCurrentFloor().map[element.x+','+element.y] == '+') {
                            dungeon.getCurrentFloor().map[element.x+','+element.y] = '-';
                            updatedMapTiles[element.x+','+element.y] = '-';
                        }
                    }
                });
            }
            if (Object.keys(updatedMapTiles).length > 0) {
                socket.emit('worldTurn', {enemies: dungeon.getCurrentFloor().enemies, fov: dungeon.mapAlphaValues(), map: updatedMapTiles});
            } else {
                socket.emit('worldTurn', {enemies: dungeon.getCurrentFloor().enemies, fov: dungeon.mapAlphaValues()});
            }
        } else {
            socket.emit('missing', 'no dungeon');        
        }
    });
});

http.listen(PORT, function() {
    console.log('Listening on port ' + PORT + '.');
});

process.on('SIGINT', function() {
    console.log('Shuting down...');
    db.close();
    process.exit();
});