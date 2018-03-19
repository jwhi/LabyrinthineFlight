/**
 * Handles all the rendering of the game functions with PIXI.js
 * and player input.
 * Will try to keep generic enough so can be used with other games
 * and not break if Rogue.js is heavily modified.
 */

// Currently the tiles used are 64x64 pixels. Originally 16x16 but PIXI.js
// had issues with scaling sprites that small
const tileSize = 64;

// Width in pixels of the textures used for fonts
const fontSize =  24;

 // Socket for interactions with the server
 var socket = io();
 socket.emit('request', 'new map');
 socket.on('map', function(map) {
     var str = "";
     for (var y = 0; y < 30; y++) {
         for (var x = 0; x < 30; x++) {
             str += map[x+","+y];
         }
         str += "\n";
     }
     console.log(str);
 });

// Aliases
var Application = PIXI.Application,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    Sprite = PIXI.Sprite;

// Number of tiles that make up the width and height of the Roguelike level
// Unsure what is optimal for performance but still creates a fun map to play
var mapWidth = 40,
    mapHeight = 34;

// If running on a mobile phone, will add buttons for navigation
// and create smaller map.
var isMobile = false;

// http://detectmobilebrowsers.com/
if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
|| /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4)))
{
    isMobile = true;
    mapWidth = 25;
    mapHeight = 30;
}

// Variables used to store the buttons used for navigation on mobile. Needed
// to test which button is pressed so can have the buttons appear when pressed
var buttonUp, buttonDown, buttonLeft, buttonRight;

// Set PIXI.js application window to the width and height of the map * size of map textures in pixels.
var appWidth = mapWidth * tileSize, appHeight = mapHeight * tileSize;


var renderer = PIXI.autoDetectRenderer(appWidth, appHeight, null);

// Stores the game state used with PIXI.js
var state = null;

// rogue is where we store the Rogue class that contains all game logic
var rogue = null;


// Stores the player texture and can be used to make sure the map stored in rogue
// has the same player position that is displayed on the screen.
var player;
// Stores the PIXI loader for all the map textures, except for open doors which I
// patched in on the go and haven't had the chance to merge it into the spritesheet.
var mapTiles, openDoorTexture;

// Map sprites stores all the map sprites currently drawn on the screen
// Map alpha stores the opacity for each individual tile that handles the FOV effect
var mapSprites = [], mapAlpha = [];

// PIXI can store sprites in a container. This allows all game sprites to be deleted
// and redrawn easily after a player changes floors
var gameTiles = new PIXI.Container();

let app = new Application({
    width: appWidth,
    height: appHeight,
    antialias: true,
    transparent: false,
    resolution: 1
});

// Texture loading of font and map sprite sheets.
PIXI.loader
    .add('level', "assets/level_creatures.json")
    .load(setup);

