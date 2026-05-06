// ============ Estado ============
let allGroups = [];
let activeGroupName = null; // null = "todas"
let searchQuery = '';
let rootPath = '';

// ============ Elementos ============
const $setup = document.getElementById('setup');
const $app = document.getElementById('app');
const $btnPick = document.getElementById('btn-pick');
const $btnReload = document.getElementById('btn-reload');
const $btnChangeFolder = document.getElementById('btn-change-folder');
const $search = document.getElementById('search');
const $btnClearSearch = document.getElementById('btn-clear-search');
const $groupsList = document.getElementById('groups-list');
const $filesGrid = document.getElementById('files-grid');
const $emptyState = document.getElementById('empty-state');
const $statusText = document.getElementById('status-text');
const $rootInfo = document.getElementById('root-info');

// ============ Helpers ============
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function formatGroupName(name) {
  return name.replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/Estrategia/g, 'Estratégia')
    .replace(/Juridicas/g, 'Jurídicas')
    .replace(/Pratica/g, 'Prática')
    .replace(/Saude/g, 'Saúde')
    .replace(/Educacao/g, 'Educação');
}

// ============ Lazy thumbnails ============
let thumbObserver = null;
const thumbInflight = new Set();

function initThumbnailObserver() {
  if (thumbObserver) thumbObserver.disconnect();

  thumbObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      thumbObserver.unobserve(el);
      loadThumbnail(el);
    }
  }, {
    root: document.querySelector('.content'),
    rootMargin: '200px',
    threshold: 0.01
  });

  document.querySelectorAll('.file-thumb[data-thumb]').forEach(el => {
    thumbObserver.observe(el);
  });
}

async function loadThumbnail(el) {
  const dataAttr = el.getAttribute('data-thumb');
  if (!dataAttr) return;
  let payload;
  try {
    payload = JSON.parse(dataAttr);
  } catch {
    return;
  }
  if (thumbInflight.has(payload.filePath)) return;
  thumbInflight.add(payload.filePath);

  const placeholder = el.querySelector('.file-thumb-placeholder');
  if (placeholder) placeholder.textContent = '...';

  try {
    const result = await window.api.getThumbnail(payload);
    if (result && result.url) {
      const img = document.createElement('img');
      img.src = result.url;
      img.alt = '';
      img.loading = 'lazy';
      el.innerHTML = '';
      el.appendChild(img);
    } else {
      if (placeholder) placeholder.textContent = payload.ext;
    }
  } catch (err) {
    if (placeholder) placeholder.textContent = payload.ext;
  } finally {
    thumbInflight.delete(payload.filePath);
  }
}

// ============ Boot ============
async function boot() {
  if (!window.api) {
    document.body.innerHTML = '<div style="color:#ff6b1a;padding:40px;font-family:sans-serif;">Erro crítico: preload script não carregou.</div>';
    return;
  }
  try {
    const cfg = await window.api.getConfig();
    if (!cfg || !cfg.rootPath) showSetup();
    else { showApp(); await loadData(); }
  } catch (err) {
    console.error('Erro no boot:', err);
    document.body.innerHTML = '<div style="color:#ff6b1a;padding:40px;font-family:sans-serif;">Erro no boot: ' + (err.message || err) + '</div>';
  }
}

function showSetup() {
  $setup.classList.remove('hidden');
  $app.classList.add('hidden');
}

function showApp() {
  $setup.classList.add('hidden');
  $app.classList.remove('hidden');
}

// ============ Carregar dados ============
async function loadData() {
  $statusText.textContent = 'Escaneando arquivos...';
  const result = await window.api.scan();

  if (result.error) {
    $statusText.textContent = 'Erro: ' + result.error;
    return;
  }

  allGroups = result.groups || [];
  rootPath = result.rootPath || '';
  $rootInfo.textContent = rootPath;

  const totalFiles = allGroups.reduce((sum, g) => sum + g.files.length, 0);
  $statusText.textContent = `${allGroups.length} marcas/categorias · ${totalFiles} arquivos`;

  renderGroups();
  renderFiles();
}

