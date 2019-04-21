"use strict";
const ROT = require('rot-js');
const fs = require('fs');
var os = require('os');

var sg = new ROT.StringGenerator();

var nameFile = '';
var malePlayerNameData;
var femalePlayerNameData;
var adjectiveData;
var nicknameData;


fs.readFile('keeperrl_male_names.txt', function(err, data) {
    data = data.toString();
    malePlayerNameData = data.split(os.EOL);
});

fs.readFile('keeperrl_female_names.txt', function(err, data) {
    data = data.toString();
    femalePlayerNameData = data.split(os.EOL);
});

fs.readFile('adjectives.txt', function(err, data) {
    data = data.toString();
    adjectiveData = data.split(os.EOL);
});

fs.readFile('nicknames.txt', function(err, data) {
    if (err) {
        console.error(err);
        return;
    }
    data = data.toString();
    nicknameData = data.split(os.EOL);
});



function getPlayerName() {
    while(!malePlayerNameData || !femalePlayerNameData) {}
    if (Math.round(Math.random())) {
        nameFile = 'keeperrl_male_names.txt';
        var rnd = Math.floor(Math.random() * malePlayerNameData.length);
        return malePlayerNameData[rnd];
    } else {
        var rnd = Math.floor(Math.random() * femalePlayerNameData.length);
        return femalePlayerNameData[rnd];
    }
}

function getPlayerTitle() {
    while(!adjectiveData || !nicknameData) {}
    var rnd = Math.floor(Math.random() * adjectiveData.length);
    var adjective = adjectiveData[rnd];
    rnd = Math.floor(Math.random() * nicknameData.length);
    var nickname = nicknameData[rnd];
    return ('the ' + adjective + ' ' + nickname);
}

const mapWidth = 35;
const mapHeight = 35;

const playerFOVRadius = 8;
const previouslyExploredAlpha = 0.4;

class Dungeon {
    constructor(seed, floorNumber, furthestFloor) {
        if (floorNumber) {
            this.floorNumber = floorNumber;
        } else {
            this.floorNumber = 0;
        }
        if (furthestFloor) {
            this.furthestFloor = furthestFloor;
        } else {
            this.furthestFloor = floorNumber;
        }
       this.player = new Player();
        this.floors = [];
        this.seed = seed;
        ROT.RNG.setSeed(this.seed + this.floorNumber);
        this.floors[this.floorNumber] = new Floor(mapWidth, mapHeight, this.floorNumber);
    }
    gotoFloor(floorNumber, upOrDown) {
        if (floorNumber < 0) return;
        if (!this.floors[floorNumber]) {
            // New level that needs to be created and stored.
            // RNG for ROT set to initial seed + floorNumber
            ROT.RNG.setSeed(this.seed + floorNumber);
            this.floors[floorNumber] = new Floor(mapWidth, mapHeight, floorNumber, upOrDown === 'down');
        }
        this.floorNumber = floorNumber;
    }
    getCurrentFloor() {
        return this.floors[this.floorNumber];
    }
    
    useStairs(symbol) {
        var cf = this.getCurrentFloor();
        if (!symbol) {
            symbol = cf.getMap()[cf.playerX+","+cf.playerY];
        } else if (symbol !== cf.getMap()[cf.playerX+","+cf.playerY]) {
            return false;
        }
        if (symbol === ">") {
            this.gotoFloor(this.floorNumber + 1);
            return true;
        } else if (symbol === "<") {
            this.gotoFloor(this.floorNumber - 1);
            return true;
        }
        return false;
    }

    /** mapAlphaValues
     * 
     * @param x Player's X 
     * @param y Player's Y
     * @returns an array of alpha values to be used on the map of the tiles
     * Tiles seen by the player = 1
     * Tiles the player hasn't seen = 0
     * Tiles previously seen but not currently in FOV is a value between 0 and 1.
     */
    mapAlphaValues(x, y) {
        if (x && y) {
            return this.getCurrentFloor().updateFOV(x, y);
        } else {
            return this.getCurrentFloor().updateFOV(this.getCurrentFloor().playerX, this.getCurrentFloor().playerY);
        }
    }

    setAlphaValues(alpha) {
        this.getCurrentFloor().mapExplored = alpha;
    }

    updatePlayerPosition(x,y) {
        this.getCurrentFloor().setPlayerPosition(x, y);
    }

