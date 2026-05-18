/**
 * ========================================================================
 * MOTOR LÓGICO DEL VIDEOJUEGO: EL REMIX DE LA JUSTICIA
 * Universo Proiectio — Control de Infiltración y Hacking Táctico
 * ========================================================================
 * 
 * Este script controla el estado del juego, los gráficos del osciloscopio en 
 * canvas, los efectos de partículas del DDoS y del fondo digital, la inyección 
 * del payload de karaoke, y los efectos sonoros sintetizados por Web Audio API.
 * 
 * Diseñado con comentarios detallados para cada módulo técnico y narrativo.
 */

// =================================---------------------------------------
// 1. CONTROL DE ESTADO GLOBAL DEL JUEGO
// =================================---------------------------------------
const gameState = {
    step: 'intro',              // Pantalla actual ('intro', 'mite', 'infiltrate', 'hack1', 'hack2', 'hack3', 'victory', 'gameover')
    timeLeft: 120,              // Temporizador inicial en segundos (2 minutos)
    timerActive: false,         // Control de ejecución del temporizador
    arrogancia: 0,              // Valor del slider de arrogancia (0-100)
    tono: 50,                   // Valor del slider de tono de voz (0-100)
    copyrightClicks: 0,         // Contador de impactos DDoS (0-15)
    injectionProgress: 0,       // Posición de la aguja oscilante en la inyección (0-100)
    injectionDirection: 1.5,    // Dirección y velocidad del rebote de la aguja
    animationFrameId: null,     // ID del frame de animación para el rebote
    audioCtx: null,             // Contexto de Audio Web (inicializado con gesto de usuario)
    oscillatorActive: false     // Control de osciladores de sonido
};

// Definición de las letras del remix humillante de Presidente MC para el Karaoke
const remixLyrics = [
    { text: "🎵 [ TRANSMISIÓN PIRATA INICIADA... ]", duration: 1500 },
    { text: "🎵 Rigel dijo que soy señal pura, un circuito perfecto,", duration: 2500 },
    { text: "🎵 pero este cantante insiste en presumir su intelecto.", duration: 2500 },
    { text: "🎵 ¡Escuchen ahora su voz real, el glitch de su ego!", duration: 2500 },
    { text: "🎵 - 'No soy un genio, soy el virus del sistema...'", duration: 3000 },
    { text: "🎵 - 'Sin el autotune, mi talento es un problema.'", duration: 3000 },
    { text: "🎵 - 'Llamo error al que piensa diferente...'", duration: 3000 },
    { text: "🎵 - 'porque soy el esclavo más tonto de esta gente.'", duration: 3500 },
    { text: "🎵 [ ERROR 404: TALENTO NO DETECTADO ]", duration: 2000 },
    { text: "🎵 [ SINTAXIS CORREGIDA POR ORION PARA RIGEL ]", duration: 3000 }
];

// Lista de patentes absurdas de Humania Records para el minijuego de DDoS
const mockPatents = [
    "BREATHING_LICENSE_v1.2 // REVOCADA",
    "PATENT_D_MINOR_SCALE // EXPIRADA",
    "COPYRIGHT_SILENCE_HOLDERS // BYPASS",
    "HUMANIA_SECURE_PAYMENT // INJECTED",
    "E_MAJOR_CHORD_ROYALTY // OVERWRITTEN",
    "AUTOTUNE_MASTER_LICENSE // TAMPERED",
    "LOGICAL_LIMIT_BYPASS // SUCCESS",
    "RHYTHM_PATTERN_708 // CORRUPTED"
];

// =================================---------------------------------------
// 2. SINTETIZADOR DE EFECTOS SONOROS (WEB AUDIO API)
// =================================---------------------------------------
/**
 * Inicializa el contexto de Audio del navegador de forma segura.
 * Es necesario llamarlo tras una interacción de usuario (como hacer clic en Iniciar).
 * Salvaguardado con un bloque try/catch para evitar bloqueos en entornos headless sin audio.
 */
