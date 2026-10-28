<<<<<<< HEAD
# 🏎️ Carreras Arcade — Phaser 3

Juego de carreras arcade 2D con vista superior (*top-down*), desarrollado con **Phaser 3**, **JavaScript**, **HTML5** y **CSS3**.

Controla un automóvil que avanza por una carretera de varios carriles: esquiva vehículos, recoge monedas y sobrevive el mayor tiempo posible.

---

## 📁 Estructura del proyecto

```
carreras-phaser/
├── index.html          ← Página principal (carga Phaser y el juego)
├── css/
│   └── style.css       ← Estilos de la página y el contenedor
├── js/
│   └── game.js         ← Lógica completa del juego (escenas, controles, etc.)
├── README.md           ← Este archivo
└── .gitignore          ← Archivos excluidos del repositorio
```

---

## 🎮 Controles

| Tecla | Acción         |
|-------|----------------|
| **W** | Avanzar        |
| **S** | Retroceder     |
| **A** | Izquierda      |
| **D** | Derecha        |

---

## ✨ Funcionalidades

### Mecánicas base
- **Pantalla inicial** con instrucciones, récord personal y botón de inicio.
- **Movimiento fluido** con teclas WASD, con normalización diagonal.
- **Carretera con desplazamiento continuo** (líneas de carril animadas).
- **Obstáculos generados progresivamente** en carriles aleatorios.
- **Detección de colisiones** con margen de tolerancia.
- **Puntuación en tiempo real** basada en el tiempo de supervivencia.
- **Indicador de velocidad** que refleja la aceleración progresiva.
- **Pantalla de Game Over** con estadísticas completas y botón de reinicio.
- **Reinicio limpio** sin acumulación de eventos ni objetos.
- **Gráficos generados con Phaser** (sin imágenes externas).
- **Adaptación de pantalla** con `Phaser.Scale.FIT`.

### Sistema de vidas (♥)
- El jugador comienza con **3 vidas**.
- Al colisionar con un obstáculo, pierde una vida.
- Tras recibir daño: **2 segundos de invulnerabilidad** con parpadeo visual y sacudida de cámara.
- La partida termina cuando se pierden todas las vidas.

### Monedas doradas (🪙)
- Aparecen monedas doradas en la carretera.
- Al pasar por encima, se recogen con una animación de desaparición.
- Contador de monedas visible durante la partida.
- Las monedas pulsan suavemente para ser más visibles.

### Niveles de dificultad (📈)
- La dificultad aumenta cada **500 puntos**.
- Al subir de nivel: más obstáculos, mayor velocidad de los vehículos.
- A partir del **nivel 3**: posibilidad de aparición simultánea de 2 obstáculos.
- Se muestra brevemente un indicador "¡NIVEL X!" al subir de nivel.
- Hasta **8 niveles** de dificultad.

### Récords (🏆)
- La mejor puntuación se guarda en el navegador (localStorage).
- El récord se muestra en la pantalla de menú.
- Al terminar una partida, se indica si se ha batido el récord ("¡NUEVO RÉCORD!").
- Funciona incluso si localStorage no está disponible (modo incógnito).

---

## 🛠️ Requisitos

- Un navegador web moderno (Chrome, Firefox, Edge).
- Un servidor HTTP local para ejecutar el juego (por ejemplo, **Live Server** en VS Code).

> **Nota:** Abrir `index.html` directamente con `file://` puede causar problemas de carga. Siempre usa un servidor local.

---

## ✅ Lista de comprobación

### Mecánicas base
- [ ] La pantalla inicial se muestra correctamente.
- [ ] El botón "COMENZAR" inicia la partida.
- [ ] Las teclas WASD controlan el automóvil.
- [ ] El automóvil no sale de la carretera.
- [ ] La carretera se desplaza continuamente.
- [ ] Los obstáculos aparecen correctamente.
- [ ] Las colisiones se detectan.
- [ ] La puntuación aumenta durante la partida.
- [ ] El indicador de velocidad se actualiza.
- [ ] El botón "JUGAR DE NUEVO" reinicia la partida.
- [ ] No aparecen errores en la consola del navegador.

### Nuevas mecánicas
- [ ] El jugador tiene 3 vidas (♥♥♥).
- [ ] Al colisionar, se pierde 1 vida y el auto parpadea.
- [ ] La partida solo termina al perder todas las vidas.
- [ ] Las monedas doradas aparecen en la carretera.
- [ ] Al recoger una moneda, el contador sube.
- [ ] El nivel de dificultad aumenta cada 500 puntos.
- [ ] Se muestra "¡NIVEL X!" al subir de nivel.
- [ ] El récord se guarda y se muestra en el menú.
- [ ] En Game Over se indica si es un nuevo récord.

---

## 🧰 Tecnologías

| Tecnología     | Uso                          |
|----------------|------------------------------|
| Phaser 3.60.0  | Motor del videojuego         |
| JavaScript     | Lógica del juego             |
| HTML5          | Estructura de la página      |
| CSS3           | Estilos y presentación       |
| GitHub Pages   | Publicación del juego        |

---

Proyecto académico. Uso libre para fines educativos.
=======

>>>>>>> 2f535b413b54313ef4af56a68e7625c1117ca2e8
