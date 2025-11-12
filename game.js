const config = {
    type: Phaser.AUTO,
    width: 480,
    height: 800,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 200 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    backgroundColor: '#1A123B'
};

const game = new Phaser.Game(config);
let score = 0;
let goal = 0;
let scoreText;
let goalText;
let operationText;
let selectedBubbles = [];
let level = 0;
const operations = ['+', 'x', '-', '/'];
let goalsCompleted = 0;
let particles;
let gameOver = false;
const gameOverLineY = 50;
const bubbleColors = [0xffff00, 0x00ff00, 0xff00ff, 0x00ffff, 0xffa500, 0x800080];
let popSound, levelUpSound;

function preload () {
    // No assets to preload for now
}

function create () {
    // Create sounds
    popSound = jsfxr.sfxr_to_audio_element([0,,0.07,0.36,0.39,0.52,,,,,,0.43,0.61,,,,,,,1,,,,,0.5]);
    levelUpSound = jsfxr.sfxr_to_audio_element([1,,0.25,0.5,0.25,0.75,,,,,,0.5,0.25,,,,,,,1,,,,,0.5]);

    // Add a starry background
    let bg = this.add.graphics();
    for (let i = 0; i < 100; i++) {
        bg.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.2, 0.6));
        const x = Phaser.Math.Between(0, game.config.width);
        const y = Phaser.Math.Between(0, game.config.height);
        const size = Phaser.Math.Between(1, 3);
        bg.fillCircle(x, y, size);
    }

    scoreText = this.add.text(game.config.width / 2, 50, 'Score: 0', { fontSize: '32px', fill: '#FF00FF' });
    scoreText.setOrigin(0.5);
    scoreText.setShadow(0, 0, '#FF00FF', 10);

    goalText = this.add.text(game.config.width / 2, 100, 'Goal: ' + goal, { fontSize: '32px', fill: '#00FFFF' });
    goalText.setOrigin(0.5);
    goalText.setShadow(0, 0, '#00FFFF', 10);

    operationText = this.add.text(game.config.width / 2, 150, 'Op: +', {fontSize: '32px', fill: '#ffffff' });
    operationText.setOrigin(0.5);

    const radius = 30;

    this.bubbles = this.physics.add.group();

    // Spawn a bubble every 1000ms
    this.bubbleSpawner = this.time.addEvent({
        delay: 1000,
        callback: () => {
            const x = Phaser.Math.Between(50, game.config.width - 50);
            const color = Phaser.Math.RND.pick(bubbleColors);

            let graphics = this.make.graphics();
            graphics.fillStyle(color, 1);
            graphics.fillCircle(radius, radius, radius);
            graphics.lineStyle(2, 0xffffff, 0.5);
            graphics.strokeCircle(radius, radius, radius);
            const textureName = 'bubble_' + color;
            graphics.generateTexture(textureName, radius * 2, radius * 2);
            graphics.destroy();

            const bubble = this.bubbles.create(x, 0, textureName);
            bubble.setBounce(0.5);
            bubble.setCollideWorldBounds(true);
            bubble.setCircle(radius);
            bubble.setInteractive();

            const number = generateBubbleNumber();
            bubble.setData('number', number);
            bubble.setData('color', color);
            const text = this.add.text(bubble.x, bubble.y, number, { fontSize: '24px', fill: '#fff', fontStyle: 'bold' });
            text.setOrigin(0.5);
            bubble.setData('text', text);

            if (this.bubbles.getChildren().length >= 2 && goal === 0) {
                generateGoal.call(this);
            }
        },
        callbackScope: this,
        loop: true
    });

    this.physics.add.collider(this.bubbles, this.bubbles);

    this.input.on('gameobjectdown', (pointer, gameObject) => {
        if (gameOver) {
            restartGame.call(this);
        } else if (this.bubbles.contains(gameObject)) {
            selectBubble.call(this, gameObject);
        }
    });
}

function update () {
    if (gameOver) return;

    this.bubbles.getChildren().forEach(bubble => {
        const text = bubble.getData('text');
        if (text) {
            text.x = bubble.x;
            text.y = bubble.y;
        }

        if (bubble.body.touching.up && bubble.y < gameOverLineY + bubble.height) {
            endGame.call(this);
        }
    });
}