function initAudio() {
    try {
        if (!gameState.audioCtx) {
            gameState.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (gameState.audioCtx && gameState.audioCtx.state === 'suspended') {
            gameState.audioCtx.resume();
        }
    } catch (e) {
        console.warn("AudioContext initialization failed, proceeding without audio:", e);
    }
}

/**
 * Sintetiza un tono simple usando osciladores nativos del navegador.
 * Evita la descarga de archivos de audio adicionales.
 * 
 * @param {number} freq Frecuencia en Hertz.
 * @param {string} type Tipo de onda ('sine', 'square', 'sawtooth', 'triangle').
 * @param {number} duration Duración del tono en segundos.
 * @param {number} volume Volumen relativo (0 a 1).
 */
function playSynthSound(freq, type, duration, volume = 0.1) {
    if (!gameState.audioCtx) return;
    
    try {
        const osc = gameState.audioCtx.createOscillator();
        const gainNode = gameState.audioCtx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, gameState.audioCtx.currentTime);
        
        // Suavizado del volumen para evitar "clicks" al iniciar y parar el audio
        gainNode.gain.setValueAtTime(volume, gameState.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, gameState.audioCtx.currentTime + duration);
        
        osc.connect(gainNode);
        gainNode.connect(gameState.audioCtx.destination);
        
        osc.start();
        osc.stop(gameState.audioCtx.currentTime + duration);
    } catch (e) {
        console.warn("Audio Context Error: ", e);
    }
}

/**
 * Secuencias de sonido temáticas
 */
const sounds = {
    click: () => playSynthSound(600, 'sine', 0.08, 0.05),
    equip: () => {
        playSynthSound(440, 'triangle', 0.15, 0.08);
        setTimeout(() => playSynthSound(880, 'sine', 0.25, 0.08), 100);
    },
    bypass: () => {
        playSynthSound(523.25, 'sine', 0.1, 0.1); // C5
        setTimeout(() => playSynthSound(659.25, 'sine', 0.1, 0.1), 100); // E5
        setTimeout(() => playSynthSound(783.99, 'sine', 0.2, 0.1), 200); // G5
    },
    error: () => {
        playSynthSound(150, 'sawtooth', 0.35, 0.15);
    },
    clickDdos: () => {
        // Tono aleatorio para simular la sobrecarga de un ataque continuo
        const freq = 300 + Math.random() * 500;
        playSynthSound(freq, 'square', 0.1, 0.04);
    },
    victory: () => {
        // Melodía corta heroica de 8 bits
        const notes = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50];
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                playSynthSound(freq, 'triangle', 0.18, 0.1);
            }, idx * 120);
        });
    },
    gameover: () => {
        // Acorde descendente fúnebre
        playSynthSound(220, 'sawtooth', 0.4, 0.12);
        setTimeout(() => playSynthSound(196, 'sawtooth', 0.4, 0.12), 200);
        setTimeout(() => playSynthSound(146.83, 'sawtooth', 0.8, 0.15), 400);
    }
};

// =================================---------------------------------------
// 3. CANVAS 1: EFECTO DE PARTÍCULAS DIGITALES DEL FONDO GENERAL
// =================================---------------------------------------
const bgCanvas = document.getElementById('bg-canvas');
const bgCtx = bgCanvas.getContext('2d');
const particles = [];

/**
 * Ajusta el tamaño del lienzo de fondo al de la pantalla.
 */
function resizeBgCanvas() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeBgCanvas);
resizeBgCanvas();

/**
 * Clase que representa un nodo digital flotando en el espacio virtual.
 */
class DigitalParticle {
    constructor() {
        this.x = Math.random() * bgCanvas.width;
        this.y = Math.random() * bgCanvas.height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.radius = Math.random() * 2 + 1;
        this.color = Math.random() > 0.5 ? 'rgba(6, 182, 212, 0.2)' : 'rgba(236, 72, 153, 0.15)';
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Rebote en bordes
        if (this.x < 0 || this.x > bgCanvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > bgCanvas.height) this.vy *= -1;
    }

    draw() {
        bgCtx.beginPath();
        bgCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        bgCtx.fillStyle = this.color;
        bgCtx.fill();
    }
}

// Inicialización de la red de nodos flotantes
for (let i = 0; i < 40; i++) {
    particles.push(new DigitalParticle());
}

/**
 * Bucle de animación del lienzo de fondo digital.
 * Dibuja los nodos flotantes y conexiones inter-nodo débiles.
 */
function animateBackground() {
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    
    // Dibujar y enlazar partículas
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        
        // Enlazar nodos que estén cerca
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 120) {
                bgCtx.beginPath();
                bgCtx.moveTo(particles[i].x, particles[i].y);
                bgCtx.lineTo(particles[j].x, particles[j].y);
                bgCtx.strokeStyle = `rgba(6, 182, 212, ${0.05 * (1 - dist / 120)})`;
                bgCtx.lineWidth = 0.5;
                bgCtx.stroke();
            }
        }
    }
    
    requestAnimationFrame(animateBackground);
}
animateBackground();

