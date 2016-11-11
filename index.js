"use strict"

var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'phaser-example', { 
    preload: preload, 
    create: create, 
    update: update, 
    render: render 
});

function preload() {

    game.load.tilemap('level1', 'assets/levels/level1.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.image('tiles-1', 'assets/images/tiles-1.png');
    game.load.image('background', 'assets/images/background2.png');


    game.load.spritesheet('dude', 'assets/images/dude.png', 32, 48);
    game.load.spritesheet('droid', 'assets/images/droid.png', 32, 32);
    
}

var map;
var tileset;
var layer;

var player;
var droid;

var facing = 'left';
var jumpTimer = 0;
var cursors;
var jumpButton;
var bg;
var switchButton;

var droidspeed = -100;

function create() {

    game.physics.startSystem(Phaser.Physics.ARCADE);

    game.stage.backgroundColor = '#000000';

    bg = game.add.tileSprite(0, 0, 800, 600, 'background');
    bg.fixedToCamera = true;

    map = game.add.tilemap('level1');

    map.addTilesetImage('tiles-1');

    map.setCollisionByExclusion([ 13, 14, 15, 16, 46, 47, 48, 49, 50, 51 ]);

    layer = map.createLayer('Tile Layer 1');

    //  Un-comment this on to see the collision tiles
    layer.debug = true;

    layer.resizeWorld();

    game.physics.arcade.gravity.y = 250;

    //****************PLAYER****************//
    player = game.add.sprite(32, 32, 'dude');
    game.physics.enable(player, Phaser.Physics.ARCADE);

    player.body.bounce.y = 0.1;
    player.body.collideWorldBounds = true;
    player.body.setSize(20, 32, 5, 16);

    player.animations.add('left', [0, 1, 2, 3], 10, true);
    player.animations.add('turn', [4], 20, true);
    player.animations.add('right', [5, 6, 7, 8], 10, true);
    //****************PLAYER***************//

    //****************DROID***************//

    droid = game.add.sprite(400, 200, 'droid');
    initDroid(droid);
    //****************DROID***************//

    game.camera.follow(player);

    cursors = game.input.keyboard.createCursorKeys();
    switchButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
}

function update() {

    game.physics.arcade.collide(player, layer);
    player.body.velocity.x = 0;

    game.physics.arcade.collide(droid, layer);
    droid.animations.play('move');
    droid.body.velocity.x = -15;

    if (cursors.left.isDown)
    {
        player.body.velocity.x = -150;

        if (facing != 'left')
        {
            player.animations.play('left');
            facing = 'left';
        }
    }
    else if (cursors.right.isDown)
    {
        player.body.velocity.x = 150;

        if (facing != 'right')
        {
            player.animations.play('right');
            facing = 'right';
        }
    }
    else
    {
        if (facing != 'idle')
        {
            player.animations.stop();

            if (facing == 'left')
            {
                player.frame = 0;
            }
            else
            {
                player.frame = 5;
            }

            facing = 'idle';
        }
    }
    
    if (cursors.up.isDown && player.body.onFloor() && game.time.now > jumpTimer)
    {
        player.body.velocity.y = -250;
        jumpTimer = game.time.now + 750;
    }

    if (switchButton.isDown)
    {
        console.log('switch Gravity here');
    }
}

function render () {

    //game.debug.text(game.time.physicsElapsed, 32, 32);
    //game.debug.body(droid);
    //game.debug.bodyInfo(droid, 16, 24);
}


function initDroid(droid) {
    game.physics.enable(droid, Phaser.Physics.ARCADE);

    droid.body.collideWorldBounds = true;
    droid.body.setSize(32, 32);
    droid.body.velocity.x = droidspeed;

    droid.animations.add('move', [0, 1, 2, 3], 10, true);
}
