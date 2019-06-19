/*

    This is hacked together from Game.js to make creating the map data for the town easier since that is needed for
    collision, player field-of-view, and so many other things. The code and comments are not clean or the best, but
    it works for the purpose I needed it and just built it as quick as possible.



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

const asciiCharacters = {
    "0": "",
    "1": "☺",
    "2": "☻",
    "3": "♥",
    "4": "♦",
    "5": "♣",
    "6": "♠",
    "7": "•",
    "8": "◘",
    "9": "○",
    "10": "◙",
    "11": "♂",
    "12": "♀",
    "13": "♪",
    "14": "♫",
    "15": "☼",
    "16": "►",
    "17": "◄",
    "18": "↕",
    "19": "‼",
    "20": "¶",
    "21": "§",
    "22": "▬",
    "23": "↨",
    "24": "↑",
    "25": "↓",
    "26": "→",
    "27": "←",
    "28": "∟",
    "29": "↔",
    "30": "▲",
    "31": "▼",
    "32": " ",
    "33": "!",
    "34": "\"",
    "35": "#",
    "36": "$",
    "37": "%",
    "38": "&",
    "39": "'",
    "40": "(",
    "41": ")",
    "42": "*",
    "43": "+",
    "44": ",",
    "45": "-",
    "46": ".",
    "47": "/",
    "48": "0",
    "49": "1",
    "50": "2",
    "51": "3",
    "52": "4",
    "53": "5",
    "54": "6",
    "55": "7",
    "56": "8",
    "57": "9",
    "58": ":",
    "59": ";",
    "60": "<",
    "61": "=",
    "62": ">",
    "63": "?",
    "64": "@",
    "65": "A",
    "66": "B",
    "67": "C",
    "68": "D",
    "69": "E",
    "70": "F",
    "71": "G",
    "72": "H",
    "73": "I",
    "74": "J",
    "75": "K",
    "76": "L",
    "77": "M",
    "78": "N",
    "79": "O",
    "80": "P",
    "81": "Q",
    "82": "R",
    "83": "S",
    "84": "T",
    "85": "U",
    "86": "V",
    "87": "W",
    "88": "X",
    "89": "Y",
    "90": "Z",
    "91": "[",
    "92": "\\",
    "93": "]",
    "94": "^",
    "95": "_",
    "96": "`",
    "97": "a",
    "98": "b",
    "99": "c",
    "100": "d",
    "101": "e",
    "102": "f",
    "103": "g",
    "104": "h",
    "105": "i",
    "106": "j",
    "107": "k",
    "108": "l",
    "109": "m",
    "110": "n",
    "111": "o",
    "112": "p",
    "113": "q",
    "114": "r",
    "115": "s",
    "116": "t",
    "117": "u",
    "118": "v",
    "119": "w",
    "120": "x",
    "121": "y",
    "122": "z",
    "123": "{",
    "124": "|",
    "125": "}",
    "126": "~",
    "127": "⌂",
    "128": "Ç",
    "129": "ü",
    "130": "é",
    "131": "â",
    "132": "ä",
    "133": "à",
    "134": "å",
    "135": "ç",
    "136": "ê",
    "137": "ë",
    "138": "è",
    "139": "ï",
    "140": "î",
    "141": "ì",
    "142": "Ä",
    "143": "Å",
    "144": "É",
    "145": "æ",
    "146": "Æ",
    "147": "ô",
    "148": "ö",
    "149": "ò",
    "150": "û",
    "151": "ù",
    "152": "ÿ",
    "153": "Ö",
    "154": "Ü",
    "155": "¢",
    "156": "£",
    "157": "¥",
    "158": "₧",
    "159": "ƒ",
    "160": "á",
    "161": "í",
    "162": "ó",
    "163": "ú",
    "164": "ñ",
    "165": "Ñ",
    "166": "ª",
    "167": "º",
    "168": "¿",
    "169": "⌐",
    "170": "¬",
    "171": "½",
    "172": "¼",
    "173": "¡",
    "174": "«",
    "175": "»",
    "176": "░",
    "177": "▒",
    "178": "▓",
    "179": "│",
    "180": "┤",
    "181": "╡",
    "182": "╢",
    "183": "╖",
    "184": "╕",
    "185": "╣",
    "186": "║",
    "187": "╗",
    "188": "╝",
    "189": "╜",
    "190": "╛",
    "191": "┐",
    "192": "└",
    "193": "┴",
    "194": "┬",
    "195": "├",
    "196": "─",
    "197": "┼",
    "198": "╞",
    "199": "╟",
    "200": "╚",
    "201": "╔",
    "202": "╩",
    "203": "╦",
    "204": "╠",
    "205": "═",
    "206": "╬",
    "207": "╧",
    "208": "╨",
    "209": "╤",
    "210": "╥",
    "211": "╙",
    "212": "╘",
    "213": "╒",
    "214": "╓",
    "215": "╫",
    "216": "╪",
    "217": "┘",
    "218": "┌",
    "219": "█",
    "220": "▄",
    "221": "▌",
    "222": "▐",
    "223": "▀",
    "224": "α",
    "225": "ß",
    "226": "Γ",
    "227": "π",
    "228": "Σ",
    "229": "σ",
    "230": "µ",
    "231": "τ",
    "232": "Φ",
    "233": "Θ",
    "234": "Ω",
    "235": "δ",
    "236": "∞",
    "237": "φ",
    "238": "ε",
    "239": "∩",
    "240": "≡",
    "241": "±",
    "242": "≥",
    "243": "≤",
    "244": "⌠",
    "245": "⌡",
    "246": "÷",
    "247": "≈",
    "248": "°",
    "249": "∙",
    "250": "·",
    "251": "√",
    "252": "ⁿ",
    "253": "²",
    "254": "■",
    "255": " "
};


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

var createdAsciiMap = {};
var asciiSpriteMapTiles = {};

var selectedCharacterTileName = "1";

var selectedTileChanged = false;

var selectedTileX = 38*tileSize;
var selectedTileY = 7*tileSize

// PIXI can store sprites in a container. This allows all game sprites to be deleted
// and redrawn easily after a player changes floors
var gameTiles = new PIXI.Container();
var infoTiles = new PIXI.Container();

var asciiMapTiles = new PIXI.Container();

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

    drawText("Load", 25*tileSize, 9*tileSize, "blue", infoTiles);
    drawInvisibleButton(25*tileSize, 9*tileSize, 4*fontSize, fontHeight, infoTiles, function() {
        asciiMapTiles = new PIXI.Container();
        createdAsciiMap = getLocalStorageSave();
        for (var y = 0; y < mapHeight; y++) {
            for (var x = 0; x < mapWidth; x++) {
                if (createdAsciiMap[x+","+y]) {
                    var asciiNumber = Object.keys(asciiCharacters).find(key => asciiCharacters[key] === createdAsciiMap[x+","+y]);
                    asciiSpriteMapTiles[x+','+y] = placeTile(characterSprites, asciiNumber, x*tileSize, y*tileSize, asciiMapTiles)
                } else {
                   asciiSpriteMapTiles[x+","+y] = placeTile(characterSprites, '0', x*tileSize, y*tileSize, asciiMapTiles);
                }
            }
        }
        asciiMapTiles.children.forEach(c =>{
            c.buttonMode = true;
            c.interactive = true;
            c.on('mousedown', function() {
                var x = new Sprite(characterSprites[selectedCharacterTileName]);
                this.texture = x.texture;
                c.position.set(this.x, this.y)
                asciiSpriteMapTiles[this.x/tileSize+","+this.y/tileSize] = c;
                createdAsciiMap[this.x/tileSize+","+this.y/tileSize] = asciiCharacters[selectedCharacterTileName];
                renderer.render(app.stage);
            });
        });
        app.stage.removeChildAt(1);
        app.stage.addChild(asciiMapTiles);
        renderer.render(app.stage);
        console.log("Load successful.")
        
        // Update map sprites
        console.log(mapDataToJson());

    });

    drawText("Save", 35*tileSize, 9*tileSize, "blue", infoTiles);
    drawInvisibleButton(35*tileSize, 9*tileSize, 4*fontSize, fontHeight, infoTiles, function() {
        var jsonStringMapData = mapDataToJson();
        console.log("Saving.");
        console.log(jsonStringMapData);
        setSaveLocalStorage(jsonStringMapData);
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


    for (var y = 0; y < mapHeight; y++) {
        for (var x = 0; x < mapWidth; x++) {
            asciiSpriteMapTiles[x+","+y] = placeTile(characterSprites, '0', x*tileSize, y*tileSize, asciiMapTiles)
        }
    }
    
    asciiMapTiles.children.forEach(c =>{
        c.buttonMode = true;
        c.interactive = true;
        c.on('mousedown', function() {
            var x = new Sprite(characterSprites[selectedCharacterTileName]);
            this.texture = x.texture;
            c.position.set(this.x, this.y)
            asciiSpriteMapTiles[this.x/tileSize+","+this.y/tileSize] = c;
            createdAsciiMap[this.x/tileSize+","+this.y/tileSize] = asciiCharacters[selectedCharacterTileName];
            renderer.render(app.stage);
        });
    });
    gameTiles.addChild(asciiMapTiles);
    app.stage.addChild(gameTiles);
    app.stage.addChild(asciiMapTiles);

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
 * provided by Loveable Rogue by Surt. Orange and blue are the only ones programmed currently
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
 * provided by Loveable Rogue by Surt. Orange and blue are the only ones programmed currently
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


function mapDataToJson() {
    Object.keys(createdAsciiMap).forEach(key => {
        if (createdAsciiMap[key] === ' ' || createdAsciiMap[key] == "") {
            delete createdAsciiMap[key];
        }
    });

    return JSON.stringify(createdAsciiMap);

}


function getLocalStorageSave() {
    var storage = localStorage.getItem('map_make_save');
    if (storage) {
        return JSON.parse(storage);
    }
    
    return {};
}

function setSaveLocalStorage(saveInfo) {
    localStorage.setItem('map_make_save', saveInfo);
}

/**
 * checkStorageCompatibility
 * Checks to see if the client's browser supports using local storage. If not, player will
 * have to keep track of their saves themselves. If the browser does support local storage,
 * then players can have their browser store their recently made map.
 * @returns true if the client's browser supporses local storage, false if the browser does not.
 */
function checkStorageCompatibility() {
    if (typeof(Storage) !== 'undefined') {
        return true;
    } else {
        return false;
    }
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
