/*
    CODE BLOCKS:
    BLOCK 1 - Variables and setup
    BLOCK 2 - Socket.IO Data Received Functions
    BLOCK 3 - Initialize Game Loop and Add Game Elements to Page
    BLOCK 4 - Menu Functions
    BLOCK 5 - Core Game Functions
    BLOCK 6 - Graphics Helper Functions
    BLOCK 7 - Misc. Unsorted Functions
*/


/******************* BLOCK 1 - Variables and setup *******************/

// Currently the tiles used are 64x64 pixels. Originally 16x16 but PIXI.js
// had issues with scaling sprites that small
const tileSize = 32;

// Width and height in pixels of the textures used for fonts
const fontSize =  24;
const fontHeight = 32;

// Should add spaces between lines being drawn to the screen using drawText that contains new line characters
// Currently does not work
const lineSpacing = 8;

// Used when first drawing tiles to the screen. Mostly for testing
const defaultAlpha = 1;


// Dungeon object being drawn
var level = {};


// Map sprites stores all the map sprites currently drawn on the screen
// Map alpha stores the opacity for each individual tile that handles the FOV effect
var mapSprites = [], mapAlpha = [], enemySprites = [], dungeonLevelSprites = [];


// Aliases
var Application = PIXI.Application,
    loader = new PIXI.Loader(),
    resources = loader.resources,
    Sprite = PIXI.Sprite;

// Number of tiles that make up the width and height of the Roguelike level
// Unsure what is optimal for performance but still creates a fun map to play
var mapWidth = 75,
    mapHeight = 40;

// Set PIXI.js application window to the width and height of the map * size of map textures in pixels.
var appWidth = mapWidth * tileSize, appHeight = mapHeight * tileSize;


// var renderer = PIXI.autoDetectRenderer(appWidth, appHeight, null);
var renderer = new PIXI.Renderer({ width: appWidth, height: appHeight, transparent: true});
// Info renderer should be able to fit 10 rows of text, but use drawText2X so only 5 rows fit.
// var infoRenderer = PIXI.autoDetectRenderer(appWidth, fontHeight * 10, null);
var infoRenderer = new PIXI.Renderer({ width: appWidth, height: appHeight, transparent: true});
// Message renderer will be using standard draw text so the height will determine how many
// messages can be displayed at once.

// Stores the game state used with PIXI.js
var state = null;

// Stores the PIXI loader for all the map textures, except for open doors which I
// patched in on the go and haven't had the chance to merge it into the spritesheet.
var mapTiles;

var characterSprite;

var characterTiles = {};

var selectedCharacterTileName = "1";

var selectedTileChanged = false;

var selectedTileX = 38*tileSize;
var selectedTileY = 7*tileSize

// PIXI can store sprites in a container. This allows all game sprites to be deleted
// and redrawn easily after a player changes floors
var gameTiles = new PIXI.Container();
var infoTiles = new PIXI.Container();

// When the game is paused, display an in-game menu to allow the user to switch graphics and other options
var gameMenuTiles = new PIXI.Container();


// Holds the socket that handles communication with the server from Socket.IO. Set in the setup function along with the socket's listening events.


let app = new Application({
    width: appWidth,
    height: appHeight,
    antialias: true,
    transparent: false,
    resolution: 1,
    sharedTicker: true
});

let gameInfoApp = new Application({
    width: appWidth,
    height: fontHeight * 10,
    antialias: true,
    transparent: false,
    resolution: 1,
    sharedTicker: true
});

var townSprite;