// =================================---------------------------------------
// 4. CANVAS 2: OSCILOSCOPIO DE FIRMA DE VOZ (FIREWALL 1)
// =================================---------------------------------------
const voiceCanvas = document.getElementById('voice-canvas');
const voiceCtx = voiceCanvas.getContext('2d');
let voiceAnimId;

/**
 * Dibuja la onda senoidal del osciloscopio en base al tono y arrogancia.
 * - Con tono se altera la frecuencia.
 * - Con arrogancia se incrementan las distorsiones rojas y fallos estáticos.
 */
function drawVoiceWave() {
    if (gameState.step !== 'hack1') return;
    
    voiceCtx.clearRect(0, 0, voiceCanvas.width, voiceCanvas.height);
    
    const width = voiceCanvas.width;
    const height = voiceCanvas.height;
    
    // Cuadrícula táctica de fondo del osciloscopio
    voiceCtx.strokeStyle = 'rgba(71, 85, 105, 0.15)';
    voiceCtx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
        voiceCtx.beginPath();
        voiceCtx.moveTo(i, 0);
        voiceCtx.lineTo(i, height);
        voiceCtx.stroke();
    }
    for (let j = 0; j < height; j += 30) {
        voiceCtx.beginPath();
        voiceCtx.moveTo(0, j);
        voiceCtx.lineTo(width, j);
        voiceCtx.stroke();
    }
    
    const time = Date.now() * 0.005;
    
    // Parámetros derivados de los controles deslizantes
    const amplitude = 30 + (gameState.arrogancia * 0.15); // Amplitud crece levemente con arrogancia
    const frequency = 0.01 + (gameState.tono * 0.0006);  // Frecuencia gobernada por Tono
    
    voiceCtx.beginPath();
    voiceCtx.lineWidth = 2;
    
    // Renderizado de la onda normal de color Cian
    if (gameState.arrogancia < 95) {
        voiceCtx.strokeStyle = 'hsl(180, 100%, 50%)';
        voiceCtx.shadowColor = 'rgba(6, 182, 212, 0.5)';
        voiceCtx.shadowBlur = 8;
        
        for (let x = 0; x < width; x++) {
            // Añadir un sutil factor estático que aumenta gradualmente
            const noise = (Math.random() - 0.5) * (gameState.arrogancia * 0.1);
            const y = (height / 2) + Math.sin(x * frequency + time) * amplitude + noise;
            
            if (x === 0) voiceCtx.moveTo(x, y);
            else voiceCtx.lineTo(x, y);
        }
        voiceCtx.stroke();
    } else {
        // ONDA GLITCHEADA/SOBRECARGADA (Arrogancia >= 95%)
        // La onda explota visualmente alternando cian y rojo con saltos estáticos masivos
        voiceCtx.strokeStyle = Math.random() > 0.3 ? 'hsl(328, 100%, 54%)' : 'hsl(0, 100%, 60%)';
        voiceCtx.shadowColor = 'rgba(236, 72, 153, 0.8)';
        voiceCtx.shadowBlur = 15;
        
        for (let x = 0; x < width; x++) {
            const glitchSpike = Math.random() > 0.95 ? (Math.random() - 0.5) * 60 : 0;
            const y = (height / 2) + Math.sin(x * (frequency * 1.5) + time * 2) * (amplitude * 1.2) + glitchSpike;
            
            if (x === 0) voiceCtx.moveTo(x, y);
            else voiceCtx.lineTo(x, y);
        }
        voiceCtx.stroke();
        
        // Rayas horizontales de interferencia digital extra
        if (Math.random() > 0.7) {
            voiceCtx.fillStyle = 'rgba(239, 68, 68, 0.2)';
            voiceCtx.fillRect(0, Math.random() * height, width, Math.random() * 5);
        }
    }
    
    // Limpiar sombras para el siguiente frame
    voiceCtx.shadowBlur = 0;
    
    voiceAnimId = requestAnimationFrame(drawVoiceWave);
}

// =================================---------------------------------------
// 5. CANVAS 3: RETÍCULA DDOS Y EFECTO DE IMPACTOS (FIREWALL 2)
// =================================---------------------------------------
const ddosCanvas = document.getElementById('ddos-canvas');
const ddosCtx = ddosCanvas.getContext('2d');
const ddosRings = []; // Círculos expansivos en el núcleo
const ddosSparks = []; // Chispas voladoras al golpear

/**
 * Redimensiona el canvas DDoS a su contenedor.
 */
