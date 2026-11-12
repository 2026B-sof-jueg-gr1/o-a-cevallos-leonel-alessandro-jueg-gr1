/* ============================================================
   CARRERAS ARCADE - Juego de carreras top-down con Phaser 3
   ============================================================
   Archivo principal: configuración, escenas y lógica del juego.
   Versión 2.0 — Con monedas, vidas, niveles y récords.
   ============================================================ */

// ============================================================
// CONSTANTES DE CONFIGURACIÓN
// ============================================================

const CONFIG = {
    // Dimensiones del juego
    GAME_WIDTH: 480,
    GAME_HEIGHT: 720,

    // Carretera
    ROAD_COLOR: 0x555555,
    ROAD_SHOULDER_COLOR: 0x333333,
    ROAD_EDGE_COLOR: 0xffffff,
    LANE_LINE_COLOR: 0xffffff,
    GRASS_COLOR: 0x2d8a4e,
    ROAD_LEFT_X: 90,
    ROAD_RIGHT_X: 390,
    ROAD_WIDTH: 300,
    NUM_LANES: 4,
    LANE_LINE_WIDTH: 3,
    LANE_LINE_LENGTH: 40,
    LANE_LINE_GAP: 30,

    // Jugador
    PLAYER_WIDTH: 32,
    PLAYER_HEIGHT: 56,
    PLAYER_COLOR: 0x00ccff,
    PLAYER_SPEED: 250,
    PLAYER_START_Y_OFFSET: 150,

    // Vidas (M4)
    PLAYER_LIVES: 3,
    INVULNERABILITY_DURATION: 2000,   // Milisegundos de invulnerabilidad tras daño
    INVULNERABILITY_BLINK_MS: 100,    // Velocidad del parpadeo en ms

    // Obstáculos
    OBSTACLE_MIN_SPEED: 100,
    OBSTACLE_MAX_SPEED: 200,
    OBSTACLE_WIDTH: 32,
    OBSTACLE_HEIGHT: 56,
    OBSTACLE_SPAWN_INTERVAL: 1200,
    OBSTACLE_MIN_SPAWN_INTERVAL: 500,
    OBSTACLE_COLORS: [0xff4444, 0xffaa00, 0x44ff44, 0xaa44ff, 0xff44aa, 0xffff44],

    // Monedas (M2)
    COIN_RADIUS: 10,
    COIN_COLOR: 0xffd700,
    COIN_INNER_COLOR: 0xffec80,
    COIN_SPAWN_INTERVAL: 2500,        // ms entre monedas (base)
    COIN_MIN_SPAWN_INTERVAL: 1500,    // ms mínimo entre monedas

    // Velocidad de la carretera
    ROAD_INITIAL_SPEED: 200,
    ROAD_MAX_SPEED: 600,
    ROAD_ACCELERATION: 5,

    // Puntuación
    SCORE_PER_SECOND: 10,

    // Niveles de dificultad (M1)
    LEVEL_SCORE_THRESHOLD: 500,       // Puntos entre niveles
    LEVEL_MAX: 8,                     // Nivel máximo de dificultad
    LEVEL_SPAWN_REDUCTION: 0.08,      // Reducción del intervalo de spawn por nivel (8%)
    LEVEL_SPEED_INCREASE: 0.07,       // Aumento de velocidad de obstáculos por nivel (7%)
    LEVEL_DOUBLE_SPAWN_LEVEL: 3,      // Nivel a partir del cual puede haber spawns dobles
    LEVEL_DOUBLE_SPAWN_CHANCE: 0.25,  // Probabilidad de spawn doble (25%)

    // UI
    UI_FONT_FAMILY: 'Courier New, monospace',
    UI_FONT_SIZE: '18px',
    UI_TITLE_SIZE: '42px',
    UI_COLOR: '#ffffff',
    UI_HIGHLIGHT_COLOR: '#00ccff',

    // Diagonal: factor para normalizar (1 / sqrt(2))
    DIAGONAL_FACTOR: 0.7071
};

// ============================================================
// SISTEMA DE RÉCORDS — localStorage (M6)
// ============================================================

/**
 * Lee la mejor puntuación guardada.
 * @returns {number} Mejor puntuación, o 0 si no existe.
 */
function getHighScore() {
    try {
        return parseInt(localStorage.getItem('carreras_phaser_highScore'), 10) || 0;
    } catch (e) {
        return 0;
    }
}

/**
 * Guarda la puntuación si supera el récord actual.
 * @param {number} score - Puntuación a evaluar.
 * @returns {boolean} true si es un nuevo récord.
 */