// Texture loading of font and map sprite sheets.
// This currently causes a large number of the warning "pixi.min.js:8 Texture added to the cache with an id 'text-id' that already had an entry"
// This is caused by me using the same texture names in the JSON files.
// Probably a new way I should be loading images in PIXI v5.
/*
loader.add('level', 'assets/level_creatures.json')
    .add('level_new', 'assets/level_creatures_new.json')
    .add(['assets/orange_font.json', 'assets/white_font.json', 'assets/grey_font.json', 'assets/blue_font.json', 'assets/red_font.json'])
    .load(setup);
*/
loader.add('level', 'assets/1bit2x-expanded.json')
    .add('characters', 'assets/df-font.json')
    .add(['assets/blue_font.json'])
    .add('town', 'assets/starting-town2x-transparent.png')
    .load(setup);


/**
 * setup
 * Called after PIXI loads assets. Once assets are loaded, begin adding on-screen controls and listening
 * for keyboard events. Where the player alert boxes are and the events for socket.io are defined.
 * @returns Does not return any value. End of the program until a socket is received from the server.
 */
function setup() {
    // If the site is being loaded from a mobile device, add touch screen arrow keys
    // and a button that appears when player is standing on stairs.
    // Buttons appear transparent so they do not obstruct the view of the game.
    // Buttons are shown when pressed to allow the player to see the boundary of the button
    // and give some feedback that input has been received.
    // If not mobile, listen for keyboard events.

    /******************* BLOCK 2 - Setting up tile selection and map maker *******************/
    characterSprites = resources['characters'].textures;


    for (var y = 0; y < 16; y++) {
        for (var x = 0; x < 16; x++) {
            var spriteID = (y*16) + x;
            characterTiles[spriteID] = placeTile(characterSprites, spriteID, x * tileSize, y * tileSize, infoTiles);
        }
    }

    infoTiles.children.forEach(c =>{
        c.buttonMode = true;
        c.interactive = true;
        c.on('mousedown', function() {
            selectedCharacterTileName = c._texture.textureCacheIds[0];
            selectedTileChanged = true;
        });
    });

    drawText("Selected Tile: ", 25*tileSize, 7*tileSize, "blue", infoTiles);
    var initialSelectedTile = placeTile(characterSprites, selectedCharacterTileName, selectedTileX, selectedTileY, infoTiles);
    
    gameInfoApp.stage.addChild(infoTiles);
    infoRenderer.render(gameInfoApp.stage);

    state = play;

    
    var townTexture = resources['town'].texture;

    townSprite = new Sprite(townTexture);

    townSprite.position.set(0, 0);
    townSprite.alpha = 1;
    
    gameTiles.addChild(townSprite);
    
    app.stage.addChild(gameTiles);

    renderer.render(app.stage);

    /******************* BLOCK 3 - Initialize Game Loop and Add Game Elements to Page *******************/
    // Start the game loop by adding the `gameLoop` function to
    // Pixi's `ticker` and providing it with a 'delta' argument
    app.ticker.add(delta=>gameLoop(delta));
    
    // Add the canvases that Pixi created to the HTML document
    // These three screens will handle rendering different parts of the game
    document.getElementById('gameScreen').appendChild(renderer.view);
    document.getElementById('gameInfo').appendChild(infoRenderer.view);


    //screenWithText('Welcome to Labyrinthine Flight!', 'white');
    resize();

    // mapTiles is alias for all the texture atlas frame id textures
    // openDoorTexture is the texture swapped on the canvas when a player steps on a door tile
    var levelTilesPack = 'level';
    // var doorTilePack = 'assets/openDoor' + (tileSets ? '' : '_new') + '.png';
    mapTiles = resources[levelTilesPack].textures;
}

/******************* BLOCK 4 - Menu Functions *******************/

/**
 * gameLoop
 * The main loop of the PIXI app. Runs the function assigned to the state variable,
 * e.g. play, with the delta time
 * @param delta
 */
function gameLoop(delta) {
    // Update the current game state;
    // State does not exist until the level loads. Prevents the player taking control
    // before the game is ready.
    if (state)
        state(delta);
}


/******************* BLOCK 5 - Core Game Functions *******************/

/**
 * play
 * The game state of the application. The function is called every frame, but game only
 * updates when the player moves to a valid space.
 * @param delta
 */
