//----------Dianne Raye N. Siat---------//

var config = {
    type: Phaser.AUTO,
    width: 1000, 
    height: 800, 
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 }, 
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};


var game = new Phaser.Game(config);

// Declare Variables 
var background;
var platforms;
var cursors; 
var jumpKey;
var stars;
var bombs;
var score = 0;
var scoreText;
var nextStarTimer;
var nextBombTimer;
var starCounter = 0; 
var usedStarPositions = new Set(); //Track used star positions
var gameOverText;

//Change Color Variables in order
const rainbowColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#8A2BE2'];
var colorIndex = 0; // Index for the current color in the rainbow

function preload() {
    // Background
    this.load.image('background', 'Assets/background.png');
    
    // Platforms
    this.load.image('platform1', 'Assets/platform1.png');
    this.load.image('platform2', 'Assets/platform2.png');
    this.load.image('platform3', 'Assets/platform3.png');
    
    // Player
    this.load.spritesheet('player', 'Assets/playerOne.png', {
        frameWidth: 60,
        frameHeight: 70
    });
    
    // Star and Bomb
    this.load.image('star', 'Assets/star.png');
    this.load.image('bomb', 'Assets/bomb.png');
}


function create() {
 
    background = this.add.image(0, 0, 'background').setOrigin(0, 0);
    
    // Scale Background to Game Scene 
    background.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
    
    // Physics for Platforms
    platforms = this.physics.add.staticGroup();

    // Platform Coordinates
    platforms.create(190, 560, 'platform1').setScale(0.37).refreshBody();
    platforms.create(130, 410, 'platform2').setScale(0.4).refreshBody();
    platforms.create(600, 270, 'platform3').setScale(0.4).refreshBody();
    platforms.create(200, 800, 'platform1').setScale(0.4).refreshBody();
    platforms.create(660, 800, 'platform1').setScale(0.4).refreshBody();
    platforms.create(810, 650, 'platform2').setScale(0.4).refreshBody();
    platforms.create(820, 410, 'platform3').setScale(0.37).refreshBody();

    // Player initial coordinate& properties
    player = this.physics.add.sprite(200, 715, 'player');
    player.setBounce(0.2); 
    player.setCollideWorldBounds(true); 

    // Enable player collisions with platforms
    this.physics.add.collider(player, platforms);

    // Animations for the player
        
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1 // Loop 
        });

        this.anims.create({
            key: 'idle',
            frames: [{ key: 'player', frame: 4 }],
            frameRate: 20
        });

    // Controls
    cursors = this.input.keyboard.createCursorKeys();
    
    // Jump key (space bar) for jumping
    jumpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // Stars
    stars = this.physics.add.group({
        key: 'star',
        allowGravity: true 
    });
    
    // Enable stars to collide with the platforms
    this.physics.add.collider(stars, platforms);
    
    // Enable player collisions with stars
    this.physics.add.overlap(player, stars, collectStar, null, this);
    
    // Bombs
    bombs = this.physics.add.group({
        key: 'bomb',
        allowGravity: true 
    });
    
    // Enable bombs to collide with the platforms
    this.physics.add.collider(bombs, platforms);
    
    // Enable player collisions with bombs
    this.physics.add.overlap(player, bombs, hitBomb, null, this);
    
    // Create a text object for the score in the top right corner
    scoreText = this.add.text(650, 20, 'Stars Collected:' + score, {
        fontSize: '32px',
        fill: '#000000'
    });
    
    // Respawn time for stars if less than five
    nextStarTimer = this.time.addEvent({
        delay: 3000, // Delay (3 seconds)
        callback: createNewStar,
        callbackScope: this,
        loop: true // Repeat timer indefinitely
    });
    
    // Respawn bomb time periodically
    nextBombTimer = this.time.addEvent({
        delay:25000, // Delay (5 seconds)
        callback: createNewBomb,
        callbackScope: this,
        loop: true // Repeat timer indefinitely
    });
}

