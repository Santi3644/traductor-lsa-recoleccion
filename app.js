const videoElement = document.getElementById('videoWebcam');
const canvasElement = document.getElementById('canvasSalida');
const canvasCtx = canvasElement.getContext('2d');
const btnGrabar = document.getElementById('btnGrabar');
const estado = document.getElementById('estado');
const inputSena = document.getElementById('nombreSena');

let grabando = false;
let framesCapturados = 0;
let secuenciasDePuntos = []; // Aquí guardaremos las coordenadas
const TOTAL_FRAMES = 30; // 30 frames por seña

// 1. Configurar MediaPipe Hands
const hands = new Hands({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 0, // 0 es más rápido, ideal para celulares
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

// 2. ¿Qué pasa cuando MediaPipe detecta manos?
hands.onResults((resultados) => {
    // Dibujar lo que ve la cámara en el canvas
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(resultados.image, 0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.restore();

    // Si estamos grabando y detecta manos
    if (grabando && resultados.multiHandLandmarks) {
        let puntosDeEsteFrame = [];
        
        // Extraer X, Y, Z de cada punto de la mano
        for (const landmarks of resultados.multiHandLandmarks) {
            for (const punto of landmarks) {
                puntosDeEsteFrame.push([punto.x, punto.y, punto.z]);
            }
        }

        secuenciasDePuntos.push(puntosDeEsteFrame);
        framesCapturados++;
        estado.innerText = `Grabando... ${framesCapturados}/${TOTAL_FRAMES}`;

        // Si ya capturamos los 30 frames, detenemos y guardamos
        if (framesCapturados >= TOTAL_FRAMES) {
            grabando = false;
            estado.innerText = "¡Grabación Completa! Descargando datos...";
            descargarJSON();
        }
    }
});

// 3. Encender la cámara web
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({image: videoElement});
  },
  width: 640,
  height: 480
});
camera.start();

// 4. Lógica del botón de grabar
btnGrabar.addEventListener('click', () => {
    if (inputSena.value.trim() === "") {
        alert("Por favor, escribe el nombre de la seña primero.");
        return;
    }
    secuenciasDePuntos = []; // Limpiar grabación anterior
    framesCapturados = 0;
    grabando = true;
});

// 5. Función para descargar el archivo matemático (.json)
function descargarJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(secuenciasDePuntos));
    const elementoDescarga = document.createElement('a');
    elementoDescarga.setAttribute("href", dataStr);
    
    // El archivo se llamará, por ejemplo: "hola_1697034.json"
    elementoDescarga.setAttribute("download", `${inputSena.value.toLowerCase()}_${Date.now()}.json`);
    document.body.appendChild(elementoDescarga);
    elementoDescarga.click();
    elementoDescarga.remove();
}