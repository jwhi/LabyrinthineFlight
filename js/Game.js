// Currently the tiles used are 64x64 pixels. Originally 16x16 but PIXI.js
// had issues with scaling sprites that small
const tileSize = 64;

// Width and height in pixels of the textures used for fonts
const fontSize =  24;
const fontHeight = 32;

// Should add spaces between lines being drawn to the screen using drawText that contains new line characters
// Currently does not work
const lineSpacing = 8;

// Max number of saves to be displayed in the client's game window. Fully customizable but setting this number too large
// can make the alert window be overwhelming for users.
const maxSaves = 5;

// Used when first drawing tiles to the screen. Mostly for testing
const defaultAlpha = 1;

// Default player name to be displayed in the 'New Game' alert window.
const defaultName = 'Prisoner';

// Dungeon object received from the server.
var level;

// Variable that determines which graphics the player wants to use. True for Loveable Rogue by Surt. Cancel to use Tiny 16 by Lanea Zimmerman
var tileSets = false;

// Stores the player's name after a new game is started or a game is loaded from the server
var playerName = '';
var playerTitle = '';

// Stores the game's save ID. Received from the server after a new game begins or a game is loaded from the server.
var uuid;

// Initializes game messages array that will give descriptive text for the game world and player's actions.
// Each game message is an object with text and color attributes.
var gameMessages = [];


// Map sprites stores all the map sprites currently drawn on the screen
// Map alpha stores the opacity for each individual tile that handles the FOV effect
var mapSprites = [], mapAlpha = [], enemySprites = [];


// Aliases
var Application = PIXI.Application,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    Sprite = PIXI.Sprite;

// Number of tiles that make up the width and height of the Roguelike level
// Unsure what is optimal for performance but still creates a fun map to play
var mapWidth = 35,
    mapHeight = 35;

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
// Info renderer should be able to fit 10 rows of text, but use drawText2X so only 5 rows fit.
var infoRenderer = PIXI.autoDetectRenderer(appWidth, fontHeight * 10, null);
// Message renderer will be using standard draw text so the height will determine how many
// messages can be displayed at once.
/*
 * TODO: Need to find a good position for these messages. Original idea was to have the messages
 * to the right of game screen on desktop and under game info on mobile. That will make the resize
 * function and CSS messy, so for now the messages will be under game info for everything and desktop
 * users will have to scroll down.
 */ 
var messageRenderer = PIXI.autoDetectRenderer(appWidth, fontHeight * 20, null)

// Stores the game state used with PIXI.js
var state = null;

// Stores the player texture and can be used to make sure the map stored in rogue
// has the same player position that is displayed on the screen.
var player;

var menuScreen = 'main';

// These variables allow players to hold down buttons to help navigate the map faster
var xDirectionHeld = 0, yDirectionHeld = 0;
var directionKeyHeld = '';
var timeoutFunction;

// Stores the PIXI loader for all the map textures, except for open doors which I
// patched in on the go and haven't had the chance to merge it into the spritesheet.
var mapTiles, openDoorTexture;

// PIXI can store sprites in a container. This allows all game sprites to be deleted
// and redrawn easily after a player changes floors
var gameTiles = new PIXI.Container();
var infoTiles = new PIXI.Container();
var messageTiles = new PIXI.Container();

// When the game is paused, display an in-game menu to allow the user to switch graphics and other options
var gameMenuTiles = new PIXI.Container();


// Holds the socket that handles communication with the server from Socket.IO. Set in the setup function along with the socket's listening events.
var socket;

let app = new Application({
    width: appWidth,
    height: appHeight,
    antialias: true,
    transparent: false,
    resolution: 1
});

let gameInfoApp = new Application({
    width: appWidth,
    height: fontHeight * 10,
    antialias: true,
    transparent: false,
    resolution: 1
});

let gameMessagesApp = new Application({
    width: appWidth,
    height: fontHeight * 20,
    antialias: true,
    transparent: false,
    resolution: 1
});



