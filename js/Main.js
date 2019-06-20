/**
 * Main.js
 * 
 * This file will handle:
 *  1. Graphics with PIXI.js
 *  2. Socket.IO calls to the server
 *  3. Local storage
 *  4. User input
 *
 */

/* Sprite Constants */

// Size of sprites used on the game map
const tileSize = 32;

// Size of individual sprites of characters in color-font spritesheets.
const fontWidth = 24;
const fontHeight = 32;


/* Storage Constant */

// Max number of saves to be displayed in the client's game window. Fully customizable but setting this number too large
// can make the alert window be overwhelming for users.
const maxSaves = 5;


/* User-Input Variables */

// These variables allow players to hold down buttons to help navigate the map faster
var xDirectionHeld = 0, yDirectionHeld = 0;
var directionKeyHeld = '';
var timeoutFunction;


/* PIXI.js Aliases */

var Application = PIXI.Application,
    loader = new PIXI.Loader(),
    resources = loader.resources,
    Sprite = PIXI.Sprite;


/* Sprite Objects */

// Map sprites stores all the map sprites currently drawn on the screen
var mapSprites = [], enemySprites = [];

// PIXI can store sprites in a container. This allows all game sprites to be deleted
// and redrawn easily after a player changes floors
var gameTiles = new PIXI.Container();
var infoTiles = new PIXI.Container();

// Stores the PIXI loader for all the map textures, initiated in setup function.
var mapTiles;


/* Graphic Renderers */

var renderer = new PIXI.Renderer({ width: appWidth, height: appHeight, transparent: true});
var infoRenderer = new PIXI.Renderer({ width: appWidth, height: fontHeight * 10, transparent: true});


/* App Variables */

// This can equal a function that will be executed in the main application loop.
var state = null;

// Initial screen players will see when the enter a menu is the main game menu.
var menuScreen = 'main';

// Holds the socket that handles communication with the server from Socket.IO. Set in the setup function along with the socket's listening events.
var socket;

/* Graphics Setup */

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

// Texture loading of font and map sprite sheets. Calls setup function after textures are loaded.
// This currently causes a large number of the warning "pixi.min.js:8 Texture added to the cache with an id 'text-id' that already had an entry"
// This is caused by me using the same texture names in the JSON font files.
loader.add('kenney-1bit', 'assets/1bit2x-expanded.json')
    .add(['assets/orange_font.json', 'assets/white_font.json', 'assets/grey_font.json', 'assets/blue_font.json', 'assets/red_font.json'])
    .load(setup);

/**
 * setup
 * Called after PIXI loads assets.Begin adding functionality for user control.
 * Also where the listener events for socket.io are defined.
 * @returns null
 */
