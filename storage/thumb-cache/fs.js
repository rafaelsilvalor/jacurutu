const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');

// Bump when the on-disk thumb format or dimensions change — invalidates old caches automatically.
const CACHE_VERSION = 4;
const CACHE_DIRNAME = 'thumb-cache';
const ENTRY_EXT = '.jpg';

// Thumbnail cache directory
function getThumbDir() {
  return path.join(app.getPath('userData'), CACHE_DIRNAME);
}

function ensureThumbDir() {
  const dir = getThumbDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function entryPath(key) {
  return path.join(getThumbDir(), key + ENTRY_EXT);
}

function makeKey(filePath, mtime, size) {
  return crypto.createHash('sha1')
    .update('v' + CACHE_VERSION + '|' + filePath + '|' + mtime + '|' + size)
    .digest('hex');
}

function get(key) {
  try {
    const p = entryPath(key);
    if (fs.existsSync(p)) return fs.readFileSync(p);
  } catch {}
  return null;
}

function put(key, buffer) {
  try {
    ensureThumbDir();
    fs.writeFileSync(entryPath(key), buffer);
    return true;
  } catch {
    return false;
  }
}

function clear() {
  try {
    const dir = getThumbDir();
    if (fs.existsSync(dir)) {
      for (const f of fs.readdirSync(dir)) {
        try { fs.unlinkSync(path.join(dir, f)); } catch {}
      }
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { get, put, clear, makeKey };