// Texture loading of font and map sprite sheets.
PIXI.loader
    .add('level', 'assets/level_creatures.json')
    .add('level_new', 'assets/level_creatures_new.json')
    .add(['assets/orange_font.json', 'assets/white_font.json', 'assets/grey_font.json', 'assets/blue_font.json', 'assets/red_font.json'])
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

    } else {
        //Capture the keyboard arrow keys
        let left = keyboard(37),
            up = keyboard(38),
            right = keyboard(39),
            down = keyboard(40),
            period = keyboard(190),
            comma = keyboard(188),
            esc = keyboard(27),
            space = keyboard(32);

        //Left arrow key `press` method
        left.press = () => {
            directionPressed('L');
        };

        //Left arrow key `release` method
        left.release = () => {
            directionReleased();
        };

        //Up
        up.press = () => {
            directionPressed('U');
        };
        up.release = () => {
            directionReleased();
        };

        //Right
        right.press = () => {
            directionPressed('R');
        };
        right.release = () => {
            directionReleased();
        };

        //Down
        down.press = () => {
            directionPressed('D');
        };
        down.release = () => {
            directionReleased();
        };

        period.press = () => {
            useStairs('>');
        };

        comma.press = () => {
            useStairs('<');
        };

        space.press = () => {
            useStairs();
        }

        esc.press = () => {
            toggleMenu();
        }
    }

    socket = io();
    // Sockets handled by Socket.io
    // When the page receives these packets, update the webpage as needed
    socket.on('debug', function(message) {
        console.log(message);
    });
    // The dungeon object received from the server. Defined in the server's Rogue.js file
    // Dungeons are only received at the start of games and when player travels up or down a staircase.
    // Prints the maps layout to debug console for testing. Calls updateMap to to prepare drawing the map tiles.
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
    });
    // Player info contains the player's name and the game's save ID. Received once a new game begins or a player
    // loads a game. Display this information on the web page and save to the browser's local storage to allow the
    // user to load this game again in the future.
    socket.on('playerInfo', function(playerInfo) {
        playerName = playerInfo.name;
        playerTitle = playerInfo.title;
        uuid = playerInfo.saveID;
        document.getElementById('saveID').value = uuid;
        setLocalStorageSaves(playerName, uuid);
        
        if (searchGameMessages("Press right to select menu option.")) {
            clearGameMessages();
            addGameMessage('Welcome to Labyrinthine Flight!');
            addGameMessage(playerName + ', you awake in a dungeon confused to how you got here.');
            if (isMobile) {
                addGameMessage("Use virtual arrow keys to navigate the dungeon.");
                addGameMessage("Use Stairs button will appear next to player information when on a staircase.");
            } else {
                addGameMessage("Arrow keys to navigate the dungeon. Use  .  and  ,  to navigate stairs.");
            }
        }
    });
    // Tile names are determined by the server since the function required function calls that could only be done by the server.
    // Receieved whenever the player starts a new game or uses stairs. Draw tiles once receieved and set the state to play after
    // all tiles are drawn to allow the user to start moving the player.
    socket.on('tileNames', function(tileNames) {
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                mapSprites[x+','+y] = placeTile(tileNames[x+','+y], x * tileSize, y * tileSize);
            }
        }
        if (level) {
            for (let i = 0; i < level.enemies.length; i++) {
                currentEnemy = level.enemies[i];
                if (currentEnemy.health > 0) {
                    enemySprites[i] = placeTile(currentEnemy.name, currentEnemy.x * tileSize, currentEnemy.y * tileSize);
                } else {
                    enemySprites[i] = placeTile('corpse', currentEnemy.x * tileSize, currentEnemy.y * tileSize);
                }
            }
        }

        app.stage.addChild(gameTiles);
        gameTiles.addChild(player);
        //drawText(playerName + ' ' + playerTitle, 0, 0);
        //var str = 'Dungeon Level: ' + (level.levelNumber + 1);
        //drawText(str, 0, appHeight - fontSize*2);
        state = play;
    });
    // Server handles are the FOV calculation. Received after every time a player makes a successful movement on the map.
    // Server lag will lead the FOV not following the player and trailing behind.
    socket.on('worldTurn', function(worldTurnData) {
        // Set the player's location to what the world has set
        if (worldTurnData.player) {
            player.position.set(tileSize * worldTurnData.player.x,
                tileSize * worldTurnData.player.y);
            player.vx = 0;
            player.vy = 0;    
        }
        if(worldTurnData.fov) {
            for (var j = 0; j < mapHeight; j++) {
                for (var i = 0; i < mapWidth; i++) {
                    var t = mapSprites[i+','+j];
                    if (t) {
                        t.alpha = worldTurnData.fov[i+','+j];
                        // TODO: Instead of setting the sprites alpha, set the sprites tint.
                        // This will improv visual effect of items and enemy's remains on explored tiles
                    }
                }
            }
        }
        if (worldTurnData.enemies && level) {
            level.enemies = worldTurnData.enemies;
            for (let i = 0; i < level.enemies.length; i++) {
                currentEnemy = level.enemies[i];
                if (enemySprites[i].texture != mapTiles['corpse']) {
                        enemySprites[i].position.set(currentEnemy.x * tileSize, currentEnemy.y * tileSize);
                    if (currentEnemy.health <= 0) {
                        enemySprites[i].texture = mapTiles['corpse'];
                    }
                    if (mapSprites[currentEnemy.x+','+currentEnemy.y].alpha == 1) {
                        enemySprites[i].alpha = 1;
                    } else {
                        enemySprites[i].alpha = 0;
                    }
                } else {
                    enemySprites[i].alpha = mapSprites[currentEnemy.x+','+currentEnemy.y].alpha;
                }
            }
        }
        if (worldTurnData.map && level) {
            Object.keys(worldTurnData.map).forEach(function(key) {
                level.map[key] = worldTurnData.map[key];
                if (level.map[key] == '-') {
                    mapSprites[key].texture = openDoorTexture;
                }
            });
        }
        if (worldTurnData.player && level) {
            gameInfoApp.stage.removeChildren();
            infoTiles = new PIXI.Container(); 
            drawText2X(worldTurnData.player.name + ' ' + worldTurnData.player.title, 0, 0, tileSets ? 'orange' : 'blue', infoTiles);
            var str = 'Dungeon Level: ' + (level.levelNumber + 1);
            drawText2X(str, 0, 2*fontHeight, 'grey', infoTiles);
            drawText2X('HP: ', 0, 2*fontHeight*2, 'grey', infoTiles);
            drawText2X(worldTurnData.player.health.toString(), 2*fontSize*4, 2*fontHeight*2, 'white', infoTiles);
            drawText2X('ATK: ', 2*fontSize*8, 2*fontHeight*2, 'grey', infoTiles);
            drawText2X(worldTurnData.player.attack[0] + '-' + worldTurnData.player.attack[1], 2*13*fontSize, 2*fontHeight*2, 'white', infoTiles);
            drawText2X('Save', 0, 2*fontHeight*3, tileSets ? 'orange' : 'blue', infoTiles);
            drawInvisibleButton(0,2*fontHeight*3, 2*fontSize*4, 2*fontHeight, infoTiles, save);
            
            var playerTile = level.map[getPlayerX()+','+getPlayerY()];
            if ((playerTile === '<') || (playerTile === '>')) {
                var x = 2*fontSize*8;
                var y = 2*fontHeight*3;
                drawText2X('Use Stairs', x, y, tileSets ? 'orange' : 'blue', infoTiles);
                drawInvisibleButton(x,y, 2*fontSize*10, 2*fontHeight, infoTiles, useStairs);
            }
            if (uuid) {
                drawText(uuid, 0, 2*fontHeight*4.25, tileSets ? 'orange' : 'blue', infoTiles);
                drawInvisibleButton(0, 2*fontHeight*4.25, uuid.length*fontSize, fontHeight, infoTiles, function() {
                    if (isMobile) {
                        prompt("Here is your game's save id! You can use this id to load your game from any browser.", uuid);
                    } else {
                        /* Get the text field */
                        var copyText = document.getElementById("saveID");

                        /* Select the text field */
                        copyText.select();

                        /* Copy the text inside the text field */
                        document.execCommand("Copy");

                        /* Alert the copied text */
                        alert("Copied your game's save id! You can use this id to load your game from any browser.");
                    }
                });
            }
            gameInfoApp.stage.addChild(infoTiles);
            infoRenderer.render(gameInfoApp.stage)
        }
        renderer.render(app.stage);
    });
    // If the player disconnects from the server, happens often if playing on a phone and the user locks their screen, the server will no
    // longer have the player's dungeon data loaded in memory. In order to continue the game, the server needs to discretly load the user's
    // data to allow them to keep playing. Displays an error screen if there is an issue if the server can't recover. If the server can recover,
    // the user will snap to the location last saved on the server, but then will be able to continue as normal for the most part. Loading the game
    // causes all previous floors to lose their map data so exploration will be reset and doors will be closed.
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
    

    // Start the game loop by adding the `gameLoop` function to
    // Pixi's `ticker` and providing it with a 'delta' argument
    app.ticker.add(delta=>gameLoop(delta));

    // Add the canvases that Pixi created to the HTML document
    // These three screens will handle rendering different parts of the game
    document.getElementById('gameScreen').appendChild(renderer.view);
    document.getElementById('gameInfo').appendChild(infoRenderer.view);
    document.getElementById('gameMessages').appendChild(messageRenderer.view);

    //screenWithText('Welcome to Labyrinthine Flight!', 'white');
    resize();

    // mapTiles is alias for all the texture atlas frame id textures
    // openDoorTexture is the texture swapped on the canvas when a player steps on a door tile
    var levelTilesPack = 'level' + (tileSets ? '' : '_new');
    var doorTilePack = 'assets/openDoor' + (tileSets ? '' : '_new') + '.png';
    mapTiles = resources[levelTilesPack].textures;
    openDoorTexture =  PIXI.Texture.fromImage(doorTilePack);
    // Resize the game window to the browser window so player does not need to scroll
    // to see the entire game board or find where the player is on the screen.
    if (isMobile) {
        addGameMessage("Use virtual arrow keys to navigate the menu.");
    } else {
        addGameMessage("Use arrow keys to navigate menu.");
    }
    addGameMessage("Press right to select menu option.");
    updateMenu();
    state = menu;
}