function collectStar(player, star) {
    // Remove the collected star from the scene
    star.destroy();
    
    // Remove the position of the collected star from the set of used positions
    usedStarPositions.delete(star.x);
    
    // Increment the player's score
    score += 1;
    scoreText.setText('Stars Collected: ' + score);
        
    // Change the player's color
    player.setTint(Phaser.Display.Color.HexStringToColor(rainbowColors[colorIndex]).color);
    
    // Update the color index
    colorIndex = (colorIndex + 1) % rainbowColors.length;

        // Increment the star counter
        starCounter++;
    
        // Increase player size by 10% every 5 stars
        if (starCounter % 5 === 0) {
            player.setScale(player.scaleX * 1.1, player.scaleY * 1.1);
            
            // Reset the star counter to 0
            starCounter = 0;
        }
    }


function createNewStar() {
    // Check if there are less than 5 stars 
    if (stars.getChildren().length < 5) {
        // Filter platforms array to include only platforms with a Y-coordinate less than or equal to 710
        var platformsArray = platforms.getChildren().filter(function(platform) {
            return platform.y <= 710;
        });

        // Choose a random platform from the filtered platforms array
        if (platformsArray.length > 0) {
            var randomPlatform;
            var starX, platformIndex;

            // Randomize star placement
            do {
                platformIndex = Phaser.Math.Between(0, platformsArray.length - 2);
                randomPlatform = platformsArray[platformIndex];
                
                // Choose a random position on platform
                starX = Phaser.Math.Between(randomPlatform.x - randomPlatform.width / 5, randomPlatform.x + randomPlatform.width / 1.5);
            } while (usedStarPositions.has(starX)); // Repeat if the position is already used

            // Add the chosen position to the set of used positions
            usedStarPositions.add(starX);
            
            // Create a new star at a position above the chosen platform
            var newStarY = -5; // Start the star above the screen
            
            // Add new star to stars group
            var newStar = stars.create(starX, newStarY, 'star');
            
            // Set properties for the new star
            newStar.setBounce(0.2);
            newStar.setCollideWorldBounds(true);
            newStar.setVelocityY(15); // Falling speed
        }
    }
}


function createNewBomb() {
    // Check if there are fewer bombs in the game
    if (bombs.getChildren().length < 3) {
        // Filter the platforms array to include only platforms with a Y-coordinate less than or equal to 710
        var platformsArray = platforms.getChildren().filter(function(platform) {
            return platform.y <= 710;
        });

        // Choose a random platform from the filtered platforms array
        if (platformsArray.length > 0) {
            var randomPlatform;
            var bombX, platformIndex;

            //Randomized Coordinate for bombs
            do {
                platformIndex = Phaser.Math.Between(0, platformsArray.length - 1);
                randomPlatform = platformsArray[platformIndex];
                
                // Random Coordinate (bomb)
                bombX = Phaser.Math.Between(randomPlatform.x - randomPlatform.width / 2, randomPlatform.x + randomPlatform.width / 2);
            } while (usedStarPositions.has(bombX)); // Repeat if the position is already used

            var newBombY = -40; 
            
            // Add the new bomb to the bombs group
            var newBomb = bombs.create(bombX, newBombY, 'bomb');
            
            // Set properties for the new bomb
            newBomb.setBounce(0.2);
            newBomb.setCollideWorldBounds(true);
            newBomb.setVelocityY(5); // Falling speed
        }
    }
}
 

function hitBomb(player, bomb) {
    // Stop the player from moving
    player.setVelocity(0, 0);

    // Remove player from the map
    player.setY(game.config.height + 100); 

    // Display "Game Over" message on the screen
    gameOverText = this.add.text(game.config.width / 2, game.config.height / 2, 'Game Over', {
        fontSize: '64px',
        fill: '#f00'
    }).setOrigin(0.5);

    // Stop the game
    this.physics.pause();
}

function update() {
    // Player Controls
    if (cursors.left.isDown) {
        player.setVelocityX(-200);
        player.anims.play('walk', true);
        player.flipX = false; 

    } else if (cursors.right.isDown) {
        player.setVelocityX(200);
        player.anims.play('walk', true); 
        player.flipX = true; 

    } else {
        player.setVelocityX(0);
        player.anims.play('idle'); 
    }

    // Jump Logic
    if (jumpKey.isDown && player.body.touching.down) {
        player.setVelocityY(-300); 
    }
}