function play(delta) {
    if (selectedTileChanged) {
        console.log("Updating tile.");

        //gameInfoApp.stage.removeChildren();
        //gameInfoApp.addChild(infoTiles);
        infoTiles.removeChildAt(infoTiles.children.length-1);
        var newSelectedTile = placeTile(characterSprites, selectedCharacterTileName, selectedTileX, selectedTileY, infoTiles);
        infoRenderer.render(gameInfoApp.stage);

        selectedTileChanged = false;

        renderer.render(app.stage);
    }
}

/******************* BLOCK 6 - Graphics Helper Functions *******************/

/**
 * placeTile
 * Helper function to place tiles into the application using sprites from the spritesheet.
 * tileName corresponds to the sprite names in the level tile's JSON file in assets.
 * X and Y are the coordinates the tile is to be drawn upon the PIXI app.
 * @param tileName Name of the tile to be drawn. Can be found in the sprite sheets JSON
 * @param x The X position the tile will be drawn on the PIXI application window
 * @param y The Y position the tile will be drawn on the PIXI application window
 * @returns the placed tile so the tile can be assigned to a list to allow the alpha value to be updated.
 */
function placeTile(spriteSheet, tileName, x, y, appContainer) {
    var tile = null;
    if (tileName !== ' ') {
        tile = new Sprite(spriteSheet[tileName]);
    }
    if (tile) {
        tile.position.set(x, y);
        tile.alpha = 1;
        if (appContainer) {
            appContainer.addChild(tile);
        } else {
            gameTiles.addChild(tile);
        }
    }
    return tile;
}

/**
 * drawText
 * Draws text using the orange font that is with loveable rogue-like tiles.
 * str is the string you want to draw and x and y are the starting positions for the text.
 * Color is just limited to orange, white, grey, and blue right now. Based on the textures
 * proved by Loveable Rogue by Surt. Orange and blue are the only ones programmed currently
 * because that is all I needed for loading and error screens with the two graphic sets.
 * @param str The string to be drawn to the screen. Accepts new line characters.
 * @param start_x Starting x position of text based on the PIXI app coordinates
 * @param start_y Starting y position of text based on the PIXI app coordinates
 * @param color Selects the sprite sheet of the font to be used
 */
function drawText(str, start_x, start_y, color, appContainer) {
    color = 'blue';
    
    lines = str.split('\n');
    if (lines.length > 1) {
        lines.forEach(function(line, i) {
            // TODO: figure out why lineSpacing is shifting everything down or not being used at all
            // Replace the lineSpacing with a large int value (e.g. 800) to see shift effect
            drawText(line, start_x, (start_y + lineSpacing) + (i * fontHeight), color, appContainer);
        });
    } else {
        font = loader.resources['assets/' + color + '_font.json'].textures;
        let x = start_x, y = start_y;
        for (let i = 0, len = str.length; i < len; i++) {
            let character, charAt = str.charAt(i);
            if (!isNaN(charAt)) {
                character = charAt;
            } else if (charAt == '!') {
                character = '_exclamation';
            } else if (charAt == ':') {
                character = '_colon'; 
            } else if (charAt == '.') {
                character = '_period';
            } else if (charAt == '-') {
                character = '_hyphen';
            } else if (charAt == ',') {
                character = '_comma';
            } else if (charAt == charAt.toLowerCase()) {
                character = charAt + '_l';
            } else if (charAt == charAt.toUpperCase()) {
                character = charAt.toLowerCase() + '_u';
            }

            let sprite = new Sprite(font[character + '.png']);
            sprite.position.set(x, y);
            if (appContainer) {
                appContainer.addChild(sprite);
            } else {
                gameTiles.addChild(sprite);
            }
            x += fontSize;
        }
    }
    
}


