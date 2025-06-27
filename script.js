// ゲーム要素の取得
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');
const jumpBtn = document.getElementById('jumpBtn');
const slideBtn = document.getElementById('slideBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');

// ゲーム変数
let gameRunning = false;
let score = 0;
let gameSpeed = 3;
let keys = {};

// プレイヤー（ロボット）
const player = {
    x: 100,
    y: canvas.height - 80,
    width: 40,
    height: 40,
    velocityY: 0,
    velocityX: 0,
    jumping: false,
    sliding: false,
    color: '#00ffff',
    maxSpeed: 5,
    acceleration: 0.5,
    friction: 0.8
};

// 障害物配列
let obstacles = [];

// 背景要素配列
let backgroundElements = [];

// パーティクル配列
let particles = [];

// サウンド要素の作成
const bgm = new Audio('audio/run.mp3');
bgm.loop = true; // BGMをループ再生
bgm.volume = 0.5; // BGMの音量を調整

const jumpSound = new Audio('audio/tobu.mp3');
jumpSound.volume = 0.7; // ジャンプ効果音の音量を調整


// ゲーム初期化
function initGame() {
    gameRunning = true;
    score = 0;
    gameSpeed = 3;
    obstacles = [];
    particles = [];
    backgroundElements = [];
    
    // プレイヤーリセット
    player.x = 100;
    player.y = canvas.height - 80;
    player.velocityY = 0;
    player.velocityX = 0;
    player.jumping = false;
    player.sliding = false;
    
    // 背景要素を生成
    generateBackgroundElements();
    
    // ゲームオーバー画面を隠す
    gameOverElement.classList.add('hidden');
    
    // BGM再生開始
    bgm.play();

    // ゲームループ開始
    gameLoop();
}

// 背景要素生成
function generateBackgroundElements() {
    // ビル群
    for (let i = 0; i < 10; i++) {
        backgroundElements.push({
            type: 'building',
            x: i * 150,
            y: Math.random() * 200 + 50,
            width: 80 + Math.random() * 40,
            height: 150 + Math.random() * 100,
            color: `hsl(${200 + Math.random() * 60}, 50%, ${20 + Math.random() * 30}%)`
        });
    }
    
    // ネオンライト
    for (let i = 0; i < 20; i++) {
        backgroundElements.push({
            type: 'neon',
            x: Math.random() * canvas.width * 2,
            y: Math.random() * canvas.height,
            size: 3 + Math.random() * 5,
            color: ['#ff6b6b', '#00ffff', '#ffff00', '#ff00ff'][Math.floor(Math.random() * 4)],
            alpha: 0.5 + Math.random() * 0.5
        });
    }
}

// プレイヤー描画
function drawPlayer() {
    ctx.save();
    
    // ロボットの光る効果
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 20;
    
    // メインボディ
    ctx.fillStyle = player.color;
    const bodyY = player.sliding ? player.y + 15 : player.y;
    const bodyHeight = player.sliding ? 25 : player.height;
    
    ctx.fillRect(player.x, bodyY, player.width, bodyHeight);
    
    // ロボットの目
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(player.x + 8, bodyY + 8, 8, 8);
    ctx.fillRect(player.x + 24, bodyY + 8, 8, 8);
    
    // ロボットの腕（スライド時は隠す）
    if (!player.sliding) {
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x - 8, bodyY + 15, 8, 15);
        ctx.fillRect(player.x + player.width, bodyY + 15, 8, 15);
    }
    
    // パーティクル効果
    if (Math.random() < 0.3) {
        particles.push({
            x: player.x + player.width / 2,
            y: bodyY + bodyHeight,
            velocityX: -2 - Math.random() * 3,
            velocityY: -1 - Math.random() * 2,
            life: 30,
            color: player.color,
            size: 2 + Math.random() * 3
        });
    }
    
    ctx.restore();
}

