// Currently the tiles used are 64x64 pixels. Originally 16x16 but PIXI.js
// had issues with scaling sprites that small
const tileSize = 64;

// Width in pixels of the textures used for fonts
const fontSize =  24;
const fontHeight = 32;
const lineSpacing = 8;

const maxSaves = 8;

// Used when first drawing tiles to the screen. Mostly for testing
const defaultAlpha = 0;

const defaultName = 'Prisoner';

// Socket for interactions with the server

// Dungeon object received from the server.
var level;

var tileSets = false;

var playerName = '';
var uuid;

// Map sprites stores all the map sprites currently drawn on the screen
// Map alpha stores the opacity for each individual tile that handles the FOV effect
var mapSprites = [], mapAlpha = [];


// Aliases
var Application = PIXI.Application,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    Sprite = PIXI.Sprite;

// Number of tiles that make up the width and height of the Roguelike level
// Unsure what is optimal for performance but still creates a fun map to play
var mapWidth = 30,
    mapHeight = 30;

// If running on a mobile phone, will add buttons for navigation
// and create smaller map.
var isMobile = false;

// http://detectmobilebrowsers.com/
if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
|| /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4)))
{
    isMobile = true;
}

// Variables used to store the buttons used for navigation on mobile. Needed
// to test which button is pressed so can have the buttons appear when pressed
var buttonUp, buttonDown, buttonLeft, buttonRight;

// Set PIXI.js application window to the width and height of the map * size of map textures in pixels.
var appWidth = mapWidth * tileSize, appHeight = mapHeight * tileSize;


var renderer = PIXI.autoDetectRenderer(appWidth, appHeight, null);

// Stores the game state used with PIXI.js
var state = null;

// Stores the player texture and can be used to make sure the map stored in rogue
// has the same player position that is displayed on the screen.
var player;
// Stores the PIXI loader for all the map textures, except for open doors which I
// patched in on the go and haven't had the chance to merge it into the spritesheet.
var mapTiles, openDoorTexture;

// PIXI can store sprites in a container. This allows all game sprites to be deleted
// and redrawn easily after a player changes floors
var gameTiles = new PIXI.Container();

var socket;

let app = new Application({
    width: appWidth,
    height: appHeight,
    antialias: true,
    transparent: false,
    resolution: 1
});



// Texture loading of font and map sprite sheets.
PIXI.loader
    .add('level', 'assets/level_creatures.json')
    .add('level_new', 'assets/level_creatures_new.json')
    .add(['assets/orange_font.json', 'assets/white_font.json', 'assets/grey_font.json', 'assets/blue_font.json'])
    .load(setup);