/**
 * drawText2X
 * Draws text using the font that is included with loveable rogue-like tiles.
 * str is the string you want to draw and x and y are the starting positions for the text.
 * Color is just limited to orange, white, grey, and blue right now. Based on the textures
 * proved by Loveable Rogue by Surt. Orange and blue are the only ones programmed currently
 * because that is all I needed for loading and error screens with the two graphic sets.
 * @param str The string to be drawn to the screen. Accepts new line characters.
 * @param start_x Starting x position of text based on the PIXI app coordinates
 * @param start_y Starting y position of text based on the PIXI app coordinates
 * @param color Selects the sprite sheet of the font to be used
 * @returns Array of all the tiles drawn.
 */
function drawText2X(str, start_x, start_y, color, appContainer) {
    var textArray = [];
    
    color = 'blue';
    
    lines = str.split('\n');
    if (lines.length > 1) {
        lines.forEach(function(line, i) {
            // TODO: figure out why lineSpacing is shifting everything down or not being used at all
            // Replace the lineSpacing with a large int value (e.g. 800) to see shift effect
            drawText2X(line, start_x, (start_y + lineSpacing) + (i * fontHeight), color, appContainer);
        });
    } else {
        font = loader.resources['assets/' + color + '_font.json'].textures;
        let x = start_x, y = start_y;
        for (let i = 0, len = str.length; i < len; i++) {
            let character, charAt = str.charAt(i);
            if (!isNaN(charAt)) {
                character = charAt;
            } else if (charAt == '!') {
                character = '_exclamation';
            } else if (charAt == ':') {
                character = '_colon'; 
            } else if (charAt == '.') {
                character = '_period';
            } else if (charAt == '-') {
                character = '_hyphen';
            } else if (charAt == ',') {
                character = '_comma';
            } else if (charAt == charAt.toLowerCase()) {
                character = charAt + '_l';
            } else if (charAt == charAt.toUpperCase()) {
                character = charAt.toLowerCase() + '_u';
            }

            let sprite = new Sprite(font[character + '.png']);
            
            //sprite.scale.set(2);
            sprite.position.set(x, y);
            if (appContainer) {
                appContainer.addChild(sprite);
            } else {
                gameTiles.addChild(sprite);
            }
            textArray.push(sprite)
            x += fontSize; //*2;
        }
    }
    
    return textArray;
}

function updateMapFOV(alphaValues) {
    alphaToTintDict = {
        1: 0xFFFFFF,
        0.4: 0x333333
    }
    Object.keys(alphaValues).forEach(key => {
        // Key is in the format "x,y". e.g. "20,5"
        var t = mapSprites[key]
        if (t) {
            // TODO: Instead of setting the sprites alpha, set the sprites tint.
            // This will improve visual effect of items and enemy's remains on explored tiles
            if (alphaValues[key] != 0) {
                t.alpha = 1;
                t.tint = alphaToTintDict[alphaValues[key]];
            }
            else {
                t.alpha = 0;
            }
        }
    })
}

/******************* BLOCK 7 - Misc. Unsorted Functions *******************/

/*
 * addGameMessage
 * Adds a message to the message window which displays the last 10 messages
 */
function addGameMessage(messageText, color = 'grey') {
    if (!messageText || typeof messageText != "string") {
        console.log('Error: ' + messageText + ' is not a valid message to display.');
        return;
    }

    // Add message to global variable holding the current games message text.
    // Think about adding floor number to messages so player can see where they were when they received it.
    gameMessages.push({text: messageText, color: color});

    // Clear old messages from the screen.
    // TODO: Instead of removing all messages each time, move the old messages and only draw the new one.
    // Then delete the messages that occur off-screen.
    messageTiles = new PIXI.Container(); 
    gameMessagesApp.stage.removeChildren(); 

    var messageY = 0;

    var startIndex = 0;

    if (gameMessages.length > 10) {
        startIndex = gameMessages.length - 10;
    }

    for (var i = startIndex; i < gameMessages.length; i++) {
        drawText(gameMessages[i].text, 0, messageY, gameMessages[i].color, messageTiles);
        messageY += fontHeight;
    }

    gameMessagesApp.stage.addChild(messageTiles);
    messageRenderer.render(gameMessagesApp.stage);
}

