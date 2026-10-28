/* ============================================================
   CARRERAS ARCADE - Juego de carreras top-down con Phaser 3
   ============================================================
   Archivo principal: contiene configuración, escenas y lógica.
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
    ROAD_LEFT_X: 90,           // Borde izquierdo de la carretera
    ROAD_RIGHT_X: 390,         // Borde derecho de la carretera
    ROAD_WIDTH: 300,           // Ancho de la carretera (390 - 90)
    NUM_LANES: 4,              // Número de carriles
    LANE_LINE_WIDTH: 3,
    LANE_LINE_LENGTH: 40,
    LANE_LINE_GAP: 30,

    // Jugador
    PLAYER_WIDTH: 32,
    PLAYER_HEIGHT: 56,
    PLAYER_COLOR: 0x00ccff,
    PLAYER_SPEED: 250,         // Velocidad del jugador (píxeles/seg)
    PLAYER_START_Y_OFFSET: 150,// Distancia desde la parte inferior

    // Obstáculos
    OBSTACLE_MIN_SPEED: 100,
    OBSTACLE_MAX_SPEED: 200,
    OBSTACLE_WIDTH: 32,
    OBSTACLE_HEIGHT: 56,
    OBSTACLE_SPAWN_INTERVAL: 1200,  // Milisegundos entre obstáculos
    OBSTACLE_MIN_SPAWN_INTERVAL: 500,
    OBSTACLE_COLORS: [0xff4444, 0xffaa00, 0x44ff44, 0xaa44ff, 0xff44aa, 0xffff44],

    // Velocidad de la carretera
    ROAD_INITIAL_SPEED: 200,
    ROAD_MAX_SPEED: 600,
    ROAD_ACCELERATION: 5,      // Incremento de velocidad por segundo

    // Puntuación
    SCORE_PER_SECOND: 10,

    // UI
    UI_FONT_FAMILY: 'Courier New, monospace',
    UI_FONT_SIZE: '18px',
    UI_TITLE_SIZE: '42px',
    UI_SUBTITLE_SIZE: '20px',
    UI_COLOR: '#ffffff',
    UI_HIGHLIGHT_COLOR: '#00ccff',

    // Diagonal: factor para normalizar velocidad diagonal (1 / sqrt(2))
    DIAGONAL_FACTOR: 0.7071
};

// ============================================================
// ESCENA: MENÚ PRINCIPAL (MenuScene)
// ============================================================

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const centerX = CONFIG.GAME_WIDTH / 2;
        const centerY = CONFIG.GAME_HEIGHT / 2;

        // Fondo con degradado simulado
        this.cameras.main.setBackgroundColor('#1a1a2e');

        // Dibujar carretera de fondo decorativa
        this._drawBackgroundRoad();

        // Panel semitransparente detrás del texto
        const panel = this.add.graphics();
        panel.fillStyle(0x000000, 0.7);
        panel.fillRoundedRect(centerX - 180, 100, 360, 520, 16);

        // Título del juego
        this.add.text(centerX, 150, '🏎️ CARRERAS', {
            fontFamily: CONFIG.UI_FONT_FAMILY,
            fontSize: CONFIG.UI_TITLE_SIZE,
            color: CONFIG.UI_HIGHLIGHT_COLOR,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(centerX, 200, 'ARCADE', {
            fontFamily: CONFIG.UI_FONT_FAMILY,
            fontSize: '32px',
            color: CONFIG.UI_COLOR,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Descripción
        this.add.text(centerX, 260, 'Esquiva los vehículos\ny sobrevive el mayor\ntiempo posible.', {
            fontFamily: CONFIG.UI_FONT_FAMILY,
            fontSize: '16px',
            color: '#cccccc',
            align: 'center',
            lineSpacing: 6
        }).setOrigin(0.5);

        // Instrucciones de controles
        this.add.text(centerX, 360, '— CONTROLES —', {
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
            this.add.text(centerX, 395 + index * 28, line, {
                fontFamily: CONFIG.UI_FONT_FAMILY,
                fontSize: '15px',
                color: '#aaaaaa'
            }).setOrigin(0.5);
        });

        // Botón de inicio
        this._createButton(centerX, 540, 'COMENZAR', () => {
            this.scene.start('GameScene');
        });
    }

    /**
     * Dibuja una carretera decorativa de fondo en el menú.
     */
    _drawBackgroundRoad() {
        const graphics = this.add.graphics();

        // Hierba
        graphics.fillStyle(CONFIG.GRASS_COLOR, 0.3);
        graphics.fillRect(0, 0, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT);

        // Carretera
        graphics.fillStyle(CONFIG.ROAD_COLOR, 0.3);
        graphics.fillRect(CONFIG.ROAD_LEFT_X, 0, CONFIG.ROAD_WIDTH, CONFIG.GAME_HEIGHT);

        // Líneas de carril (estáticas, decorativas)
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
     * Crea un botón interactivo con texto.
     */
    _createButton(x, y, label, callback) {
        const buttonWidth = 200;
        const buttonHeight = 50;

        // Fondo del botón
        const bg = this.add.graphics();
        bg.fillStyle(0x00aacc, 1);
        bg.fillRoundedRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight, 12);

        // Texto del botón
        const text = this.add.text(x, y, label, {
            fontFamily: CONFIG.UI_FONT_FAMILY,
            fontSize: '22px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Zona interactiva
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
        // --- Estado del juego ---
        this.isGameOver = false;
        this.score = 0;
        this.roadSpeed = CONFIG.ROAD_INITIAL_SPEED;
        this.laneLineOffset = 0;
        this.scoreAccumulator = 0;
        this.spawnAccumulator = 0;
        this.currentSpawnInterval = CONFIG.OBSTACLE_SPAWN_INTERVAL;

        // --- Cálculos de carretera ---
        this.laneWidth = CONFIG.ROAD_WIDTH / CONFIG.NUM_LANES;
        this.laneCenters = [];
        for (let i = 0; i < CONFIG.NUM_LANES; i++) {
            this.laneCenters.push(CONFIG.ROAD_LEFT_X + this.laneWidth * i + this.laneWidth / 2);
        }

        // --- Dibujar elementos estáticos ---
        this._drawStaticBackground();

        // --- Líneas de carril (gráficos que se redibujan) ---
        this.laneGraphics = this.add.graphics();

        // --- Grupo de obstáculos ---
        this.obstacles = this.add.group();

        // --- Crear jugador ---
        this._createPlayer();

        // --- Controles WASD ---
        this.keys = this.input.keyboard.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D
        });

        // --- Interfaz de usuario (HUD) ---
        this._createHUD();

        // --- Capa de Game Over (inicialmente oculta) ---
        this.gameOverContainer = this.add.container(0, 0);
        this.gameOverContainer.setVisible(false);
        this.gameOverContainer.setDepth(100);
    }

    update(time, delta) {
        if (this.isGameOver) {
            return;
        }

        const deltaSeconds = delta / 1000;

        // --- Actualizar velocidad (aceleración progresiva) ---
        if (this.roadSpeed < CONFIG.ROAD_MAX_SPEED) {
            this.roadSpeed = Math.min(
                this.roadSpeed + CONFIG.ROAD_ACCELERATION * deltaSeconds,
                CONFIG.ROAD_MAX_SPEED
            );
        }

        // --- Mover líneas de carril ---
        this._updateLaneLines(deltaSeconds);

        // --- Mover jugador ---
        this._handlePlayerMovement(deltaSeconds);

        // --- Generar obstáculos ---
        this._updateObstacleSpawning(delta);

        // --- Mover obstáculos y detectar colisiones ---
        this._updateObstacles(deltaSeconds);

        // --- Actualizar puntuación ---
        this._updateScore(deltaSeconds);

        // --- Actualizar HUD ---
        this._updateHUD();
    }

    // --------------------------------------------------------
    // DIBUJO DE LA CARRETERA (elementos estáticos)
    // --------------------------------------------------------

    /**
     * Dibuja los elementos estáticos del fondo: hierba, asfalto, bordes.
     */
    _drawStaticBackground() {
        const bg = this.add.graphics();

        // Hierba (todo el fondo)
        bg.fillStyle(CONFIG.GRASS_COLOR, 1);
        bg.fillRect(0, 0, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT);

        // Decoración de hierba: líneas más claras simulando textura
        bg.fillStyle(0x35a05a, 1);
        for (let y = 0; y < CONFIG.GAME_HEIGHT; y += 20) {
            bg.fillRect(0, y, CONFIG.ROAD_LEFT_X - 10, 2);
            bg.fillRect(CONFIG.ROAD_RIGHT_X + 10, y, CONFIG.GAME_WIDTH - CONFIG.ROAD_RIGHT_X - 10, 2);
        }

        // Arcén / hombro de la carretera
        const shoulderWidth = 12;
        bg.fillStyle(CONFIG.ROAD_SHOULDER_COLOR, 1);
        bg.fillRect(CONFIG.ROAD_LEFT_X - shoulderWidth, 0, shoulderWidth, CONFIG.GAME_HEIGHT);
        bg.fillRect(CONFIG.ROAD_RIGHT_X, 0, shoulderWidth, CONFIG.GAME_HEIGHT);

        // Asfalto principal
        bg.fillStyle(CONFIG.ROAD_COLOR, 1);
        bg.fillRect(CONFIG.ROAD_LEFT_X, 0, CONFIG.ROAD_WIDTH, CONFIG.GAME_HEIGHT);

        // Bordes blancos de la carretera
        bg.fillStyle(CONFIG.ROAD_EDGE_COLOR, 1);
        bg.fillRect(CONFIG.ROAD_LEFT_X - 3, 0, 3, CONFIG.GAME_HEIGHT);
        bg.fillRect(CONFIG.ROAD_RIGHT_X, 0, 3, CONFIG.GAME_HEIGHT);
    }

    /**
     * Redibuja las líneas de carril con su desplazamiento actual.
     */
    _updateLaneLines(deltaSeconds) {
        const totalCycleLength = CONFIG.LANE_LINE_LENGTH + CONFIG.LANE_LINE_GAP;

        // Incrementar el offset según la velocidad
        this.laneLineOffset += this.roadSpeed * deltaSeconds;
        // Mantener el offset dentro de un ciclo para evitar valores enormes
        this.laneLineOffset %= totalCycleLength;

        // Redibujar
        this.laneGraphics.clear();
        this.laneGraphics.lineStyle(CONFIG.LANE_LINE_WIDTH, CONFIG.LANE_LINE_COLOR, 0.7);

        for (let lane = 1; lane < CONFIG.NUM_LANES; lane++) {
            const x = CONFIG.ROAD_LEFT_X + lane * this.laneWidth;

            // Dibujar líneas desde arriba hacia abajo, con offset
            for (let y = -totalCycleLength + this.laneLineOffset; y < CONFIG.GAME_HEIGHT; y += totalCycleLength) {
                const startY = y;
                const endY = y + CONFIG.LANE_LINE_LENGTH;

                // Solo dibujar si está visible en pantalla
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
     * Crea el automóvil del jugador usando figuras geométricas.
     */
    _createPlayer() {
        const startX = CONFIG.GAME_WIDTH / 2;
        const startY = CONFIG.GAME_HEIGHT - CONFIG.PLAYER_START_Y_OFFSET;

        // Crear textura del jugador con gráficos
        this.playerGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        this._drawCar(this.playerGraphics, CONFIG.PLAYER_COLOR, CONFIG.PLAYER_WIDTH, CONFIG.PLAYER_HEIGHT, true);

        // Generar textura a partir del gráfico
        this.playerGraphics.generateTexture('player_car', CONFIG.PLAYER_WIDTH + 4, CONFIG.PLAYER_HEIGHT + 4);
        this.playerGraphics.destroy();

        // Crear sprite del jugador
        this.player = this.add.sprite(startX, startY, 'player_car');
        this.player.setDepth(10);

        // Definir el tamaño de hitbox para colisiones manuales
        this.playerHitbox = {
            width: CONFIG.PLAYER_WIDTH - 4,
            height: CONFIG.PLAYER_HEIGHT - 4
        };
    }

    /**
     * Dibuja la forma de un automóvil en un objeto Graphics.
     * @param {Phaser.GameObjects.Graphics} graphics - Objeto donde dibujar
     * @param {number} color - Color principal del auto
     * @param {number} w - Ancho
     * @param {number} h - Alto
     * @param {boolean} isPlayer - Si es el jugador (diseño ligeramente diferente)
     */
    _drawCar(graphics, color, w, h, isPlayer) {
        const offsetX = 2;
        const offsetY = 2;

        // Cuerpo principal del auto
        graphics.fillStyle(color, 1);
        graphics.fillRoundedRect(offsetX, offsetY, w, h, 6);

        // Ventana / cabina
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

        // Ruedas (4 esquinas)
        graphics.fillStyle(0x222222, 1);
        const wheelW = 6;
        const wheelH = 12;
        // Ruedas delanteras
        graphics.fillRect(offsetX - 2, offsetY + 5, wheelW, wheelH);
        graphics.fillRect(offsetX + w - wheelW + 2, offsetY + 5, wheelW, wheelH);
        // Ruedas traseras
        graphics.fillRect(offsetX - 2, offsetY + h - wheelH - 5, wheelW, wheelH);
        graphics.fillRect(offsetX + w - wheelW + 2, offsetY + h - wheelH - 5, wheelW, wheelH);

        // Luces delanteras (solo la parte frontal del auto, que es la superior)
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
     * Gestiona el movimiento del jugador basado en las teclas WASD.
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

        // Normalizar velocidad diagonal
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= CONFIG.DIAGONAL_FACTOR;
            velocityY *= CONFIG.DIAGONAL_FACTOR;
        }

        // Aplicar movimiento
        this.player.x += velocityX * CONFIG.PLAYER_SPEED * deltaSeconds;
        this.player.y += velocityY * CONFIG.PLAYER_SPEED * deltaSeconds;

        // Limitar dentro de la carretera (con margen para las ruedas)
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
     */
    _updateObstacleSpawning(delta) {
        // Reducir el intervalo de aparición conforme aumenta la velocidad
        const speedRatio = (this.roadSpeed - CONFIG.ROAD_INITIAL_SPEED) /
                           (CONFIG.ROAD_MAX_SPEED - CONFIG.ROAD_INITIAL_SPEED);
        this.currentSpawnInterval = Phaser.Math.Linear(
            CONFIG.OBSTACLE_SPAWN_INTERVAL,
            CONFIG.OBSTACLE_MIN_SPAWN_INTERVAL,
            speedRatio
        );

        this.spawnAccumulator += delta;
        if (this.spawnAccumulator >= this.currentSpawnInterval) {
            this.spawnAccumulator -= this.currentSpawnInterval;
            this._spawnObstacle();
        }
    }

    /**
     * Genera un nuevo obstáculo en un carril aleatorio.
     */
    _spawnObstacle() {
        // Elegir un carril aleatorio
        const laneIndex = Phaser.Math.Between(0, CONFIG.NUM_LANES - 1);
        const x = this.laneCenters[laneIndex];
        const y = -CONFIG.OBSTACLE_HEIGHT;

        // Color aleatorio del conjunto definido
        const colorIndex = Phaser.Math.Between(0, CONFIG.OBSTACLE_COLORS.length - 1);
        const color = CONFIG.OBSTACLE_COLORS[colorIndex];

        // Crear textura única por color si no existe
        const textureKey = 'obstacle_' + color.toString(16);
        if (!this.textures.exists(textureKey)) {
            const gfx = this.make.graphics({ x: 0, y: 0, add: false });
            this._drawCar(gfx, color, CONFIG.OBSTACLE_WIDTH, CONFIG.OBSTACLE_HEIGHT, false);
            gfx.generateTexture(textureKey, CONFIG.OBSTACLE_WIDTH + 4, CONFIG.OBSTACLE_HEIGHT + 4);
            gfx.destroy();
        }

        // Crear sprite del obstáculo
        const obstacle = this.add.sprite(x, y, textureKey);
        obstacle.setDepth(9);

        // Velocidad individual del obstáculo (se suma a la velocidad de la carretera)
        obstacle.obstacleSpeed = Phaser.Math.Between(
            CONFIG.OBSTACLE_MIN_SPEED,
            CONFIG.OBSTACLE_MAX_SPEED
        );

        this.obstacles.add(obstacle);
    }

    /**
     * Mueve los obstáculos y comprueba colisiones con el jugador.
     */
    _updateObstacles(deltaSeconds) {
        const children = this.obstacles.getChildren();

        for (let i = children.length - 1; i >= 0; i--) {
            const obstacle = children[i];

            // Mover hacia abajo (velocidad de carretera + velocidad propia del obstáculo)
            obstacle.y += (this.roadSpeed + obstacle.obstacleSpeed) * deltaSeconds;

            // Eliminar si salió de la pantalla
            if (obstacle.y > CONFIG.GAME_HEIGHT + CONFIG.OBSTACLE_HEIGHT) {
                obstacle.destroy();
                continue;
            }

            // Comprobar colisión con el jugador (AABB simplificado)
            if (this._checkCollision(this.player, obstacle)) {
                this._triggerGameOver();
                return;
            }
        }
    }

    /**
     * Detección de colisiones AABB entre dos sprites.
     * @returns {boolean} true si hay colisión
     */
    _checkCollision(spriteA, spriteB) {
        // Usar hitbox reducido para que las colisiones se sientan justas
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
    // PUNTUACIÓN Y VELOCIDAD
    // --------------------------------------------------------

    /**
     * Actualiza la puntuación basada en el tiempo jugado.
     */
    _updateScore(deltaSeconds) {
        this.scoreAccumulator += CONFIG.SCORE_PER_SECOND * deltaSeconds;
        // Solo actualizar cuando se acumula al menos 1 punto
        if (this.scoreAccumulator >= 1) {
            const pointsToAdd = Math.floor(this.scoreAccumulator);
            this.score += pointsToAdd;
            this.scoreAccumulator -= pointsToAdd;
        }
    }

    // --------------------------------------------------------
    // INTERFAZ DE USUARIO (HUD)
    // --------------------------------------------------------

    /**
     * Crea los textos del HUD.
     */
    _createHUD() {
        const hudStyle = {
            fontFamily: CONFIG.UI_FONT_FAMILY,
            fontSize: CONFIG.UI_FONT_SIZE,
            color: CONFIG.UI_COLOR,
            stroke: '#000000',
            strokeThickness: 3
        };

        // Puntuación (esquina superior izquierda, sobre la hierba)
        this.scoreText = this.add.text(10, 10, 'PTS: 0', hudStyle).setDepth(50);

        // Velocidad (esquina superior derecha, sobre la hierba)
        this.speedText = this.add.text(CONFIG.GAME_WIDTH - 10, 10, 'VEL: 200', hudStyle)
            .setOrigin(1, 0)
            .setDepth(50);
    }

    /**
     * Actualiza los textos del HUD cada frame.
     */
    _updateHUD() {
        this.scoreText.setText('PTS: ' + this.score);
        this.speedText.setText('VEL: ' + Math.round(this.roadSpeed));
    }

    // --------------------------------------------------------
    // GAME OVER
    // --------------------------------------------------------

    /**
     * Maneja el fin de la partida.
     */
    _triggerGameOver() {
        this.isGameOver = true;

        const centerX = CONFIG.GAME_WIDTH / 2;
        const centerY = CONFIG.GAME_HEIGHT / 2;

        // Fondo oscuro semitransparente
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.75);
        overlay.fillRect(0, 0, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT);
        this.gameOverContainer.add(overlay);

        // Panel central
        const panel = this.add.graphics();
        panel.fillStyle(0x1a1a2e, 0.95);
        panel.fillRoundedRect(centerX - 160, centerY - 140, 320, 280, 16);
        panel.lineStyle(2, 0x00ccff, 1);
        panel.strokeRoundedRect(centerX - 160, centerY - 140, 320, 280, 16);
        this.gameOverContainer.add(panel);

        // Texto "GAME OVER"
        const gameOverTitle = this.add.text(centerX, centerY - 90, 'GAME OVER', {
            fontFamily: CONFIG.UI_FONT_FAMILY,
            fontSize: '36px',
            color: '#ff4444',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.gameOverContainer.add(gameOverTitle);

        // Puntuación final
        const finalScoreText = this.add.text(centerX, centerY - 30, 'PUNTUACIÓN', {
            fontFamily: CONFIG.UI_FONT_FAMILY,
            fontSize: '16px',
            color: '#aaaaaa'
        }).setOrigin(0.5);
        this.gameOverContainer.add(finalScoreText);

        const scoreValue = this.add.text(centerX, centerY + 10, String(this.score), {
            fontFamily: CONFIG.UI_FONT_FAMILY,
            fontSize: '48px',
            color: CONFIG.UI_HIGHLIGHT_COLOR,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.gameOverContainer.add(scoreValue);

        // Velocidad máxima alcanzada
        const maxSpeedText = this.add.text(centerX, centerY + 55, 'Velocidad máx: ' + Math.round(this.roadSpeed), {
            fontFamily: CONFIG.UI_FONT_FAMILY,
            fontSize: '14px',
            color: '#888888'
        }).setOrigin(0.5);
        this.gameOverContainer.add(maxSpeedText);

        // Botón de reinicio
        this._createGameOverButton(centerX, centerY + 105);

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
     * Usa scene.restart() para limpiar todos los objetos, eventos y temporizadores.
     */
    _restartGame() {
        // Destruir todos los obstáculos restantes
        this.obstacles.clear(true, true);

        // Reiniciar la escena (Phaser limpia automáticamente todos los objetos y listeners)
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
    // Desactivar la física integrada ya que usamos detección manual AABB
    physics: {
        default: null
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    // Evitar que las teclas WASD desplacen la página
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