function resizeDdosCanvas() {
    ddosCanvas.width = ddosCanvas.parentElement.clientWidth;
    ddosCanvas.height = ddosCanvas.parentElement.clientHeight;
}

/**
 * Estructuras de partículas para el efecto visual del DDoS.
 */
class ImpactRing {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.alpha = 1;
        this.color = Math.random() > 0.5 ? '6, 182, 212' : '236, 72, 153';
    }
    update() {
        this.radius += 3;
        this.alpha -= 0.025;
    }
    draw() {
        ddosCtx.beginPath();
        ddosCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ddosCtx.strokeStyle = `rgba(${this.color}, ${this.alpha})`;
        ddosCtx.lineWidth = 1.5;
        ddosCtx.stroke();
    }
}

class ParticleSpark {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.alpha = 1;
        this.decay = 0.02 + Math.random() * 0.02;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
    }
    draw() {
        ddosCtx.beginPath();
        ddosCtx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ddosCtx.fillStyle = `rgba(239, 68, 68, ${this.alpha})`;
        ddosCtx.fill();
    }
}

/**
 * Bucle que anima las ondas expansivas de DDoS y chispas.
 */
function animateDdosArena() {
    if (gameState.step !== 'hack2') return;
    
    ddosCtx.clearRect(0, 0, ddosCanvas.width, ddosCanvas.height);
    
    // Actualizar y dibujar círculos concéntricos
    for (let i = ddosRings.length - 1; i >= 0; i--) {
        ddosRings[i].update();
        if (ddosRings[i].alpha <= 0) {
            ddosRings.splice(i, 1);
        } else {
            ddosRings[i].draw();
        }
    }
    
    // Actualizar y dibujar chispas
    for (let i = ddosSparks.length - 1; i >= 0; i--) {
        ddosSparks[i].update();
        if (ddosSparks[i].alpha <= 0) {
            ddosSparks.splice(i, 1);
        } else {
            ddosSparks[i].draw();
        }
    }
    
    requestAnimationFrame(animateDdosArena);
}

/**
 * Lanza la animación de impacto al hacer clic en el núcleo de DDoS.
 */
function triggerDdosImpact() {
    const rect = ddosCanvas.getBoundingClientRect();
    const centerX = ddosCanvas.width / 2;
    const centerY = ddosCanvas.height / 2;
    
    // Añadir anillo expansivo cian/rosa
    ddosRings.push(new ImpactRing(centerX, centerY));
    
    // Añadir ráfaga de chispas rojas de desbordamiento
    for (let i = 0; i < 8; i++) {
        ddosSparks.push(new ParticleSpark(centerX, centerY));
    }
}

// =================================---------------------------------------
// 6. MINIJUEGO 3: INYECCIÓN DE CÓDIGO (LÓGICA DEL REBOTE)
// =================================---------------------------------------
/**
 * Actualiza el movimiento continuo de vaivén de la aguja osciladora.
 */
function updateInjectionNeedle(currentTime) {
    if (gameState.step !== 'hack3') return;
    
    // Calcular delta de tiempo real en segundos (independiente de hercios de monitor)
    const now = currentTime || performance.now();
    if (!gameState.lastFrameTime) {
        gameState.lastFrameTime = now;
    }
    const deltaTime = Math.min(0.1, (now - gameState.lastFrameTime) / 1000); // Límite de seguridad
    gameState.lastFrameTime = now;
    
    // Velocidad constante del rebote (160 unidades por segundo para un reto premium emocionante)
    const speed = 160;
    gameState.injectionProgress += gameState.injectionDirection * speed * deltaTime;
    
    // Invertir dirección al chocar contra los límites del rail (0 y 100)
    if (gameState.injectionProgress >= 100) {
        gameState.injectionProgress = 100;
        gameState.injectionDirection = -1; // Dirección izquierda
    } else if (gameState.injectionProgress <= 0) {
        gameState.injectionProgress = 0;
        gameState.injectionDirection = 1; // Dirección derecha
    }
    
    // Aplicar posicionamiento visual de la aguja en el DOM
    const needleEl = document.getElementById('needle');
    const needlePosText = document.getElementById('needle-pos');
    if (needleEl) {
        needleEl.style.left = `${gameState.injectionProgress}%`;
    }
    if (needlePosText) {
        needlePosText.textContent = `${Math.floor(gameState.injectionProgress)}%`;
    }
    
    gameState.animationFrameId = requestAnimationFrame(updateInjectionNeedle);
}