function switchGraphics() {
    tileSets = !tileSets;
    var levelTilesPack = 'level' + (tileSets ? '' : '_new');
    var doorTilePack = 'assets/openDoor' + (tileSets ? '' : '_new') + '.png';
    mapTiles = resources[levelTilesPack].textures;
    openDoorTexture =  PIXI.Texture.fromImage(doorTilePack);
}

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

function updateMenu() {
    if (!menuScreen || menuScreen == 'main') {
        clearApp();
        var text = 'Labyrinthine Flight'
        var textXLocation = (appWidth - (text.length * 2*fontSize))/2;
        drawText2X(text, textXLocation, (appHeight/2) - (fontHeight*18), 'blue');

        menuInput = new Sprite(mapTiles['player']);
        var textYLocation =  (appHeight/2) - (fontHeight*14 - 32) ;
        menuInput.position.set(textXLocation, textYLocation);
        menuInput.vx = 0;
        menuInput.vy = 0;
        gameTiles.addChild(menuInput);
        textXLocation += tileSize;
        drawText2X('New Game', textXLocation, textYLocation, 'orange');
        textYLocation += 2*fontHeight*1.5;
        drawText2X('Load Game', textXLocation, textYLocation, 'orange');
        textYLocation += 2*fontHeight*1.5;
        drawText2X('Graphics', textXLocation, textYLocation, 'orange');
    } else if (menuScreen == 'load') {
        clearApp();
        var text = 'Load Game'
        var textXLocation = (appWidth/2 - (text.length * 2*fontSize)/2);
        drawText2X(text, textXLocation, (appHeight/2) - (fontHeight*18), 'blue');
        menuInput = new Sprite(mapTiles['player']);
        menuInput.vx = 0;
        menuInput.vy = 0;
        textXLocation = (appWidth/2 - (text.length * 2*fontSize))/2;
        var textYLocation =  (appHeight/2) - (fontHeight*16 - 32) ;
        menuInput.position.set(textXLocation, textYLocation + 2*fontHeight*1.5);
        textXLocation += tileSize;
        var saves = getLocalStorageSaves();
        
        for (var i = 1; i <= maxSaves; i++) {
            textYLocation += 2*fontHeight*1.5;
            if (saves[i].saveID) {
                drawText2X(saves[i].name + ' : ', textXLocation, textYLocation, 'orange');
                drawText(saves[i].saveID, textXLocation + (saves[i].name.length+4)*fontSize*2, textYLocation + fontHeight/2, 'orange');
        
            } else {
                drawText2X('No data in save slot ' + i, textXLocation, textYLocation, 'orange');
            
            }
        }
        textYLocation += 2*fontHeight*1.5;
        drawText2X('Open Load Dialog', textXLocation, textYLocation, 'orange');
        textYLocation += 2*fontHeight*1.5;
        drawText2X('Back', textXLocation, textYLocation, 'orange');
        
        gameTiles.addChild(menuInput);
    }
    
    app.stage.addChild(gameTiles);
    renderer.render(app.stage);
}

