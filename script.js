// === КОНФИГУРАЦИЯ ИГРЫ ===
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Элементы UI
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const scoreValue = document.getElementById('score-value');
const levelValue = document.getElementById('level-value');

// Состояние игры
let gameRunning = false;
let score = 0;
let level = 1;
let keys = {};
let touchControls = { left: false, right: false, jump: false };

// === ИГРОВЫЕ ОБЪЕКТЫ ===
const player = {
    x: 50,
    y: 300,
    width: 40,
    height: 40,
    speed: 5,
    jumpPower: -12,
    velocityY: 0,
    gravity: 0.6,
    grounded: false,
    color: '#8B4513',
    facingRight: true
};

// Платформы
let platforms = [];

// Враги
let enemies = [];

// Коллекционные предметы
let collectibles = [];

// Зоны головоломок (ключи и двери)
let puzzleElements = [];

// Частицы для эффектов
let particles = [];

// === ИНИЦИАЛИЗАЦИЯ УРОВНЯ ===
function initLevel(levelNum) {
    platforms = [];
    enemies = [];
    collectibles = [];
    puzzleElements = [];
    player.x = 50;
    player.y = 300;
    player.velocityY = 0;
    
    // Границы уровня (пол и стены)
    platforms.push({ x: 0, y: 550, width: 800, height: 50, color: '#8B4513' }); // Пол
    
    if (levelNum === 1) {
        // Уровень 1: Обучение прыжкам
        platforms.push({ x: 200, y: 450, width: 100, height: 20, color: '#228B22' });
        platforms.push({ x: 400, y: 380, width: 100, height: 20, color: '#228B22' });
        platforms.push({ x: 600, y: 300, width: 100, height: 20, color: '#228B22' });
        
        // Коллекционные предметы (золотые перья)
        collectibles.push({ x: 230, y: 410, width: 20, height: 20, collected: false });
        collectibles.push({ x: 430, y: 340, width: 20, height: 20, collected: false });
        collectibles.push({ x: 630, y: 260, width: 20, height: 20, collected: false });
        
    } else if (levelNum === 2) {
        // Уровень 2: Враги
        platforms.push({ x: 150, y: 450, width: 120, height: 20, color: '#228B22' });
        platforms.push({ x: 350, y: 380, width: 120, height: 20, color: '#228B22' });
        platforms.push({ x: 550, y: 300, width: 120, height: 20, color: '#228B22' });
        platforms.push({ x: 300, y: 220, width: 200, height: 20, color: '#228B22' });
        
        // Враги (Змей Горыныч - красный кружок)
        enemies.push({ 
            x: 350, y: 350, width: 30, height: 30, 
            speed: 2, direction: 1, 
            minX: 350, maxX: 470,
            color: '#FF4500'
        });
        
        collectibles.push({ x: 190, y: 410, width: 20, height: 20, collected: false });
        collectibles.push({ x: 390, y: 340, width: 20, height: 20, collected: false });
        collectibles.push({ x: 590, y: 260, width: 20, height: 20, collected: false });
        collectibles.push({ x: 390, y: 180, width: 20, height: 20, collected: false });
        
    } else if (levelNum === 3) {
        // Уровень 3: Головоломка с ключом
        platforms.push({ x: 100, y: 450, width: 100, height: 20, color: '#228B22' });
        platforms.push({ x: 300, y: 380, width: 100, height: 20, color: '#228B22' });
        platforms.push({ x: 500, y: 300, width: 100, height: 20, color: '#228B22' });
        platforms.push({ x: 650, y: 220, width: 100, height: 20, color: '#228B22' });
        
        // Ключ
        puzzleElements.push({ 
            type: 'key', x: 680, y: 180, width: 20, height: 20, 
            collected: false, color: '#FFD700' 
        });
        
        // Дверь (выход с уровня)
        puzzleElements.push({ 
            type: 'door', x: 50, y: 480, width: 40, height: 70, 
            unlocked: false, color: '#8B0000' 
        });
        
        collectibles.push({ x: 130, y: 410, width: 20, height: 20, collected: false });
        collectibles.push({ x: 330, y: 340, width: 20, height: 20, collected: false });
        
    } else {
        // Случайная генерация для следующих уровней
        for (let i = 0; i < 5; i++) {
            platforms.push({ 
                x: 150 + i * 130, 
                y: 450 - i * 50, 
                width: 100, 
                height: 20, 
                color: '#228B22' 
            });
        }
        
        if (levelNum % 2 === 0) {
            enemies.push({ 
                x: 300, y: 350, width: 30, height: 30, 
                speed: 2 + levelNum * 0.5, direction: 1, 
                minX: 250, maxX: 550,
                color: '#FF4500'
            });
        }
        
        for (let i = 0; i < 3 + levelNum; i++) {
            collectibles.push({ 
                x: 200 + i * 150, 
                y: 200 + Math.random() * 300, 
                width: 20, 
                height: 20, 
                collected: false 
            });
        }
    }
}