function saveHighScore(score) {
    try {
        const current = getHighScore();
        if (score > current) {
            localStorage.setItem('carreras_phaser_highScore', String(score));
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

/**
 * Lee la mejor cantidad de monedas guardada.
 * @returns {number} Mejor cantidad de monedas, o 0 si no existe.
 */
function getHighCoins() {
    try {
        return parseInt(localStorage.getItem('carreras_phaser_highCoins'), 10) || 0;
    } catch (e) {
        return 0;
    }
}

/**
 * Guarda las monedas si superan el récord actual.
 * @param {number} coins - Monedas a evaluar.
 */
function saveHighCoins(coins) {
    try {
        const current = getHighCoins();
        if (coins > current) {
            localStorage.setItem('carreras_phaser_highCoins', String(coins));
        }
    } catch (e) {
        // Silenciar error — el juego funciona sin localStorage
    }
}

// ============================================================
// ESCENA: MENÚ PRINCIPAL (MenuScene)
// ============================================================

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const centerX = CONFIG.GAME_WIDTH / 2;

        this.cameras.main.setBackgroundColor('#1a1a2e');

        // Carretera decorativa de fondo
        this._drawBackgroundRoad();

        // Panel semitransparente
        const panel = this.add.graphics();
        panel.fillStyle(0x000000, 0.7);
        panel.fillRoundedRect(centerX - 180, 80, 360, 560, 16);

        // Título
        this.add.text(centerX, 130, '🏎️ CARRERAS', {
            fontFamily: CONFIG.UI_FONT_FAMILY,
            fontSize: CONFIG.UI_TITLE_SIZE,
            color: CONFIG.UI_HIGHLIGHT_COLOR,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(centerX, 180, 'ARCADE', {
            fontFamily: CONFIG.UI_FONT_FAMILY,
            fontSize: '32px',
            color: CONFIG.UI_COLOR,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Récord (M6)
        const highScore = getHighScore();
        if (highScore > 0) {
            this.add.text(centerX, 225, '🏆 RÉCORD: ' + highScore, {
                fontFamily: CONFIG.UI_FONT_FAMILY,
                fontSize: '18px',
                color: '#ffd700',
                fontStyle: 'bold'
            }).setOrigin(0.5);
        }

        // Descripción
        this.add.text(centerX, 280, 'Esquiva los vehículos,\nrecoge monedas y\nsobrevive el mayor\ntiempo posible.', {
            fontFamily: CONFIG.UI_FONT_FAMILY,
            fontSize: '15px',
            color: '#cccccc',
            align: 'center',
            lineSpacing: 5
        }).setOrigin(0.5);

        // Controles
        this.add.text(centerX, 375, '— CONTROLES —', {
            fontFamily: CONFIG.UI_FONT_FAMILY,
            fontSize: '16px',
            color: CONFIG.UI_HIGHLIGHT_COLOR,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const controls = [
            'W  -  Avanzar',
            'S  -  Retroceder',
            'A  -  Izquierda',
            'D  -  Derecha'
        ];
        controls.forEach((line, index) => {
            this.add.text(centerX, 408 + index * 26, line, {
                fontFamily: CONFIG.UI_FONT_FAMILY,
                fontSize: '14px',
                color: '#aaaaaa'
            }).setOrigin(0.5);
        });

        // Información de vidas y monedas
        this.add.text(centerX, 525, '♥ 3 vidas  •  Recoge monedas doradas', {
            fontFamily: CONFIG.UI_FONT_FAMILY,
            fontSize: '12px',
            color: '#888888'
        }).setOrigin(0.5);

        // Botón de inicio
        this._createButton(centerX, 570, 'COMENZAR', () => {
            this.scene.start('GameScene');
        });
    }

    /**
     * Dibuja carretera decorativa de fondo en el menú.
     */
    _drawBackgroundRoad() {
        const graphics = this.add.graphics();

        graphics.fillStyle(CONFIG.GRASS_COLOR, 0.3);
        graphics.fillRect(0, 0, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT);

        graphics.fillStyle(CONFIG.ROAD_COLOR, 0.3);
        graphics.fillRect(CONFIG.ROAD_LEFT_X, 0, CONFIG.ROAD_WIDTH, CONFIG.GAME_HEIGHT);

        graphics.lineStyle(2, CONFIG.LANE_LINE_COLOR, 0.15);
        const laneWidth = CONFIG.ROAD_WIDTH / CONFIG.NUM_LANES;
        for (let i = 1; i < CONFIG.NUM_LANES; i++) {
            const x = CONFIG.ROAD_LEFT_X + i * laneWidth;
            for (let y = 0; y < CONFIG.GAME_HEIGHT; y += CONFIG.LANE_LINE_LENGTH + CONFIG.LANE_LINE_GAP) {
                graphics.beginPath();
                graphics.moveTo(x, y);
                graphics.lineTo(x, y + CONFIG.LANE_LINE_LENGTH);
                graphics.strokePath();
            }
        }
    }

    /**
     * Crea un botón interactivo con hover.
     */
    _createButton(x, y, label, callback) {
        const buttonWidth = 200;
        const buttonHeight = 50;

        const bg = this.add.graphics();
        bg.fillStyle(0x00aacc, 1);
        bg.fillRoundedRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight, 12);

        this.add.text(x, y, label, {
            fontFamily: CONFIG.UI_FONT_FAMILY,
            fontSize: '22px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const hitArea = this.add.zone(x, y, buttonWidth, buttonHeight).setInteractive({ useHandCursor: true });

        hitArea.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x00ddff, 1);
            bg.fillRoundedRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight, 12);
        });

        hitArea.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x00aacc, 1);
            bg.fillRoundedRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight, 12);
        });

        hitArea.on('pointerdown', callback);
    }
}