function setup() {
    // mapTiles is alias for all the texture atlas frame id textures
    // openDoorTexture is the texture swapped on the canvas when a player steps on a door tile
    mapTiles = resources["level"].textures;
    openDoorTexture =  PIXI.Texture.fromImage("assets/openDoor.png");

    // Create instance of the roguelike that handles a majority of the game
    rogue = new Rogue(mapWidth, mapHeight);
    updateMap();
    rogue.updatePlayerPosition(getPlayerX(), getPlayerY());

    // If the site is being loaded from a mobile device, add touch screen arrow keys
    // and a button that appears when player is standing on stairs.
    // Buttons appear transparent so they do not obstruct the view of the game.
    // Buttons are shown when pressed to allow the player to see the boundary of the button
    // and give some feedback that input has been received.
    // If not mobile, listen for keyboard events.
    if (isMobile) {
        buttonUp = new PIXI.Graphics();
        buttonUp.beginFill(0x404040);
        buttonUp.drawPolygon([
            0,0,
            appWidth,0,
            appWidth/2,appHeight/2
        ]);
        buttonUp.endFill();
        buttonUp.interactive = true;
        buttonUp.buttonMode = true;
        buttonUp
            .on('pointerdown', onButtonDown)
            .on('pointerup', onButtonUp);
        buttonUp.alpha = 0;

        buttonLeft = new PIXI.Graphics();
        buttonLeft.beginFill(0x404040);
        buttonLeft.drawPolygon([
            0,0,
            0,appHeight,
            appWidth/2,appHeight/2
        ]);
        buttonLeft.endFill();
        buttonLeft.interactive = true;
        buttonLeft.buttonMode = true;
        buttonLeft
            .on('pointerdown', onButtonDown)
            .on('pointerup', onButtonUp);
        buttonLeft.alpha = 0;

        buttonRight = new PIXI.Graphics();
        buttonRight.beginFill(0x404040);
        buttonRight.drawPolygon([
            appWidth,0,
            appWidth,appHeight,
            appWidth/2,appHeight/2
        ]);
        buttonRight.endFill();
        buttonRight.interactive = true;
        buttonRight.buttonMode = true;
        buttonRight
            .on('pointerdown', onButtonDown)
            .on('pointerup', onButtonUp);
        buttonRight.alpha = 0;

        buttonDown = new PIXI.Graphics();
        buttonDown.beginFill(0x404040);
        buttonDown.drawPolygon([
            0,appHeight,
            appWidth,appHeight,
            appWidth/2,appHeight/2
        ]);
        buttonDown.endFill();
        buttonDown.interactive = true;
        buttonDown.buttonMode = true;
        buttonDown
            .on('pointerdown', onButtonDown)
            .on('pointerup', onButtonUp);
        buttonDown.alpha = 0;

        app.stage.addChild(buttonUp);
        app.stage.addChild(buttonLeft);
        app.stage.addChild(buttonRight);
        app.stage.addChild(buttonDown);

        // Button that allows the player to use stairs to change floors of the dungeon
        document.getElementById('addedControls').innerHTML = '<button class="button" onclick="if (rogue.useStairs()) updateMap();">Use Stairs</button>';
        document.getElementById('addedControls').style.visibility = "hidden";    
    } else {
        //Capture the keyboard arrow keys
        let left = keyboard(37),
            up = keyboard(38),
            right = keyboard(39),
            down = keyboard(40),
            period = keyboard(190),
            comma = keyboard(188);

        //Left arrow key `press` method
        left.press = () => {
            player.vx = -1;
            player.vy = 0;
        };

        //Left arrow key `release` method
        left.release = () => {
            if (!right.isDown && player.vy === 0) {
                player.vx = 0;
            }
        };

        //Up
        up.press = () => {
            player.vy = -1;
            player.vx = 0;
        };
        up.release = () => {
            if (!down.isDown && player.vx === 0) {
                player.vy = 0;
            }
        };

        //Right
        right.press = () => {
            player.vx = 1;
            player.vy = 0;
        };
        right.release = () => {
            if (!left.isDown && player.vy === 0) {
                player.vx = 0;
            }
        };

        //Down
        down.press = () => {
            player.vy = 1;
            player.vx = 0;
        };
        down.release = () => {
            if (!up.isDown && player.vx === 0) {
                player.vy = 0;
            }
        };

        period.press = () => {
            if (rogue.useStairs(">")) {
                updateMap();
            }
        };

        comma.press = () => {
            if (rogue.useStairs("<")) {
                updateMap();
            }
        };
    }

    // Set the game state to play
    state = play;

    // Start the game loop by adding the `gameLoop` function to
    // Pixi's `ticker` and providing it with a 'delta' argument
    app.ticker.add(delta=>gameLoop(delta));
    
    // Add the canvas that Pixi automatically created to the HTML document
    document.getElementById('gameScreen').appendChild(renderer.view);

    // Resize the game window to the browser window so player does not need to scroll
    // to see the entire game board or find where the player is on the screen.
    resize();
}
function gameLoop(delta) {
    // Update the current game state;
    state(delta);
}
function play(delta) {
    // Wait for player to perform an action to end the player's turn
    // Right now the only action the player can make is move
    if (player.vx != 0 || player.vy != 0) {
        // Player has moved, move player on the map and update the player's FOV

        // Check if player can walk on the tile they are trying to walk towards
        // If player can't walk on destination tile, player stays on their current tile.
        // The player's turn still ends, but need to display text letting the player know they
        // can't go that direction and it is now the enemies turn
        if (rogue.getCurrentFloor().canWalk(getPlayerX() + player.vx, getPlayerY() + player.vy)) {
            // Player's vx and vy are +1 and -1 depending on direction the player wants to go
            // To move player the proper amount of pixels on map, need to multiply the vx/vy by
            // the size of the map sprites
            player.x += tileSize * player.vx;
            player.y += tileSize * player.vy;
            rogue.updatePlayerPosition(getPlayerX(), getPlayerY());
            
            if (rogue.getCurrentFloor().getMap()[getPlayerX()+","+getPlayerY()] == "+") {
                if (rogue.getCurrentFloor().openDoor(getPlayerX(),getPlayerY())) {
                    // If successfully opened door, replace closed door texture with an open door.
                    mapSprites[getPlayerX()+","+getPlayerY()].texture = openDoorTexture;
                }
            }
            
            mapAlpha = rogue.mapAlphaValues(getPlayerX(), getPlayerY());

            for (var j = 0; j < mapHeight; j++) {
                for (var i = 0; i < mapWidth; i++) {
                    var t = mapSprites[i+","+j];
                    if (t) {
                        t.alpha = mapAlpha[i+","+j];
                    }
                }
            }
        }

        for (var j = 0; j < mapHeight; j++) {
            for (var i = 0; i < mapWidth; i++) {
                var t = mapSprites[i+","+j];
                if (t) {
                    t.alpha = mapAlpha[i+","+j];
                }
            }
        }
        
        if (rogue.getCurrentFloor().getMap()[getPlayerX()+","+getPlayerY()] == ">" || rogue.getCurrentFloor().getMap()[getPlayerX()+","+getPlayerY()] == "<") {
            document.getElementById('addedControls').style.visibility = "visible";
        } else {
            document.getElementById('addedControls').style.visibility = "hidden";
        }
        player.vx = 0;
        player.vy = 0;

        // Render the updated game screen
        renderer.render(app.stage);
    }
}
// Handles drawing the dungeon level and deleting the old floor when the player changes floors
function updateMap() {
    if (gameTiles) {
        gameTiles.destroy({children:true, texture:false, baseTexture:false});
    }
    
   gameTiles = new PIXI.Container();
    
    if (player)
        app.stage.removeChild(player);
    
    player = new Sprite(mapTiles["player"]);
    player.position.set(tileSize*rogue.getCurrentFloor().playerX,
                        tileSize*rogue.getCurrentFloor().playerY);
    player.vx = 0;
    player.vy = 0;
    
    renderMap();

    
    gameTiles.addChild(player);
    app.stage.addChild(gameTiles);
    renderer.render(app.stage);
    return true;
}
// Helper function to place tiles into the application using sprites from the spritesheet
function placeTile(tileName, x, y) {
    var tile = null;
    if (tileName == "openDoor") {
        tile = new Sprite(openDoorTexture);
    } else if (tileName !== " ") {
        tile = new Sprite(mapTiles[tileName]);
    }
    if (tile) {
        tile.position.set(x, y);
        gameTiles.addChild(tile);
    }
    return tile;
}
function renderMap() {
    // Instead of placing individual tiles, store all tile sprites together in an array
    // in the layout of map[x+","+y] with the key being tile coordinates. This will allow
    // easier updating of an individual tiles alpha value.
    var tileName = "";
    var floorData = rogue.getCurrentFloor();
    var map = floorData.getMap();
    var mapData = ' ';

    for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
            mapData = map[x+","+y];
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
                    var surroundingTiles = [floorData.inRoom(x,(y-1)), floorData.inRoom(x,(y+1)), floorData.inRoom((x+1),y), floorData.inRoom((x-1),y),
                                            floorData.inRoom((x+1),(y-1)), floorData.inRoom((x-1),(y-1)), floorData.inRoom((x+1),(y+1)), floorData.inRoom((x-1),(y+1)) ];
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
            mapSprites[x+","+y] = placeTile(tileName, x * tileSize, y * tileSize);
        }
    }

    // sprite.alpha = 0.6 or similar value for explored map outside of current FOV
    // eventually have updateFOV return mapArray that has alpha values for entire map
    mapAlpha = rogue.mapAlphaValues();

    for (var j = 0; j < mapHeight; j++) {
        for (var i = 0; i < mapWidth; i++) {
            var t = mapSprites[i+","+j];
            if (t) {
                t.alpha = mapAlpha[i+","+j];
            }
        }
    }
}
// Returns the player's X value in relation to the map instead of pixels from the right
// This gives the player's X position in terms the rogue class can understandpl
function getPlayerX() {
    if (player) {
        return player.x / tileSize;
    }
    else
        return -1;
}
// Returns the player's Y value in relation to the map instead of pixels from the top
// This gives the player's Y position in terms the rogue class can understand
function getPlayerY() {
    
    if (player)
        return player.y / tileSize;
    else
        return -1;
}
// Code taken from stack overflow question that linked the js fiddle example.
// http://jsfiddle.net/2wjw043f/
// https://stackoverflow.com/questions/30554533/dynamically-resize-the-pixi-stage-and-its-contents-on-window-resize-and-window
function resize() {        
    // Ratio is used in resize function and not sure why is calculated as a global or why it was defined twice
    // the second one being set and never being used and resize was using the first instance that doesn't use Math.min
    var ratio = appWidth / appHeight;
    // ratio = Math.min(window.innerWidth / app.stage.height, window.innerHeight / app.stage.width);

    if (window.innerWidth / window.innerHeight >= ratio) {
        var w = window.innerHeight * ratio;
        var h = window.innerHeight;
    } else {
        var w = window.innerWidth;
        var h = window.innerWidth / ratio;
    }
    renderer.view.style.width = w + 'px';
    renderer.view.style.height = h + 'px';

    
    window.onresize = function(event) {
        resize();
    };

}
// Taken from https://github.com/kittykatattack/learningPixi#textureatlas
function keyboard(keyCode) {
    let key = {};
    key.code = keyCode;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;
    //The `downHandler`
    key.downHandler = event => {
        if (event.keyCode === key.code) {
            if (key.isUp && key.press) key.press();
            key.isDown = true;
            key.isUp = false;
        }
        event.preventDefault();
    };

    //The `upHandler`
    key.upHandler = event => {
        if (event.keyCode === key.code) {
            if (key.isDown && key.release) key.release();
            key.isDown = false;
            key.isUp = true;
        }
        event.preventDefault();
    };

    //Attach event listeners
    window.addEventListener(
        "keydown", key.downHandler.bind(key), false
    );
    window.addEventListener(
        "keyup", key.upHandler.bind(key), false
    );
    return key;
}
// When touch screen button is pressed, set the opacity of the button to 40% to give
// feedback to the user that they are pressing one of the navigation keys and 
// moving the player in a direction
function onButtonDown() {
    this.alpha = 0.4;
    switch (this) {
        case buttonUp:
            player.vy = -1;
            player.vx = 0;
            break;
        case buttonDown:
            player.vy = 1;
            player.vx = 0;
            break;
        case buttonRight:
            player.vx = 1;
            player.vy = 0;
            break;
        case buttonLeft:
            player.vx = -1;
            player.vy = 0;
            break;
        default:
            player.vx = 0;
            player.vy = 0;
    }
}
// When touch screen button is released, set opacity to 0
function onButtonUp() {
    this.alpha = 0;
    renderer.render(app.stage);
}