function clearGameMessages() {
    gameMessages = [];
    gameMessagesApp.stage.removeChildren();
    messageRenderer.render(gameMessagesApp.stage);
}

function searchGameMessages(text) {
    for (var i = 0; i < gameMessages.length; i++) {
        if (text == gameMessages[i].text) {
            return true;
        }
    }

    return false;
}

function drawInvisibleButton(x, y, width, height, appContainer, pressedFunction, releasedFunction) {
    var newButton = new PIXI.Graphics();
    newButton.beginFill(0x404040);
    newButton.drawPolygon([
        x,y,
        x,y+height,
        x+width,y+height,
        x+width,y
    ]);
    newButton.endFill();
    newButton
        .on('pointerdown', (event) => { if(event.target) {if (pressedFunction) {pressedFunction()}}})
        .on('pointerup', (event) => { if(event.target) {if (releasedFunction) {releasedFunction()}}});
    newButton.alpha = 0;
    newButton.interactive = true;
    newButton.buttonMode = true;
    appContainer.addChild(newButton);
}

/**
 * resize
 * Code taken from stack overflow question that linked the js fiddle example.
 * http://jsfiddle.net/2wjw043f/
 * https://stackoverflow.com/questions/30554533/dynamically-resize-the-pixi-stage-and-its-contents-on-window-resize-and-window
 * This function allows the PIXI application window to resize to fit the browser window.
 */
function resize() {        
    var ratio = appWidth / appHeight;

    if (window.innerWidth / window.innerHeight >= ratio) {
        var w = window.innerHeight * ratio;
        var h = window.innerHeight;
    } else {
        var w = window.innerWidth;
        var h = window.innerWidth / ratio;
    }
    renderer.view.style.width = w + 'px';
    renderer.view.style.height = h + 'px';
    infoRenderer.view.style.width = w + 'px';

    
    window.onresize = function(event) {
        resize();
    };

}
/**
 * keyboard
 * Modified from code that appears in the PIXI tutorial.
 * https://github.com/kittykatattack/learningPixi#textureatlas
 * @param keyCode
 */
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

/**
 * screenWithText
 * Clears the screen and displays a static message in the middle of the screen. Used
 * for error and loading screens.
 * @param text Text that will appear in the middle of the PIXI application window 
 * @param color Specifies the sprite sheet to be used when drawing the text. Blue and orange only colors enabled right now
 */
function screenWithText(text, color) {
    clearApp();
    drawText(text, appWidth/2 - (text.length/2) * fontSize, (appHeight - fontHeight)/2, color);
    app.stage.addChild(gameTiles);
    renderer.render(app.stage);
    infoRenderer.render(gameInfoApp.stage);
    messageRenderer.render(gameMessagesApp.stage);
}

/**
 * error
 * Error game state. State used for loading and error screens to prevent player input at times when player
 * input would cause errors.
 * @param delta
 * @returns {undefined}
 */
function error(delta) {
}


/**
 * clearApp
 * Deletes all the tiles on the screen and removes the player sprite. This is used
 * whenever the map needs to update when the player changes levels or whenever a new
 * screen needs to be created.
 */
function clearApp() {
    if (gameTiles) {
        gameTiles.destroy({children:true, texture:false, baseTexture:false});
    }
    
    gameTiles = new PIXI.Container();
    gameInfoApp.stage.removeChildren();
    // Keep game messages between stages.
    // gameMessagesApp.stage.removeChildren();    
}


function printMapToConsole() {
    var str = '';
        for (var y = 0; y < mapHeight; y++) {
            for (var x = 0; x < mapWidth; x++) {
                str += level.map[x+','+y];
            }
            str += '\n';
        }
        console.log(str);
}