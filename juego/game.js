/* ============================================================
   CARRERAS ARCADE — ETAPAS 3.5 y 4
   Circuito de Spa-Francorchamps con elevación + física de conducción
   ============================================================
   Todo el apartado visual se genera con Phaser.GameObjects.Graphics.
   Cero imágenes, cero spritesheets, cero librerías adicionales.
   La física es propia, integrada dentro del ciclo update de Phaser.

   Implementado:
     - Circuito cerrado de 6000 segmentos inspirado en Spa-Francorchamps
       (15 sectores, curvas y desniveles, ~1 m 40 s por vuelta).
     - Proyección pseudo-3D por trapecios con elevación (world.y).
     - Recorte vertical (maxy) para ocultar lo que queda tras una cima.
     - Automóvil visto desde atrás, fijo y centrado.
     - Aceleración progresiva (W), frenada (S) y fricción natural.
     - Dirección lateral (A/D) escalada por velocidad.
     - Fuerza centrífuga en curva y pérdida de velocidad en césped.

   Prohibido todavía: inclinación o derrape visual del coche,
   muros de choque, colisiones, HUD, rivales, menús, sonido.
   ============================================================ */

'use strict';

// ------------------------------------------------------------
// DIMENSIONES
// ------------------------------------------------------------

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

// ------------------------------------------------------------
// CONFIGURACIÓN DE LA PISTA Y DE LA CÁMARA
// ------------------------------------------------------------

const CONFIG = {
    // Longitud de un segmento en unidades de mundo
    SEGMENT_LENGTH: 200,

    // Nº de segmentos por franja de piano (rojo/blanco)
    RUMBLE_LENGTH: 3,

    // Media anchura de la calzada en unidades de mundo.
    // 700 deja el automóvil en ~23 % del ancho total del asfalto.
    ROAD_WIDTH: 700,

    // Altura de la cámara sobre el asfalto
    CAMERA_HEIGHT: 1000,

    // Campo de visión vertical
    FOV: 100,

    // Nº máximo de segmentos proyectados por fotograma
    DRAW_DISTANCE: 220,

    // --- Física de conducción ---

    // Velocidad máxima (unidades de mundo por segundo)
    MAX_SPEED: 12000,

    // Aceleración al mantener W (u/s²): 0 → máximo en ~4,3 s
    ACCEL: 2800,

    // Frenada al mantener S (u/s²): máximo → 0 en ~1,1 s
    FRENO: 11000,

    // Fricción natural al no pulsar nada (u/s²): máximo → 0 en ~6 s
    DECEL: 2000,

    // Fricción fuerte sobre el césped (u/s²)
    DECEL_CESPED: 7000,

    // Techo temporal de velocidad sobre el césped (25 % de MAX_SPEED)
    LIMITE_CESPED: 3000,

    // Empuje lateral hacia el exterior de la curva
    CENTRIFUGA: 0.35,

    // Velocidad de giro lateral a velocidad máxima (unidades/s)
    STEER_RATE: 2,

    // Borde exterior del piano: 1 = borde del asfalto
    ROAD_EDGE: 1.14,

    // --- HUD y cronometraje ---

    // Segmentos que ocupa la línea de meta a cuadros
    META_SEGMENTOS: 5,

    // Velocidad que marca el tope del velocímetro (km/h)
    KMH_MAX: 300,

    // Intervalo de refresco de los textos del HUD (ms)
    HUD_ACTUALIZACION_MS: 33,

    // Línea del horizonte en pantalla
    HORIZON_Y: 236,

    // Posición fija del automóvil
    CAR_X: 400,
    CAR_Y: 500
};

// Constante de proyección: profundidad de la cámara
const CAMERA_DEPTH = 1 / Math.tan((CONFIG.FOV / 2) * Math.PI / 180);

// Profundidad a la que se sitúa el automóvil por delante de la cámara
const PLAYER_Z = CONFIG.CAMERA_HEIGHT * CAMERA_DEPTH;

// Desplazamiento vertical del punto de fuga (lleva el horizonte a HORIZON_Y)
const OFFSET_Y = CONFIG.HORIZON_Y - GAME_HEIGHT / 2;

// ------------------------------------------------------------
// PALETA
// ------------------------------------------------------------

