# 🏎️ GT8 · Spa-Francorchamps — Simulador pseudo-3D

Proyecto de videojuego de carreras arcade con **perspectiva pseudo-3D** y **circuito cerrado**, inspirado en Spa-Francorchamps y desarrollado con **Phaser 3**, **JavaScript**, **HTML5** y **CSS3**.

> Estado actual: **Etapa 6 — Reestructuración y escaparate digital**. El juego vive en `juego/` y la raíz aloja una *landing page* con estética de terminal de telemetría que presenta el proyecto y da acceso al simulador.

---

## 📁 Estructura del proyecto

```
o-a-cevallos-leonel-alessandro-jueg-gr1/
├── index.html      ← Escaparate digital (landing de telemetría)
├── style.css       ← Estilos de la landing
├── juego/
│   ├── index.html  ← Contenedor del canvas + barra de retorno
│   ├── style.css   ← Estilos del juego y de la barra superior
│   └── game.js     ← Pista, física y HUD (Etapa 5, sin cambios)
├── legacy/         ← Proyecto anterior (top-down lineal). Solo referencia
├── .gitignore
└── README.md
```

---

## 🖥️ Escaparate digital (`index.html`)

Landing de una sola página, sin frameworks ni fuentes externas:

| Bloque | Contenido |
|---|---|
| Barra de estado | Marca GT8, `STATUS: TRACK GREEN`, `CIRCUIT: SPA-FRANCORCHAMPS 7.004 KM`, `TELEMETRY: ONLINE` |
| Hero | Título, entradilla, logline comercial y CTA `Iniciar simulación` |
| Tira de telemetría | Cuatro lecturas simuladas (vuelta, mejor, velocidad, sector) |
| Misión 01 | Lore del piloto-ingeniero + tres tarjetas de resonancia ludonarrativa |
| Cabina | Diagrama WASD, descripción de controles y lectura del HUD |
| Misión 02 | Sello de clasificación creativa, muro de honor de licencias y política de privacidad |

Paleta: fondo `#070809`, acento de competición `#e10600`, cian de datos `#00f0ff`, verde de estado `#2ee06a`. Tipografía monoespaciada del sistema para datos y sans del sistema para prosa. Todo el apartado gráfico es CSS e inline SVG: **cero peticiones de red** aparte del CDN del juego.

---

## ✅ Alcance del simulador

| Implementado | Detalle |
|---|---|
| Circuito | 6 000 segmentos (1 200 000 u), 15 sectores inspirados en Spa-Francorchamps |
| Duración de vuelta | ~1 m 40 s a velocidad máxima (12 000 u/s) |
| Elevación | `world.y` por segmento, con `easeIn`/`easeInOut`; desniveles de +6 200 a −5 000 u |
| Recorte de horizonte | `maxy` oculta los segmentos que quedan tras una cima |
| Ancho de pista | `ROAD_WIDTH` 700 → el coche ocupa el 23,2 % del asfalto |
| Proyección pseudo-3D | Trapecios por segmento, `Phaser.AUTO`, 800 × 600 |
| Automóvil | Visto desde atrás, fijo en (400, 500), 100 % `Graphics` |
| Aceleración | Progresiva con `W` hasta 12 000 u/s (~4,3 s) |
| Frenada | `S` frena en ~1,1 s, sin marcha atrás |
| Dirección | `A` / `D`, solo en movimiento y escalada por velocidad |
| Fuerza centrífuga | Empuje al exterior proporcional a curvatura × velocidad² |
| Fuera de pista | Fricción fuerte y tope del 25 % de la velocidad máxima |
| Línea de meta | Damero a cuadros sobre los 5 primeros segmentos |
| Cronómetro | Vuelta actual y mejor vuelta en `MM:SS.mmm` |
| Velocímetro | 0–300 km/h + barra cian → verde → rojo |
| Gráficos | Cero imágenes y cero spritesheets externos |

---

## 🎮 Controles

| Tecla | Acción |
|---|---|
| **W** | Acelerar |
| **S** | Frenar |
| **A** | Girar a la izquierda |
| **D** | Girar a la derecha |

El automóvil se dibuja siempre igual y en el mismo sitio: el desplazamiento lateral se aprecia en cómo se mueve la carretera bajo él. En las curvas fuertes hay que levantar el pie o frenar: a velocidad máxima el empuje centrífugo supera al volante.