function menu(delta) {
    if (menuInput.vx != 0 || menuInput.vy != 0) {
        if (menuScreen == 'main') {
            if (menuInput.vy > 0) {
                menuInput.y += 2*fontHeight*1.5;
                if (menuInput.y > 896) {
                    menuInput.y = 704;
                }
            } else if(menuInput.vy < 0) {
                menuInput.y -= 2*fontHeight*1.5;
                if (menuInput.y < 704) {
                    menuInput.y = 896;
                }
            }

            if (menuInput.vx > 0) {
                switch(menuInput.y) {
                    case 704:
                        // New Game
                        socket.emit('new game', defaultName);
                        break;
                    case 800:
                        // Load Game
                        menuScreen = 'load';
                        updateMenu();
                        break;
                    case 896:
                        // Graphics
                        switchGraphics();
                        updateMenu();
                        break;
                    case 832:
                        // Help
                        break;
                    default:
                        console.log(menuInput.y);
                        break;
                }
            } else if (menuInput.vx < 0) {
                console.log(menuInput.y);
            }
        } else if (menuScreen == 'load') {
            var saves = getLocalStorageSaves();
            if (menuInput.vy > 0) {
                menuInput.y += 2*fontHeight*1.5;
                if (menuInput.y > 1312) {
                    menuInput.y = 736;
                }
            } else if(menuInput.vy < 0) {
                menuInput.y -= 2*fontHeight*1.5;
                if (menuInput.y < 736) {
                    menuInput.y = 1312;
                }
            }
            
            if (menuInput.vx < 0) {
                menuScreen = 'main';
                updateMenu();
            } else if (menuInput.vx > 0) {
                switch(menuInput.y) {
                    // TODO: Can be reduced. Instead of doing things this way, going to create menu objects
                    // Also instead of checking each y in a switch, will just use Object.keys(saves).length+1)*64
                    // to find which menu object the user is looking at.
                    case 736:
                        // Save 1
                        if (saves[1].saveID) {
                            socket.emit('load game', saves[1].saveID);
                        }
                        break;
                    case 832:
                        // Save 2
                        if (saves[2].saveID) {
                            socket.emit('load game', saves[2].saveID);
                        }
                        break;
                    case 928:
                        // Save 3
                        if (saves[3].saveID) {
                            socket.emit('load game', saves[3].saveID);
                        }
                        break;
                    case 1024:
                        // Save 4
                        if (saves[4].saveID) {
                            socket.emit('load game', saves[4].saveID);
                        }
                        break;
                    case 1120:
                        // Save 5
                        if (saves[5].saveID) {
                            socket.emit('load game', saves[5].saveID);
                        }
                        break;
                    case 1216:
                        // Load from Dialog
                        var uuid = prompt("Enter the game's uuid: ", '');
                        socket.emit('load game', uuid);
                        break;
                    case 1312:
                        // Back
                        menuScreen = 'main';
                        updateMenu();
                        break;
                    default:
                        console.log(menuInput.y);
                        break;
                }
            }
        }
        menuInput.vx = 0;
        menuInput.vy = 0;
        renderer.render(app.stage);
    }
}

