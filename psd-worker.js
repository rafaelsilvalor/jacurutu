// Worker thread: roda em paralelo à thread principal do Electron.
// Suporta vários tipos de tarefa via { type, ... }:
//   - 'render_psd'    : abre PSD, gera composite, redimensiona, retorna JPEG
//   - 'resize_buffer' : recebe buffer de imagem, redimensiona, retorna JPEG
//   - 'resize_file'   : lê arquivo de imagem, redimensiona, retorna JPEG
const { parentPort } = require('worker_threads');
const fs = require('fs');

const THUMB_MAX = 480;       // dimensão máxima (px) — o card mostra 120-220px
const THUMB_QUALITY = 85;    // qualidade JPEG

let agPsd = null;
let Jimp = null;
let canvasInitialized = false;

function makeStubCanvas(width, height) {
  return {
    width, height,
    getContext() {
      return {
        canvas: { width, height },
        createImageData(w, h) { return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }; },
        getImageData(x, y, w, h) { return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }; },
        putImageData() {},
        drawImage() {},
        fillRect() {}, clearRect() {},
        save() {}, restore() {},
        translate() {}, scale() {}, rotate() {}, transform() {}, setTransform() {},
        beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
        fill() {}, stroke() {}, fillText() {}, strokeText() {},
        measureText() { return { width: 0 }; }
      };
    }
  };
}
function makeStubImage() { return { src: '', width: 0, height: 0, onload: null, onerror: null }; }

function ensureJimp() {
  if (!Jimp) Jimp = require('jimp');
}
function ensureAgPsd() {
  if (!agPsd) agPsd = require('ag-psd');
  if (!canvasInitialized) {
    agPsd.initializeCanvas(makeStubCanvas, makeStubImage);
    canvasInitialized = true;
  }
}

async function renderPsd(filePath) {
  ensureAgPsd();
  ensureJimp();

  const buffer = fs.readFileSync(filePath);
  const psd = agPsd.readPsd(buffer, {
    skipLayerImageData: true,
    skipThumbnail: true,
    useImageData: true
  });

  const imgData = psd.imageData;
  if (!imgData || !imgData.data || !imgData.width || !imgData.height) return null;

  const jimg = await new Promise((resolve, reject) => {
    try {
      new Jimp({
        data: Buffer.from(imgData.data),
        width: imgData.width,
        height: imgData.height
      }, (err, image) => {
        if (err) return reject(err);
        resolve(image);
      });
    } catch (err) { reject(err); }
  });

  jimg.scaleToFit(THUMB_MAX, THUMB_MAX).quality(THUMB_QUALITY);
  return await jimg.getBufferAsync(Jimp.MIME_JPEG);
}

async function resizeJimp(input) {
  ensureJimp();
  const img = await Jimp.read(input);
  // Achata transparência em fundo branco (JPEG não suporta alpha)
  img.background(0xffffffff);
  img.scaleToFit(THUMB_MAX, THUMB_MAX).quality(THUMB_QUALITY);
  return await img.getBufferAsync(Jimp.MIME_JPEG);
}

parentPort.on('message', async (msg) => {
  const { id, type } = msg;
  try {
    let result = null;
    if (type === 'render_psd' || !type) {
      result = await renderPsd(msg.filePath);
    } else if (type === 'resize_buffer') {
      const inputBuf = msg.buffer ? Buffer.from(msg.buffer) : null;
      if (inputBuf) result = await resizeJimp(inputBuf);
    } else if (type === 'resize_file') {
      result = await resizeJimp(msg.filePath);
    }

    if (result && result.length > 0) {
      parentPort.postMessage({ id, jpegBuffer: result }, [result.buffer]);
    } else {
      parentPort.postMessage({ id, jpegBuffer: null });
    }
  } catch (err) {
    parentPort.postMessage({ id, error: err.message || String(err) });
  }
});