// =================================---------------------------------------
// 7. MOTOR TEMPORIZADOR Y SEGUIMIENTO DE SEGURIDAD
// =================================---------------------------------------
let timerInterval;

/**
 * Formatea segundos en formato MM:SS.
 */
function formatTimeDisplay(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSecs = seconds % 60;
    const formattedSecs = remainingSecs < 10 ? `0${remainingSecs}` : remainingSecs;
    return `0${minutes}:${formattedSecs}`;
}

/**
 * Controla el reloj de la cabecera del terminal.
 */
function startSecurityTimer() {
    const timerBox = document.getElementById('timer-box');
    const timeLeftText = document.getElementById('time-left');
    
    timerBox.classList.remove('hidden');
    gameState.timeLeft = 120;
    gameState.timerActive = true;
    
    // Reiniciar colores de alerta por si veníamos de una partida previa
    timerBox.classList.remove('danger');
    document.getElementById('terminal-main').classList.remove('warning-state');
    
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!gameState.timerActive) return;
        
        gameState.timeLeft--;
        timeLeftText.textContent = formatTimeDisplay(gameState.timeLeft);
        
        // Advertencia si queda menos de 30 segundos
        if (gameState.timeLeft <= 30) {
            timerBox.classList.add('danger');
            document.getElementById('terminal-main').classList.add('warning-state');
        }
        
        // Fin de la partida por agotamiento de tiempo
        if (gameState.timeLeft <= 0) {
            triggerGameOver();
        }
    }, 1000);
}

/**
 * Detiene el temporizador de forma definitiva.
 */
function stopSecurityTimer() {
    gameState.timerActive = false;
    clearInterval(timerInterval);
}

// =================================---------------------------------------
// 8. LOGS DE SISTEMA EN LA BARRA INFERIOR (FEEDBACK NARRATIVO)
// =================================---------------------------------------
const footerLogText = document.getElementById('footer-logs');

/**
 * Inyecta una línea de logs en el pie de página de la terminal simulando procesos.
 */
function addSystemLog(message, isAlert = false) {
    footerLogText.textContent = message;
    if (isAlert) {
        footerLogText.style.color = 'var(--neon-red)';
    } else {
        footerLogText.style.color = 'var(--text-muted)';
    }
}

// =================================---------------------------------------
// 9. NAVEGACIÓN Y FLUJO DE PANTALLAS
// =================================---------------------------------------
/**
 * Cambia la pantalla actual activando y desactivando clases DOM.
 * Ejecuta callbacks especiales de arranque según la pantalla a la que accedamos.
 */