---

## 🗺️ Sectores del circuito

| # | Sector | Curva | Δ altura |
|---|---|---|---|
| 1 | Recta principal | — | 0 |
| 2 | La Source | horquilla dcha | −5 |
| 3 | Bajada a Eau Rouge | izq. ligera | −20 |
| 4 | Raidillon A | dcha. | +20 |
| 5 | Raidillon B (cima ciega) | izq. | +28 |
| 6 | Kemmel Straight | — | +6 |
| 7-9 | Les Combes | chicane dcha-izq-dcha | +2 |
| 10 | Descenso a Bruxelles | — | −12 |
| 11 | Bruxelles (Rivage) | dcha. larga | −8 |
| 12 | Speaker's Corner | izq. media | 0 |
| 13-14 | Pouhon | doble izq. | −16 |
| 15-16 | Fagnes / Campus | dcha-izq. | +4 |
| 17 | Stavelot | dcha. | +4 |
| 18-19 | Blanchimont | izq. rápidas | +5 |
| 20-21 | Bus Stop | chicane dcha-izq. | −2 |
| 22 | Cierre a meta | — | −6 |

La altura acumulada termina exactamente en 0, así que el cierre con el primer segmento no produce ningún salto.

---

## ⏱️ HUD del simulador

| Elemento | Dónde | Detalle |
|---|---|---|
| `TIEMPO` | Panel superior izquierdo | Vuelta actual, formato `MM:SS.mmm` |
| `MEJOR` | Panel superior izquierdo | Mejor vuelta; `--:--.---` hasta completar la primera |
| `KM/H` | Panel superior derecho | 0–300 km/h mapeado desde la velocidad real |
| Barra | Bajo el velocímetro | Cian → verde → rojo según la velocidad |
| Meta | Asfalto, segmento 0 | Damero blanco y negro de 12 columnas |

El cronómetro arranca en cuanto el coche se mueve y se reinicia al cruzar la meta. Los textos se refrescan a 30 Hz; la barra, a 60 Hz.

---

## ▶️ Ejecución con Live Server

1. Abre **la carpeta raíz** del proyecto en VS Code (no `juego/`).
2. Instala la extensión **Live Server** (Ritwick Dey).
3. Clic derecho sobre el `index.html` **de la raíz** → **Open with Live Server**.
4. Se abre la landing en `http://127.0.0.1:5500`. Pulsa **Iniciar simulación** para entrar al juego.
5. Desde el juego, **Volver al Pit Wall** regresa a la landing.

Alternativa con Node:

```bash
npx serve .
```

> ⚠️ No abras los archivos con `file://`: algunos navegadores bloquean la carga del CDN y de los scripts locales.

---

## 🧪 Verificación

**Escaparate y navegación**
- [x] La landing carga sin errores 404 ni peticiones externas.
- [x] El CTA apunta a `./juego/index.html` y navega correctamente.
- [x] El botón de retorno de `juego/index.html` resuelve a `../index.html`.
- [x] La barra de retorno no se superpone al canvas.
- [x] El diseño es responsivo (probado a 1440 px y 390 px).

**Simulador**
- [x] Phaser 3 se importa desde el CDN (única petición externa).
- [x] Canvas 800 × 600, escena `PistaScene`, 6 000 segmentos.
- [x] El coche ocupa el 23,2 % del ancho del asfalto.
- [x] Hay desniveles y las cimas ocultan los segmentos traseros con `maxy`.
- [x] El cierre del circuito vuelve exactamente a altura 0.
- [x] Aceleración, frenada, dirección, centrífuga y penalización en césped operativas.
- [x] Cronómetro y velocímetro responden en tiempo real.
- [x] 61 FPS y consola sin errores.

---

## 🧰 Tecnologías

| Tecnología | Uso |
|---|---|
| Phaser 3.60.0 | Motor del videojuego (MIT · Photon Storm) |
| `Phaser.GameObjects.Graphics` | Todo el apartado visual del juego |
| JavaScript ES6+ | Proyección, física y HUD |
| HTML5 semántico | Landing y contenedor del juego |
| CSS3 puro | Variables, Grid/Flexbox, diseño responsivo |

Proyecto académico. Uso libre para fines educativos.