    getMap() {
        this.getCurrentFloor().getMap();
    }
}

class Floor {
    constructor(width, height, levelNumber, spawnOnDownStairs) {
        this.map = {};
        this.width = width;
        this.height = height;
        this.playerX = null;
        this.playerY = null;
        this.levelNumber = levelNumber;
        this.enemies = [];
        this.mapExplored = {};
        
        if ((this.levelNumber+1)%5 == 0) {
        
            /* create a connected map where the player can reach all non-wall sections */
            var cellMap = new ROT.Map.Cellular(width, height, { connected: true });

            /* cells with 1/2 probability */
            cellMap.randomize(0.43);

            /* make a few generations */
            for (var i=0; i<5; i++) cellMap.create();

            for (var j = 0; j < height; j++) {
                for (var i = 0; i < width; i++) {
                    if (cellMap._map[i][j]) {
                        this.map[i+','+j] = '%';
                    } else {
                        this.map[i+','+j] = ' '
                    }
                }
            }

            var digger = new ROT.Map.Digger(width, height, {roomWidth:[3,7], roomHeight:[3,7], corridorLength:[2,10], dugPercentage:0.2});
            var digCallback = function(x,y, value) {
                var key = x + "," + y;
                if (value) { if (this.map[x+','+y] != '%') { this.map[key] = ' ';}}
                else { this.map[key] = ".";}// Walls: ' ' Floor: '.'
            }
        } else {        
            var digger = new ROT.Map.Digger(width, height, {roomWidth:[3,7], roomHeight:[3,7], corridorLength:[2,4], dugPercentage:0.24});
            //new ROT.Map.Uniform(width, height, {roomWidth: [3,6], roomHeight: [3,6], roomDugPercentage: 0.5});

            var digCallback = function(x,y, value) {
                var key = x + "," + y;
                if (value) { this.map[key] = " ";}
                else { this.map[key] = ".";}// Walls: ' ' Floor: '.'
            }
        }
        digger.create(digCallback.bind(this));

        this.rooms = digger.getRooms();
        var worldMap = this.map;
        var drawDoor = function(x,y) {
            worldMap[x+","+y] = "+";
        }
        for (var i = 0; i < this.rooms.length; i++) {
            var room = this.rooms[i];
            room.getDoors(drawDoor);
        }

        for (var j = 0; j < this.height; j++) {
            for (var i = 0; i < this.width; i++) {
                if (this.map[i+","+j] === ".") {
                    if (!(this.inRoom(i,j))) {
                        this.map[i+","+j] = ",";
                    }
                }
                this.mapExplored[i+","+j] = 0;
            }
        }

        for (var j = 0; j < this.height; j++) {
            for (var i = 0; i < this.width; i++) {
                if(this.map[i +","+j] === " ") {
                    if (
                        (this.map[(i+1)+","+j] === ".") ||
                        (this.map[(i-1)+","+j] === ".") ||
                        (this.map[i+","+(j+1)] === ".") ||
                        (this.map[i+","+(j-1)] === ".") ||
                        (this.map[(i+1)+","+(j+1)] === ".") ||
                        (this.map[(i+1)+","+(j-1)] === ".") ||
                        (this.map[(i-1)+","+(j+1)] === ".") ||
                        (this.map[(i-1)+","+(j-1)] === ".")) {
                            // If a blank tile has a floor tile around it, then the blank tile needs to be a wall
                            this.map[i +","+j] = "#";
                    }
                }
            }
        }

        //var playerStartRoom = this.rooms[Math.floor(Math.random() * (this.rooms.length-1))];
        if (this.levelNumber != 0) {
            this.map[this.rooms[0].getCenter()[0] + "," + this.rooms[0].getCenter()[1]] = "<";
        }

        //var stairsDownRoom = playerStartRoom;
        //while (stairsDownRoom == playerStartRoom) { stairsDownRoom = this.rooms[Math.floor(Math.random() * (this.rooms.length-1))]; }
        
        this.map[this.rooms[this.rooms.length-1].getCenter()[0] + "," + this.rooms[this.rooms.length-1].getCenter()[1]] = ">";
        
        var roomID = 0;
        if (spawnOnDownStairs) {
            roomID = this.rooms.length - 1;
        }
        this.playerX = this.rooms[roomID].getCenter()[0];
        this.playerY = this.rooms[roomID].getCenter()[1];

        // Initiate Enemies and Dijkstra path-finding passed function
        this.placeEnemies();
        this.dijkstra = new ROT.Path.Dijkstra(this.playerX, this.playerY, function (x, y) {
            if (this.map) {
                return ((this.map[x+','+y] === '.') || (this.map[x+','+y] === ',') || (this.map[x+','+y] === '-') || (this.map[x+','+y] === '+') || (this.map[x+','+y] === '%'))
            } else {
                return false;
            }
        }); 


        
    }
    updateFOV(pX, pY) {
        var localMap = this.map;
        var localMapExplored = this.mapExplored;
        // Player's field-of-view light input callback
        var lightPasses = function(x,y) {
            var key = x+","+y;
            if (key in localMap) { return ((localMap[key] == ".") || (localMap[key] == ",") || localMap[key] == "-" || localMap[key] == "<" || localMap[key] == ">" || localMap[key] == "%"); }
            return false;
        }
        
        var fov = new ROT.FOV.PreciseShadowcasting(lightPasses);
        // Output callback for player's field-of-view
        fov.compute(pX, pY, playerFOVRadius, function(x, y, r, visibility) {
            var ch = (r ? "" : "@");
            localMapExplored[x+","+y] = 2;
        });

        for (var j = 0; j < this.height; j++) {
            for (var i = 0; i < this.width; i++) {
                var tileAlpha = this.mapExplored[i+","+j];
                if (tileAlpha == 1) {
                    tileAlpha = previouslyExploredAlpha;
                } else if (tileAlpha == 2) {
                    tileAlpha = 1;
                } else if (tileAlpha != previouslyExploredAlpha){
                    tileAlpha = 0;
                }
                this.mapExplored[i+","+j] = tileAlpha;
            }
        }
        return this.mapExplored;
    }
    getMap() {
        return this.map;
    }
    getPlayerPosition() {
        return {x: this.playerX, y: this.playerY};
    }
    inRoom(x, y) {
        for(var i = 0; i < this.rooms.length; i++) {
            var room = this.rooms[i];
            if (x >= room.getLeft() && x <= room.getRight() && y >= room.getTop() && y <= room.getBottom()) {
                return i+1;
            }
        }
        return 0;
    }
    setPlayerPosition(x, y) {
        this.playerX = x;
        this.playerY = y;
        if (this.map[x+','+y] === '+') {
            this.map[x+','+y] = '-';
        }
    }
    getExploredMap() {
        return this.mapExplored;
    }
    openDoor(x, y) {
        if (this.map[x+","+y] === '+') {
            this.map[x+","+y] = '-';
            return true;
        } else {
            return false;
        }
    }
    canWalk(x, y) {
        if (x>this.width || y>this.height || x<0 || y<0) {
            return false;
        }

        switch (this.map[x+","+y]) {
            case ' ':
            case '#':
                return false;
            default:
                return true;
        }
    }
    placeEnemies() {
        var enemyStartRoom, enemyX, enemyY, attempts = 0;
        // TODO: Improve enemy placement
        // Attempts is to prevent infinite loops that might happen during test. Will place enemies different in final implementation
        do {
        enemyStartRoom = this.rooms[Math.floor(Math.random() * (this.rooms.length-1))];
        enemyX = enemyStartRoom.getCenter()[0];
        enemyY = enemyStartRoom.getCenter()[1];
        attempts++;
        } while (this.inRoom(enemyX, enemyY) == this.inRoom(this.playerX, this.playerY) && attempts < 3);
        this.enemies.push(new Enemy('goblin', enemyX, enemyY));
    }
    getEnemies() {
        return this.enemies;
    }
    getEnemyAt(x, y) {
       for (var i = 0; i < this.enemies.length; i++) {
            var enemy = this.enemies[i];
            
            if (enemy.x == x && enemy.y == y) {
                return enemy;
            }
        }
        return null;
    }
    generateTileNames() {
        // Instead of placing individual tiles, store all tile sprites together in an array
        // in the layout of map[x+","+y] with the key being tile coordinates. This will allow
        // easier updating of an individual tiles alpha value.
        var tileNames = {};
        var tileName = "";
        var mapData = ' ';

        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                mapData = this.map[x+","+y];
                switch (mapData) {
                    case ' ':
                        tileName = 'monster 6';
                        break;
                    case '.':
                        tileName = "floor_room";
                        break;
                    case ',':
                        tileName = "floor_hallway";
                        break;
                    case '>':
                        tileName = "stairs_down";
                        break;
                    case '<':
                        tileName = "stairs_up";
                        break;
                    case '+':
                        tileName = "door";
                        break;
                    case '-':
                        tileName = "openDoor";
                        break;
                    case '%':
                        // Cave floor
                        tileName = "trap";
                        break;
                    case '#':
                        // Surround Tiles is an array of the results from checking if the tiles surrounding a wall are in rooms or not.
                        // Each direction is used twice so wanted to reduce the number of calls to inRoom
                        // Order is in 0)N, 1)S, 2)E, 3)W, 4)NE, 5)NW, 6)SE, 7)SW
                        var surroundingTiles = [this.inRoom(x,(y-1)), this.inRoom(x,(y+1)), this.inRoom((x+1),y), this.inRoom((x-1),y),
                                                this.inRoom((x+1),(y-1)), this.inRoom((x-1),(y-1)), this.inRoom((x+1),(y+1)), this.inRoom((x-1),(y+1)) ];
                        tileName = "";
                        if (!surroundingTiles[0] && (surroundingTiles[2] + surroundingTiles[3] + surroundingTiles[4] + surroundingTiles[5])) {
                            // If there is a room to the East or West of the wall, it's a wall that connects on the North and South side.
                            tileName += "N";
                        } else {
                            tileName += "_";
                        }

                        if (!surroundingTiles[1] && (surroundingTiles[2] + surroundingTiles[3] + surroundingTiles[6] + surroundingTiles[7])){
                            // If there is a room to the East or West of the wall, it's a wall that connects on the North and South side.
                            tileName += "S";
                        } else {
                            tileName += "_";
                        }
                        if (!surroundingTiles[2] && (surroundingTiles[0] + surroundingTiles[1] + surroundingTiles[4] + surroundingTiles[6])) {
                            // If there is a room to the East or West of the wall, it's a wall that connects on the North and South side.
                            tileName += "E";
                        } else {
                            tileName += "_";
                        }
                        if (!surroundingTiles[3] && (surroundingTiles[0] + surroundingTiles[1] + surroundingTiles[5] + surroundingTiles[7])) {
                            // If there is a room to the East or West of the wall, it's a wall that connects on the North and South side.
                            tileName += "W";
                        } else {
                            tileName += "_";
                        }
                        break;
                    default:
                        tileName = mapData;
                }
                tileNames[x+","+y] = tileName;
            }
        }
        return tileNames;
    }
}

