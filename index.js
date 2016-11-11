// Create the state that will contain the whole game
var mainState = {
    preload: function () {
        // Here we preload the assets
        game.load.image('player', 'assets/player.png');
        game.load.image('wall', 'assets/wall.png');
        game.load.image('coin', 'assets/coin.png');
        game.load.image('enemy', 'assets/enemy.png');
        game.load.image('heart', 'assets/heartFull.png');

    },

    create: function () {



        // Here we create the game
        // Set the background color to blue
        game.stage.backgroundColor = '#3598db';

        // Start the Arcade physics system (for movements and collisions)
        game.physics.startSystem(Phaser.Physics.ARCADE);

        // Add the physics engine to all game objects
        game.world.enableBody = true;
        // Variable to store the arrow key pressed
        this.cursor = game.input.keyboard.createCursorKeys();

        // Create the player in the middle of the game
        this.player = game.add.sprite(70, 100, 'player');
        this.player.alive = true;
        this.player.health = 3;
        this.player.maxHealth = 8;
        this.game.plugin = this.game.plugins.add(Phaser.Plugin.HealthMeter);

        // create our hearts
        this.hearts = this.game.add.group();
        this.hearts.enableBody = true;

        for (var k = 0; k < 6; k++) {
            this.hearts.create(100 + Math.random() * 800, 45 + Math.random() * 200, 'heartFull');
        }
        // set up a timer so player is briefly invincible after being damaged
        this.invincibleTimer = this.game.time.now + 1000;

        this.healthMeterIcons = this.game.add.plugin(Phaser.Plugin.HealthMeter);
        this.healthMeterIcons.icons(this.player, {icon: 'heart', y: 20, x: 32, width: 16, height: 16, rows: 1});


        // Add gravity to make it fall
        this.player.body.gravity.y = 600;
        // Create 3 groups that will contain our objects
        this.walls = game.add.group();
        this.coins = game.add.group();
        this.enemies = game.add.group();
        // Design the level. x = wall, o = coin, ! = lava.
        var level = [
            'xxxxxxxxxxxxxxxxxxxxxx',
            '!         !          x',
            '!                 o  x',
            '!         o          x',
            '!                    x',
            '!     o   !    x     x',
            'xxxxxxxxxxxxxxxx!!!!!x'
        ];
        // Create the level by going through the array
        for (var i = 0; i < level.length; i++) {
            for (var j = 0; j < level[i].length; j++) {

                // Create a wall and add it to the 'walls' group
                if (level[i][j] == 'x') {
                    var wall = game.add.sprite(30 + 20 * j, 30 + 20 * i, 'wall');
                    this.walls.add(wall);
                    wall.body.immovable = true;
                }

                // Create a coin and add it to the 'coins' group
                else if (level[i][j] == 'o') {
                    var coin = game.add.sprite(30 + 20 * j, 30 + 20 * i, 'coin');
                    this.coins.add(coin);
                }

                // Create a enemy and add it to the 'enemies' group
                else if (level[i][j] == '!') {
                    var enemy = game.add.sprite(30 + 20 * j, 30 + 20 * i, 'enemy');
                    this.enemies.add(enemy);
                    enemy.body.immovable = true;
                }
            }
        }

        this.cursor.up.onDown.add(function () {
            if (this.player.body.touching.down) {
                this.player.body.velocity.y = -250;
            }
        }, this);

        this.cursor.left.onDown.add(function () {
            this.player.body.velocity.x = -200;
        }, this);

        this.cursor.right.onDown.add(function () {
            this.player.body.velocity.x = 200;
        }, this);

        this.cursor.down.onDown.add(function () {
            this.player.body.velocity.x = 0;
        }, this);

    },

    update: function () {
        //game.debug.text(this.player.health, 32, 32);
        // Make the player and the walls collide
        game.physics.arcade.collide(this.player, this.walls);

        // Call the 'takeCoin' function when the player takes a coin
        game.physics.arcade.overlap(this.player, this.coins, this.takeCoin, null, this);

        // Make the player and the lava
        game.physics.arcade.collide(this.player, this.enemies, this.takeDamage, null, this);

    },

    // Function to kill a coin
    takeCoin: function (player, coin) {
        coin.kill();
    },

    takeDamage: function () {
        if (this.game.time.now > this.invincibleTimer) {
            this.player.damage(1);
            this.invincibleTimer = this.game.time.now + 1000;
        }

        // player is dead, start over
        if (this.player.health <= 0) {
            this.restart();
        }
    },

    // Function to restart the game
    restart: function () {
        game.state.start('main');
    }
};

// Initialize the game and start our state
var game = new Phaser.Game(500, 200);
game.state.add('main', mainState);
game.state.start('main');