// === УПРАВЛЕНИЕ ===
// Клавиатура
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // Прыжок по пробелу
    if (e.key === ' ' || e.key === 'ArrowUp') {
        if (player.grounded) {
            player.velocityY = player.jumpPower;
            player.grounded = false;
            createParticles(player.x + player.width/2, player.y + player.height, '#FFF', 5);
        }
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Touch-управление для планшетов
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    
    const rect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;
    
    // Определение зон управления
    const screenWidth = canvas.width;
    const screenHeight = canvas.height;
    
    // Левая часть - влево, правая - вправо, верх - прыжок
    if (touchY < screenHeight / 3) {
        touchControls.jump = true;
        if (player.grounded) {
            player.velocityY = player.jumpPower;
            player.grounded = false;
            createParticles(player.x + player.width/2, player.y + player.height, '#FFF', 5);
        }
    } else if (touchX < screenWidth / 2) {
        touchControls.left = true;
    } else {
        touchControls.right = true;
    }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    touchControls.left = false;
    touchControls.right = false;
    touchControls.jump = false;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

// === ФИЗИКА И ЛОГИКА ===
function update() {
    if (!gameRunning) return;
    
    // Горизонтальное движение
    player.velocityX = 0;
    
    if (keys.ArrowLeft || keys.a || keys.A || touchControls.left) {
        player.velocityX = -player.speed;
        player.facingRight = false;
    }
    if (keys.ArrowRight || keys.d || keys.D || touchControls.right) {
        player.velocityX = player.speed;
        player.facingRight = true;
    }
    
    // Гравитация
    player.velocityY += player.gravity;
    
    // Применение скорости
    player.x += player.velocityX;
    player.y += player.velocityY;
    
    // Границы экрана
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    
    // Проверка столкновений с платформами
    player.grounded = false;
    platforms.forEach(platform => {
        if (checkCollision(player, platform)) {
            // Приземление на платформу
            if (player.velocityY > 0 && player.y + player.height - player.velocityY <= platform.y) {
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.grounded = true;
            }
            // Удар головой о платформу
            else if (player.velocityY < 0 && player.y - player.velocityY >= platform.y + platform.height) {
                player.y = platform.y + platform.height;
                player.velocityY = 0;
            }
        }
    });
    
    // Смерть при падении
    if (player.y > canvas.height) {
        resetLevel();
    }
    
    // Обновление врагов
    enemies.forEach(enemy => {
        enemy.x += enemy.speed * enemy.direction;
        
        // Разворот врага
        if (enemy.x <= enemy.minX || enemy.x + enemy.width >= enemy.maxX) {
            enemy.direction *= -1;
        }
        
        // Столкновение с игроком
        if (checkCollision(player, enemy)) {
            // Если игрок прыгает сверху - враг повержен
            if (player.velocityY > 0 && player.y + player.height - player.velocityY <= enemy.y) {
                enemy.defeated = true;
                player.velocityY = -8; // Отскок
                score += 5;
                createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#FF4500', 10);
            } else {
                // Иначе игрок получает урон
                resetLevel();
            }
        }
    });
    
    // Удаление поверженных врагов
    enemies = enemies.filter(enemy => !enemy.defeated);
    
    // Сбор предметов
    collectibles.forEach(item => {
        if (!item.collected && checkCollision(player, item)) {
            item.collected = true;
            score++;
            scoreValue.textContent = score;
            createParticles(item.x + item.width/2, item.y + item.height/2, '#FFD700', 8);
        }
    });
    
    // Головоломки
    puzzleElements.forEach(element => {
        if (element.type === 'key' && !element.collected && checkCollision(player, element)) {
            element.collected = true;
            createParticles(element.x + element.width/2, element.y + element.height/2, '#FFD700', 10);
            
            // Разблокировать все двери
            puzzleElements.forEach(p => {
                if (p.type === 'door') p.unlocked = true;
            });
        }
        
        if (element.type === 'door' && element.unlocked && checkCollision(player, element)) {
            // Переход на следующий уровень
            nextLevel();
        }
    });
    
    // Обновление частиц
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        return p.life > 0;
    });
    
    // Проверка перехода на следующий уровень (если собраны все предметы и нет головоломки)
    if (level <= 3 && collectibles.every(c => c.collected) && puzzleElements.length === 0) {
        setTimeout(nextLevel, 1000);
    }
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 30,
            color: color
        });
    }
}