class Player {
    constructor(name) {
        this.name;
        this.title;
        this.x = 0,
        this.y = 0,
        this.health = 10;
        this.attack = [1,2];
        
        if (name) {
            this.name = name;
        } else {
            this.name = getPlayerName();
        }

        this.title = getPlayerTitle();
    }
}

class Enemy {
    constructor(name, x, y) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.health = 0;
        this.attack = [1];
        this.accuracy = 0;
        this.char = "";
        this.loot = [];
        this.description = "";
        this.path = [];
        
        switch (name) {
            case 'goblin':
                this.health = 4;
                this.attack = [1];
                this.accuracy = 0.8;
                this.char = "g";
                this.description = "It a goblin.";
                break;
        }
    }
    calculateMove(playerX, playerY, map) {
        var dijkstra = new ROT.Path.Dijkstra(playerX, playerY, function (x, y) {
            if (map) {
                return ((map[x+','+y] === '.') || (map[x+','+y] === ',') || (map[x+','+y] === '-') || (map[x+','+y] === '+') || (map[x+','+y] === '%'))
            } else {
                return false;
            }
        }, { topology: 4 });
        var localPath = this.path; 
        dijkstra.compute(this.x, this.y, function(x, y) {
            // For testing, have the alpha of all the tiles in the enemies path should have the alpha value of 1.
            localPath.push({x:x, y:y});
        });
        // Remove the first spot in path because it contains the enemy's current location. We want the first spot to be where the enemy's next turn should be.
        this.path.shift();
        return this.path;
    }
}

module.exports = { Dungeon, Floor, Enemy, getPlayerName, getPlayerTitle };
