'use strict'

var game = new Phaser.Game(800, 512, Phaser.CANVAS, 'phaser-example', { 
    preload: preload, 
    create: create, 
    update: update, 
    render: render 
});


function preload() {

    game.load.tilemap('levelTest0', 'assets/levels/levelTestRevamp0.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.tilemap('levelTest', 'assets/levels/levelTestRevamp.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.tilemap('levelTest2', 'assets/levels/levelTestRevamp2.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.tilemap('levelTest3', 'assets/levels/levelTestRevamp3.json', null, Phaser.Tilemap.TILED_JSON);
    
    game.load.image('tiles-1', 'assets/images/tiles-1.png');
    game.load.image('background', 'assets/images/background2.png');

    game.load.image('potion', 'assets/images/potion.png');
    game.load.spritesheet('enemy', 'assets/images/enemy1.png', 32, 64);   
    game.load.spritesheet('bird', 'assets/images/enemy2.png', 40, 31);  
    game.load.spritesheet('droid', 'assets/images/droid.png', 32, 32); 
    game.load.spritesheet('ghost', 'assets/images/ghost.png', 60, 60);

    game.load.spritesheet('boom', 'assets/images/explosion.png', 98, 84);  
    game.load.spritesheet('smoke', 'assets/images/smoke.png', 100, 37); 

    game.load.spritesheet('spikes', 'assets/images/spikes.png', 61, 28); 
    game.load.spritesheet('spikes_down', 'assets/images/spikes_down.png', 61, 28); 

    game.load.spritesheet('dude', 'assets/images/dude6.png', 126, 80);  // Size of Sprite including whitespace
  
    game.load.image('heart', 'assets/heartFull.png');

    game.load.image('arrowDown', 'assets/images/arrow-down.png');

    //***************************************Sound FX************************//
    game.load.audio('explosion', 'assets/sfx/explosion.mp3');
    game.load.audio('player_hit', 'assets/sfx/player_hit.mp3');
    game.load.audio('music', 'assets/sfx/music.mp3');
    game.load.audio('sword', 'assets/sfx/sword.mp3');
    game.load.audio('die', 'assets/sfx/die.mp3');
    game.load.audio('potion', 'assets/sfx/potion.mp3');
}

var map;

var layer;

var player;
var droid;
var enemy;
var booms;
var smokes;


var droidCollection;
var facing = 'left';
var jumpTimer = 0;
var gravityTimer = 0;
var attackTimer = 0;
var cursors;
var jumpButton;
var gravityButton;
var bg;
var attackButton;

var droidspeed = 50;
var playerSpeed = 290;
var playerJumpPower = 500;
var gravityDown = true;
var invincibleTimer;
var hearts;
var healthMeterIcons;

var potionCollection;
var spikesCollection;
var enemyCollection;


var endfirstLevel = false; 

var arrowDown;
var currentLevel = 0;
var timerStarted = false;
var currentSeconds = 0;
var gameTimer;

var endGametext;
var endGameSubtext;
var weapon;
var graphics;
var monster;

var player_hit;
var explosion;
var music;
var sword;
var music_on;
var musicButton;
var audiolag;
var die;
var potion_sound;
var stun;

function create() {
    gravityDown = true; // Ensure that gravity is set correctly on level load
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.physics.startSystem(Phaser.Physics.P2JS);
    game.stage.backgroundColor = '#000000';

    bg = game.add.tileSprite(0, 0, 800, 512, 'background');
    bg.fixedToCamera = true;

    loadLevel(currentLevel);
    game.physics.arcade.gravity.y = 1000;

    //********************************Weapon*********************************//
    weapon = new Weapon(75,1);
    explosion = game.add.audio('explosion');
    music = game.add.audio('music');
    player_hit = game.add.audio('player_hit');
    sword = game.add.audio('sword');
    die = game.add.audio('die');
    potion_sound = game.add.audio('potion');
    music.play();
    music_on = true;
    audiolag = 0;
//********************************END Weapon*********************************//

    //****************PLAYER****************//
    player = game.add.sprite(72, 32, 'dude');
    game.physics.enable(player, Phaser.Physics.ARCADE);
    player.body.bounce.y = 0.0; // I set this to 0 because it interfers with the jump. Originally 0.2
    player.body.collideWorldBounds = true;
    player.body.setSize(32, 46, 44, 34); //player.body.setSize(20, 32, 5, 16);
    player.body.height = 46;
    player.weapon = weapon;

    
    player.anchor.setTo(0.7, 0.7);  // This ensure that the player's centre point is in the middle. Needed for flipping sprite

    player.animations.add('left', [4, 5, 6, 7], 10, true);
    player.animations.add('turn', [4], 20, true);
    player.animations.add('right', [0, 1, 2, 3], 10, true);
    player.animations.add('attackL', [9, 10, 11, 11, 4], 25, false, true);
    player.animations.add('attackR', [12, 13, 14, 14, 0], 25, false, true);
    player.health = 3;
    player.maxHealth = 8;
    stun = 0;
 


    //****************End PLAYER***************//
    //graphics = new Phaser.Circle(player.x,player.y,player.weapon.length);
    

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

    //for(var i=0; i<droidLength; i++) {
        // I made this global so that it can be viewed in the render()
        //droid = droidCollection.create(game.world.randomX, game.world.randomY, 'droid'); 
        //initDroid(droid);
    //}

    droidCollection.forEach(updateAnchor, this);
    //****************End DROIDS***************//


    //****************ENEMIES***************//
    enemyCollection = game.add.physicsGroup();
    //if(currentLevel > 0){
    createEnemy();
    enemyCollection.forEach(updateAnchor, this);
    //****************End ENEMIES***************//


    //****************POTIONS***************//
    potionCollection = game.add.physicsGroup();

    // Loop through all objects in potion layer and assign x and y positions
    
    for(var i=0; i<map.objects.potionLayer.length; i++) {
        var sizeArray = [map.objects.potionLayer[i].properties.w, map.objects.potionLayer[i].properties.h];
        // Must subtract height from y position because origin in phaser is different to Tiled
        var potion = potionCollection.create(map.objects.potionLayer[i].x, map.objects.potionLayer[i].y - sizeArray[1], 'potion');
        initPotion(potion, sizeArray);
    }
    //****************End POTIONS***************//


    //****************SPIKES***************//
    spikesCollection = game.add.physicsGroup();

    // Loop through all objects in potion layer and assign x and y positions
    for(var i=0; i<map.objects.spikesLayer.length; i++) {
        var sizeArray = [map.objects.spikesLayer[i].properties.w, map.objects.spikesLayer[i].properties.h];

        var spr;

        if(map.objects.spikesLayer[i].type === "spikes"){
            spr = "spikes";
        }
        else {
            spr = "spikes_down";
        }

        // Must subtract height from y position because origin in phaser is different to Tiled
        var spikes = spikesCollection.create(map.objects.spikesLayer[i].x, map.objects.spikesLayer[i].y - sizeArray[1], spr);
        initSpikes(spikes, sizeArray);
    }
    //****************End POTIONS***************//

    // Explosions
    booms = game.add.group();
    booms.createMultiple(30, 'boom');
    booms.forEach(setupBoom, this);

    // Smokes
    smokes = game.add.group();
    smokes.createMultiple(30, 'smoke');
    smokes.forEach(setupSmoke, this);

        
    //}

    /*****************/
    // SPAWN ENEMIES
    /******************/
    // spawnEnemy(Type of enemy (array number of map objects), interval between spawn, number of times to spawn, level)
    
    if(currentLevel === 1){
        spawnEnemy(0, 4000, 2, 1);
        spawnEnemy(3, 3000, 2, 1);;
    }

    game.camera.follow(player);

    cursors = game.input.keyboard.createCursorKeys();
    jumpButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    gravityButton = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);      // Press DOWN to flip gravity
    attackButton = game.input.keyboard.addKey(Phaser.Keyboard.CONTROL);
    musicButton = game.input.keyboard.addKey(Phaser.Keyboard.M);

    createSplash();
}

function createSplash(text, endGame) {
    /*
    var levelText = 'Start Game';
    var textarr;
    var changeLevel =  game.add.graphics(0, 0);
    changeLevel.beginFill(0x000000);
    changeLevel.lineStyle(10, 0xffd900, 1);
    changeLevel.drawRect(0, 0, game.width, game.height);
    if (currentLevel > 0) {
        levelText = 'Level ' + currentLevel;
    }
    levelText = text ? text : levelText;
    endGametext = game.add.text(game.world.centerX, game.world.centerY, levelText, {
            font: "65px Squada One",
            fill: "#1a768e",
            align: "center",
        });
    
    textarr = levelText.split("");
    var ani = 0;
    var aniY = game.world.randomY < 350 ? game.world.randomY: 350;
    var int1 = setInterval(function(){
        //console.log('here');
        endGametext.x = ani;
        endGametext.angle = ani / 20;
        endGametext.y = aniY;
        ani += 20;
        aniY +- 20;
        if(ani >= 800) {
            if(!endGame){
                clearInterval(int1);
                changeLevel.destroy(); 
                endGametext.kill();
                 for(var j=0; j<textarr.length; j++){
                    textarr[j].kill();
                }
            }
            
            if(currentLevel > 0 && !timerStarted) {
                startGameTimer();
            }
        }
        if (ani === 400) {
            for(var j=0; j<textarr.length; j++){
                textarr[j] = game.add.text(game.world.randomX, game.world.randomY, levelText, {
                    font: "65px Squada One",
                    fill: "#99d9ea",
                    align: "center",
                });
            }
        } 
    }, 100);
    endGametext.anchor.setTo(0, 0);
    */

    /*setTimeout(function(){ 
        
    }, 1000);*/
}

function update() {
    game.physics.arcade.collide(player, layer);
    game.physics.arcade.collide(enemyCollection, layer);

    player.body.velocity.x = 0;

    render();

    droidCollection.forEach(updateEnemies, this);
    enemyCollection.forEach(updateEnemies, this);

    checkForLevelEnd();

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
        if (facing != 'idle' && player.animations.currentAnim.name != "attackL" && player.animations.currentAnim.name != "attackR") {
            player.animations.stop();

            if (facing == 'left') {
                player.frame = 4;
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
        player.body.velocity.y = playerJumpPower;

        jumpTimer = game.time.now + 750;
    }

    // Reversing GRAVITY when DOWN button is pressed
    if(gravityButton.isDown && game.time.now > gravityTimer) {
        updateGravity();
    }

    // COLLISIONS
    game.physics.arcade.collide(player, droidCollection, knockback, null, this);
    game.physics.arcade.collide(player, enemyCollection, knockback, null, this);

    game.physics.arcade.collide(enemyCollection, spikesCollection, killEnemy, null, this);

    game.physics.arcade.collide(player, spikesCollection, knockback, null, this);
    game.physics.arcade.collide(player, potionCollection, collectedPotion, null, this);
    

    if(player.health <= 0){
        if (game.input.activePointer.isDown) {
            location.reload();
        }
    }

    if(attackButton.isDown && game.time.now > attackTimer){
        for (var i = 0; i< enemyCollection.length; i++) {
            enemy = enemyCollection.hash[i];
            if(enemy.alive == true)
                attack(enemy);
            attackTimer = game.time.now + Phaser.Timer.SECOND * .2;
        }
        attackAnimation();        
        sword.play();
    }
    if(musicButton.isDown && game.time.now > audiolag){

        if(music_on == true){
            music.pause();
            audiolag = game.time.now + Phaser.Timer.SECOND*.5;
            music_on = false;
        }else{
            music.resume();
            audiolag = game.time.now + Phaser.Timer.SECOND*.5;
            music_on = true;
        }
    }
}

function setupBoom(b){
    b.anchor.x = 0.5;
    b.anchor.y = 0.5;
    b.animations.add('boom');
}
function setupSmoke(s){
    s.anchor.x = 0.5;
    s.anchor.y = 0.5;
    s.animations.add('smoke');
}

function checkForLevelEnd(){
    var levelOver = false;
    for (var i = enemyCollection.length - 1; i >= 0; i--) {
        if(enemyCollection.children[i].alive){
            levelOver = false;
            break;
        }
        levelOver = true;
    }

    if(levelOver){
        music.stop();
        currentLevel++;
        create();
    }
}

var titleStyle = {
    font: "65px Squada One",
    shadowFill: "black",
    shadowOffsetX: "10px",
    stroke: "black",
    strokeThickness: 3,
    fill: "#ff0044",
    align: "center"
}

function loadLevel(level){
    if(level === 0){

        //endGametext = game.add.text(game.world.centerX, game.world.centerY, "Start Game", titleStyle);
        //endGametext.anchor.setTo(0.5, 0.5);


        map = game.add.tilemap('levelTest0');

        if(layer){ 
            layer.destroy();
        }
        layer = map.createLayer('Tile Layer 1');
    } 

    else if (level === 1){
        map = game.add.tilemap('levelTest');
        if(layer) {
            layer.destroy();
        }
        layer = map.createLayer('Tile Layer 1');
    } 

    else if(level === 2){
        map = game.add.tilemap('levelTest2');
        
        if(layer) {
            layer.destroy();
        }
        layer = map.createLayer('Tile Layer 1'); 
    } 

    else if(level === 3){
        map = game.add.tilemap('levelTest3');
        
        if(layer) {
            layer.destroy();
        }
        layer = map.createLayer('Tile Layer 1'); 
    } 

    else if(level === 4){
        //endGametext = game.add.text(game.world.centerX, game.world.centerY, "You Win!!!!!!", titleStyle);

        //endGametext.anchor.setTo(0.5, 0.5);
        clearInterval(gameTimer);
        $('.gameWrapper h2').replaceWith('<h2>You completed the game in ' + currentSeconds + ' seconds </h2>');
    } 
    else if (level === 999){
       // endGametext = game.add.text(game.world.centerX, game.world.centerY, "DEAD... Restart?", titleStyle);
       // endGametext.anchor.setTo(0.5, 0.5);

        createSplash('You Win', true);
        clearInterval(gameTimer);
        $('.gameWrapper h2').replaceWith('<h2>You completed the game in ' + currentSeconds + ' seconds </h2>');
    } 
    else if (level === 999){
        createSplash('You are dead', true);
        clearInterval(gameTimer);
    }
    
    map.addTilesetImage('tiles-1');
    map.setCollisionByExclusion([ 13, 14, 15, 16, 46, 47, 48, 49, 50, 51 ]);

    if(layer){
        layer.resizeWorld();
    }
}

function render() {
    //game.debug.text(game.time.physicsElapsed, 32, 32);
   
    // game.debug.body(player,"pink",false);
    // game.debug.spriteBounds(player,"blue",false);
    // game.debug.spriteCoords(player);
    // game.debug.body(enemy,"red",false);
    //game.debug.bodyInfo(droid, 16, 24);
    game.debug.body(player);
    //game.debug.bodyInfo(player, 16, 24);
    //layer.debug = true;
}

function initDroid(droid) {
    game.physics.enable(droid, Phaser.Physics.ARCADE);

    game.physics.enable([droid,player], Phaser.Physics.ARCADE);

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

function startGameTimer() {
    timerStarted = true;
    gameTimer = setInterval(function(){
        $('.gameWrapper h2').replaceWith('<h2>' + currentSeconds + ' seconds </h2>');
        currentSeconds += 1;
    }, 1000);
    
}

function initSpikes(spikes, size) {
    game.physics.enable(spikes, Phaser.Physics.ARCADE);
    spikes.body.collideWorldBounds = true;  
    spikes.body.allowGravity = false;   // Ensure spikes stays put in spot
    spikes.body.setSize(size[0], size[1]);
    spikes.damageLevel = 1;
    spikes.body.immovable = true;
    spikes.body.moves = false;
}

// Enemy, Type, W & H, Speed, Damage, Affected by Gravity
function initEnemy(enemy, enemyType, size, speed, damage, grav, colEnv, health) {
    game.physics.enable(enemy, Phaser.Physics.ARCADE);

    if(enemyType === "ghost"){
        enemy.checkWorldBounds = true;
        enemy.events.onOutOfBounds.add(enemyOut, this);
    }else{
        enemy.body.collideWorldBounds = true;
    }

    enemy.body.checkCollision.left = enemy.body.checkCollision.right = colEnv;

    enemy.body.setSize(size[0], size[1]);
    enemy.damageLevel = damage;
    enemy.body.allowGravity = grav;   
    enemy.customSpeed = speed;
    enemy.enemyType = enemyType;
    enemy.health = health;

    enemy.currentDirection = 'left';

    if(enemyType === "bird" || enemyType === "enemy" || enemyType === "ghost"){
        enemy.animations.add('move', [0, 1, 2, 3], 10, true);
    }
}

function createEnemy(){
    // Go through every enemy spawn point and create enemy
    for(var i=0; i<map.objects.enemyLayer.length; i+=1) {
        var sizeArray = [map.objects.enemyLayer[i].properties.w, map.objects.enemyLayer[i].properties.h];
        var enemyType = map.objects.enemyLayer[i].type;
        var enemyDamage = map.objects.enemyLayer[i].properties.damage;
        var enemySpeed = map.objects.enemyLayer[i].properties.speed;
        var affectedByGravity = map.objects.enemyLayer[i].properties.gravity; 
        var colEnv = map.objects.enemyLayer[i].properties.colEnv;    
        var health = map.objects.enemyLayer[i].properties.health;      

        // I made this global so that it can be viewed in the render()
        // X pos, Y pos minus its height, sprite
        enemy = enemyCollection.create(map.objects.enemyLayer[i].x, map.objects.enemyLayer[i].y + sizeArray[1], map.objects.enemyLayer[i].type);
        
        // Enemy, Type, W & H, Speed, Damage, Affected by Gravity
        initEnemy(enemy, enemyType, sizeArray, enemySpeed, enemyDamage, affectedByGravity, colEnv, health);       
    }
}

function spawnEnemy(b, interval, max, level) {
    if(currentLevel === level) {
        var spawnInterval = setInterval(function(){
            var sizeArray = [map.objects.enemyLayer[b].properties.w, map.objects.enemyLayer[b].properties.h];
            var enemyType = map.objects.enemyLayer[b].type;
            var enemyDamage = map.objects.enemyLayer[b].properties.damage;
            var enemySpeed = map.objects.enemyLayer[b].properties.speed;
            var affectedByGravity = map.objects.enemyLayer[b].properties.gravity;  
            var colEnv = map.objects.enemyLayer[b].properties.colEnv;   
            var health = map.objects.enemyLayer[b].properties.health; 

            // I made this global so that it can be viewed in the render()
            // X pos, Y pos minus its height, sprite
            enemy = enemyCollection.create(map.objects.enemyLayer[b].x, map.objects.enemyLayer[b].y - sizeArray[1]*0.5, map.objects.enemyLayer[b].type);

            if(gravityDown === false){
                // Gravity is upside down therefore make enemy upside down
                enemy.scale.y = enemy.scale.y * (-1); 
            }  

            // Enemy, Type, W & H, Speed, Damage, Affected by Gravity
            initEnemy(enemy, enemyType, sizeArray, enemySpeed, enemyDamage, affectedByGravity, colEnv, health);
            updateAnchor(enemy); 
            max -= 1;

            if(max <= 0 || currentLevel != level){
                clearInterval(spawnInterval);
            }
        }, interval);
    }
}
function knockback(player,enemy) {
    if (player.body.touching.down && gravityDown) {
        player.body.velocity.y = -400;
    }
    else if (player.body.touching.up && !gravityDown) {
        player.body.velocity.y = 400;
    }
    takeDamage(player,enemy);
}
//whatever is damaging the player needs to have attribute "damageLevel"
function takeDamage(player, enemy)   {

    if (game.time.now > invincibleTimer) {
        player.damage(enemy.damageLevel);
        fadePlayer();
        game.time.events.add(Phaser.Timer.SECOND * 0.20, unFadePlayer, this);
        game.time.events.add(Phaser.Timer.SECOND * 0.40, fadePlayer, this);
        game.time.events.add(Phaser.Timer.SECOND * 0.60, unFadePlayer, this);
        game.time.events.add(Phaser.Timer.SECOND * 0.80, fadePlayer, this);
        game.time.events.add(Phaser.Timer.SECOND * 1, unFadePlayer, this);
        game.time.events.add(Phaser.Timer.SECOND * 1.2, fadePlayer, this);
        game.time.events.add(Phaser.Timer.SECOND * 1.4, unFadePlayer, this);

        invincibleTimer = game.time.now + 1400;
    }

    // player is dead, start over
    if (player.health <= 0) {
        die.play();
        restart();
    }
}

function giveDamage(enemy){
    //fadeEnemy(enemy);
    //game.time.events.add(Phaser.Timer.SECOND * .5, unFadeEnemy, this);
    if(gravityDown === true){
        enemy.body.velocity.y -= 150;
    }
    else {
        enemy.body.velocity.y += 150;
    }
    
    if(player.body.x > enemy.body.x){
        //console.log("Player on RIGHT");
        enemy.body.velocity.x -= 400;
    }
    else {
        //console.log("Player on LEFT");
        enemy.body.velocity.x += 400;        
    }

    var smoke = smokes.getFirstExists(false);
    smoke.reset(enemy.body.x, enemy.body.y);
    smoke.play('smoke', 30, false, true);
    
    enemy.damage(player.weapon.damage);
}

function attack(enemy) {

    if (game.physics.arcade.distanceBetween(player.body, enemy.body) < player.weapon.length) {
        if ((player.frame == 4 && player.x > enemy.x)||(player.frame == 0 && player.x < enemy.x))  {
            giveDamage(enemy);
            player_hit.play();
        }
        if (enemy.health <= 0) {
            killEnemy(enemy)
        }
    }
}
function attackAnimation(){
    if(facing == 'left' ||  player.frame == 4){
        player.animations.play('attackL');
    }
    else if(facing == 'right' ||  player.frame == 0) {
        player.animations.play('attackR');
    }
   
}

function killEnemy(enemy) {
    explosion.play();
    var boom = booms.getFirstExists(false);
    boom.reset(enemy.body.x, enemy.body.y);
    boom.play('boom', 30, false, true);
    enemy.kill();
}

function fadePlayer(){
    player.alpha = 0.1;
}

function unFadePlayer(){
    player.alpha = 1;
}
function unFadeEnemy(){
    enemy.alpha = 1;
}

function fadeEnemy(){
    enemy.alpha = 0.1;
}

// Function to restart the game
function restart () {
    player.kill();
    loadLevel(999);
}

function updateAnchor(enemy){
    enemy.anchor.setTo(0.5, 0.5);
    enemy.body.immovable = true;
}    

function updateEnemies(enemy){

    if(enemy.enemyType !== 'ghost'){
        game.physics.arcade.collide(enemy, layer);
    }
    
    enemy.animations.play('move');
    if(enemy.body.blocked.left){
        enemy.currentDirection = 'right';
    }
    if(enemy.body.blocked.right){
        enemy.currentDirection = 'left';
    }

    if(enemy.enemyType === "ghost"){
        enemy.body.velocity.y =  (Math.sin(0.5 * Math.PI * (enemy.body.x/40)) * 180);
    }

    enemy.body.velocity.x = enemy.currentDirection === 'left' ? (enemy.customSpeed * -1) : enemy.customSpeed;
    enemy.scale.x = enemy.currentDirection === 'left' ? (-1) : 1;
}

function updateGravity() {
    gravityDown = !gravityDown;             // Change gravity boolean
    game.physics.arcade.gravity.y *= -1;    // Invert gravity

    console.log("GravityDown is " + gravityDown);

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

    if(currentLevel === 0 && arrowDown){
        arrowDown.kill();
    }
}

function updateDroidGravity(droid){
    droid.scale.y *= -1;
    droid.body.velocity.x = droid.currentDirection === 'left' ? (droidspeed * -1) : droidspeed;
}

function collectedPotion(player, potion) {
    potion.kill();
    if (player.health < player.maxHealth) {
        player.heal(1);
        potion_sound.play();
    }
}
function Weapon(length,damage) {
    this.length = length;
    this.damage = damage;
}

function enemyOut(ghost){
    if(ghost.x < 0 || ghost.x > game.width){
        ghost.x = game.width - ghost.width;
    }
    if(ghost.y < 0 || ghost.y > game.height){
        ghost.y = game.height - ghost.height; 
    }
}