function endGame() {
    gameOver = true;
    this.physics.pause();
    this.bubbleSpawner.remove();
    const gameOverText = this.add.text(game.config.width / 2, game.config.height / 2, 'Game Over\nClick to Restart', { fontSize: '48px', fill: '#ff0000', align: 'center' });
    gameOverText.setOrigin(0.5);
    gameOverText.setShadow(0, 0, '#ff0000', 10);
}

function restartGame() {
    gameOver = false;
    score = 0;
    goal = 0;
    level = 0;
    goalsCompleted = 0;
    selectedBubbles = [];
    this.scene.restart();
}


function generateBubbleNumber() {
    const operation = operations[level];
    if (operation === 'x' || operation === '/') {
        return Phaser.Math.Between(1, 10);
    }
    return Phaser.Math.Between(1, 20);
}

function generateGoal() {
    const activeBubbles = this.bubbles.getChildren();
    if (activeBubbles.length < 2) return;

    let firstBubble, secondBubble, tempGoal;
    let attempts = 0;
    const maxAttempts = 20;

    const operation = operations[level];

    while(attempts < maxAttempts) {
        firstBubble = Phaser.Math.RND.pick(activeBubbles);
        secondBubble = Phaser.Math.RND.pick(activeBubbles);

        if (firstBubble === secondBubble) {
            attempts++;
            continue;
        }

        const num1 = firstBubble.getData('number');
        const num2 = secondBubble.getData('number');

        switch (operation) {
            case '+':
                tempGoal = num1 + num2;
                break;
            case 'x':
                tempGoal = num1 * num2;
                break;
            case '-':
                tempGoal = Math.abs(num1 - num2);
                break;
            case '/':
                 if (num1 % num2 === 0) {
                    tempGoal = num1 / num2;
                } else if (num2 % num1 === 0) {
                    tempGoal = num2 / num1;
                } else {
                    attempts++;
                    continue;
                }
                break;
        }
        goal = tempGoal;
        goalText.setText('Goal: ' + goal);
        return;
    }
}

function selectBubble(bubble) {
    if (selectedBubbles.includes(bubble)) {
        selectedBubbles = selectedBubbles.filter(b => b !== bubble);
        bubble.clearTint();
        return;
    }

    selectedBubbles.push(bubble);
    bubble.setTint(0xcccccc);

    if (selectedBubbles.length === 2) {
        const num1 = selectedBubbles[0].getData('number');
        const num2 = selectedBubbles[1].getData('number');
        const operation = operations[level];
        let result;

        switch (operation) {
             case '+':
                result = num1 + num2;
                break;
            case 'x':
                result = num1 * num2;
                break;
            case '-':
                result = Math.abs(num1 - num2);
                break;
            case '/':
                if (num1 > num2 && num1 % num2 === 0) {
                    result = num1 / num2;
                } else if (num2 > num1 && num2 % num1 === 0) {
                    result = num2 / num1;
                }
                break;
        }

        if (result === goal) {
            popSound.play();
            score += 10;
            scoreText.setText('Score: ' + score);

            const feedbackText = this.add.text(selectedBubbles[0].x, selectedBubbles[0].y - 50, '+10', { fontSize: '32px', fill: '#00ff00' });
            this.tweens.add({
                targets: feedbackText,
                y: feedbackText.y - 50,
                alpha: 0,
                duration: 1000,
                ease: 'Power2',
                onComplete: () => {
                    feedbackText.destroy();
                }
            });

            selectedBubbles.forEach(b => {
                const emitter = this.add.particles(b.texture.key).createEmitter({
                    speed: 200,
                    scale: { start: 1, end: 0 },
                    blendMode: 'ADD',
                    lifespan: 500
                });
                emitter.explode(30, b.x, b.y);
                b.getData('text').destroy();
                b.destroy();
            });
            goalsCompleted++;
            if (goalsCompleted % 5 === 0) {
                levelUpSound.play();
                level = (level + 1) % operations.length;
                operationText.setText('Op: ' + operations[level]);
                const levelUpText = this.add.text(game.config.width/2, game.config.height/2, 'Level Up!', { fontSize: '48px', fill: '#00ff00' });
                levelUpTect.setOrigin(0.5);
                this.tweens.add({
                    targets: levelUpText,
                    alpha: 0,
                    duration: 2000,
                    ease: 'Power2',
                    onComplete: () => {
                        levelUpText.destroy();
                    }
                });
            }
            goal = 0;
            generateGoal.call(this);
        } else {
             selectedBubbles.forEach(b => b.clearTint());
        }
        selectedBubbles = [];
    }
}