/**
 * play
 * The game state of the application. The function is called every frame, but game only
 * updates when the player moves to a valid space.
 * @param delta
 */
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
            // If a player attacks an enemy, disable player movement until client receive world's turn from server
            socket.emit('playerTurn', {x: player_x, y: player_y});
            if (level.map[player_x+','+player_y] === '+') {
                level.map[player_x+','+player_y] = '-';
                mapSprites[player_x+','+player_y].texture = openDoorTexture;
            }
        
            // Renderer is updated when the game receives updated FOV from player
            // movement, but this is to update the player's client that the player
            // has moved, but server might take a second to update their FOV
            renderer.render(app.stage);
        }

        // TODO: Clean the held down key checks.
        if (directionKeyHeld) {
            xDirectionHeld = player.vx;
            yDirectionHeld = player.vy;
            timeoutFunction = setTimeout(function () {
                player.vx = xDirectionHeld;
                player.vy = yDirectionHeld; 
                xDirectionHeld = 0;
                yDirectionHeld = 0;
            
            }, 170);
        }
        player.vx = 0;
        player.vy = 0;
    }
}

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

/**
 * updateMap
 * Clears the screen and resets the player. Moves the player to the new floor's location.
 * Sends requests to the server to get the tile names and alpha values for the new floor.
 */