// 障害物生成
function generateObstacle() {
    const types = ['box', 'laser', 'floating', 'wide'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    if (type === 'box') {
        obstacles.push({
            type: 'box',
            x: canvas.width,
            y: canvas.height - 60,
            width: 40,
            height: 40,
            color: '#ff6b6b'
        });
    } else if (type === 'laser') {
        obstacles.push({
            type: 'laser',
            x: canvas.width,
            y: canvas.height - 120,
            width: 60,
            height: 10,
            color: '#ff0000',
            glowIntensity: Math.random() * 20 + 10
        });
    } else if (type === 'floating') {
        // 浮いている障害物（ジャンプでは避けられない）
        obstacles.push({
            type: 'floating',
            x: canvas.width,
            y: canvas.height - 160,
            width: 80,
            height: 30,
            color: '#ff9900',
            glowIntensity: 15
        });
    } else if (type === 'wide') {
        // 幅広い障害物（左右移動が必要）
        obstacles.push({
            type: 'wide',
            x: canvas.width,
            y: canvas.height - 100,
            width: 120,
            height: 80,
            color: '#ff0066'
        });
    }
}

// 障害物描画
function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.save();
        
        if (obstacle.type === 'box') {
            // メタルボックス
            ctx.shadowColor = obstacle.color;
            ctx.shadowBlur = 15;
            ctx.fillStyle = obstacle.color;
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // メタルの質感
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, 5);
        } else if (obstacle.type === 'laser') {
            // レーザートラップ
            ctx.shadowColor = obstacle.color;
            ctx.shadowBlur = obstacle.glowIntensity;
            ctx.fillStyle = obstacle.color;
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // レーザーの点滅効果
            if (Math.random() < 0.5) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(obstacle.x + 2, obstacle.y + 2, obstacle.width - 4, obstacle.height - 4);
            }
        } else if (obstacle.type === 'floating') {
            // 浮遊障害物
            ctx.shadowColor = obstacle.color;
            ctx.shadowBlur = obstacle.glowIntensity;
            ctx.fillStyle = obstacle.color;
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // 浮遊エフェクト
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            const offset = Math.sin(Date.now() * 0.01) * 3;
            ctx.fillRect(obstacle.x, obstacle.y + offset, obstacle.width, obstacle.height);
        } else if (obstacle.type === 'wide') {
            // 幅広障害物
            ctx.shadowColor = obstacle.color;
            ctx.shadowBlur = 20;
            ctx.fillStyle = obstacle.color;
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // 危険マーク
            ctx.fillStyle = '#ffff00';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⚠', obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2 + 7);
        }
        
        ctx.restore();
    });
}

// 背景描画
function drawBackground() {
    // グラデーション背景
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a0f23');
    gradient.addColorStop(0.5, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 背景要素描画
    backgroundElements.forEach(element => {
        if (element.type === 'building') {
            ctx.fillStyle = element.color;
            ctx.fillRect(element.x, element.y, element.width, element.height);
            
            // ビルの窓
            ctx.fillStyle = '#ffff00';
            for (let i = 0; i < 5; i++) {
                for (let j = 0; j < 8; j++) {
                    if (Math.random() < 0.3) {
                        ctx.fillRect(
                            element.x + 10 + i * 12,
                            element.y + 10 + j * 15,
                            8, 8
                        );
                    }
                }
            }
        } else if (element.type === 'neon') {
            ctx.save();
            ctx.globalAlpha = element.alpha;
            ctx.shadowColor = element.color;
            ctx.shadowBlur = 10;
            ctx.fillStyle = element.color;
            ctx.fillRect(element.x, element.y, element.size, element.size);
            ctx.restore();
        }
    });
    
    // 地面
    ctx.fillStyle = '#333';
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
    
    // 地面のライン
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 20);
    ctx.lineTo(canvas.width, canvas.height - 20);
    ctx.stroke();
}

// パーティクル描画
function drawParticles() {
    particles.forEach((particle, index) => {
        ctx.save();
        ctx.globalAlpha = particle.life / 30;
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 5;
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        ctx.restore();
        
        // パーティクル更新
        particle.x += particle.velocityX;
        particle.y += particle.velocityY;
        particle.life--;
        
        // 古いパーティクルを削除
        if (particle.life <= 0) {
            particles.splice(index, 1);
        }
    });
}

// プレイヤー更新
function updatePlayer() {
    // 左右移動の処理
    if (keys['ArrowLeft'] || keys['a']) {
        player.velocityX = Math.max(player.velocityX - player.acceleration, -player.maxSpeed);
    } else if (keys['ArrowRight'] || keys['d']) {
        player.velocityX = Math.min(player.velocityX + player.acceleration, player.maxSpeed);
    } else {
        // 摩擦で減速
        player.velocityX *= player.friction;
        if (Math.abs(player.velocityX) < 0.1) {
            player.velocityX = 0;
        }
    }
    
    // 横移動の適用
    player.x += player.velocityX;
    
    // 画面端での制限
    if (player.x < 0) {
        player.x = 0;
        player.velocityX = 0;
    }
    if (player.x > canvas.width - player.width) {
        player.x = canvas.width - player.width;
        player.velocityX = 0;
    }
    
    // 重力
    if (player.jumping) {
        player.velocityY += 0.8;
        player.y += player.velocityY;
        
        // 地面に着地
        if (player.y >= canvas.height - 80) {
            player.y = canvas.height - 80;
            player.jumping = false;
            player.velocityY = 0;
        }
    }
}