function setup() {
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
        document.getElementById('addedControls').innerHTML = '<button class="button" id="stairsButton" onclick="useStairs();">Use Stairs</button>';
        document.getElementById('stairsButton').style.visibility = "hidden";
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
            useStairs('>');
        };

        comma.press = () => {
            useStairs('<');
        };
    }


    tileSets = confirm('Press OK to use the classic tiles.\nPress Cancel to use new tiles.');
    var newGame;
    var dialogValue = '';

    if (confirm("Press 'OK' to start a NEW GAME\nPress 'Cancel' to LOAD GAME from a UUID.")) {
        playerName = prompt('Please enter your name', defaultName);
        if (playerName == null || playerName == '') {
            playerName = defaultName;
        }
        newGame = true;
        dialogValue = playerName;
    } else {
        var promptStr = '';
        var saves = getLocalStorageSaves();
        if (saves[1].saveID) {
            promptStr = 'Enter the UUID to load or the number next to a previously played game.\n';
            for (var i = 1; i <= maxSaves; i++) {
                if (saves[i].saveID) {
                    promptStr += i + ') ' + saves[i].name + ' : ' + saves[i].saveID + '\n';
                }
            }
        } else {
            promptStr = 'Enter the UUID to load:';
        }
        var loadID = prompt(promptStr, '');
        if (loadID == null || loadID == '') {
            screenWithText("Error: Unable to load game.");
        } else {
            if (loadID <= maxSaves && loadID >= 1) {
                newGame = false;
                dialogValue = saves[loadID].saveID;
            } else {
                newGame = false;
                dialogValue = loadID;
            }
        }
    }

    socket = io();
    // Sockets handled by Socket.io
    // When the page receives these packets, update the webpage as needed
    socket.on('debug', function(message) {
        console.log(message);
    });
    socket.on('dungeon', function(dungeonFloor) {
        level = dungeonFloor;
        var str = '';
        for (var y = 0; y < mapHeight; y++) {
            for (var x = 0; x < mapWidth; x++) {
                str += level.map[x+','+y];
            }
            str += '\n';
        }
        console.log(str);
        updateMap();
        // Set the game state to play
        state = play;
    });
    socket.on('playerInfo', function(playerInfo) {
            playerName = playerInfo.name;
            uuid = playerInfo.saveID;
            document.getElementById('saveID').innerHTML = '<h1>' + uuid + '</h1>';
            setLocalStorageSaves(playerName, uuid);
    });
    socket.on('tileNames', function(tileNames) {
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                mapSprites[x+','+y] = placeTile(tileNames[x+','+y], x * tileSize, y * tileSize);
            }
        }
        app.stage.addChild(gameTiles);
        gameTiles.addChild(player);
    });
    socket.on('mapAlphaValues', function(mapAlpha) {
        for (var j = 0; j < mapHeight; j++) {
            for (var i = 0; i < mapWidth; i++) {
                var t = mapSprites[i+','+j];
                if (t) {
                    t.alpha = mapAlpha[i+','+j];
                    //t.alpha = 1;
                }
            }
        }
        document.getElementById('gameInfo').innerHTML = '<h1 style="float: left">Player Name: ' + playerName + '</h1><h1 style="float: right">Dungeon Level: ' + (level.levelNumber + 1) + '</h1>';
        renderer.render(app.stage);
    });
    socket.on('missing', function(err) {
        if (err === 'no dungeon') {
            if (uuid) {
                socket.emit('load game', uuid);
            } else {
                screenWithText('Error: Unable to continue with the game.');
            }
        } else if (err === 'load') {
            // Display error screen. Unable to load the game.
            screenWithText('Error: No save found with that UUID.');
            document.getElementById('addedControls').innerHTML = '';
            state = error;
        }
    });
    



    if (newGame) {
        socket.emit('new game', dialogValue);
    } else {

        socket.emit('load game', dialogValue);
    }
    // Start the game loop by adding the `gameLoop` function to
    // Pixi's `ticker` and providing it with a 'delta' argument
    app.ticker.add(delta=>gameLoop(delta));

    // Add the canvas that Pixi automatically created to the HTML document
    document.getElementById('gameScreen').appendChild(renderer.view);

    //screenWithText('Welcome to Labyrinthine Flight!', 'white');
    resize();

    // mapTiles is alias for all the texture atlas frame id textures
    // openDoorTexture is the texture swapped on the canvas when a player steps on a door tile
    var levelTilesPack = 'level' + (tileSets ? '' : '_new');
    var doorTilePack = 'assets/openDoor' + (tileSets ? '' : '_new') + '.png';
    mapTiles = resources[levelTilesPack].textures;
    openDoorTexture =  PIXI.Texture.fromImage(doorTilePack);
    // Add save button
    document.getElementById('addedControls').innerHTML += '<button class="button" onclick="save();">Save</button>';    
    // Resize the game window to the browser window so player does not need to scroll
    // to see the entire game board or find where the player is on the screen.
}
function gameLoop(delta) {
    // Update the current game state;
    // State does not exist until the level loads. Prevents the player taking control
    // before the game is ready.
    if (state)
        state(delta);
}
function play(delta) {
    // Wait for player to perform an action to end the player's turn
    // Right now the only action the player can make is move
    if (player.vx != 0 || player.vy != 0) {
        var player_x = getPlayerX();
        var player_y = getPlayerY();
        if (canWalk(player_x + player.vx, player_y + player.vy)) {
            
            player_x += player.vx;
            player_y += player.vy;

            player.x = player_x * tileSize;
            player.y = player_y * tileSize;
            // Player has moved. Update the server and move the player on the map.
            // FOV is still calculated server side so that will lag behind a little.
            socket.emit('move', [player_x, player_y]);
            if (level.map[player_x+','+player_y] === '+') {
                level.map[player_x+','+player_y] = '-';
                mapSprites[player_x+','+player_y].texture = openDoorTexture;
            }
        
            if (isMobile) {
                if ((level.map[player_x+','+player_y] === '<') || (level.map[player_x+','+player_y] === '>')) {
                    document.getElementById('stairsButton').style.visibility = "visible";
                } else {
                    document.getElementById('stairsButton').style.visibility = "hidden";
                }
            }

            // Renderer is updated when the game receives updated FOV from player
            // movement, but this is to update the player's client that the player
            // has moved, but server might take a second to update their FOV
            renderer.render(app.stage);
        }
        player.vx = 0;
        player.vy = 0;
    }
}
function canWalk(x, y) {
    if (x > mapWidth || y > mapHeight || x < 0 || y < 0) {
        return false;
    }

    switch (level.map[x+','+y]) {
        case ' ':
        case '#':
            return false;
        default:
            return true;
    }
}

