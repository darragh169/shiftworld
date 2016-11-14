'use strict'

var game = new Phaser.Game(800, 500, Phaser.CANVAS, 'phaser-example', { 
    preload: preload, 
    create: create, 
    update: update, 
    render: render 
});


function preload() {

    game.load.tilemap('levelTest', 'assets/levels/levelTest2.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.image('tiles-1', 'assets/images/tiles-1.png');
    game.load.image('background', 'assets/images/background2.png');

    game.load.image('potion', 'assets/images/potion.png');
    game.load.spritesheet('enemy', 'assets/images/enemy1.png', 32, 64);   
    game.load.spritesheet('bird', 'assets/images/enemy2.png', 40, 31);  

    game.load.spritesheet('dude', 'assets/images/dude4.png', 80, 80);  // Size of Sprite including whitespace
    game.load.spritesheet('droid', 'assets/images/droid.png', 32, 32);   
    game.load.image('heart', 'assets/heartFull.png');
}

var map;

var layer;

var player;
var droid;
var enemy;

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

var potionCollection;

var enemyCollection;


function create() {

    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.physics.startSystem(Phaser.Physics.P2JS);
    game.stage.backgroundColor = '#000000';

    bg = game.add.tileSprite(0, 0, 800, 500, 'background');
    bg.fixedToCamera = true;


    map = game.add.tilemap('levelTest');

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
	//****************End PLAYER***************//


	//*******************HEARTS*****************//
	game.plugin = game.plugins.add(Phaser.Plugin.HealthMeter);
	hearts = game.add.group();
    hearts.enableBody = true;
	 // set up a timer so player is briefly invincible after being damaged
    invincibleTimer = game.time.now + 1000;
	healthMeterIcons = game.add.plugin(Phaser.Plugin.HealthMeter);
    healthMeterIcons.icons(player, {icon: 'heart', y: 20, x: 32, width: 16, height: 16, rows: 1});
    //****************End HEARTS***************//


    //****************DROIDS***************//
    droidCollection = game.add.physicsGroup();

    for(var i=0; i<droidLength; i++) {
        // I made this global so that it can be viewed in the render()
        droid = droidCollection.create(game.world.randomX, game.world.randomY, 'droid'); 
        initDroid(droid);
    }

    droidCollection.forEach(updateAnchor, this);
    //****************End DROIDS***************//


    //****************ENEMIES***************//
    enemyCollection = game.add.physicsGroup();

    for(var i=0; i<map.objects.enemyLayer.length; i+=1) {
        var sizeArray = [map.objects.enemyLayer[i].properties.w, map.objects.enemyLayer[i].properties.h];
        var enemyType = map.objects.enemyLayer[i].type;
        var enemyDamage = map.objects.enemyLayer[i].properties.damage;
        var enemySpeed = map.objects.enemyLayer[i].properties.speed;
        var affectedByGravity = map.objects.enemyLayer[i].properties.gravity;
        
        // I made this global so that it can be viewed in the render()
        // X pos, Y pos, sprite
        enemy = enemyCollection.create(map.objects.enemyLayer[i].x, map.objects.enemyLayer[i].y + sizeArray[1], map.objects.enemyLayer[i].type);
        // Enemy, Type, W & H, Speed, Damage, Affected by Gravity
        initEnemy(enemy, enemyType, sizeArray, enemySpeed, enemyDamage, affectedByGravity);
    }

    enemyCollection.forEach(updateAnchor, this);
    //****************End ENEMIES***************//


    //****************POTIONS***************//
    potionCollection = game.add.physicsGroup();

    // Loop through all objects in potion layer and assign x and y positions
    for(var i=0; i<map.objects.potionLayer.length; i++) {
        var sizeArray = [map.objects.potionLayer[i].properties.w, map.objects.potionLayer[i].properties.h];
        // Must subtract height from y position because origin in phaser is different to Tiled
        var potion = potionCollection.create(map.objects.potionLayer[i].x, map.objects.potionLayer[i].y - sizeArray[1], 'potion');
        initPotion(potion, sizeArray[1]);
    }
     //****************End POTIONS***************//


    game.camera.follow(player);

    cursors = game.input.keyboard.createCursorKeys();
    jumpButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    gravityButton = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);      // Press DOWN to flip gravity
}

function update() {
    game.physics.arcade.collide(player, layer);
    game.physics.arcade.collide(enemyCollection, layer);

    player.body.velocity.x = 0;

    droidCollection.forEach(updateDroids, this);
    enemyCollection.forEach(updateDroids, this);

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

    // Reversing GRAVITY when DOWN button is pressed
    if(gravityButton.isDown && game.time.now > gravityTimer) {  
        updateGravity();
    }
	
    // COLLISIONS
    game.physics.arcade.collide(player, droidCollection, takeDamage, null, this);
    game.physics.arcade.collide(player, enemyCollection, takeDamage, null, this);
    game.physics.arcade.collide(player, potionCollection, collectedPotion, null, this);
}

function render() {
    //game.debug.text(game.time.physicsElapsed, 32, 32);

    //game.debug.body(enemy);
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

function initPotion(potion, size) {
    game.physics.enable(potion, Phaser.Physics.ARCADE);
    potion.body.collideWorldBounds = true;  
    potion.body.allowGravity = false;   // Ensure potions stays put in spot
    potion.body.setSize(size[0], size[1]);
}

// Enemy, Type, W & H, Speed, Damage, Affected by Gravity
function initEnemy(enemy, enemyType, size, speed, damage, grav) {
    game.physics.enable(enemy, Phaser.Physics.ARCADE);

    enemy.body.collideWorldBounds = true;
    enemy.body.setSize(size[0], size[1]);
    enemy.body.velocity.x = -speed;
    enemy.damageLevel = damage;
    enemy.body.allowGravity = grav;   

    enemy.currentDirection = 'left';

    if(enemyType === "bird" || enemyType === "enemy"){
        enemy.animations.add('move', [0, 1, 2, 3], 10, true);
    }
}

//damage the play the amount of amountOfDamage
function takeDamage(player, enemy)   {

    if (game.time.now > invincibleTimer) {
        player.damage(enemy.damageLevel);
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
    enemyCollection.forEach(updateDroidGravity, this);
    
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

function collectedPotion(player, potion) {
    potion.kill();
    if (player.health < player.maxHealth) {
        player.heal(1);
    }
}