// 障害物更新
function updateObstacles() {
    // 障害物移動
    obstacles.forEach((obstacle, index) => {
        obstacle.x -= gameSpeed;
        
        // 画面外の障害物を削除
        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(index, 1);
            score += 10;
        }
    });
    
    // 新しい障害物生成
    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width - 200) {
        generateObstacle();
    }
}

// 背景更新
function updateBackground() {
    backgroundElements.forEach(element => {
        if (element.type === 'building') {
            element.x -= gameSpeed * 0.3;
            if (element.x + element.width < 0) {
                element.x = canvas.width + Math.random() * 100;
            }
        } else if (element.type === 'neon') {
            element.x -= gameSpeed * 0.5;
            if (element.x < 0) {
                element.x = canvas.width + Math.random() * 100;
            }
        }
    });
}

// 衝突判定
function checkCollision() {
    const playerRect = {
        x: player.x,
        y: player.sliding ? player.y + 15 : player.y,
        width: player.width,
        height: player.sliding ? 25 : player.height
    };
    
    obstacles.forEach(obstacle => {
        if (playerRect.x < obstacle.x + obstacle.width &&
            playerRect.x + playerRect.width > obstacle.x &&
            playerRect.y < obstacle.y + obstacle.height &&
            playerRect.y + playerRect.height > obstacle.y) {
            gameOver();
        }
    });
}

// 移動関数
function moveLeft() {
    keys['ArrowLeft'] = true;
}

function moveRight() {
    keys['ArrowRight'] = true;
}

function stopMove() {
    keys['ArrowLeft'] = false;
    keys['ArrowRight'] = false;
}

// ジャンプ
function jump() {
    if (!player.jumping && !player.sliding) {
        player.jumping = true;
        player.velocityY = -15;
        jumpSound.currentTime = 0; // 効果音を最初から再生
        jumpSound.play();
    }
}

// スライド
function slide() {
    if (!player.jumping) {
        player.sliding = true;
        setTimeout(() => {
            player.sliding = false;
        }, 500);
    }
}

// ゲームオーバー
function gameOver() {
    gameRunning = false;
    finalScoreElement.textContent = score;
    gameOverElement.classList.remove('hidden');
    bgm.pause(); // BGMを停止
    bgm.currentTime = 0; // BGMを最初に戻す
}

// ゲームループ
function gameLoop() {
    if (!gameRunning) return;
    
    // 画面クリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 描画・更新
    drawBackground();
    updateBackground();
    updatePlayer();
    updateObstacles();
    drawPlayer();
    drawObstacles();
    drawParticles();
    
    // 衝突判定
    checkCollision();
    
    // スコア更新
    score += 1;
    scoreElement.textContent = score;
    
    // ゲームスピード上昇
    if (score % 500 === 0) {
        gameSpeed += 0.5;
    }
    
    // 次のフレーム
    requestAnimationFrame(gameLoop);
}

// イベントリスナー
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        jump();
    }
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        slide();
    }
    if (e.key === 'ArrowLeft' || e.key === 'a') {
        e.preventDefault();
    }
    if (e.key === 'ArrowRight' || e.key === 'd') {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// ボタンイベント
jumpBtn.addEventListener('click', jump);
slideBtn.addEventListener('click', slide);
restartBtn.addEventListener('click', initGame);

// 移動ボタンイベント
leftBtn.addEventListener('mousedown', moveLeft);
leftBtn.addEventListener('mouseup', stopMove);
leftBtn.addEventListener('mouseleave', stopMove);
rightBtn.addEventListener('mousedown', moveRight);
rightBtn.addEventListener('mouseup', stopMove);
rightBtn.addEventListener('mouseleave', stopMove);

// タッチイベント（スマホ対応）
jumpBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    jump();
});

slideBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    slide();
});

leftBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    moveLeft();
});

leftBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    stopMove();
});

rightBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    moveRight();
});

rightBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    stopMove();
});

// キャンバスリサイズ（レスポンシブ対応）
function resizeCanvas() {
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    
    if (window.innerWidth <= 768) {
        canvas.width = Math.min(400, containerWidth - 40);
        canvas.height = 200;
    } else {
        canvas.width = 800;
        canvas.height = 400;
    }
    
    // プレイヤーの位置を再調整
    player.y = canvas.height - 80;
}

// 画面リサイズ時の処理
window.addEventListener('resize', resizeCanvas);

// 初期化
resizeCanvas();
initGame();