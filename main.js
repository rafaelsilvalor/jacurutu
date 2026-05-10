const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const storage = require('./storage');

// Worker pool: renderização de PSD em threads separadas (não trava UI)
const { Worker } = require('worker_threads');

const PSD_WORKER_PATH = path.join(__dirname, 'psd-worker.js');
const PSD_WORKER_COUNT = 2;
const PSD_RENDER_TIMEOUT_MS = 60000; // 60s por arquivo

class PsdWorkerPool {
  constructor(size) {
    this.size = size;
    this.workers = [];
    this.idleWorkers = [];
    this.queue = [];
    this.taskCounter = 0;
    this.tasksByWorker = new Map();
  }

  spawnWorker() {
    let worker;
    try {
      worker = new Worker(PSD_WORKER_PATH);
    } catch (err) {
      console.error('Falha ao criar worker:', err.message);
      return null;
    }

    worker.on('message', (msg) => {
      const task = this.tasksByWorker.get(worker);
      if (!task || task.id !== msg.id) return;
      this.tasksByWorker.delete(worker);
      clearTimeout(task.timeout);
      if (msg.error) task.resolve(null);
      else task.resolve(msg.jpegBuffer ? Buffer.from(msg.jpegBuffer) : null);
      this.releaseWorker(worker);
    });

    worker.on('error', (err) => {
      console.error('Worker error:', err.message);
      const task = this.tasksByWorker.get(worker);
      if (task) {
        clearTimeout(task.timeout);
        task.resolve(null);
        this.tasksByWorker.delete(worker);
      }
      this.removeWorker(worker);
      // Respawna depois de 1s
      setTimeout(() => {
        const w = this.spawnWorker();
        if (w) this.idleWorkers.push(w);
        this.dispatch();
      }, 1000);
    });

    worker.on('exit', (code) => {
      if (code !== 0) console.warn('Worker saiu com código:', code);
      this.removeWorker(worker);
    });

    this.workers.push(worker);
    return worker;
  }

  removeWorker(worker) {
    this.workers = this.workers.filter(w => w !== worker);
    this.idleWorkers = this.idleWorkers.filter(w => w !== worker);
  }

  releaseWorker(worker) {
    if (this.workers.includes(worker)) {
      this.idleWorkers.push(worker);
      this.dispatch();
    }
  }

  ensureStarted() {
    while (this.workers.length < this.size) {
      const w = this.spawnWorker();
      if (!w) break;
      this.idleWorkers.push(w);
    }
  }

  dispatch() {
    while (this.queue.length > 0 && this.idleWorkers.length > 0) {
      const worker = this.idleWorkers.shift();
      const task = this.queue.shift();
      this.tasksByWorker.set(worker, task);
      task.timeout = setTimeout(() => {
        console.warn('Worker task timeout:', task.payload ? (task.payload.filePath || task.payload.type) : task.filePath);
        const t = this.tasksByWorker.get(worker);
        if (t && t.id === task.id) {
          t.resolve(null);
          this.tasksByWorker.delete(worker);
          // Mata o worker travado e respawna
          worker.terminate().catch(() => {});
          this.removeWorker(worker);
          setTimeout(() => {
            const w = this.spawnWorker();
            if (w) this.idleWorkers.push(w);
            this.dispatch();
          }, 500);
        }
      }, PSD_RENDER_TIMEOUT_MS);
      try {
        const msg = Object.assign({ id: task.id }, task.payload || { type: 'render_psd', filePath: task.filePath });
        // Se o payload tem buffer, transferir zero-copy
        const transfers = [];
        if (msg.buffer && msg.buffer.buffer) transfers.push(msg.buffer.buffer);
        worker.postMessage(msg, transfers);
      } catch (err) {
        clearTimeout(task.timeout);
        task.resolve(null);
        this.tasksByWorker.delete(worker);
        this.releaseWorker(worker);
      }
    }
  }

  // Despacha qualquer tarefa pro worker. payload pode ter type/filePath/buffer.
  task(payload) {
    this.ensureStarted();
    return new Promise((resolve) => {
      this.queue.push({ id: ++this.taskCounter, payload, resolve });
      this.dispatch();
    });
  }
  // Atalho legado pra render de PSD
  render(filePath) {
    return this.task({ type: 'render_psd', filePath });
  }
}

