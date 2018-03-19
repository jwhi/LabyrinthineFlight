var ROT = require("rot-js");

const mapWidth = 30;
const mapHeight = 30;


module.exports = class Rogue {
    constructor() {
        this.map = {};
    }
    generateMap() {
        var digger = new ROT.Map.Digger(mapWidth, mapHeight);

        var digCallback = function(x,y, value) {
            var key = x + ',' + y;
            if (value) { this.map[key] = " ";} // Walls = ' '
            else { this.map[key] = ".";}       // Floor = '.'
        }
        
        try {
        digger.create(digCallback.bind(this));
        }
        catch(error) {
            console.error(error);
            return;
        }

        for (var j = 0; j < mapHeight; j++) {
            for (var i = 0; i < mapWidth; i++) {
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

        return this.map;
    }
}