// ============================================================
// ESCENA: JUEGO PRINCIPAL (GameScene)
// ============================================================

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // --- Estado principal ---
        this.isGameOver = false;
        this.score = 0;
        this.roadSpeed = CONFIG.ROAD_INITIAL_SPEED;
        this.laneLineOffset = 0;
        this.scoreAccumulator = 0;
        this.spawnAccumulator = 0;
        this.currentSpawnInterval = CONFIG.OBSTACLE_SPAWN_INTERVAL;

        // --- Estado de monedas (M2) ---
        this.coins = 0;
        this.coinSpawnAccumulator = 0;

        // --- Estado de vidas (M4) ---
        this.lives = CONFIG.PLAYER_LIVES;
        this.isInvulnerable = false;
        this.invulnerabilityTimer = 0;
        this.blinkTween = null;

        // --- Estado de niveles (M1) ---
        this.currentLevel = 1;

        // --- Cálculos de carretera ---
        this.laneWidth = CONFIG.ROAD_WIDTH / CONFIG.NUM_LANES;
        this.laneCenters = [];
        for (let i = 0; i < CONFIG.NUM_LANES; i++) {
            this.laneCenters.push(CONFIG.ROAD_LEFT_X + this.laneWidth * i + this.laneWidth / 2);
        }

        // --- Dibujar fondo estático ---
        this._drawStaticBackground();

        // --- Líneas de carril animadas ---
        this.laneGraphics = this.add.graphics();

        // --- Grupos ---
        this.obstacles = this.add.group();
        this.coinGroup = this.add.group();

        // --- Crear texturas generadas ---
        this._createCoinTexture();

        // --- Crear jugador ---
        this._createPlayer();

        // --- Controles WASD ---
        this.keys = this.input.keyboard.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D
        });

        // --- HUD ---
        this._createHUD();

        // --- Contenedor de Game Over ---
        this.gameOverContainer = this.add.container(0, 0);
        this.gameOverContainer.setVisible(false);
        this.gameOverContainer.setDepth(100);
    }

    update(time, delta) {
        if (this.isGameOver) {
            return;
        }

        const deltaSeconds = delta / 1000;

        // --- Aceleración de la carretera ---
        if (this.roadSpeed < CONFIG.ROAD_MAX_SPEED) {
            this.roadSpeed = Math.min(
                this.roadSpeed + CONFIG.ROAD_ACCELERATION * deltaSeconds,
                CONFIG.ROAD_MAX_SPEED
            );
        }

        // --- Líneas de carril ---
        this._updateLaneLines(deltaSeconds);

        // --- Movimiento del jugador ---
        this._handlePlayerMovement(deltaSeconds);

        // --- Invulnerabilidad (M4) ---
        this._updateInvulnerability(delta);

        // --- Generar obstáculos ---
        this._updateObstacleSpawning(delta);

        // --- Mover obstáculos y detectar colisiones ---
        this._updateObstacles(deltaSeconds);

        // --- Monedas: generar y recoger (M2) ---
        this._updateCoinSpawning(delta);
        this._updateCoins(deltaSeconds);

        // --- Puntuación ---
        this._updateScore(deltaSeconds);

        // --- Nivel de dificultad (M1) ---
        this._checkLevelUp();

        // --- HUD ---
        this._updateHUD();
    }

    // --------------------------------------------------------
    // CARRETERA
    // --------------------------------------------------------

    /**
     * Dibuja los elementos estáticos: hierba, asfalto, bordes.
     */
    _drawStaticBackground() {
        const bg = this.add.graphics();

        // Hierba
        bg.fillStyle(CONFIG.GRASS_COLOR, 1);
        bg.fillRect(0, 0, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT);

        // Textura de hierba
        bg.fillStyle(0x35a05a, 1);
        for (let y = 0; y < CONFIG.GAME_HEIGHT; y += 20) {
            bg.fillRect(0, y, CONFIG.ROAD_LEFT_X - 10, 2);
            bg.fillRect(CONFIG.ROAD_RIGHT_X + 10, y, CONFIG.GAME_WIDTH - CONFIG.ROAD_RIGHT_X - 10, 2);
        }

        // Arcén
        const shoulderWidth = 12;
        bg.fillStyle(CONFIG.ROAD_SHOULDER_COLOR, 1);
        bg.fillRect(CONFIG.ROAD_LEFT_X - shoulderWidth, 0, shoulderWidth, CONFIG.GAME_HEIGHT);
        bg.fillRect(CONFIG.ROAD_RIGHT_X, 0, shoulderWidth, CONFIG.GAME_HEIGHT);

        // Asfalto
        bg.fillStyle(CONFIG.ROAD_COLOR, 1);
        bg.fillRect(CONFIG.ROAD_LEFT_X, 0, CONFIG.ROAD_WIDTH, CONFIG.GAME_HEIGHT);

        // Bordes blancos
        bg.fillStyle(CONFIG.ROAD_EDGE_COLOR, 1);
        bg.fillRect(CONFIG.ROAD_LEFT_X - 3, 0, 3, CONFIG.GAME_HEIGHT);
        bg.fillRect(CONFIG.ROAD_RIGHT_X, 0, 3, CONFIG.GAME_HEIGHT);
    }

    /**
     * Redibuja las líneas de carril con desplazamiento.
     */
    _updateLaneLines(deltaSeconds) {
        const totalCycleLength = CONFIG.LANE_LINE_LENGTH + CONFIG.LANE_LINE_GAP;

        this.laneLineOffset += this.roadSpeed * deltaSeconds;
        this.laneLineOffset %= totalCycleLength;

        this.laneGraphics.clear();
        this.laneGraphics.lineStyle(CONFIG.LANE_LINE_WIDTH, CONFIG.LANE_LINE_COLOR, 0.7);

        for (let lane = 1; lane < CONFIG.NUM_LANES; lane++) {
            const x = CONFIG.ROAD_LEFT_X + lane * this.laneWidth;
            for (let y = -totalCycleLength + this.laneLineOffset; y < CONFIG.GAME_HEIGHT; y += totalCycleLength) {
                const startY = y;
                const endY = y + CONFIG.LANE_LINE_LENGTH;
                if (endY > 0 && startY < CONFIG.GAME_HEIGHT) {
                    this.laneGraphics.beginPath();
                    this.laneGraphics.moveTo(x, Math.max(0, startY));
                    this.laneGraphics.lineTo(x, Math.min(CONFIG.GAME_HEIGHT, endY));
                    this.laneGraphics.strokePath();
                }
            }
        }
    }

    // --------------------------------------------------------
    // JUGADOR
    // --------------------------------------------------------

    /**
     * Crea el automóvil del jugador.
     */
    _createPlayer() {
        const startX = CONFIG.GAME_WIDTH / 2;
        const startY = CONFIG.GAME_HEIGHT - CONFIG.PLAYER_START_Y_OFFSET;

        // Generar textura solo si no existe (evita warnings en restart)
        if (!this.textures.exists('player_car')) {
            const gfx = this.make.graphics({ x: 0, y: 0, add: false });
            this._drawCar(gfx, CONFIG.PLAYER_COLOR, CONFIG.PLAYER_WIDTH, CONFIG.PLAYER_HEIGHT, true);
            gfx.generateTexture('player_car', CONFIG.PLAYER_WIDTH + 4, CONFIG.PLAYER_HEIGHT + 4);
            gfx.destroy();
        }

        this.player = this.add.sprite(startX, startY, 'player_car');
        this.player.setDepth(10);

        this.playerHitbox = {
            width: CONFIG.PLAYER_WIDTH - 4,
            height: CONFIG.PLAYER_HEIGHT - 4
        };
    }

    /**
     * Dibuja la forma de un automóvil.
     * @param {Phaser.GameObjects.Graphics} graphics
     * @param {number} color - Color principal
     * @param {number} w - Ancho
     * @param {number} h - Alto
     * @param {boolean} isPlayer - Diseño diferenciado para el jugador
     */
    _drawCar(graphics, color, w, h, isPlayer) {
        const offsetX = 2;
        const offsetY = 2;

        // Cuerpo
        graphics.fillStyle(color, 1);
        graphics.fillRoundedRect(offsetX, offsetY, w, h, 6);

        // Ventana delantera
        const cabinColor = isPlayer ? 0x0088aa : 0x444444;
        graphics.fillStyle(cabinColor, 1);
        const cabinW = w * 0.6;
        const cabinH = h * 0.25;
        const cabinX = offsetX + (w - cabinW) / 2;
        const cabinY = offsetY + h * 0.2;
        graphics.fillRoundedRect(cabinX, cabinY, cabinW, cabinH, 3);

        // Ventana trasera
        const rearW = w * 0.5;
        const rearH = h * 0.15;
        const rearX = offsetX + (w - rearW) / 2;
        const rearY = offsetY + h * 0.55;
        graphics.fillStyle(cabinColor, 0.8);
        graphics.fillRoundedRect(rearX, rearY, rearW, rearH, 2);

        // Ruedas
        graphics.fillStyle(0x222222, 1);
        const wheelW = 6;
        const wheelH = 12;
        graphics.fillRect(offsetX - 2, offsetY + 5, wheelW, wheelH);
        graphics.fillRect(offsetX + w - wheelW + 2, offsetY + 5, wheelW, wheelH);
        graphics.fillRect(offsetX - 2, offsetY + h - wheelH - 5, wheelW, wheelH);
        graphics.fillRect(offsetX + w - wheelW + 2, offsetY + h - wheelH - 5, wheelW, wheelH);

        // Luces delanteras (solo jugador)
        if (isPlayer) {
            graphics.fillStyle(0xffff88, 1);
            graphics.fillCircle(offsetX + 7, offsetY + 4, 3);
            graphics.fillCircle(offsetX + w - 7, offsetY + 4, 3);
        }

        // Luces traseras
        graphics.fillStyle(0xff3333, 1);
        graphics.fillCircle(offsetX + 5, offsetY + h - 3, 2.5);
        graphics.fillCircle(offsetX + w - 5, offsetY + h - 3, 2.5);
    }

    /**
     * Movimiento del jugador con WASD.
     */
    _handlePlayerMovement(deltaSeconds) {
        let velocityX = 0;
        let velocityY = 0;

        if (this.keys.A.isDown) {
            velocityX = -1;
        } else if (this.keys.D.isDown) {
            velocityX = 1;
        }

        if (this.keys.W.isDown) {
            velocityY = -1;
        } else if (this.keys.S.isDown) {
            velocityY = 1;
        }

        // Normalizar diagonal
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= CONFIG.DIAGONAL_FACTOR;
            velocityY *= CONFIG.DIAGONAL_FACTOR;
        }

        this.player.x += velocityX * CONFIG.PLAYER_SPEED * deltaSeconds;
        this.player.y += velocityY * CONFIG.PLAYER_SPEED * deltaSeconds;

        // Limitar dentro de la carretera
        const halfW = CONFIG.PLAYER_WIDTH / 2 + 4;
        const halfH = CONFIG.PLAYER_HEIGHT / 2 + 4;

        this.player.x = Phaser.Math.Clamp(
            this.player.x,
            CONFIG.ROAD_LEFT_X + halfW,
            CONFIG.ROAD_RIGHT_X - halfW
        );
        this.player.y = Phaser.Math.Clamp(
            this.player.y,
            halfH,
            CONFIG.GAME_HEIGHT - halfH
        );
    }

    // --------------------------------------------------------
    // OBSTÁCULOS
    // --------------------------------------------------------

    /**
     * Controla la generación temporizada de obstáculos.
     * M1: el nivel actual reduce el intervalo de spawn.
     */
    _updateObstacleSpawning(delta) {
        // Factor de velocidad (0 a 1)
        const speedRatio = (this.roadSpeed - CONFIG.ROAD_INITIAL_SPEED) /
                           (CONFIG.ROAD_MAX_SPEED - CONFIG.ROAD_INITIAL_SPEED);

        // Factor de nivel: reduce el intervalo adicionalmente (M1)
        const levelReduction = 1 - (Math.min(this.currentLevel - 1, CONFIG.LEVEL_MAX - 1) * CONFIG.LEVEL_SPAWN_REDUCTION);

        this.currentSpawnInterval = Phaser.Math.Linear(
            CONFIG.OBSTACLE_SPAWN_INTERVAL,
            CONFIG.OBSTACLE_MIN_SPAWN_INTERVAL,
            speedRatio
        ) * levelReduction;

        this.spawnAccumulator += delta;
        if (this.spawnAccumulator >= this.currentSpawnInterval) {
            this.spawnAccumulator -= this.currentSpawnInterval;
            this._spawnObstacle();

            // M1: spawns dobles en niveles altos
            if (this.currentLevel >= CONFIG.LEVEL_DOUBLE_SPAWN_LEVEL &&
                Math.random() < CONFIG.LEVEL_DOUBLE_SPAWN_CHANCE) {
                this._spawnObstacle();
            }
        }
    }

    /**
     * Genera un obstáculo en un carril aleatorio.
     * M1: el nivel aumenta el rango de velocidad de los obstáculos.
     */
    _spawnObstacle() {
        const laneIndex = Phaser.Math.Between(0, CONFIG.NUM_LANES - 1);
        const x = this.laneCenters[laneIndex];
        const y = -CONFIG.OBSTACLE_HEIGHT;

        const colorIndex = Phaser.Math.Between(0, CONFIG.OBSTACLE_COLORS.length - 1);
        const color = CONFIG.OBSTACLE_COLORS[colorIndex];

        // Textura cacheada por color
        const textureKey = 'obstacle_' + color.toString(16);
        if (!this.textures.exists(textureKey)) {
            const gfx = this.make.graphics({ x: 0, y: 0, add: false });
            this._drawCar(gfx, color, CONFIG.OBSTACLE_WIDTH, CONFIG.OBSTACLE_HEIGHT, false);
            gfx.generateTexture(textureKey, CONFIG.OBSTACLE_WIDTH + 4, CONFIG.OBSTACLE_HEIGHT + 4);
            gfx.destroy();
        }

        const obstacle = this.add.sprite(x, y, textureKey);
        obstacle.setDepth(9);

        // M1: la velocidad del obstáculo aumenta con el nivel
        const levelSpeedBonus = (this.currentLevel - 1) * CONFIG.LEVEL_SPEED_INCREASE;
        const minSpeed = CONFIG.OBSTACLE_MIN_SPEED * (1 + levelSpeedBonus);
        const maxSpeed = CONFIG.OBSTACLE_MAX_SPEED * (1 + levelSpeedBonus);
        obstacle.obstacleSpeed = Phaser.Math.Between(Math.round(minSpeed), Math.round(maxSpeed));

        this.obstacles.add(obstacle);
    }

    /**
     * Mueve obstáculos, detecta colisiones.
     * M4: llama a _handleHit() en lugar de Game Over directo.
     */
    _updateObstacles(deltaSeconds) {
        const children = this.obstacles.getChildren();

        for (let i = children.length - 1; i >= 0; i--) {
            const obstacle = children[i];

            obstacle.y += (this.roadSpeed + obstacle.obstacleSpeed) * deltaSeconds;

            // Eliminar si salió de pantalla
            if (obstacle.y > CONFIG.GAME_HEIGHT + CONFIG.OBSTACLE_HEIGHT) {
                obstacle.destroy();
                continue;
            }

            // Colisión con el jugador
            if (!this.isInvulnerable && this._checkCollision(this.player, obstacle)) {
                this._handleHit(obstacle);
                return; // Detener la evaluación este frame
            }
        }
    }

    /**
     * Detección de colisiones AABB con margen de tolerancia.
     */
    _checkCollision(spriteA, spriteB) {
        const margin = 6;

        const aLeft = spriteA.x - this.playerHitbox.width / 2;
        const aRight = spriteA.x + this.playerHitbox.width / 2;
        const aTop = spriteA.y - this.playerHitbox.height / 2;
        const aBottom = spriteA.y + this.playerHitbox.height / 2;

        const bHalfW = (CONFIG.OBSTACLE_WIDTH - margin) / 2;
        const bHalfH = (CONFIG.OBSTACLE_HEIGHT - margin) / 2;
        const bLeft = spriteB.x - bHalfW;
        const bRight = spriteB.x + bHalfW;
        const bTop = spriteB.y - bHalfH;
        const bBottom = spriteB.y + bHalfH;

        return aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop;
    }

    // --------------------------------------------------------
    // SISTEMA DE VIDAS Y DAÑO (M4)
    // --------------------------------------------------------

    /**
     * Gestiona el impacto con un obstáculo.
     * Reduce vidas, activa invulnerabilidad o termina la partida.
     * @param {Phaser.GameObjects.Sprite} obstacle - El obstáculo que causó el impacto.
     */
    _handleHit(obstacle) {
        this.lives--;

        // Destruir el obstáculo que impactó para evitar colisiones repetidas
        obstacle.destroy();

        // Actualizar el indicador de vidas
        this._updateLivesDisplay();

        if (this.lives <= 0) {
            this._triggerGameOver();
            return;
        }

        // Activar invulnerabilidad temporal
        this.isInvulnerable = true;
        this.invulnerabilityTimer = CONFIG.INVULNERABILITY_DURATION;

        // Efecto de parpadeo
        this.blinkTween = this.tweens.add({
            targets: this.player,
            alpha: { from: 1, to: 0.25 },
            duration: CONFIG.INVULNERABILITY_BLINK_MS,
            yoyo: true,
            repeat: Math.floor(CONFIG.INVULNERABILITY_DURATION / (CONFIG.INVULNERABILITY_BLINK_MS * 2)) - 1
        });

        // Sacudida leve de cámara como feedback
        this.cameras.main.shake(150, 0.006);
    }

    /**
     * Actualiza el temporizador de invulnerabilidad.
     * @param {number} delta - Delta en milisegundos.
     */
    _updateInvulnerability(delta) {
        if (!this.isInvulnerable) {
            return;
        }

        this.invulnerabilityTimer -= delta;

        if (this.invulnerabilityTimer <= 0) {
            this.isInvulnerable = false;
            this.invulnerabilityTimer = 0;

            // Detener parpadeo y restaurar visibilidad
            if (this.blinkTween) {
                this.blinkTween.stop();
                this.blinkTween = null;
            }
            this.player.setAlpha(1);
        }
    }

    // --------------------------------------------------------
    // SISTEMA DE MONEDAS (M2)
    // --------------------------------------------------------

    /**
     * Genera la textura de la moneda si no existe.
     */
    _createCoinTexture() {
        if (this.textures.exists('coin')) {
            return;
        }

        const r = CONFIG.COIN_RADIUS;
        const size = r * 2 + 4;
        const cx = size / 2;
        const cy = size / 2;

        const gfx = this.make.graphics({ x: 0, y: 0, add: false });

        // Círculo exterior (dorado)
        gfx.fillStyle(CONFIG.COIN_COLOR, 1);
        gfx.fillCircle(cx, cy, r);

        // Borde interior
        gfx.lineStyle(1.5, 0xb8860b, 1);
        gfx.strokeCircle(cx, cy, r - 2);

        // Centro brillante
        gfx.fillStyle(CONFIG.COIN_INNER_COLOR, 1);
        gfx.fillCircle(cx, cy, r * 0.5);

        // Punto central
        gfx.fillStyle(CONFIG.COIN_COLOR, 1);
        gfx.fillCircle(cx, cy, r * 0.15);

        gfx.generateTexture('coin', size, size);
        gfx.destroy();
    }

    /**
     * Controla la generación temporizada de monedas.
     */
    _updateCoinSpawning(delta) {
        // El intervalo de monedas también se reduce ligeramente con la velocidad
        const speedRatio = (this.roadSpeed - CONFIG.ROAD_INITIAL_SPEED) /
                           (CONFIG.ROAD_MAX_SPEED - CONFIG.ROAD_INITIAL_SPEED);

        const coinInterval = Phaser.Math.Linear(
            CONFIG.COIN_SPAWN_INTERVAL,
            CONFIG.COIN_MIN_SPAWN_INTERVAL,
            speedRatio * 0.5 // Las monedas se aceleran más lentamente que los obstáculos
        );

        this.coinSpawnAccumulator += delta;
        if (this.coinSpawnAccumulator >= coinInterval) {
            this.coinSpawnAccumulator -= coinInterval;
            this._spawnCoin();
        }
    }

    /**
     * Genera una moneda en un carril aleatorio.
     */
    _spawnCoin() {
        const laneIndex = Phaser.Math.Between(0, CONFIG.NUM_LANES - 1);
        const x = this.laneCenters[laneIndex];
        const y = -CONFIG.COIN_RADIUS * 2;

        const coin = this.add.sprite(x, y, 'coin');
        coin.setDepth(8);
        coin.collected = false;

        // Efecto de pulso continuo
        this.tweens.add({
            targets: coin,
            scaleX: { from: 1, to: 1.2 },
            scaleY: { from: 1, to: 1.2 },
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.coinGroup.add(coin);
    }

    /**
     * Mueve las monedas y detecta recolección.
     */
    _updateCoins(deltaSeconds) {
        const children = this.coinGroup.getChildren();

        for (let i = children.length - 1; i >= 0; i--) {
            const coin = children[i];

            // Las monedas se mueven con la carretera (no tienen velocidad propia)
            coin.y += this.roadSpeed * deltaSeconds;

            // Eliminar si salió de pantalla
            if (coin.y > CONFIG.GAME_HEIGHT + CONFIG.COIN_RADIUS * 2) {
                coin.destroy();
                continue;
            }

            // Detectar recolección (AABB simplificado)
            if (!coin.collected && this._checkCoinCollision(this.player, coin)) {
                this._collectCoin(coin);
            }
        }
    }

    /**
     * Detección de colisión entre jugador y moneda.
     */
    _checkCoinCollision(player, coin) {
        const pHalfW = this.playerHitbox.width / 2;
        const pHalfH = this.playerHitbox.height / 2;
        const cRadius = CONFIG.COIN_RADIUS;

        // AABB simplificado para la moneda (cuadrado inscrito)
        return player.x - pHalfW < coin.x + cRadius &&
               player.x + pHalfW > coin.x - cRadius &&
               player.y - pHalfH < coin.y + cRadius &&
               player.y + pHalfH > coin.y - cRadius;
    }

    /**
     * Recoge una moneda: incrementa contador y aplica animación de desaparición.
     * @param {Phaser.GameObjects.Sprite} coin
     */
    _collectCoin(coin) {
        coin.collected = true;
        this.coins++;

        // Animación de recolección: escalar y desvanecer
        this.tweens.add({
            targets: coin,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            y: coin.y - 30,
            duration: 250,
            ease: 'Power2',
            onComplete: () => {
                coin.destroy();
            }
        });
    }

    // --------------------------------------------------------
    // SISTEMA DE NIVELES (M1)
    // --------------------------------------------------------

    /**
     * Comprueba si el jugador ha alcanzado un nuevo nivel de dificultad.
     */
    _checkLevelUp() {
        const newLevel = Math.min(
            Math.floor(this.score / CONFIG.LEVEL_SCORE_THRESHOLD) + 1,
            CONFIG.LEVEL_MAX
        );

        if (newLevel > this.currentLevel) {
            this.currentLevel = newLevel;
            this._showLevelUpText(newLevel);
        }
    }

    /**
     * Muestra un texto animado de subida de nivel.
     * @param {number} level - Número de nivel alcanzado.
     */
    _showLevelUpText(level) {
        const centerX = CONFIG.GAME_WIDTH / 2;
        const startY = CONFIG.GAME_HEIGHT / 2 - 60;

        const text = this.add.text(centerX, startY, '¡NIVEL ' + level + '!', {
            fontFamily: CONFIG.UI_FONT_FAMILY,
            fontSize: '34px',
            color: '#ffdd00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5).setDepth(60).setAlpha(0);

        this.tweens.add({
            targets: text,
            alpha: { from: 0, to: 1 },
            y: startY - 50,
            duration: 600,
            ease: 'Power2',
            yoyo: true,
            hold: 900,
            onComplete: () => {
                text.destroy();
            }
        });
    }

    // --------------------------------------------------------
    // PUNTUACIÓN
    // --------------------------------------------------------

    /**
     * Actualiza la puntuación basada en el tiempo.
     */
    _updateScore(deltaSeconds) {
        this.scoreAccumulator += CONFIG.SCORE_PER_SECOND * deltaSeconds;
        if (this.scoreAccumulator >= 1) {
            const pointsToAdd = Math.floor(this.scoreAccumulator);
            this.score += pointsToAdd;
            this.scoreAccumulator -= pointsToAdd;
        }
    }

    // --------------------------------------------------------
    // HUD
    // --------------------------------------------------------

    /**
     * Crea los elementos del HUD.
     */
    _createHUD() {
        const hudStyle = {
            fontFamily: CONFIG.UI_FONT_FAMILY,
            fontSize: CONFIG.UI_FONT_SIZE,
            color: CONFIG.UI_COLOR,
            stroke: '#000000',
            strokeThickness: 3
        };

        // Columna izquierda (sobre la hierba)
        this.scoreText = this.add.text(10, 10, 'PTS: 0', hudStyle).setDepth(50);

        this.coinsText = this.add.text(10, 35, 'MON: 0', {
            ...hudStyle,
            color: '#ffd700'
        }).setDepth(50);

        this.livesText = this.add.text(10, 60, '', {
            ...hudStyle,
            fontSize: '20px',
            color: '#ff4444'
        }).setDepth(50);
        this._updateLivesDisplay();

        // Columna derecha (sobre la hierba)
        this.speedText = this.add.text(CONFIG.GAME_WIDTH - 10, 10, 'VEL: 200', hudStyle)
            .setOrigin(1, 0)
            .setDepth(50);

        this.levelText = this.add.text(CONFIG.GAME_WIDTH - 10, 35, 'NIV: 1', {
            ...hudStyle,
            color: '#ffdd00'
        }).setOrigin(1, 0).setDepth(50);
    }

    /**
     * Actualiza los textos del HUD cada frame.
     */
    _updateHUD() {
        this.scoreText.setText('PTS: ' + this.score);
        this.coinsText.setText('MON: ' + this.coins);
        this.speedText.setText('VEL: ' + Math.round(this.roadSpeed));
        this.levelText.setText('NIV: ' + this.currentLevel);
    }

    /**
     * Actualiza la representación visual de las vidas.
     */
    _updateLivesDisplay() {
        let hearts = '';
        for (let i = 0; i < CONFIG.PLAYER_LIVES; i++) {
            if (i > 0) hearts += ' ';
            hearts += (i < this.lives) ? '♥' : '♡';
        }
        this.livesText.setText(hearts);
    }

    // --------------------------------------------------------
    // GAME OVER
    // --------------------------------------------------------

    /**
     * Maneja el fin de la partida. M6: guarda récord.
     */
    _triggerGameOver() {
        this.isGameOver = true;

        // Detener el parpadeo de invulnerabilidad si estaba activo
        if (this.blinkTween) {
            this.blinkTween.stop();
            this.blinkTween = null;
        }
        this.player.setAlpha(1);

        // M6: guardar récords
        const isNewHighScore = saveHighScore(this.score);
        saveHighCoins(this.coins);

        const centerX = CONFIG.GAME_WIDTH / 2;
        const centerY = CONFIG.GAME_HEIGHT / 2;

        // Sacudida de cámara final
        this.cameras.main.shake(200, 0.008);

        // Overlay oscuro
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.75);
        overlay.fillRect(0, 0, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT);
        this.gameOverContainer.add(overlay);

        // Panel central (más alto para incluir nuevas estadísticas)
        const panelW = 320;
        const panelH = 400;
        const panelX = centerX - panelW / 2;
        const panelY = centerY - panelH / 2;

        const panel = this.add.graphics();
        panel.fillStyle(0x1a1a2e, 0.95);
        panel.fillRoundedRect(panelX, panelY, panelW, panelH, 16);
        panel.lineStyle(2, 0x00ccff, 1);
        panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 16);
        this.gameOverContainer.add(panel);

        // "GAME OVER"
        const titleY = panelY + 40;
        const title = this.add.text(centerX, titleY, 'GAME OVER', {
            fontFamily: CONFIG.UI_FONT_FAMILY,
            fontSize: '36px',
            color: '#ff4444',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.gameOverContainer.add(title);

        // Nuevo récord (M6)
        let nextY = titleY + 40;
        if (isNewHighScore) {
            const newRecordText = this.add.text(centerX, nextY, '★ ¡NUEVO RÉCORD! ★', {
                fontFamily: CONFIG.UI_FONT_FAMILY,
                fontSize: '18px',
                color: '#ffd700',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            this.gameOverContainer.add(newRecordText);

            // Efecto de pulso en el texto de nuevo récord
            this.tweens.add({
                targets: newRecordText,
                scaleX: { from: 1, to: 1.1 },
                scaleY: { from: 1, to: 1.1 },
                duration: 600,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            nextY += 30;
        }

        // Etiqueta "PUNTUACIÓN"
        nextY += 10;
        const scoreLabel = this.add.text(centerX, nextY, 'PUNTUACIÓN', {
            fontFamily: CONFIG.UI_FONT_FAMILY,
            fontSize: '14px',
            color: '#aaaaaa'
        }).setOrigin(0.5);
        this.gameOverContainer.add(scoreLabel);

        // Valor de puntuación (grande)
        nextY += 35;
        const scoreValue = this.add.text(centerX, nextY, String(this.score), {
            fontFamily: CONFIG.UI_FONT_FAMILY,
            fontSize: '44px',
            color: CONFIG.UI_HIGHLIGHT_COLOR,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.gameOverContainer.add(scoreValue);

        // Línea divisoria
        nextY += 35;
        const divider = this.add.graphics();
        divider.lineStyle(1, 0x444444, 1);
        divider.beginPath();
        divider.moveTo(panelX + 30, nextY);
        divider.lineTo(panelX + panelW - 30, nextY);
        divider.strokePath();
        this.gameOverContainer.add(divider);

        // Estadísticas
        nextY += 20;
        const statsStyle = {
            fontFamily: CONFIG.UI_FONT_FAMILY,
            fontSize: '14px',
            color: '#bbbbbb'
        };

        const stats = [
            'Monedas: ' + this.coins,
            'Nivel: ' + this.currentLevel,
            'Velocidad máx: ' + Math.round(this.roadSpeed),
            '🏆 Récord: ' + getHighScore()
        ];

        stats.forEach((line) => {
            const text = this.add.text(centerX, nextY, line, statsStyle).setOrigin(0.5);
            this.gameOverContainer.add(text);
            nextY += 22;
        });

        // Botón de reinicio
        nextY += 15;
        this._createGameOverButton(centerX, nextY);

        this.gameOverContainer.setVisible(true);
    }

    /**
     * Crea el botón "JUGAR DE NUEVO" en la pantalla de Game Over.
     */
    _createGameOverButton(x, y) {
        const buttonWidth = 220;
        const buttonHeight = 48;

        const bg = this.add.graphics();
        bg.fillStyle(0x00aacc, 1);
        bg.fillRoundedRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight, 10);
        this.gameOverContainer.add(bg);

        const text = this.add.text(x, y, 'JUGAR DE NUEVO', {
            fontFamily: CONFIG.UI_FONT_FAMILY,
            fontSize: '18px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.gameOverContainer.add(text);

        const hitArea = this.add.zone(x, y, buttonWidth, buttonHeight)
            .setInteractive({ useHandCursor: true })
            .setDepth(101);
        this.gameOverContainer.add(hitArea);

        hitArea.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x00ddff, 1);
            bg.fillRoundedRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight, 10);
        });

        hitArea.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x00aacc, 1);
            bg.fillRoundedRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight, 10);
        });

        hitArea.on('pointerdown', () => {
            this._restartGame();
        });
    }

    /**
     * Reinicia la partida completamente.
     */
    _restartGame() {
        // Limpiar grupos
        this.obstacles.clear(true, true);
        this.coinGroup.clear(true, true);

        // Detener parpadeo si estaba activo
        if (this.blinkTween) {
            this.blinkTween.stop();
            this.blinkTween = null;
        }

        // scene.restart() limpia todos los objetos, tweens y listeners
        this.scene.restart();
    }
}

// ============================================================
// CONFIGURACIÓN DE PHASER
// ============================================================

const phaserConfig = {
    type: Phaser.AUTO,
    width: CONFIG.GAME_WIDTH,
    height: CONFIG.GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scene: [MenuScene, GameScene],
    physics: {
        default: null
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    input: {
        keyboard: {
            capture: [
                Phaser.Input.Keyboard.KeyCodes.W,
                Phaser.Input.Keyboard.KeyCodes.A,
                Phaser.Input.Keyboard.KeyCodes.S,
                Phaser.Input.Keyboard.KeyCodes.D
            ]
        }
    }
};

// Crear la instancia del juego cuando el DOM esté listo
window.addEventListener('load', () => {
    new Phaser.Game(phaserConfig);
});