const COLORS = {
    CIELO_ARRIBA: 0x071019,
    CIELO_ABAJO: 0x3d6b8a,
    RESPLANDOR: 0x7fb6d9,
    HORIZONTE: 0x9fd2ee,

    CESPED_CLARO: 0x1f6b3a,
    CESPED_OSCURO: 0x185630,

    PIANO_CLARO: 0xe8e8e8,
    PIANO_OSCURO: 0xc0392b,

    ASFALTO_CLARO: 0x3b4148,
    ASFALTO_OSCURO: 0x333940,

    LINEA: 0xe8e8e8,

    // Línea de meta a cuadros
    META_CLARA: 0xf2f2f2,
    META_OSCURA: 0x101418,

    // Barra de velocidad: cian → verde → rojo
    VEL_BAJA: 0x25c8ff,
    VEL_MEDIA: 0x35d07a,
    VEL_ALTA: 0xff3b2f,

    // Paneles del HUD
    HUD_PANEL: 0x0a0f14,
    HUD_BORDE: 0x2a3a48,
    HUD_BARRA_FONDO: 0x1a2430
};

// ------------------------------------------------------------
// HUD: LAYOUT Y TIPOGRAFÍA
// ------------------------------------------------------------

const HUD = {
    IZQ: { x: 14, y: 14, w: 210, h: 76 },
    DER: { x: 576, y: 14, w: 210, h: 76 },
    BARRA: { x: 590, y: 64, w: 182, h: 8 },
    ETIQUETA: '#7d94a8',
    VALOR: '#e8f1f8',
    TENUE: '#55697a',
    FUENTE: 'Consolas, "Courier New", monospace',
    FUENTE_UI: 'Segoe UI, Tahoma, sans-serif'
};