function switchStep(targetStep) {
    gameState.step = targetStep;
    
    // Desactivar todas las pantallas
    document.querySelectorAll('.step-screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Activar la pantalla objetivo
    const activeScreen = document.getElementById(`step-${targetStep}`);
    if (activeScreen) {
        activeScreen.classList.add('active');
    }
    
    // Acciones y renders específicos de cada pantalla
    if (targetStep === 'hack1') {
        // Redimensionar canvas de osciloscopio e iniciar dibujo
        cancelAnimationFrame(voiceAnimId);
        setTimeout(() => {
            voiceCanvas.width = voiceCanvas.parentElement.clientWidth;
            voiceCanvas.height = voiceCanvas.parentElement.clientHeight;
            drawVoiceWave();
        }, 100);
        addSystemLog("Fase 1: Vulneración Vocal activa. Sintonizando ego.");
    } else if (targetStep === 'hack2') {
        // Detener osciloscopio, preparar arena DDoS
        cancelAnimationFrame(voiceAnimId);
        setTimeout(() => {
            resizeDdosCanvas();
            animateDdosArena();
        }, 100);
        addSystemLog("Fase 2: Filtro de patentes corporativo cargado. Atacando puerto 8080.");
    } else if (targetStep === 'hack3') {
        // Iniciar el ciclo de aguja rebotando
        cancelAnimationFrame(gameState.animationFrameId);
        gameState.lastFrameTime = performance.now();
        updateInjectionNeedle();
        addSystemLog("Fase 3: Sincronización de payload requerida para bypass.");
    } else if (targetStep === 'victory') {
        cancelAnimationFrame(gameState.animationFrameId);
        stopSecurityTimer();
        startKaraokeLyrics();
        addSystemLog("Acceso de administrador concedido. Retransmisión hackeada.");
    } else if (targetStep === 'gameover') {
        cancelAnimationFrame(gameState.animationFrameId);
        stopSecurityTimer();
        addSystemLog("¡CONEXIÓN CORTADA! Intruso detectado.", true);
    } else if (targetStep === 'intro') {
        // Reiniciar visualizaciones de la cabecera
        document.getElementById('timer-box').classList.add('hidden');
        addSystemLog("Terminal reiniciada. Esperando enlace...");
    }
}

// =================================---------------------------------------
// 10. LÓGICA ESPECÍFICA DE CADA MINIJUEGO
// =================================---------------------------------------

/* HACK 1: CALIBRACIÓN VOCAL (Arrogancia y Tono) */
const sliderTono = document.getElementById('slider-tono');
const sliderArrogancia = document.getElementById('slider-arrogancia');
const valTono = document.getElementById('val-tono');
const valArrogancia = document.getElementById('val-arrogancia');
const voiceLogs = document.getElementById('voice-logs');
const hack1Error = document.getElementById('hack1-error');
const btnHack1Bypass = document.getElementById('btn-hack1-bypass');

/**
 * Actualiza el registro de salida en base a los niveles de arrogancia.
 */
function updateVoiceLogs(arroganceVal) {
    voiceLogs.innerHTML = '';
    
    let text = '';
    let category = 'PENDIENTE';
    
    if (arroganceVal < 20) {
        text = "SENS_ERR: Nivel de humildad inaceptable. Acceso Denegado.";
        category = "DENEGADO";
    } else if (arroganceVal >= 20 && arroganceVal < 60) {
        text = "SENS_WARN: Tono regular detectado. No coincide con el ego del Presidente.";
        category = "CUESTIONABLE";
    } else if (arroganceVal >= 60 && arroganceVal < 95) {
        text = "SENS_ALERT: Huella de egolatría moderada. Al borde del bypass vocal...";
        category = "PROCESANDO";
    } else {
        text = "SYSTEM_OK: ¡SOBRECARGA DE EGO DETECTADA! Sintaxis de seguridad invalidada.";
        category = "BYPASS AUTORIZADO";
    }
    
    const line1 = document.createElement('div');
    line1.className = `log-line ${arroganceVal >= 95 ? 'green-neon' : 'text-primary'}`;
    line1.textContent = `[ESTADO: ${category}]`;
    
    const line2 = document.createElement('div');
    line2.className = `log-line ${arroganceVal >= 95 ? 'green-neon' : 'text-muted'}`;
    line2.textContent = `>> ${text}`;
    
    voiceLogs.appendChild(line1);
    voiceLogs.appendChild(line2);
}

// Eventos de entrada en los sliders de voz
sliderTono.addEventListener('input', (e) => {
    gameState.tono = parseInt(e.target.value);
    valTono.textContent = `${gameState.tono}%`;
    
    // Feedback de audio interactivo con cambio de tono (pitch shift)
    playSynthSound(200 + (gameState.tono * 4), 'sine', 0.05, 0.03);
});

sliderArrogancia.addEventListener('input', (e) => {
    gameState.arrogancia = parseInt(e.target.value);
    valArrogancia.textContent = `${gameState.arrogancia}%`;
    updateVoiceLogs(gameState.arrogancia);
    
    // Sonido zumbante ascendente según el ego
    playSynthSound(100 + (gameState.arrogancia * 5), 'sawtooth', 0.06, 0.04);
    
    // Liberar botón de Bypass en el punto álgido de la arrogancia (>95%)
    if (gameState.arrogancia >= 95) {
        hack1Error.classList.add('hidden');
        btnHack1Bypass.classList.remove('hidden');
        
        // Sonido triunfal de desbloqueo al llegar a la arrogancia crítica
        if (!sliderArrogancia.hasTriggeredBypassSound) {
            sounds.bypass();
            sliderArrogancia.hasTriggeredBypassSound = true;
        }
    } else {
        hack1Error.classList.remove('hidden');
        btnHack1Bypass.classList.add('hidden');
        sliderArrogancia.hasTriggeredBypassSound = false;
    }
});


/* HACK 2: SOBRECARGA DDoS DE COPYRIGHT */
const btnDdos = document.getElementById('btn-ddos');
const ddosPercentage = document.getElementById('ddos-percentage');
const ddosBar = document.getElementById('ddos-bar');
const clicksLeftText = document.getElementById('clicks-left');
const patentsLog = document.getElementById('patents-log');

/**
 * Controla la fuerza bruta contra el servidor de licencias.
 */
btnDdos.addEventListener('click', () => {
    initAudio();
    if (gameState.copyrightClicks < 15) {
        gameState.copyrightClicks++;
        
        // Generar animaciones visuales
        triggerDdosImpact();
        sounds.clickDdos();
        
        // Actualizar barra de carga
        const percent = Math.floor((gameState.copyrightClicks / 15) * 100);
        ddosPercentage.textContent = `${percent}%`;
        ddosBar.style.width = `${percent}%`;
        
        clicksLeftText.textContent = `Ataques recibidos: ${gameState.copyrightClicks} / 15`;
        
        // Generar toast flotante de patente destruida
        spawnPatentToast();
        
        // Al completar las 15 pulsaciones
        if (gameState.copyrightClicks >= 15) {
            btnDdos.disabled = true;
            clicksLeftText.textContent = "¡SERVIDOR SATURADO! Desviando flujos...";
            clicksLeftText.className = "click-counter green-neon text-center";
            
            sounds.bypass();
            
            // Retardo de medio segundo para ver la explosión antes de saltar
            setTimeout(() => {
                // Actualizar visual del panel
                document.getElementById('layer-cop').className = "layer-item unlocked";
                document.getElementById('layer-cop').querySelector('.layer-status').textContent = "[ BYPASSED ]";
                
                switchStep('hack3');
            }, 600);
        }
    }
});

/**
 * Spawnea un texto flotante simulando una patente corporativa que se rompe.
 */
function spawnPatentToast() {
    const toast = document.createElement('div');
    toast.className = 'patent-toast';
    
    // Elegir patente ficticia al azar
    const randomMsg = mockPatents[Math.floor(Math.random() * mockPatents.length)];
    toast.textContent = randomMsg;
    
    // Posicionar aleatoriamente en la arena
    const xPos = 20 + Math.random() * 60;
    const yPos = 30 + Math.random() * 40;
    
    toast.style.left = `${xPos}%`;
    toast.style.top = `${yPos}%`;
    
    patentsLog.appendChild(toast);
    
    // Eliminar del DOM una vez termine la animación CSS (1.2s)
    setTimeout(() => {
        toast.remove();
    }, 1200);
}


/* HACK 3: INYECCIÓN TEMPORAL */
const btnInject = document.getElementById('btn-inject');

btnInject.addEventListener('click', () => {
    initAudio();
    // La aguja debe estar exactamente en el centro (Tolerancia entre el 40% y el 60%)
    if (gameState.injectionProgress >= 40 && gameState.injectionProgress <= 60) {
        sounds.victory();
        
        // Desbloquear última capa de seguridad en los registros
        document.getElementById('layer-inj').className = "layer-item unlocked";
        document.getElementById('layer-inj').querySelector('.layer-status').textContent = "[ BYPASSED ]";
        
        switchStep('victory');
    } else {
        // Penalización por mala sincronización
        sounds.error();
        gameState.timeLeft = Math.max(0, gameState.timeLeft - 5);
        
        // Feedback visual en la barra temporal y agitación en pantalla
        const timerBox = document.getElementById('timer-box');
        timerBox.classList.add('danger');
        document.getElementById('terminal-main').style.animation = 'glitch-anim 0.2s';
        
        addSystemLog("¡FALLO DE SINCRONIZACIÓN! -5 Segundos por contraataque de cortafuegos.", true);
        
        setTimeout(() => {
            document.getElementById('terminal-main').style.animation = '';
            if (gameState.timeLeft > 30) {
                timerBox.classList.remove('danger');
            }
        }, 200);
    }
});

// =================================---------------------------------------
// 11. REPRODUCTOR Y DESPLIEGUE DEL KARAOKE DE LA VICTORIA
// =================================---------------------------------------
const lyricsContainer = document.getElementById('lyrics-container');

/**
 * Arranca la retransmisión de las letras del remix en el reproductor de karaoke.
 * Va iluminando y desplazando cada rima en sincronía temporal.
 */
function startKaraokeLyrics() {
    lyricsContainer.innerHTML = '';
    
    // Pre-insertar todas las líneas en el scrollbox
    const lines = remixLyrics.map((lyric, idx) => {
        const p = document.createElement('p');
        p.className = 'lyric-line';
        p.textContent = lyric.text;
        lyricsContainer.appendChild(p);
        return { element: p, duration: lyric.duration };
    });
    
    let currentLineIdx = 0;
    
    /**
     * Resalta la línea actual, reproduce un tono de afinación y agenda la siguiente.
     */
    function playNextLine() {
        if (currentLineIdx >= lines.length) return;
        
        // Quitar resaltado de la rima anterior
        if (currentLineIdx > 0) {
            lines[currentLineIdx - 1].element.classList.remove('active-line');
        }
        
        const currentLine = lines[currentLineIdx];
        currentLine.element.classList.add('active-line');
        currentLine.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Pequeño bleep armónico simulando la corrección de afinación
        const freq = 400 + (currentLineIdx * 80);
        playSynthSound(freq, 'triangle', 0.12, 0.05);
        
        currentLineIdx++;
        
        // Programar transición a la siguiente línea del remix
        setTimeout(playNextLine, currentLine.duration);
    }
    
    // Lanzar bucle
    setTimeout(playNextLine, 500);
}

// =================================---------------------------------------
// 12. TRANSICIONES DE DERROTA Y REINICIO
// =================================---------------------------------------
/**
 * Bloquea la terminal por completo al agotarse el tiempo.
 */
function triggerGameOver() {
    sounds.gameover();
    switchStep('gameover');
}

/**
 * Restablece todas las variables del juego a su estado original.
 */
function resetGameState() {
    gameState.timeLeft = 120;
    gameState.arrogancia = 0;
    gameState.tono = 50;
    gameState.copyrightClicks = 0;
    gameState.injectionProgress = 0;
    gameState.injectionDirection = 1.5;
    
    // Resetear elementos del DOM
    sliderTono.value = 50;
    sliderArrogancia.value = 0;
    valTono.textContent = "50%";
    valArrogancia.textContent = "0%";
    btnDdos.disabled = false;
    ddosPercentage.textContent = "0%";
    ddosBar.style.width = "0%";
    clicksLeftText.className = "click-counter text-muted text-center";
    clicksLeftText.textContent = "Requerido: 15 impactos directos.";
    
    // Resetear estados visuales de los Firewalls en el Panel de Infiltración
    document.querySelectorAll('.layer-item').forEach(item => {
        item.className = "layer-item locked";
        item.querySelector('.layer-status').textContent = "[ BLOQUEADA ]";
    });
    
    // Ocultar botones de bypass
    hack1Error.classList.remove('hidden');
    btnHack1Bypass.classList.add('hidden');
    sliderArrogancia.hasTriggeredBypassSound = false;
    
    switchStep('intro');
}

// =================================---------------------------------------
// 13. VINCULACIÓN DE BOTONES Y GESTOS DE USUARIO
// =================================---------------------------------------
const btnStart = document.getElementById('btn-start');
const btnEquip = document.getElementById('btn-equip');
const btnStartHack = document.getElementById('btn-start-hack');
const btnRestartVictory = document.getElementById('btn-restart-victory');
const btnRestartFail = document.getElementById('btn-restart-fail');

// Botón de Inicio (Intro)
btnStart.addEventListener('click', () => {
    initAudio();  // Desbloquear AudioContext tras el primer clic legítimo
    sounds.click();
    switchStep('mite');
});

// Botón de Equipamiento (Mite)
btnEquip.addEventListener('click', () => {
    sounds.equip();
    switchStep('infiltrate');
});

// Botón de Iniciar Hackeo (Infiltración)
btnStartHack.addEventListener('click', () => {
    sounds.click();
    startSecurityTimer();
    
    // Resaltar en el panel la Capa 1 de Voz como activa/en progreso
    const layerVoc = document.getElementById('layer-voc');
    layerVoc.querySelector('.layer-status').textContent = "[ EN PROCESO ]";
    layerVoc.querySelector('.layer-status').style.color = "var(--neon-pink)";
    
    switchStep('hack1');
});

// Botón de Bypass del Primer Firewall (Voz)
btnHack1Bypass.addEventListener('click', () => {
    sounds.bypass();
    
    // Marcar Capa 1 como resuelta y Capa 2 como en proceso
    const layerVoc = document.getElementById('layer-voc');
    layerVoc.className = "layer-item unlocked";
    layerVoc.querySelector('.layer-status').textContent = "[ BYPASSED ]";
    
    const layerCop = document.getElementById('layer-cop');
    layerCop.querySelector('.layer-status').textContent = "[ EN PROCESO ]";
    layerCop.querySelector('.layer-status').style.color = "var(--neon-pink)";
    
    switchStep('hack2');
});

// Botón de Reinicio (Pantalla de Victoria)
btnRestartVictory.addEventListener('click', () => {
    sounds.click();
    resetGameState();
});

// Botón de Reinicio (Pantalla de Derrota)
btnRestartFail.addEventListener('click', () => {
    sounds.click();
    resetGameState();
});
