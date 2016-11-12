'use strict'

var game = new Phaser.Game(800, 500, Phaser.CANVAS, 'phaser-example', { 
    preload: preload, 
    create: create, 
    update: update, 
    render: render 
});


function preload() {

    game.load.tilemap('level1', 'assets/levels/level1.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.image('tiles-1', 'assets/images/tiles-1.png');
    game.load.image('background', 'assets/images/background2.png');

    game.load.spritesheet('dude', 'assets/images/dude4.png', 80, 80);  // Size of Sprite including whitespace
    game.load.spritesheet('droid', 'assets/images/droid.png', 32, 32);   
    game.load.image('heart', 'assets/heartFull.png');
}

var map;

var layer;

var player;
var droid;

var droidLength = 10;

var droidCollection;
var facing = 'left';
var jumpTimer = 0;
var gravityTimer = 0;
var cursors;
var jumpButton;
var gravityButton;
var bg;

var droidspeed = 50;
var playerSpeed = 290;
var playerJumpPower = 500;
var gravityDown = true;
var invincibleTimer;
var hearts;
var healthMeterIcons;
var damagelevel;


function create() {;

    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.physics.startSystem(Phaser.Physics.P2JS);
    game.stage.backgroundColor = '#000000';

    bg = game.add.tileSprite(0, 0, 800, 500, 'background');
    bg.fixedToCamera = true;


    map = game.add.tilemap('level1');

    map.addTilesetImage('tiles-1');

    map.setCollisionByExclusion([ 13, 14, 15, 16, 46, 47, 48, 49, 50, 51 ]);

    layer = map.createLayer('Tile Layer 1');

	
	 
    //  Un-comment this on to see the collision tiles
    // layer.debug = true;

    layer.resizeWorld();

    game.physics.arcade.gravity.y = 1000;

    //****************PLAYER****************//
    player = game.add.sprite(32, 32, 'dude');
    game.physics.enable(player, Phaser.Physics.ARCADE);

    player.body.bounce.y = 0.0; // I set this to 0 because it interfers with the jump. Originally 0.2
    player.body.collideWorldBounds = true;
    player.body.setSize(32, 46, 24, 34); //player.body.setSize(20, 32, 5, 16);
    player.anchor.setTo(0.7, 0.7);  // This ensure that the player's centre point is in the middle. Needed for flipping sprite

    player.animations.add('left', [5, 6, 7, 8], 10, true);
    player.animations.add('turn', [4], 20, true);
    player.animations.add('right', [0, 1, 2, 3], 10, true);
	player.health = 3;
    player.maxHealth = 8;
	
	//*******************HEARTS*****************//
	game.plugin = game.plugins.add(Phaser.Plugin.HealthMeter);
	hearts = game.add.group();
    hearts.enableBody = true;
	 // set up a timer so player is briefly invincible after being damaged
    invincibleTimer = game.time.now + 1000;
	healthMeterIcons = game.add.plugin(Phaser.Plugin.HealthMeter);
    healthMeterIcons.icons(player, {icon: 'heart', y: 20, x: 32, width: 16, height: 16, rows: 1});
    //****************PLAYER***************//

    //****************DROIDS***************//
    droidCollection = game.add.physicsGroup();


    for(var i=0; i<droidLength; i++)    {
        var droid = droidCollection.create(game.world.randomX, game.world.randomY, 'droid');
        initDroid(droid);
    }

    droidCollection.forEach(updateAnchor, this);

    

    // Set Anchor for each droid so that they flip correctly
    /*for(var i=0; i < droidCollection.length; i+=1) {
        droidCollection[i].anchor.setTo(0.5, 0.5);
    }*/
    //****************DROIDS***************//

    game.camera.follow(player);

    cursors = game.input.keyboard.createCursorKeys();
    jumpButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    gravityButton = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);      // Press DOWN to flip gravity

}