let psdPool = null;
function getPsdPool() {
  if (!psdPool) psdPool = new PsdWorkerPool(PSD_WORKER_COUNT);
  return psdPool;
}

const SUPPORTED_EXTS = new Set([
  '.psd', '.psb',
  '.ai', '.eps',
  '.indd',
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.tif', '.tiff'
]);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0f1115',
    title: 'Saci',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Loga crashes do renderer no terminal (sem console-message — era ruidoso)
  mainWindow.webContents.on('render-process-gone', (_evt, details) => {
    console.error('[RENDERER CRASH]', details);
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

// ---------- IPC: config / scan / abrir ----------

ipcMain.handle('config:get', () => storage.config.get());

ipcMain.handle('config:pickFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Selecione a pasta "Modelos"',
    properties: ['openDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const cfg = storage.config.get();
  cfg.rootPath = result.filePaths[0];
  storage.config.set(cfg);
  return cfg.rootPath;
});

ipcMain.handle('scan', async () => {
  const cfg = storage.config.get();
  if (!cfg.rootPath || !fs.existsSync(cfg.rootPath)) {
    return { error: 'Caminho não configurado ou inexistente.' };
  }
  const groups = [];
  try {
    const topLevel = fs.readdirSync(cfg.rootPath, { withFileTypes: true });
    for (const entry of topLevel) {
      if (!entry.isDirectory()) continue;
      const groupPath = path.join(cfg.rootPath, entry.name);
      const files = scanFolder(groupPath, 4);
      if (files.length > 0) {
        groups.push({
          name: entry.name,
          path: groupPath,
          files: files.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
        });
      }
    }
  } catch (err) {
    return { error: err.message };
  }
  groups.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  return { groups, rootPath: cfg.rootPath };
});

function scanFolder(dir, maxDepth, currentDepth = 0) {
  const out = [];
  if (currentDepth > maxDepth) return out;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      out.push(...scanFolder(full, maxDepth, currentDepth + 1));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (SUPPORTED_EXTS.has(ext)) {
        try {
          const stat = fs.statSync(full);
          out.push({ name: entry.name, path: full, ext: ext.replace('.', ''), size: stat.size, mtime: stat.mtimeMs });
        } catch {}
      }
    }
  }
  return out;
}

ipcMain.handle('file:open', async (_evt, filePath) => {
  const err = await shell.openPath(filePath);
  if (err) return { ok: false, error: err };
  return { ok: true };
});

