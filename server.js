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
app.get('/map', function(req, res) {
    res.sendFile(__dirname + '/map.html');
})
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
    var dungeon;
    var seed;

    function save() {
        // Save the player's info
        if (dungeon && uuid) {
            db.run(`UPDATE saves SET playerData = $playerData, mapData = $mapData WHERE uuid = $uuid;`, {
                $uuid: uuid,
                $playerData: JSON.stringify({name: dungeon.player.name, title: dungeon.player.title, x: dungeon.getCurrentFloor().playerX, y: dungeon.getCurrentFloor().playerY}),
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
        // Seed for the concurrent floors is based on the initial seed.
        // Choosing a random number 1,000,000 less than max int so player
        // has plenty of floors before they hit max int. Just needs to be a check
        // but this is quick and planning on just being the implementation during testing.
        seed = Math.floor(Math.random() * Math.floor(Number.MAX_SAFE_INTEGER - 1000000));
        dungeon = new Rogue.Dungeon(seed);
        if (name  && name != 'Prisoner') {
            dungeon.player.name = name;
        }
        var initialDungeonData = dungeon.getFloorDataForClient({includePlayerInfo: true});
        initialDungeonData.saveID = uuid;
        socket.emit('dungeon', initialDungeonData);
        //  create table saves(uuid text primary key, playerData text, mapData text);
        db.run(`INSERT INTO saves VALUES ($uuid, $playerData, $mapData)`, {
                    $uuid: uuid,
                    $playerData: JSON.stringify({name: dungeon.player.name, title: dungeon.player.title, x: dungeon.getCurrentFloor().playerX, y: dungeon.getCurrentFloor().playerY}),
                    $mapData: JSON.stringify({seed: seed, currentFloor: dungeon.floorNumber, maxFloor: dungeon.floors.length - 1, map: dungeon.getCurrentFloor().map, fov: dungeon.mapAlphaValues(), enemies: dungeon.getCurrentFloor().enemies})
        });
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
                seed = mapData.seed;
                dungeon = new Rogue.Dungeon(seed, mapData.currentFloor, mapData.maxFloor);
                dungeon.player.name = playerData.name;
                dungeon.player.title = playerData.title;
                dungeon.getCurrentFloor().map = mapData.map;
                dungeon.getCurrentFloor().enemies = mapData.enemies;
                dungeon.setAlphaValues(mapData.fov);
                dungeon.getCurrentFloor().playerX = playerData.x;
                dungeon.getCurrentFloor().playerY = playerData.y;
                var initialDungeonData = dungeon.getFloorDataForClient({includePlayerInfo: true});
                initialDungeonData.saveID = uuid;
                socket.emit('dungeon', initialDungeonData);
            }
        });
    });
    socket.on('request', function(data) {
        switch(data) {
            case 'tileNames':
                socket.emit('tileData', dungeon.getCurrentFloor().generateTileData());
                break;
            case 'floor down':
                dungeon.gotoFloor(dungeon.floorNumber + 1, "up");
                socket.emit('dungeon', dungeon.getFloorDataForClient());
                break;
            case 'floor up':
                dungeon.gotoFloor(dungeon.floorNumber - 1, "down");
                socket.emit('dungeon', dungeon.getFloorDataForClient());
                break;
            case 'name':
                if (name) {
                    socket.emit('name', dungeon.player.name);
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
                /* CALCULATING PLAYER'S TURN */
                // COMBAT: Player possible attacks enemy
                playerAttackingEnemy = dungeon.getCurrentFloor().getEnemyAt(playerTurnData.x, playerTurnData.y);
                if (playerAttackingEnemy && playerAttackingEnemy.health > 0) {
                    // Player tried to move to a tile with an enemy that has health.
                    // Player attacks the enemy.
                    // Player can have different attack values. Ideally this will be affected by their skills. Right now it chooses a random value in their attack array.
                    var playerDamage = dungeon.player.attack[Math.floor(Math.random() * dungeon.player.attack.length)];
                    playerAttackingEnemy.health -= playerDamage;
                } else {
                    // If there isn't an alive enemy in the tile, move the player
                    dungeon.getCurrentFloor().setPlayerPosition(playerTurnData.x, playerTurnData.y);
                }

                var currentPlayerPosition = dungeon.getCurrentFloor().getPlayerPosition();
                
                dungeon.getCurrentFloor().enemies.forEach(function(element) {
                    if (element.health > 0) {
                        enemy = new Rogue.Enemy(element.name, element.x, element.y);
                        element.path = enemy.calculateMove(currentPlayerPosition.x, currentPlayerPosition.y, dungeon.getCurrentFloor().map);
                        var moveTo = element.path.shift();
                        if (moveTo) {
                            // COMBAT: Enemy attacks
                            // TODO: Check if enemy still attacks from one tile away.
                            if(moveTo.x == currentPlayerPosition.x && moveTo.y == currentPlayerPosition.y) {
                                // Enemy tried to move on a tile where the player is at.
                                // Counts as enemy attacking player.
                                dungeon.player.health -= element.attack[Math.floor(Math.random() * element.attack.length)];
                                if (dungeon.player.health < 0) {
                                    dungeon.player.health = 0;
                                }
                            } else {
                                // Tile is free of player.
                                // Enemy is able to move to the spot.
                                element.x = moveTo.x;
                                element.y = moveTo.y;
                            }
                        } else {
                            // Should only be called when player is on the enemy. This shouldn't happen
                            // often so we just instantly kill the enemy.
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
            dungeon.mapAlphaValues()
            if (Object.keys(updatedMapTiles).length > 0) {
                dungeon.player.x = dungeon.getCurrentFloor().playerX;
                dungeon.player.y = dungeon.getCurrentFloor().playerY;
                socket.emit('worldTurn', {enemies: dungeon.getCurrentFloor().enemies, fov: dungeon.getCurrentFloor().getDiffMapExplored(), map: updatedMapTiles, player: dungeon.player});
            } else {
                dungeon.player.x = dungeon.getCurrentFloor().playerX;
                dungeon.player.y = dungeon.getCurrentFloor().playerY;
                socket.emit('worldTurn', {enemies: dungeon.getCurrentFloor().enemies, fov: dungeon.getCurrentFloor().getDiffMapExplored(), player: dungeon.player});
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