function update() {
    game.physics.arcade.collide(player, layer);
    player.body.velocity.x = 0;


    // console.log("Y Vel " + player.body.velocity.y);
    //console.log("Gravity Y " + game.physics.arcade.gravity.y);

    droidCollection.forEach(updateDroids, this);

    // PLAYER MOVEMENT
    if (cursors.left.isDown) {
        player.body.velocity.x = -playerSpeed;

        if (facing != 'left') {
            player.animations.play('left');
            facing = 'left';
        }
    }
    else if (cursors.right.isDown) {
        player.body.velocity.x = playerSpeed;

        if (facing != 'right') {
            player.animations.play('right');
            facing = 'right';
        }
    }
    else {
        if (facing != 'idle') {
            player.animations.stop();

            if (facing == 'left') {
                player.frame = 5;
            }
            else {
                player.frame = 0;
            }
            facing = 'idle';
        }
    }

    
    // JUMPING
    if (cursors.up.isDown && game.time.now > jumpTimer && player.body.onFloor()) { 
        player.body.velocity.y = -playerJumpPower;

        jumpTimer = game.time.now + 750;
    }
    // REVERSE JUMP
    else if (cursors.up.isDown && game.time.now > jumpTimer && player.body.blocked.up) { 
        player.body.velocity.y =  playerJumpPower;

        jumpTimer = game.time.now + 750;
    }

    // Reversing GRAVITY when C button is pressed
    if(gravityButton.isDown && game.time.now > gravityTimer) {  
        updateGravity();
    }
	// Make the player and the lava

    game.physics.arcade.collide(player,droidCollection, takeDamage,null,this);
    game.physics.arcade.collide(player,hearts,collectedHeart,null,this);
}

function render() {

    game.debug.text(game.time.physicsElapsed, 32, 32);
    //game.debug.body(droid);
    //game.debug.bodyInfo(droid, 16, 24);

    //game.debug.body(player);
    //game.debug.bodyInfo(player, 16, 24);
}

function initDroid(droid) {
    game.physics.enable(droid, Phaser.Physics.ARCADE);

    droid.body.collideWorldBounds = true;
    droid.body.setSize(32, 32);
    droid.body.velocity.x = droidspeed;
    droid.damageLevel = 1;

    droid.currentDirection = 'left';

    droid.animations.add('move', [0, 1, 2, 3], 10, true);
}

//damage the play the amount of amountOfDamage
function takeDamage(player, enemy)   {
debugger;
    if (game.time.now > invincibleTimer) {

            player.damage(enemy.damagelevel);
            invincibleTimer = game.time.now + 1000;

        }

        // player is dead, start over
        if (player.health <= 0) {
            restart();
        }
    }

    // Function to restart the game
    function restart () {
        player.kill();

    }
function updateAnchor(droid){
    droid.anchor.setTo(0.5, 0.5);
}    

function updateDroids(dr){
        game.physics.arcade.collide(dr, layer);
        dr.animations.play('move');
        if(dr.body.blocked.left){
            dr.currentDirection = 'right';
        }
        if(dr.body.blocked.right){
            dr.currentDirection = 'left';
        }
        dr.body.velocity.x = dr.currentDirection === 'left' ? (droidspeed * -1) : droidspeed;
}

function updateGravity() {
    gravityDown = !gravityDown;             // Change gravity boolean
        game.physics.arcade.gravity.y *= -1;    // Invert gravity

        //player.anchor.setTo(0.5, 0.5);        // Set anchor point to middle of sprite - Redundant due to setting this at create()
        player.scale.y *= -1;                   // Flip Sprite vertically

        droidCollection.forEach(updateDroidGravity, this);
        
        gravityTimer = game.time.now + 500;     // Ensures that function is called once 

        // Flip the game Header Text
        var twist;

        if(gravityDown) { twist = "rotate(0deg)"; }
        else            { twist = "rotate(180deg)"; }
        var gameH1 = document.getElementsByTagName("h1")[0];

        // Accommodate all CSS vendor Prefixes
        gameH1.style.oTransform = twist;
        gameH1.style.mozTransform = twist; 
        gameH1.style.msTransform = twist;
        gameH1.style.webkitTransform = twist; 
        gameH1.style.Transform = twist;
}

function updateDroidGravity(droid){
    droid.scale.y *= -1;
     droid.body.velocity.x = droid.currentDirection === 'left' ? (droidspeed * -1) : droidspeed;
}

function collectedHeart(player,heart) {
    heart.kill();
    if (player.health < player.maxHealth) {
        player.heal(1);
    }
}