function updateMap() {
    clearApp();
    player = new Sprite(mapTiles['player']);
    player.position.set(tileSize * level.playerX,
                        tileSize * level.playerY);
    player.vx = 0;
    player.vy = 0;
    
    socket.emit('request', 'tileNames');
    socket.emit('playerTurn', {x: getPlayerX(), y: getPlayerY()});
    return true;
}

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
function placeTile(tileName, x, y, appContainer) {
    var tile = null;
    if (tileName == 'openDoor') {
        tile = new Sprite(openDoorTexture);
    } else if (tileName !== ' ') {
        tile = new Sprite(mapTiles[tileName]);
    }
    if (tile) {
        tile.position.set(x, y);
        tile.alpha = 0;
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
            drawText(line, start_x, (start_y + lineSpacing) + (i * fontHeight), color, appContainer);
        });
    } else {
        font = PIXI.loader.resources['assets/' + color + '_font.json'].textures;
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
 */
function drawText2X(str, start_x, start_y, color, appContainer) {
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
            drawText(line, start_x, (start_y + lineSpacing) + (i * 2 * fontHeight), color, appContainer);
        });
    } else {
        font = PIXI.loader.resources['assets/' + color + '_font.json'].textures;
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
            
            sprite.scale.set(2);
            sprite.position.set(x, y);
            if (appContainer) {
                appContainer.addChild(sprite);
            } else {
                gameTiles.addChild(sprite);
            }
            x += fontSize*2;
        }
    }
    
}

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
 * getPlayerX
 * Returns the player's X value in relation to the map instead of pixels from the right
 * This gives the player's X position in terms the rogue class can understand
 * @returns The player's X position on the dungeon map. Returns -1 if there is no player defined.
 */
function getPlayerX() {
    if (player) {
        return player.x / tileSize;
    }
    else
        return -1;
}

/**
 * getPlayerY
 * Returns the player's Y value in relation to the map instead of pixels from the top
 * This gives the player's Y position in terms the rogue class can understand
 * @returns The player's Y position on the dungeon map. Returns -1 if there is no player defined.
 */