// ============ Render ============
function renderGroups() {
  const totalFiles = allGroups.reduce((sum, g) => sum + g.files.length, 0);
  let html = `
    <div class="group-item ${activeGroupName === null ? 'active' : ''}" data-group="">
      <span class="group-name">Todas</span>
      <span class="group-count">${totalFiles}</span>
    </div>
  `;
  for (const g of allGroups) {
    const isActive = activeGroupName === g.name;
    html += `
      <div class="group-item ${isActive ? 'active' : ''}" data-group="${escapeHtml(g.name)}">
        <span class="group-name" title="${escapeHtml(g.name)}">${escapeHtml(formatGroupName(g.name))}</span>
        <span class="group-count">${g.files.length}</span>
      </div>
    `;
  }
  $groupsList.innerHTML = html;

  $groupsList.querySelectorAll('.group-item').forEach(el => {
    el.addEventListener('click', () => {
      const g = el.dataset.group;
      activeGroupName = g === '' ? null : g;
      renderGroups();
      renderFiles();
    });
  });
}

function renderFiles() {
  let files = [];
  if (activeGroupName === null) {
    for (const g of allGroups) {
      for (const f of g.files) files.push({ ...f, group: g.name });
    }
  } else {
    const g = allGroups.find(x => x.name === activeGroupName);
    if (g) files = g.files.map(f => ({ ...f, group: g.name }));
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    files = files.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.group.toLowerCase().includes(q)
    );
  }

  files.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  if (files.length === 0) {
    $filesGrid.innerHTML = '';
    $emptyState.classList.remove('hidden');
    $emptyState.querySelector('p').textContent = searchQuery
      ? 'Nenhum modelo encontrado para esta busca.'
      : 'Nenhum arquivo nesta categoria.';
    return;
  }
  $emptyState.classList.add('hidden');

  let html = '';
  for (const f of files) {
    const fileJson = escapeHtml(JSON.stringify({
      filePath: f.path, mtime: f.mtime, size: f.size, ext: f.ext
    }));
    html += `
      <div class="file-card" data-path="${escapeHtml(f.path)}">
        <div class="file-thumb" data-thumb='${fileJson}' data-ext="${f.ext}">
          <span class="file-thumb-placeholder">${f.ext}</span>
        </div>
        <div class="file-card-body">
          <div class="file-card-header">
            <span class="file-ext-badge ext-${f.ext}">${f.ext}</span>
          </div>
          <div class="file-name" title="${escapeHtml(f.name)}">${escapeHtml(f.name)}</div>
          <div class="file-meta">
            <span title="${escapeHtml(f.group)}">${escapeHtml(formatGroupName(f.group))}</span>
            <span>${formatSize(f.size)}</span>
          </div>
          <div class="file-actions">
            <button class="action-open" data-path="${escapeHtml(f.path)}">Abrir</button>
            <button class="action-reveal secondary" data-path="${escapeHtml(f.path)}" title="Mostrar no Explorer">📁</button>
          </div>
        </div>
      </div>
    `;
  }
  $filesGrid.innerHTML = html;

  initThumbnailObserver();

  $filesGrid.querySelectorAll('.action-open').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await openFile(btn.dataset.path);
    });
  });
  $filesGrid.querySelectorAll('.action-reveal').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await revealFile(btn.dataset.path);
    });
  });
  $filesGrid.querySelectorAll('.file-card').forEach(card => {
    card.addEventListener('dblclick', async () => {
      await openFile(card.dataset.path);
    });
  });
}

// ============ Ações ============
async function openFile(filePath) {
  $statusText.textContent = 'Abrindo ' + filePath.split(/[\\\/]/).pop() + '...';
  const result = await window.api.openFile(filePath);
  if (!result.ok) {
    $statusText.textContent = 'Erro ao abrir: ' + result.error;
  } else {
    $statusText.textContent = 'Aberto: ' + filePath.split(/[\\\/]/).pop();
  }
}

async function revealFile(filePath) {
  const result = await window.api.revealFile(filePath);
  if (!result.ok) {
    $statusText.textContent = 'Erro: ' + result.error;
  }
}

// ============ Event listeners ============
$btnPick.addEventListener('click', async () => {
  const newPath = await window.api.pickFolder();
  if (newPath) {
    showApp();
    await loadData();
  }
});

$btnReload.addEventListener('click', async () => {
  await loadData();
});

$btnChangeFolder.addEventListener('click', async () => {
  const newPath = await window.api.pickFolder();
  if (newPath) {
    activeGroupName = null;
    searchQuery = '';
    $search.value = '';
    await loadData();
  }
});

$search.addEventListener('input', (e) => {
  searchQuery = e.target.value.trim();
  renderFiles();
});

$btnClearSearch.addEventListener('click', () => {
  searchQuery = '';
  $search.value = '';
  $search.focus();
  renderFiles();
});

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    $search.focus();
    $search.select();
  } else if (e.key === 'Escape' && document.activeElement === $search) {
    searchQuery = '';
    $search.value = '';
    renderFiles();
  }
});

// ============ Iniciar ============
boot();
