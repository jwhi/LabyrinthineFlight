/**
 * LabyrinthineFlight.js
 * 
 * This file will handle:
 * 1. Storing and updating game data
 * 2. Game logic that is done client-side
 * 3. Counterpart to the server-side Rogue class
 *
 */

/* Game Constants */

const mapWidth = 75;
const mapHeight = 40;


/* Map Functions */

/**
 * canWalk
 * Walking is handled client side to give the user a better gameplay experience.
 * To test whether a player can move to a tile on the map, check the x,y coordinate
 * on the map passed to the client from the server. So far, blank tiles and '#' are
 * they only tiles that block movement
 * @param x The X value of the tile to be checked
 * @param y The Y value of the tile to be checked
 * @returns a boolean that is true for walkable tiles, false for walls
 */
function canWalk(x, y) {
    // If x,y is off the map, return false
    // If map tile is not walkable, return false
    // If tile is occupied, return false
    // Else return true
}