function getPlayerY() {
    if (player)
        return player.y / tileSize;
    else
        return -1;
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
    renderer.view.style.width = w*((isMobile) ? 1 : 0.8) + 'px';
    renderer.view.style.height = h*((isMobile) ? 1 : 0.8) + 'px';
    infoRenderer.view.style.width = w + 'px';
    messageRenderer.view.style.width = w + 'px';

    
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
 * onButtonDown
 * When touch screen button is pressed, set the opacity of the button to 40% to give
 * feedback to the user that they are pressing one of the navigation keys and 
 * moving the player in a direction
 * this is tied to the button that was pressed that initiated the function call
 */
function onButtonDown() {
    this.alpha = 0.4;
    switch (this) {
        case buttonUp:
            directionPressed('U');
            break;
        case buttonDown:
        directionPressed('D');
            break;
        case buttonRight:
        directionPressed('R');
            break;
        case buttonLeft:
            directionPressed('L');
            break;
        default:
            directionReleased();
    }
}
/**
 * onButtonUp
 * When touch screen button is released, set opacity of that
 * button to 0
 */
function onButtonUp() {
    this.alpha = 0;
    directionReleased();
    renderer.render(app.stage);
}

// keyPressed reflects whether '.' or ',' was pressed by user
// '>' gets passed in for '.'; '<' gets passed in for ',';
// Don't need to have distinction, but most desktop roguelikes have the two seperate
// stairs buttons for up or down so I figured I should too for desktop controls.
// If no key is passed in, function just uses whatever tile at player's position
/**
 * useStairs
 * Called whenever the user presses the 'Use Stairs' button or pressed the button
 * on the keyboard that corresponds to the stairs up or stairs down. Function will
 * request the floor above or below from the sever based on the tile the player is
 * standing on. While waiting for the server to respond, a 'Loading' screen will be
 * loaded. keyPressed should be '>' if a '.' was pressed and a '<' if a ',' is pressed.
 * @param keyPressed The key on the keyboard the use pressed. Null when use presses the button.
 */
function useStairs(keyPressed) {
    // TODO: prevent player from moving after request for new floor is send. Maybe switch
    // to a loading screen until new floor arrives.
        console.log('stairs');
        console.log(keyPressed);
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

/**
 * save
 * Sends a request to the server to save the game. Called when the user presses the 'Save'
 * button. Should not be needed since the server saves a user's game whenever the client
 * disconnects, but good to allow the user a way to manually save.
 */
function save() {
    socket.emit('request', 'save');
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

// TODO: Don't switch the state. Create a new container to draw the menu to and draw this above the game app.
// Once player exits the window, remove the menu container from the game screen.
// When the player opens the menu, disable the player from moving to prevent updates to the server.
// Double check network dev tools in browser to make sure menu doesn't send any socket requests
// In-game menu will only have resume and graphics for right now. Eventually a spot to place inventory.
// TODO: Allow the gameInfo screen to display different information screens. Swipe or press tab to display item hotbar,
// character stats, map, anything that is useful to have open while playing but would cause screen clutter.
// These screens would all be seperate containers to allow quick switching between screens.
function toggleMenu() {
    /*
    if (level && state === play) {
        gameMenuBackup.gameTiles = gameTiles;
        gameMenuBackup.player = player;
        gameMenuBackup.gameInfo = gameInfo;
        gameMenuBackup.mapSprites = mapSprites;
        gameMenuBackup.enemySprites = enemySprites;
        menuScreen = 'game';
        state = menu;
        updateMenu();
    } else if (menuScreen === 'game' && state === menu) {
        menuScreen = '';
        gameTiles = gameMenuBackup.gameTiles;
        player = gameMenuBackup.player;
        infoTiles = gameMenuBackup.infoTiles;
        mapSprites = gameMenuBackup.mapSprites;
        enemySprites = gameMenuBackup.enemySprites;

        app.addChild(gameTiles);
        app.addChild(player);
        gameInfo.addChild(infoTiles);
        renderer.render(app.stage);
        infoRenderer.render(gameInfo.stage);
    }
    */
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
    
    if (player)
        app.stage.removeChild(player);
    
}

/**
 * getLocalStorageSaves
 * Socket.IO uses cookies so to keep track of games players start on their device, the
 * browser local storage is used. Saves are in the format 'name:uuid' where the name is
 * the name players entered at the start of their new game and the uuid is the saveID
 * their game is associated with in the server's save database. Uses a series of helper
 * functions to allow the number of saves to be a customizable number.
 * @returns An array starting at 1 of all the local saves
 */
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

/**
 * getLocalStorageSaveObject
 * Returns the save in the specified save slot. Save objects are in the format 'name:uuid'
 * where name is the name the player entered at the start of that session and uuid is the
 * save ID that is associated with their game in the server's database.
 * @param slot The save slot to be loaded. Can be between 1 and the maximum save count.
 * @returns The save in local storage at the specified spot. Object has a name and saveID field.
 */
function getLocalStorageSaveObject(slot) {
    var storage = localStorage.getItem('save'+slot);
    var saveObject = storage ? storage.split(':') : ['',''];
    return {name: saveObject[0], saveID: saveObject[1]};
}

/**
 * setLocalStorageSaves
 * When a player starts a new game or loads a previous game, the save is added to slot 1 in
 * the saves kept in the client's browser's local storage. All other games are shifted down.
 * @param name The name the player entered at the start of a new game
 * @param saveID The uuid that's unique to every game that's used as an identifier in the server's save database
 * @returns Returns true if a save was successfully added, false if the save was unable to be added to local storage.
 */
function setLocalStorageSaves(name, saveID) {
    if (checkStorageCompatibility()) {
        var saveInfo = name+':'+saveID;
        removeDuplicateStorageHelper(1, saveInfo);
        addSaveLocalStorage(maxSaves, saveInfo);
        return true;
    }
    return false;
}

/**
 * addSaveLocalStorage
 * Moves all saves down one slot and then adds the most recent game to save slot 1.
 * A recursive function that exits once the save is added to the first slot.
 * @param slot The current slot being manipulated in local storage
 * @param saveInfo The saveInfo in the format 'name:uuid' to add to save slot 1.
 * @returns null once all the saves are updated.
 */
function addSaveLocalStorage(slot, saveInfo) {
    if (slot < 1)  return;
    if (slot === 1) { 
        localStorage.setItem('save1', saveInfo);
        return;
    }
    moveLocalStorageSave(slot-1, slot);
    addSaveLocalStorage(slot-1, saveInfo);
}

/**
 * removeDuplicateStorageHelper
 * If a player loads a game that appears in local storage, remove that save from
 * its old location and place it in the first save slot. Recursive function because
 * the function needs to move all the saves up after a save is removed. The way I
 * handle moving saves up would cause infinite loops if all save slots were not being
 * used. The counter increments whenever the function tries to remove empty save slots
 * and if the counter is ever greater than the (max saves) - (current save slot) then
 * we know that the current slot is the last save on the local machine so the recursive
 * calls end.
 * @param slot The current save slot being manipulated.
 * @param saveInfo The info being saved and to be removed from the old save list. In the format 'name:uuid'.
 * @param counter Number of times the recursive function has been called for current save slot
 * @returns true once recursive calls end. Until then, the function returns itself. If a duplicate is removed, call the function again from the same save slot. If no save is removed, call the function from the next slot.
 */
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

/**
 * moveLocalStorageSave
 * Helper function used to move saves from one save slot in the browser's local storage
 * to another spot.
 * @param from Location to move data from. Corresponds to the save slot number.
 * @param to Location to set to the value in the from location. Corresponds to the save slot number.
 * @returns true if the saves can be moved, false if to or from is less than 1 or greater than the max number of saves.
 */
function moveLocalStorageSave(from, to) {
    if (from < 1 || from > maxSaves || to < 1 || from > maxSaves) return false;
    localStorage.setItem('save'+to, localStorage.getItem('save'+from));
    localStorage.setItem('save'+from, '');
    return true;
}

/**
 * checkStorageCompatibility
 * Checks to see if the client's browser supports using local storage. If not, player will
 * have to keep track of their saves themselves. If the browser does support local storage,
 * then players can have their browser store their recently played games.
 * @returns true if the client's browser supporses local storage, false if the browser does not.
 */
function checkStorageCompatibility() {
    if (typeof(Storage) !== 'undefined') {
        return true;
    } else {
        return false;
    }
}

// The directionPressed and directionReleased functions handle clearing the timeout function
// which allows players hold down a direction instead of having to press the key every time they want to move
function directionReleased() {
    var inputObject;
    if (state == menu) {
        inputObject = menuInput;
    } else {
        inputObject = player;
    }
    clearTimeout(timeoutFunction);
    directionKeyHeld = '';
    inputObject.vx = 0;
    inputObject.vy = 0;
}
function directionPressed(direction) {
    clearTimeout(timeoutFunction);
    var inputObject;
    if (state == menu) {
        inputObject = menuInput;
    } else {
        inputObject = player;
    }
    if (direction != directionKeyHeld) {
        directionKeyHeld = direction;
        switch (direction) {
            case 'U':
                inputObject.vy = -1;
                inputObject.vx = 0;
                break;
            case 'D':
                inputObject.vy = 1;
                inputObject.vx = 0;
                break;
            case 'L':
                inputObject.vx = -1;
                inputObject.vy = 0;
                break;
            case 'R':
                inputObject.vx = 1;
                inputObject.vy = 0;
                break;
            default:
                directionReleased();
                break;
        }
    }
}