function setup() {
    // Mobile controls are possible but focusing on desktop gameplay first.
    //Capture the keyboard arrow keys
    let left = keyboard(37),
        up = keyboard(38),
        right = keyboard(39),
        down = keyboard(40),
        period = keyboard(190),
        comma = keyboard(188),
        esc = keyboard(27),
        space = keyboard(32);

    // Arrow keys all call directionPressed and directionReleased
    // Moves player and attacks
    left.press = () => {
        directionPressed('L');
    };
    left.release = () => {
        directionReleased();
    };

    up.press = () => {
        directionPressed('U');
    };
    up.release = () => {
        directionReleased();
    };

    right.press = () => {
        directionPressed('R');
    };
    right.release = () => {
        directionReleased();
    };

    down.press = () => {
        directionPressed('D');
    };
    down.release = () => {
        directionReleased();
    };

    // Keys that navigate stairs.
    period.press = () => {
        useStairs('>');
    };

    comma.press = () => {
        useStairs('<');
    };

    space.press = () => {
        // TODO: Make generic interaction key.
        useStairs();
    }


    /* Socket.IO Data Received Functions */
    // Sending data between server and client handled by Socket.io
    socket = io();
    
    // When the page receives these packets, update the webpage as needed
    socket.on('debug', function(message) {
        console.log(message);
    });
    // The dungeon object received from the server. Defined in the server's Rogue.js file
    // Dungeons are only received at the start of games and when player travels up or down a staircase.
    socket.on('dungeon', function(dungeonFloor) {
        /**
         * Clear the screen.
         * Save game data to LabyrinthineFlight object
         * Draw map/player/enemy/item sprites to the screen.
         * Sprites' alpha/tint reflect player's field-of-vision
         * Store the game's save id in local storage
         * Add game messages
         * Display player's info
         * Set application state to 'play'
         */
    });
    
    // Received after every time a player moves or interacts with object/character.
    socket.on('worldTurn', function(worldTurnData) {
        /**
         * Move and update enemies (health)
         * Update enemy sprites to new position and change tint if damaged
         * Update LabyrinthineFlight map data
         * Update map sprites (open doors)
         * Update player (field-of-vision, health)
         * Update map sprites' tint using player's field-of-vision
         */
    });

    // If the player disconnects from the server, the server will no
    // longer have the player's dungeon data loaded in memory.
    // In order to continue the game, the server needs to discreetly load the user's
    // game save to allow them to keep playing. Displays an error screen if there is
    // an issue and the server can't recover. Once the server finishes loading the game,
    // the user will snap to the location last saved on the server, but then will be
    // able to continue as normal.
    // Loading the game currently causes all previous floors to lose their map data
    // so exploration will be reset and doors will be closed for all floors except the
    // current one.
    socket.on('missing', function(err) {
        /**
         * If server sends error 'no dungeon', emit 'load game' with the game id stored in local variable.
         * If there is save id stored in the local variable, display an error screen.
         * 
         * If the server doesn't have a game with the save id stored locally, server will return the error 'load'
         * Display a different error screen.
         */
    });
    

    /* Initialize Game Loop and Add Graphic Elements to Page */

    // Start the game loop by adding the `gameLoop` function to
    // PIXI.js `ticker` and providing it with a 'delta' argument
    app.ticker.add(delta=>gameLoop(delta));
    
    // Add the canvases that PIXI.js creates to the HTML page
    // These screens will handle rendering different parts of the game
    document.getElementById('gameScreen').appendChild(renderer.view);
    document.getElementById('gameInfo').appendChild(infoRenderer.view);
    
    // Resize the game window to the browser window so player does not need to scroll
    // to see the entire game board or find where the player is on the screen.
    resize();

    // levelTilesPack allows for switching between different graphics.
    // Only supporting one for the time being.
    var levelTilesPack = 'kenney-1bit';
    
    // mapTiles is alias for all the texture atlas frame id textures
    mapTiles = resources[levelTilesPack].textures;
    
    /**
     * Direct the application to go to the main menu
     * From the main menu players can select:
     *  1. New Game: Quickly start a new game with a new dungeon
     *  2. Load Game: Return to a previous game that is in browser's local storage
    */
}

/**
 * gameLoop
 * The main loop of the PIXI app. Runs the function assigned to the state variable,
 * e.g. play, with the delta time
 * @param delta
 */
function gameLoop(delta) {
    // State should not exist until the level or menu is loaded.
    // Prevents the player taking control before the game is ready.
    if (state)
        state(delta);
}

// Function that is called to draw menu text/sprites
function updateMenu() {
    /**
     * Adds menu text for main or load menu
     * Creates cursor to select options
     * Adds option for user to load game from save id not stored in local storage
     */
}

// Main state loop when a user is on the menu before a game begins.
function menu(delta) {
    /**
     * Move cursor when user presses arrow keys
     * If user selects 'new game', emit 'new game' to server to begin process of creating a new game
     * If user selects 'load game', update menu to display previous games
     */
}

/**
 * play
 * Main state loop when game is being played.
 * The function is called every frame, but should only updates when the user provides input.
 * @param delta
 */
function play(delta) {
    /**
     * 1. Wait for player to perform valid action (move, attack, interact)
     * 2. When a player presses move key:
     *      a. Check if tile is walkable. Move player if empty.
     *      b. Update tile player moved to if needed (open door)
     *      c. Attack if an enemy occupies tile with the player's equipped weapon
     * 3. Interaction key is pressed:
     *      a. Check 8 tiles around player and tile player is on.
     *      b. If only 1 interactive object, do default action on object (talk, pickup, open, read)
     *      c. If multiple objects, prompt user to pick.
     * 4. Update player and map sprites if needed
     * 5. Update server when player performs valid option
     *      a. Retrieves data from server for interaction (if not stored locally)
     *      b. End's player turn if player moved or attacked and will have server return enemy movements and other updates. 
     */
}