// Handles drawing the dungeon level and deleting the old floor when the player changes floors
function updateMap() {
    clearApp();
    player = new Sprite(mapTiles['player']);
    player.position.set(tileSize * level.playerX,
                        tileSize * level.playerY);
    player.vx = 0;
    player.vy = 0;
    
    socket.emit('request', 'tileNames');

    socket.emit('request', 'mapAlphaValues');
    
    return true;
}
// Helper function to place tiles into the application using sprites from the spritesheet
function placeTile(tileName, x, y) {
    var tile = null;
    if (tileName == 'openDoor') {
        tile = new Sprite(openDoorTexture);
    } else if (tileName !== ' ') {
        tile = new Sprite(mapTiles[tileName]);
    }
    if (tile) {
        tile.position.set(x, y);
        tile.alpha = defaultAlpha;
        gameTiles.addChild(tile);
    }
    return tile;
}

// Draws text using the orange font that is with loveable rogue-like tiles.
// str is the string you want to draw and x and y are the starting positions for the text.
function drawText(str, start_x, start_y, color) {
    if (color == null) {
        if (tileSets) {
            color = 'orange';
        } else {
            color = 'blue';
        }
    }
    lines = str.split('\n');
    if (lines.length > 1) {
        lines.forEach(function(line, i) {
            // TODO: figure out why lineSpacing is shifting everything down or not being used at all
            // Replace the lineSpacing with a large int value (e.g. 800) to see shift effect
            drawText(line, start_x, (start_y + lineSpacing) + (i * fontHeight), color);
        });
    } else {
        font = PIXI.loader.resources['assets/' + color + '_font.json'].textures;
        let x = start_x, y = start_y;
        for (let i = 0, len = str.length; i < len; i++) {
            let character, charAt = str.charAt(i);
            if (charAt == '!') {
                character = '_exclamation';
            } else if (charAt == ':') {
                character = '_colon'; 
            } else if (charAt == '.') {
                character = '_period';
            } else if (charAt == charAt.toLowerCase()) {
                character = charAt + '_l';
            } else if (charAt == charAt.toUpperCase()) {
                character = charAt.toLowerCase() + '_u';
            }

            let sprite = new Sprite(font[character + '.png']);
            sprite.position.set(x, y);
            gameTiles.addChild(sprite);
            x += fontSize;
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
        'keydown', key.downHandler.bind(key), false
    );
    window.addEventListener(
        'keyup', key.upHandler.bind(key), false
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

// keyPressed reflects whether '.' or ',' was pressed by user
// '>' gets passed in for '.'; '<' gets passed in for ',';
// Don't need to have distinction, but most desktop roguelikes have the two seperate
// stairs buttons for up or down so I figured I should too for desktop controls.
// If no key is passed in, function just uses whatever tile at player's position
function useStairs(keyPressed) {
    // TODO: prevent player from moving after request for new floor is send. Maybe switch
    // to a loading screen until new floor arrives.
    if (!keyPressed) {
        keyPressed = level.map[getPlayerX()+','+getPlayerY()];
    }
    if (keyPressed ===  level.map[getPlayerX()+','+getPlayerY()]) {
        if (keyPressed === '>') {
            state = error;
            screenWithText('Loading...');
            socket.emit('request', 'floor down');
        } else if (keyPressed === '<') {
            state = error;
            screenWithText('Loading...');
            socket.emit('request', 'floor up');    
        }
    }
}

function save() {
    socket.emit('request', 'save');
}

function screenWithText(text, color) {
    clearApp();
    drawText(text, appWidth/2 - (text.length/2) * fontSize, (appHeight - fontHeight)/2, color);
    app.stage.addChild(gameTiles);
    renderer.render(app.stage);
}

function error(delta) {
}

function clearApp() {
    if (gameTiles) {
        gameTiles.destroy({children:true, texture:false, baseTexture:false});
    }
    
    gameTiles = new PIXI.Container();
    
    if (player)
        app.stage.removeChild(player);
    
}

function getLocalStorageSaves() {
    if (checkStorageCompatibility()) {
        var saves = {};
        for (var i = 1; i <= maxSaves; i++) {
            saves[i] = getLocalStorageSaveObject(i);
        }
        
        return saves;
    }
    return null;
}

function getLocalStorageSaveObject(slot) {
    var storage = localStorage.getItem('save'+slot);
    var saveObject = storage ? storage.split(':') : ['',''];
    return {name: saveObject[0], saveID: saveObject[1]};
}

function setLocalStorageSaves(name, saveID) {
    if (checkStorageCompatibility()) {
        // TODO: Currently whenever a player is loaded, the data for the play in the next slot will be cloned
        // Example: Saves named 1) Dennis 2) Griffin 3) James 4) Alex 5) Tracey. If Dennis is loaded, Griffin
        // will take up slots 2 and 3. If James is loaded, Alex would take up 4 and 5
        var saveInfo = name+':'+saveID;
        removeDuplicateStorageHelper(1, saveInfo);
        addSaveLocalStorage(maxSaves, saveInfo);
        return true;
    }
    return false;
}

// If the player is trying to add a duplicate save, set the save in storage to null,
// then add the save as if it were any other
// function to add saves should get rid of empty saves by shifting the save slot below up.


function addSaveLocalStorage(slot, saveInfo) {
    if (slot < 1)  return;
    if (slot === 1) { 
        localStorage.setItem('save1', saveInfo);
        return;
    }
    moveLocalStorageSave(slot-1, slot);
    addSaveLocalStorage(slot-1, saveInfo);
}

function removeDuplicateStorageHelper(slot, saveInfo, counter) {
    if (!counter) { counter=0; }
    if (slot > maxSaves) { return true; }
    if (counter > maxSaves-slot) { return true; }
    var saveData = localStorage.getItem('save'+slot);
    if (saveData == saveInfo || !saveData) {
        moveLocalStorageSave(slot+1,slot);
        return removeDuplicateStorageHelper(slot, saveInfo, counter+1);
    }
    return removeDuplicateStorageHelper(slot+1, saveInfo, 0);
}

function moveLocalStorageSave(from, to) {
    if (from < 1 || from > maxSaves || to < 1 || from > maxSaves) return false;
    localStorage.setItem('save'+to, localStorage.getItem('save'+from));
    localStorage.setItem('save'+from, '');
    return true;
}

function checkStorageCompatibility() {
    if (typeof(Storage) !== 'undefined') {
        return true;
    } else {
        return false;
    }
}
