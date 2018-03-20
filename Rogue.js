var ROT = require("rot-js");

const mapWidth = 30;
const mapHeight = 30;

const playerFOVRadius = 8;
const previouslyExploredAlpha = 0.4;

class Dungeon {
    constructor() {
        this.floorNumber = 0;
        this.floors = [];
        this.floors[0] = new Floor(mapWidth, mapHeight, 0);
    }
    gotoFloor(floorNumber) {
        if (floorNumber < 0) return false;
        if (this.floors[floorNumber]) {
            // If level exist in the levels array, it is a level previously
            this.floorNumber = floorNumber;
        } else {
            // New level needs to be created and stored.
            this.floors[floorNumber] = new Floor(this.width, this.height, floorNumber);
        }
        this.floorNumber = floorNumber;
        return this.floors[floorNumber];
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
     * @param {*} x - Player's X 
     * @param {*} y - Player's Y
     * Returns an array of alpha values to be used on the map of the tiles
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

    updatePlayerPosition(x,y) {
        this.getCurrentFloor().setPlayerPosition(x, y);
    }

    getMap() {
        this.getCurrentFloor().getMap();
    }
}

class Floor {
    constructor(width, height, levelNumber) {
        this.map = {};
        this.width = width;
        this.height = height;
        this.playerX = null;
        this.playerY = null;
        this.levelNumber = levelNumber;
        this.mapExplored = {};
        var digger = new ROT.Map.Digger(this.width,this.height);;
        var digCallback = function(x,y, value) {
            var key = x + "," + y;
            if (value) { this.map[key] = " ";}
            else { this.map[key] = ".";}// Walls: ' ' Floor: '.'
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

        var playerStartRoom = this.rooms[Math.floor(Math.random() * (this.rooms.length-1))];
        this.playerX = playerStartRoom.getCenter()[0];
        this.playerY = playerStartRoom.getCenter()[1];
        if (this.levelNumber != 0) {
            this.map[this.playerX + "," + this.playerY] = "<";
        }

        var stairsDownRoom = playerStartRoom;
        while (stairsDownRoom == playerStartRoom) { stairsDownRoom = this.rooms[Math.floor(Math.random() * (this.rooms.length-1))]; }
        var stairsDown = stairsDownRoom.getCenter();
        this.map[stairsDown[0] + "," +stairsDown[1]] = ">";
    }
    updateFOV(pX, pY) {
        var localMap = this.map;
        var localMapExplored = this.mapExplored;
        // Player's field-of-view light input callback
        var lightPasses = function(x,y) {
            var key = x+","+y;
            if (key in localMap) { return ((localMap[key] == ".") || (localMap[key] == ",") || localMap[key] == "-" || localMap[key] == "<" || localMap[key] == ">"); }
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
                    tileAlpha = this.previouslyExploredAlpha;
                } else if (tileAlpha == 2) {
                    tileAlpha = 1;
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
        return [this.playerX, this.playerY];
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
                        tileName = ' ';
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

module.exports = { Dungeon, Floor};