function resetLevel() {
    initLevel(level);
}

function nextLevel() {
    level++;
    levelValue.textContent = level;
    initLevel(level);
    createParticles(canvas.width/2, canvas.height/2, '#FFD700', 30);
}

// === ОТРИСОВКА ===
function draw() {
    // Очистка
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Фон (небо)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Платформы
    platforms.forEach(platform => {
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // Трава сверху платформы
        ctx.fillStyle = '#32CD32';
        ctx.fillRect(platform.x, platform.y, platform.width, 5);
    });
    
    // Коллекционные предметы (золотые перья)
    collectibles.forEach(item => {
        if (!item.collected) {
            ctx.fillStyle = item.color || '#FFD700';
            ctx.beginPath();
            ctx.ellipse(
                item.x + item.width/2, 
                item.y + item.height/2, 
                item.width/2, 
                item.height/3, 
                Math.PI / 4, 
                0, 
                Math.PI * 2
            );
            ctx.fill();
            
            // Блеск
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(item.x + item.width/3, item.y + item.height/3, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    // Враги
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // Глаза
        ctx.fillStyle = '#FFF';
        ctx.fillRect(enemy.x + 5, enemy.y + 8, 8, 8);
        ctx.fillRect(enemy.x + enemy.width - 13, enemy.y + 8, 8, 8);
        ctx.fillStyle = '#000';
        ctx.fillRect(enemy.x + 7, enemy.y + 10, 4, 4);
        ctx.fillRect(enemy.x + enemy.width - 11, enemy.y + 10, 4, 4);
    });
    
    // Элементы головоломок
    puzzleElements.forEach(element => {
        if (element.type === 'key' && !element.collected) {
            ctx.fillStyle = element.color;
            ctx.fillRect(element.x + 8, element.y, 4, 20);
            ctx.beginPath();
            ctx.arc(element.x + 10, element.y + 10, 8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        if (element.type === 'door') {
            ctx.fillStyle = element.unlocked ? '#228B22' : element.color;
            ctx.fillRect(element.x, element.y, element.width, element.height);
            
            // Ручка двери
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(element.x + element.width - 10, element.y + element.height/2, 4, 0, Math.PI * 2);
            ctx.fill();
            
            if (element.unlocked) {
                ctx.fillStyle = '#FFF';
                ctx.font = '12px Arial';
                ctx.fillText('ВЫХОД', element.x - 5, element.y - 5);
            }
        }
    });
    
    // Игрок (Конёк-Горбунок)
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Горб
    ctx.fillStyle = '#A0522D';
    ctx.beginPath();
    ctx.arc(
        player.x + player.width/2, 
        player.y + 10, 
        12, 
        Math.PI, 
        0
    );
    ctx.fill();
    
    // Голова
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(
        player.x + (player.facingRight ? player.width - 10 : 10), 
        player.y + 10, 
        10, 
        0, 
        Math.PI * 2
    );
    ctx.fill();
    
    // Глаз
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(
        player.x + (player.facingRight ? player.width - 7 : 7), 
        player.y + 8, 
        4, 
        0, 
        Math.PI * 2
    );
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(
        player.x + (player.facingRight ? player.width - 6 : 6), 
        player.y + 8, 
        2, 
        0, 
        Math.PI * 2
    );
    ctx.fill();
    
    // Частицы
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 30;
        ctx.fillRect(p.x, p.y, 4, 4);
        ctx.globalAlpha = 1;
    });
    
    // Подсказка для touch-управления
    if ('ontouchstart' in window && gameRunning) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '14px Arial';
        ctx.fillText('← → для движения, верх для прыжка', 10, canvas.height - 10);
    }
}

// === ИГРОВОЙ ЦИКЛ ===
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// === ЗАПУСК ===
startBtn.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    gameRunning = true;
    initLevel(1);
});

// Запуск цикла
gameLoop();