// Tabla de color de la barra (101 muestras precalculadas, sin calcular en caliente)
const COLORES_VELOCIDAD = (() => {
    const tabla = [];
    const cian = Phaser.Display.Color.ValueToColor(COLORS.VEL_BAJA);
    const verde = Phaser.Display.Color.ValueToColor(COLORS.VEL_MEDIA);
    const rojo = Phaser.Display.Color.ValueToColor(COLORS.VEL_ALTA);

    for (let i = 0; i <= 100; i++) {
        const pct = i / 100;
        const c = pct < 0.5
            ? Phaser.Display.Color.Interpolate.ColorWithColor(cian, verde, 100, pct * 200)
            : Phaser.Display.Color.Interpolate.ColorWithColor(verde, rojo, 100, (pct - 0.5) * 200);

        tabla.push(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
    }
    return tabla;
})();

// ------------------------------------------------------------
// TRAZADO DEL CIRCUITO — SPA-FRANCORCHAMPS
// ------------------------------------------------------------
// Cada fila es un tramo con tres fases (entrada / retención / salida),
// una curvatura constante y un desnivel respecto al tramo anterior.
//
//   curva: 0 = recta, positivo = derecha, negativo = izquierda.
//   dy:    desnivel en múltiplos de SEGMENT_LENGTH (+ sube, − baja).
//
// La suma de segmentos es 6000 (1 200 000 u) y la altura acumulada
// vuelve exactamente a 0, de modo que el cierre con el primer segmento
// no produce salto ni de altura ni de curvatura.

const SECTORES = [
    // 1 · Recta principal
    { nombre: 'Recta principal',        e: 100, r: 300, s: 100, curva:  0, dy:   0 },
    // 2 · La Source: horquilla muy cerrada a la derecha
    { nombre: 'La Source',              e:  50, r:  60, s:  50, curva:  8, dy:  -5 },
    // 3 · Bajada rápida hacia Eau Rouge con ligera izquierda
    { nombre: 'Bajada a Eau Rouge',     e:  80, r: 160, s:  80, curva: -2, dy: -20 },
    // 4 · Raidillon: subida pronunciada derecha-izquierda
    { nombre: 'Raidillon A',            e:  60, r:  80, s:  60, curva:  5, dy:  20 },
    { nombre: 'Raidillon B (cima)',     e:  60, r:  80, s:  60, curva: -3, dy:  28 },
    // 5 · Kemmel Straight: recta en ligera subida
    { nombre: 'Kemmel Straight',        e: 120, r: 520, s: 120, curva:  0, dy:   6 },
    // 6 · Les Combes: chicane rápida derecha-izquierda-derecha
    { nombre: 'Les Combes A',           e:  50, r:  40, s:  50, curva:  4, dy:   2 },
    { nombre: 'Les Combes B',           e:  35, r:  40, s:  35, curva: -4, dy:   0 },
    { nombre: 'Les Combes C',           e:  35, r:  40, s:  35, curva:  3, dy:   0 },
    // 7 · Descenso hacia Bruxelles
    { nombre: 'Descenso a Bruxelles',   e:  70, r: 160, s:  70, curva:  0, dy: -12 },
    // 8 · Bruxelles (Rivage): curva larga a la derecha en bajada
    { nombre: 'Bruxelles (Rivage)',     e:  90, r: 240, s:  90, curva:  6, dy:  -8 },
    // 9 · Speaker's Corner: curva media a la izquierda
    { nombre: "Speaker's Corner",       e:  60, r: 120, s:  60, curva: -5, dy:   0 },
    // 10 · Pouhon: doble izquierda rápida en descenso
    { nombre: 'Pouhon A',               e:  70, r: 120, s:  70, curva: -6, dy:  -8 },
    { nombre: 'Pouhon B',               e:  70, r: 120, s:  70, curva: -5, dy:  -8 },
    // 11 · Campus (Fagnes): secuencia técnica derecha-izquierda
    { nombre: 'Fagnes',                 e:  55, r:  80, s:  55, curva:  5, dy:   2 },
    { nombre: 'Campus',                 e:  55, r:  80, s:  55, curva: -5, dy:   2 },
    // 12 · Stavelot: derecha que abre al sector rápido
    { nombre: 'Stavelot',               e:  80, r: 280, s:  80, curva:  7, dy:   4 },
    // 13 · Blanchimont: curvas rápidas a la izquierda
    { nombre: 'Blanchimont A',          e:  80, r: 180, s:  80, curva: -4, dy:   3 },
    { nombre: 'Blanchimont B',          e:  50, r:  60, s:  50, curva: -3, dy:   2 },
    // 14 · Bus Stop: chicane cerrada derecha-izquierda
    { nombre: 'Bus Stop A',             e:  55, r:  55, s:  50, curva:  7, dy:   0 },
    { nombre: 'Bus Stop B',             e:  50, r:  60, s:  50, curva: -8, dy:  -2 },
    // 15 · Cierre: recta corta que devuelve la altura a 0
    { nombre: 'Cierre a meta',          e:  80, r: 220, s:  80, curva:  0, dy:  -6 }
];

// ------------------------------------------------------------
// GEOMETRÍA: PUNTOS Y SEGMENTOS
// ------------------------------------------------------------

/**
 * Interpolación con aceleración inicial (ease-in cuadrático).
 * Se usa para entrar en una curva de forma progresiva.
 */
function easeIn(a, b, pct) {
    return a + (b - a) * (pct * pct);
}

/**
 * Interpolación suave de extremo a extremo (coseno).
 * Se usa para las pendientes: evita cambios bruscos de rasante.
 */
function easeInOut(a, b, pct) {
    return a + (b - a) * ((-Math.cos(pct * Math.PI) / 2) + 0.5);
}

/**
 * Crea un punto con sus tres espacios de coordenadas:
 * mundo, cámara y pantalla. `y` es la altura del terreno.
 */
function crearPunto(z, y) {
    return {
        world: { x: 0, y: y, z: z },
        camera: { x: 0, y: 0, z: 0 },
        screen: { x: 0, y: 0, w: 0, scale: 0 }
    };
}

/**
 * Crea un segmento con sus colores ya resueltos.
 * Alternar por índice garantiza el patrón de pianos y de tonos
 * de asfalto sin costuras al cerrar la vuelta.
 */
function crearSegmento(index, curva, y1, y2) {
    const z = index * CONFIG.SEGMENT_LENGTH;
    const oscuro = Math.floor(index / CONFIG.RUMBLE_LENGTH) % 2 === 0;

    return {
        index: index,
        curve: curva,
        p1: crearPunto(z, y1),
        p2: crearPunto(z + CONFIG.SEGMENT_LENGTH, y2),
        cesped: oscuro ? COLORS.CESPED_OSCURO : COLORS.CESPED_CLARO,
        piano: oscuro ? COLORS.PIANO_OSCURO : COLORS.PIANO_CLARO,
        asfalto: oscuro ? COLORS.ASFALTO_OSCURO : COLORS.ASFALTO_CLARO
    };
}

/**
 * Construye el circuito completo a partir de SECTORES.
 * Se ejecuta una única vez al iniciar la escena.
 *
 * Equivale a los clásicos addSegment / addRoad / addHill / addCurve:
 *   - agregarSegmento: añade un segmento heredando la altura anterior.
 *   - agregarCamino:  reparte curvatura y desnivel en tres fases.
 */
function construirPista() {
    const segmentos = [];
    let ultimaY = 0;

    const agregarSegmento = (curva, y) => {
        segmentos.push(crearSegmento(segmentos.length, curva, ultimaY, y));
        ultimaY = y;
    };

    const agregarCamino = (entrada, retencion, salida, curva, dy) => {
        const y0 = ultimaY;
        const y1 = y0 + (dy * CONFIG.SEGMENT_LENGTH);
        const total = entrada + retencion + salida;

        // Entrada: la curvatura sube de 0 a `curva` con ease-in
        for (let n = 0; n < entrada; n++) {
            agregarSegmento(easeIn(0, curva, n / entrada), easeInOut(y0, y1, n / total));
        }
        // Retención: curvatura constante
        for (let n = 0; n < retencion; n++) {
            agregarSegmento(curva, easeInOut(y0, y1, (entrada + n) / total));
        }
        // Salida: la curvatura vuelve a 0
        for (let n = 0; n < salida; n++) {
            agregarSegmento(
                easeInOut(curva, 0, n / salida),
                easeInOut(y0, y1, (entrada + retencion + n) / total)
            );
        }

        // Cierre exacto de la fase: el último pct nunca llega a 1, así que
        // se fija la altura final para que el error no se acumule por sector.
        segmentos[segmentos.length - 1].p2.world.y = y1;
        ultimaY = y1;
    };

    for (let i = 0; i < SECTORES.length; i++) {
        const t = SECTORES[i];
        agregarCamino(t.e, t.r, t.s, t.curva, t.dy);
    }

    return {
        segmentos: segmentos,
        longitud: segmentos.length * CONFIG.SEGMENT_LENGTH
    };
}

/**
 * Devuelve el segmento que contiene una posición z.
 * El módulo es lo que cierra el circuito: tras el último
 * segmento se vuelve al primero de forma continua.
 */
function buscarSegmento(pista, z) {
    const total = pista.segmentos.length;
    const indice = Math.floor(z / CONFIG.SEGMENT_LENGTH) % total;
    return pista.segmentos[(indice + total) % total];
}

/**
 * Restringe un valor a un intervalo cerrado.
 */
function limitar(valor, minimo, maximo) {
    if (valor < minimo) {
        return minimo;
    }
    if (valor > maximo) {
        return maximo;
    }
    return valor;
}

/**
 * Formatea milisegundos como MM:SS.mmm (por ejemplo 01:24.350).
 * El ancho fijo evita que el texto salte al cambiar de dígito.
 */
function formatearTiempo(ms) {
    const total = Math.max(0, Math.floor(ms));
    const minutos = Math.floor(total / 60000);
    const segundos = Math.floor((total % 60000) / 1000);
    const milesimas = total % 1000;

    return String(minutos).padStart(2, '0') + ':' +
        String(segundos).padStart(2, '0') + '.' +
        String(milesimas).padStart(3, '0');
}

// ------------------------------------------------------------
// PROYECCIÓN PSEUDO-3D
// ------------------------------------------------------------

/**
 * Proyecta un punto del mundo a coordenadas de pantalla.
 * La escala es inversamente proporcional a la profundidad:
 * lo lejano se comprime hacia el punto de fuga.
 */
function proyectar(p, camX, camY, camZ) {
    p.camera.x = p.world.x - camX;
    p.camera.y = p.world.y - camY;
    p.camera.z = p.world.z - camZ;

    // Evita la división por cero en los puntos pegados a la cámara
    const z = p.camera.z < 0.1 ? 0.1 : p.camera.z;
    p.screen.scale = CAMERA_DEPTH / z;

    p.screen.x = (GAME_WIDTH / 2) + (p.screen.scale * p.camera.x * GAME_WIDTH / 2);
    p.screen.y = (GAME_HEIGHT / 2) - (p.screen.scale * p.camera.y * GAME_HEIGHT / 2) + OFFSET_Y;
    p.screen.w = p.screen.scale * CONFIG.ROAD_WIDTH * GAME_WIDTH / 2;
}

// Búfer reutilizado: cero asignaciones dentro del bucle de dibujo
const PUNTOS_TRAPECIO = [
    { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }
];

/**
 * Rellena un trapecio entre dos líneas horizontales.
 * xIzq/xDer son los extremos de cada línea (arriba = lejos).
 */
function rellenarTrapecio(g, color, xIzq1, xDer1, y1, xIzq2, xDer2, y2) {
    PUNTOS_TRAPECIO[0].x = xIzq1; PUNTOS_TRAPECIO[0].y = y1;
    PUNTOS_TRAPECIO[1].x = xDer1; PUNTOS_TRAPECIO[1].y = y1;
    PUNTOS_TRAPECIO[2].x = xDer2; PUNTOS_TRAPECIO[2].y = y2;
    PUNTOS_TRAPECIO[3].x = xIzq2; PUNTOS_TRAPECIO[3].y = y2;

    g.fillStyle(color, 1);
    g.fillPoints(PUNTOS_TRAPECIO, true);
}

/**
 * Dibuja una capa de un segmento: césped, piano, asfalto y líneas.
 */
function dibujarSegmento(g, seg) {
    const p1 = seg.p1.screen;
    const p2 = seg.p2.screen;
    const alto = p1.y - p2.y;
    if (alto <= 0) {
        return;
    }

    // Césped: franja completa, para que nunca queden huecos laterales
    g.fillStyle(seg.cesped, 1);
    g.fillRect(0, p2.y, GAME_WIDTH, alto + 1);

    // Piano exterior rojo/blanco
    const r1 = p1.w * 1.14;
    const r2 = p2.w * 1.14;
    rellenarTrapecio(g, seg.piano, p1.x - r1, p1.x + r1, p1.y, p2.x - r2, p2.x + r2, p2.y);

    // Asfalto
    rellenarTrapecio(g, seg.asfalto, p1.x - p1.w, p1.x + p1.w, p1.y, p2.x - p2.w, p2.x + p2.w, p2.y);

    // Líneas divisorias (3 carriles => 2 líneas)
    if (p1.w > 8) {
        const l1 = Math.max(p1.w * 0.01, 0.5);
        const l2 = Math.max(p2.w * 0.01, 0.5);

        for (let k = -1; k <= 1; k += 2) {
            const c1 = p1.x + (k * p1.w / 3);
            const c2 = p2.x + (k * p2.w / 3);
            rellenarTrapecio(g, COLORS.LINEA, c1 - l1, c1 + l1, p1.y, c2 - l2, c2 + l2, p2.y);
        }
    }

    // Línea de meta: damero sobre los primeros segmentos del circuito
    if (seg.index < CONFIG.META_SEGMENTOS) {
        const columnas = 12;

        for (let c = 0; c < columnas; c++) {
            const t0 = c / columnas;
            const t1 = (c + 1) / columnas;
            const color = ((seg.index + c) % 2 === 0) ? COLORS.META_CLARA : COLORS.META_OSCURA;

            rellenarTrapecio(
                g, color,
                p1.x - p1.w + (2 * p1.w * t0), p1.x - p1.w + (2 * p1.w * t1), p1.y,
                p2.x - p2.w + (2 * p2.w * t0), p2.x - p2.w + (2 * p2.w * t1), p2.y
            );
        }
    }
}

// ------------------------------------------------------------
// ESCENA DE LA PISTA
// ------------------------------------------------------------

class PistaScene extends Phaser.Scene {

    constructor() {
        super({ key: 'PistaScene' });
    }

    create() {
        // Circuito en memoria (se construye una sola vez)
        this.pista = construirPista();

        // Estado de avance
        this.posicion = 0;
        this.velocidad = 0;

        // Posición lateral normalizada: 0 = centro, ±1 = borde del asfalto
        this.playerX = 0;

        // Búfer de segmentos visibles, reutilizado cada fotograma
        this.visibles = [];

        // Cronometraje de vueltas
        this.tiempoVuelta = 0;
        this.mejorVuelta = null;
        this.cronometroActivo = false;
        this.acumuladorHud = 0;

        // Capas: fondo estático, pista redibujable, automóvil fijo
        this.dibujarFondo();
        this.capaPista = this.add.graphics().setDepth(0);
        this.dibujarAuto();

        // Interfaz superpuesta
        this.crearHud();

        // Controles de conducción
        this.teclas = this.input.keyboard.addKeys({
            adelante: Phaser.Input.Keyboard.KeyCodes.W,
            atras: Phaser.Input.Keyboard.KeyCodes.S,
            izquierda: Phaser.Input.Keyboard.KeyCodes.A,
            derecha: Phaser.Input.Keyboard.KeyCodes.D
        });

        // Primer fotograma antes de que llegue update()
        this.dibujarPista();
    }

    /**
     * HUD: dos paneles semitransparentes, cronómetro y velocímetro.
     * Todo se dibuja con Graphics y Text nativos, con depth alto.
     */
    crearHud() {
        const paneles = this.add.graphics().setDepth(20);

        for (const p of [HUD.IZQ, HUD.DER]) {
            paneles.fillStyle(COLORS.HUD_PANEL, 0.62);
            paneles.fillRoundedRect(p.x, p.y, p.w, p.h, 8);
            paneles.lineStyle(1, COLORS.HUD_BORDE, 0.9);
            paneles.strokeRoundedRect(p.x, p.y, p.w, p.h, 8);
        }

        // --- Panel izquierdo: cronómetro ---

        this.add.text(HUD.IZQ.x + 12, HUD.IZQ.y + 20, 'TIEMPO', {
            fontFamily: HUD.FUENTE_UI, fontSize: '12px', color: HUD.ETIQUETA
        }).setOrigin(0, 0.5).setDepth(21);

        this.txtTiempo = this.add.text(HUD.IZQ.x + HUD.IZQ.w - 12, HUD.IZQ.y + 20, '00:00.000', {
            fontFamily: HUD.FUENTE, fontSize: '18px', color: HUD.VALOR
        }).setOrigin(1, 0.5).setDepth(21);

        this.add.text(HUD.IZQ.x + 12, HUD.IZQ.y + 50, 'MEJOR', {
            fontFamily: HUD.FUENTE_UI, fontSize: '12px', color: HUD.ETIQUETA
        }).setOrigin(0, 0.5).setDepth(21);

        this.txtMejor = this.add.text(HUD.IZQ.x + HUD.IZQ.w - 12, HUD.IZQ.y + 50, '--:--.---', {
            fontFamily: HUD.FUENTE, fontSize: '18px', color: HUD.TENUE
        }).setOrigin(1, 0.5).setDepth(21);

        // --- Panel derecho: velocímetro ---

        this.add.text(HUD.DER.x + 14, HUD.DER.y + 20, 'KM/H', {
            fontFamily: HUD.FUENTE_UI, fontSize: '12px', color: HUD.ETIQUETA
        }).setOrigin(0, 0.5).setDepth(21);

        this.txtVel = this.add.text(HUD.DER.x + HUD.DER.w - 14, HUD.DER.y + 24, '0', {
            fontFamily: HUD.FUENTE, fontSize: '28px', color: HUD.VALOR
        }).setOrigin(1, 0.5).setDepth(21);

        // Barra de velocidad: se redibuja cada fotograma
        this.barraVel = this.add.graphics().setDepth(21);
        this.dibujarBarraVelocidad();
    }

    /**
     * Barra de velocidad: fondo fijo + relleno proporcional.
     */
    dibujarBarraVelocidad() {
        const b = HUD.BARRA;
        const pct = limitar(this.velocidad / CONFIG.MAX_SPEED, 0, 1);
        const g = this.barraVel;

        g.clear();
        g.fillStyle(COLORS.HUD_BARRA_FONDO, 1);
        g.fillRoundedRect(b.x, b.y, b.w, b.h, b.h / 2);

        if (pct > 0) {
            // El mínimo de `b.h` deja visible un punto de color a velocidad muy baja
            const ancho = Math.max(b.h, b.w * pct);
            g.fillStyle(COLORES_VELOCIDAD[Math.round(pct * 100)], 1);
            g.fillRoundedRect(b.x, b.y, ancho, b.h, b.h / 2);
        }
    }

    /**
     * Refresca el HUD. La barra se redibuja cada fotograma (dos rectángulos);
     * los textos, cada 33 ms, para no regenerar su textura 60 veces por segundo.
     */
    actualizarHud(delta) {
        this.dibujarBarraVelocidad();

        this.acumuladorHud += delta;
        if (this.acumuladorHud < CONFIG.HUD_ACTUALIZACION_MS) {
            return;
        }
        this.acumuladorHud = 0;

        this.txtTiempo.setText(formatearTiempo(this.tiempoVuelta));
        this.txtMejor.setText(this.mejorVuelta === null
            ? '--:--.---'
            : formatearTiempo(this.mejorVuelta));

        const pct = limitar(this.velocidad / CONFIG.MAX_SPEED, 0, 1);
        this.txtVel.setText(String(Math.round(pct * CONFIG.KMH_MAX)));
    }

    /**
     * Cielo y horizonte estáticos. Se dibujan una sola vez.
     */
    dibujarFondo() {
        const g = this.add.graphics();

        // Degradado aproximado del cielo por bandas horizontales
        const arriba = Phaser.Display.Color.ValueToColor(COLORS.CIELO_ARRIBA);
        const abajo = Phaser.Display.Color.ValueToColor(COLORS.CIELO_ABAJO);
        const bandas = 24;
        const altoBanda = CONFIG.HORIZON_Y / bandas;

        for (let i = 0; i < bandas; i++) {
            const c = Phaser.Display.Color.Interpolate.ColorWithColor(arriba, abajo, bandas - 1, i);
            g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
            g.fillRect(0, Math.floor(i * altoBanda), GAME_WIDTH, Math.ceil(altoBanda) + 1);
        }

        // Resplandor suave sobre la línea del horizonte
        g.fillStyle(COLORS.RESPLANDOR, 0.16);
        g.fillRect(0, CONFIG.HORIZON_Y - 26, GAME_WIDTH, 26);

        // Línea del horizonte
        g.fillStyle(COLORS.HORIZONTE, 0.5);
        g.fillRect(0, CONFIG.HORIZON_Y - 1, GAME_WIDTH, 2);

        // Base de césped bajo el horizonte
        g.fillStyle(COLORS.CESPED_OSCURO, 1);
        g.fillRect(0, CONFIG.HORIZON_Y, GAME_WIDTH, GAME_HEIGHT - CONFIG.HORIZON_Y);
    }

    /**
     * Automóvil visto desde atrás, dibujado una sola vez.
     * Todas las coordenadas son locales a (CAR_X, CAR_Y).
     */
    dibujarAuto() {
        const g = this.add.graphics({ x: CONFIG.CAR_X, y: CONFIG.CAR_Y }).setDepth(5);

        // Sombra de contacto con el asfalto
        g.fillStyle(0x000000, 0.45);
        g.fillEllipse(0, 40, 148, 26);

        // Neumáticos traseros
        g.fillStyle(0x121418, 1);
        g.fillRoundedRect(-68, 12, 24, 32, 5);
        g.fillRoundedRect(44, 12, 24, 32, 5);

        // Carrocería: trapecio más ancho en la base
        const cuerpo = [
            { x: -56, y: -6 }, { x: 56, y: -6 },
            { x: 62, y: 36 }, { x: -62, y: 36 }
        ];
        g.fillStyle(0xd93b2f, 1);
        g.fillPoints(cuerpo, true);

        // Volumen: franja inferior en tono más oscuro
        const faldon = [
            { x: -62, y: 24 }, { x: 62, y: 24 },
            { x: 62, y: 36 }, { x: -62, y: 36 }
        ];
        g.fillStyle(0x9e2a22, 1);
        g.fillPoints(faldon, true);

        // Habitáculo / techo
        const techo = [
            { x: -40, y: -34 }, { x: 40, y: -34 },
            { x: 50, y: -6 }, { x: -50, y: -6 }
        ];
        g.fillStyle(0xb32f25, 1);
        g.fillPoints(techo, true);

        // Luneta trasera
        const luneta = [
            { x: -33, y: -31 }, { x: 33, y: -31 },
            { x: 41, y: -10 }, { x: -41, y: -10 }
        ];
        g.fillStyle(0x101a24, 1);
        g.fillPoints(luneta, true);

        // Reflejo en el cristal
        const reflejo = [
            { x: -28, y: -28 }, { x: 8, y: -28 },
            { x: 12, y: -22 }, { x: -24, y: -22 }
        ];
        g.fillStyle(0x2b4256, 0.9);
        g.fillPoints(reflejo, true);

        // Luces de freno
        g.fillStyle(0xff3b2f, 1);
        g.fillRoundedRect(-56, 4, 30, 14, 3);
        g.fillRoundedRect(26, 4, 30, 14, 3);

        g.fillStyle(0xff9a8a, 1);
        g.fillRoundedRect(-51, 7, 20, 8, 2);
        g.fillRoundedRect(31, 7, 20, 8, 2);

        // Parachoques y matrícula
        g.fillStyle(0x23262b, 1);
        g.fillRoundedRect(-58, 28, 116, 9, 3);

        g.fillStyle(0xdfe6ee, 1);
        g.fillRect(-16, 20, 32, 9);

        g.fillStyle(0x2a2d33, 1);
        g.fillRect(-12, 23, 24, 3);
    }

    /**
     * Proyecta y dibuja la pista del fotograma actual.
     */
    dibujarPista() {
        const g = this.capaPista;
        g.clear();

        const segmentos = this.pista.segmentos;
        const total = segmentos.length;
        const longitud = this.pista.longitud;

        const base = buscarSegmento(this.pista, this.posicion);
        const basePct = (this.posicion % CONFIG.SEGMENT_LENGTH) / CONFIG.SEGMENT_LENGTH;

        // Desplazamiento lateral del jugador respecto al centro de la vía
        const camX = this.playerX * CONFIG.ROAD_WIDTH;

        // La cámara sigue la rasante del segmento sobre el que va el coche
        const segCoche = buscarSegmento(this.pista, this.posicion + PLAYER_Z);
        const pctCoche = ((this.posicion + PLAYER_Z) % CONFIG.SEGMENT_LENGTH) / CONFIG.SEGMENT_LENGTH;
        const alturaCoche = segCoche.p1.world.y +
            ((segCoche.p2.world.y - segCoche.p1.world.y) * pctCoche);

        const camY = alturaCoche + CONFIG.CAMERA_HEIGHT;
        const camZ = this.posicion;

        // Acumuladores de la curva (es lo que dobla la carretera)
        let x = 0;
        let dx = -(base.curve * basePct);

        let maxy = GAME_HEIGHT;
        const visibles = this.visibles;
        visibles.length = 0;

        // PASADA 1: proyección de cerca a lejos + recorte
        for (let n = 0; n < CONFIG.DRAW_DISTANCE; n++) {
            const seg = segmentos[(base.index + n) % total];

            // Al cruzar el final del circuito se descuenta una vuelta
            const repetido = seg.index < base.index;
            const zCam = camZ - (repetido ? longitud : 0);

            proyectar(seg.p1, camX - x, camY, zCam);
            proyectar(seg.p2, camX - x - dx, camY, zCam);

            x += dx;
            dx += seg.curve;

            if (seg.p1.camera.z <= CAMERA_DEPTH) { continue; }        // detrás de la cámara
            if (seg.p2.screen.y >= seg.p1.screen.y) { continue; }     // cara trasera
            if (seg.p2.screen.y >= maxy) { continue; }                // tapado por una cima
            if ((seg.p1.screen.y - seg.p2.screen.y) < 0.4) { continue; } // menos de 0,4 px de alto

            maxy = seg.p2.screen.y;
            visibles.push(seg);
        }

        // PASADA 2: pintado de lejos a cerca (algoritmo del pintor)
        for (let i = visibles.length - 1; i >= 0; i--) {
            dibujarSegmento(g, visibles[i]);
        }
    }

    /**
     * Física de conducción arcade.
     * Orden del ciclo: giro → centrífuga → velocidad → césped →
     * límites → avance y redibujado.
     */
    update(_time, delta) {
        const dt = Math.min(delta, 50) / 1000;
        const pista = this.pista;

        // Posición antes de avanzar: la usará la detección de meta
        const posicionPrevia = this.posicion;

        // Segmento en el que está el coche (por delante de la cámara)
        const segCoche = buscarSegmento(pista, this.posicion + PLAYER_Z);
        const pctVelocidad = this.velocidad / CONFIG.MAX_SPEED;

        // --- 1. Giro lateral: proporcional a la velocidad, nulo si está parado ---
        const dx = dt * CONFIG.STEER_RATE * pctVelocidad;

        if (this.velocidad > 0) {
            if (this.teclas.izquierda.isDown) {
                this.playerX -= dx;
            } else if (this.teclas.derecha.isDown) {
                this.playerX += dx;
            }
        }

        // --- 2. Fuerza centrífuga hacia el exterior de la curva ---
        // Crece con el cuadrado de la velocidad y con la curvatura del tramo.
        this.playerX -= dx * pctVelocidad * segCoche.curve * CONFIG.CENTRIFUGA;

        // --- 3. Velocidad: acelerar, frenar o fricción natural ---
        if (this.teclas.adelante.isDown) {
            this.velocidad += CONFIG.ACCEL * dt;
        } else if (this.teclas.atras.isDown) {
            this.velocidad -= CONFIG.FRENO * dt;
        } else {
            this.velocidad -= CONFIG.DECEL * dt;
        }
        this.velocidad = limitar(this.velocidad, 0, CONFIG.MAX_SPEED);

        // --- 4. Penalización fuera de pista ---
        // Sin muros: solo desaceleración fuerte y techo temporal de velocidad.
        if (Math.abs(this.playerX) > CONFIG.ROAD_EDGE) {
            if (this.velocidad > CONFIG.LIMITE_CESPED) {
                this.velocidad = Math.max(
                    CONFIG.LIMITE_CESPED,
                    this.velocidad - (CONFIG.DECEL_CESPED * dt)
                );
            }
        }

        // --- 5. Límites del terreno (el césped es finito) ---
        this.playerX = limitar(this.playerX, -2, 2);

        // --- 6. Avance y redibujado ---
        const longitud = pista.longitud;
        this.posicion = ((this.posicion + (this.velocidad * dt)) % longitud + longitud) % longitud;

        // --- 7. Cronómetro y control de vueltas ---
        // El reloj no corre hasta que el coche se mueve por primera vez.
        if (!this.cronometroActivo && this.velocidad > 0) {
            this.cronometroActivo = true;
        }
        if (this.cronometroActivo) {
            this.tiempoVuelta += delta;
        }

        // La posición solo crece, así que el único descenso posible es el
        // salto del módulo al cruzar la meta. Las dos guardas de rango evitan
        // falsos positivos si el coche frena o se detiene cerca de la línea.
        const cruzoMeta = (this.posicion < posicionPrevia) &&
            (posicionPrevia > longitud * 0.9) &&
            (this.posicion < longitud * 0.1);

        if (cruzoMeta) {
            if (this.mejorVuelta === null || this.tiempoVuelta < this.mejorVuelta) {
                this.mejorVuelta = this.tiempoVuelta;
                this.txtMejor.setColor(HUD.VALOR);
            }
            this.tiempoVuelta = 0;
        }

        // --- 8. Interfaz ---
        this.actualizarHud(delta);

        this.dibujarPista();
    }
}

// ------------------------------------------------------------
// CONFIGURACIÓN DE PHASER
// ------------------------------------------------------------

const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: COLORS.CIELO_ARRIBA,
    scene: [PistaScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// ------------------------------------------------------------
// ARRANQUE
// ------------------------------------------------------------

window.addEventListener('load', () => {
    window.juego = new Phaser.Game(config);
});