ipcMain.handle('file:reveal', async (_evt, filePath) => {
  try {
    if (fs.statSync(filePath).isDirectory()) await shell.openPath(filePath);
    else shell.showItemInFolder(filePath);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// ---------- THUMBNAILS: extração rápida ----------

function extractPsdThumbnailJpeg(filePath) {
  let buf;
  try {
    const fd = fs.openSync(filePath, 'r');
    const stat = fs.fstatSync(fd);
    const readSize = Math.min(16 * 1024 * 1024, stat.size);
    buf = Buffer.allocUnsafe(readSize);
    fs.readSync(fd, buf, 0, readSize, 0);
    fs.closeSync(fd);
  } catch { return null; }

  if (buf.length < 30 || buf.toString('utf-8', 0, 4) !== '8BPS') return null;
  let offset = 26;
  if (offset + 4 > buf.length) return null;
  const colorModeLen = buf.readUInt32BE(offset);
  offset += 4 + colorModeLen;
  if (offset + 4 > buf.length) return null;
  const irLen = buf.readUInt32BE(offset);
  offset += 4;
  const irEnd = Math.min(offset + irLen, buf.length);

  while (offset + 12 < irEnd) {
    if (buf.toString('utf-8', offset, offset + 4) !== '8BIM') break;
    offset += 4;
    const resourceId = buf.readUInt16BE(offset);
    offset += 2;
    const nameLen = buf.readUInt8(offset);
    offset += 1 + nameLen;
    if ((nameLen + 1) % 2 !== 0) offset += 1;
    if (offset + 4 > buf.length) break;
    const dataLen = buf.readUInt32BE(offset);
    offset += 4;
    if (offset + dataLen > buf.length) break;
    if (resourceId === 1036 || resourceId === 1033) {
      // Header de 28 bytes: format(4), width(4), height(4), widthBytes(4),
      // totalSize(4), compressedSize(4), bitsPerPixel(2), planes(2)
      const headerStart = offset;
      if (headerStart + 12 <= buf.length) {
        const width = buf.readUInt32BE(headerStart + 4);
        const height = buf.readUInt32BE(headerStart + 8);
        const jpegStart = offset + 28;
        const jpegEnd = offset + dataLen;
        if (jpegStart < jpegEnd) {
          return {
            buffer: Buffer.from(buf.slice(jpegStart, Math.min(jpegEnd, buf.length))),
            width, height
          };
        }
      }
    }
    offset += dataLen;
    if (dataLen % 2 !== 0) offset += 1;
  }
  return null;
}

// ---------- THUMBNAILS: render via ag-psd (fallback) ----------

async function renderPsdComposite(filePath) {
  try {
    return await getPsdPool().render(filePath);
  } catch (err) {
    console.error('renderPsdComposite falhou:', filePath, err.message);
    return null;
  }
}

function bufferToDataUrl(buf, mime) {
  return 'data:' + mime + ';base64,' + buf.toString('base64');
}

ipcMain.handle('thumbnail:get', async (_evt, payload) => {
  const { filePath, mtime, size, ext } = payload || {};
  if (!filePath || !ext) return { url: null };

  if (ext === 'ai' || ext === 'eps' || ext === 'indd') return { url: null, unsupported: true };

  const key = storage.thumbCache.makeKey(filePath, mtime || 0, size || 0);

  const cached = storage.thumbCache.get(key);
  if (cached) return { url: bufferToDataUrl(cached, 'image/jpeg'), cached: true };

  // Imagens — sempre redimensiona via worker pra um JPEG enxuto (~15-30KB)
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
    try {
      const stat = fs.statSync(filePath);
      if (stat.size > 50 * 1024 * 1024) return { url: null, tooLarge: true };
      const resized = await getPsdPool().task({ type: 'resize_file', filePath });
      if (resized && resized.length > 0) {
        storage.thumbCache.put(key, resized);
        return { url: bufferToDataUrl(resized, 'image/jpeg') };
      }
      return { url: null, error: 'resize falhou' };
    } catch (err) {
      return { url: null, error: err.message };
    }
  }

  // PSD/PSB — escolhe a melhor fonte:
  //  - Embutida grande (>= 400px) → usa direto (rápido, qualidade ok)
  //  - Embutida pequena ou ausente → renderiza composite (mais lento mas nítido)
  if (ext === 'psd' || ext === 'psb') {
    const MIN_EMBEDDED_DIM = 400;
    const embedded = extractPsdThumbnailJpeg(filePath);

    const useEmbedded = embedded && embedded.buffer && embedded.buffer.length > 0
      && embedded.width >= MIN_EMBEDDED_DIM
      && embedded.height >= MIN_EMBEDDED_DIM;

    if (useEmbedded) {
      const resized = await getPsdPool().task({ type: 'resize_buffer', buffer: embedded.buffer });
      const out = (resized && resized.length > 0) ? resized : embedded.buffer;
      storage.thumbCache.put(key, out);
      return { url: bufferToDataUrl(out, 'image/jpeg'), source: 'embedded', dims: [embedded.width, embedded.height] };
    }

    // Fallback: renderiza com ag-psd (qualidade alta, redimensionado no worker)
    const rendered = await renderPsdComposite(filePath);
    if (rendered && rendered.length > 0) {
      storage.thumbCache.put(key, rendered);
      return { url: bufferToDataUrl(rendered, 'image/jpeg'), source: 'rendered' };
    }

    // Último recurso: se tem embutida pequena, usa ela mesmo (melhor que nada)
    if (embedded && embedded.buffer && embedded.buffer.length > 0) {
      storage.thumbCache.put(key, embedded.buffer);
      return { url: bufferToDataUrl(embedded.buffer, 'image/jpeg'), source: 'embedded-small' };
    }
    return { url: null, noEmbedded: true, renderFailed: true };
  }

  return { url: null };
});

ipcMain.handle('thumbnail:clearCache', async () => storage.thumbCache.clear());
