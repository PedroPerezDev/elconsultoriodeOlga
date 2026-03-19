/* ─── Supabase ───────────────────────────────────── */
const SUPABASE_URL = 'https://yiqzsuwafmpsdhswsics.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpcXpzdXdhZm1wc2Roc3dzaWNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MTUyMDMsImV4cCI6MjA4OTQ5MTIwM30.YJm9MxduJuIaT1DzMOMrs61AMLsLXLoMgXmlDVbAEKk';
const SB_HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

async function sbCargar() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/frases?select=id,texto&order=id`,
    { headers: SB_HEADERS }
  );
  if (!res.ok) throw new Error(res.status);
  return res.json(); // [{id, texto}]
}

async function sbInsertar(texto) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/frases`, {
    method: 'POST',
    headers: { ...SB_HEADERS, 'Prefer': 'return=representation' },
    body: JSON.stringify({ texto })
  });
  if (!res.ok) throw new Error(res.status);
  const data = await res.json();
  return data[0]; // {id, texto}
}

async function sbInsertarVarios(textos) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/frases`, {
    method: 'POST',
    headers: { ...SB_HEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify(textos.map(texto => ({ texto })))
  });
  if (!res.ok) throw new Error(res.status);
}

async function sbBorrar(id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/frases?id=eq.${id}`, {
    method: 'DELETE',
    headers: SB_HEADERS
  });
  if (!res.ok) throw new Error(res.status);
}

/* ─── Constantes ────────────────────────────────── */
const COLORS = ['#C2608E', '#7AAFC4', '#5BA08A', '#A07ABF', '#C47A5A', '#3D2B3D'];
const CACHE_KEY = 'frases_cache';

/* ─── Estado ─────────────────────────────────────── */
let pool = []; // [{id, texto}]
let indiceMostrado = -1;
let modoOffline = false;

/* ─── Elementos del DOM ──────────────────────────── */
const phraseCard      = document.getElementById('phraseCard');
const btnNuevaFrase   = document.getElementById('btnNuevaFrase');
const btnAnadirFrase  = document.getElementById('btnAnadirFrase');
const btnVerFrases    = document.getElementById('btnVerFrases');
const modalOverlay    = document.getElementById('modalOverlay');
const nuevaFraseInput = document.getElementById('nuevaFraseInput');
const btnGuardarFrase = document.getElementById('btnGuardarFrase');
const btnCerrarModal  = document.getElementById('btnCerrarModal');
const modalLista      = document.getElementById('modalLista');
const listaFrases     = document.getElementById('listaFrases');
const btnCerrarLista  = document.getElementById('btnCerrarLista');

/* ─── Utilidades aleatorias ──────────────────────── */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickExcluding(arr, excluir) {
  if (arr.length <= 1) return arr[0];
  let idx;
  do { idx = Math.floor(Math.random() * arr.length); } while (idx === excluir);
  return arr[idx];
}

/* ─── Renderizado ────────────────────────────────── */
function renderizarFrase(texto) {
  const palabras = texto.trim().split(/\s+/);
  const grupos = [];
  let i = 0;
  while (i < palabras.length) {
    const tam = Math.min(Math.ceil(Math.random() * 3), palabras.length - i);
    grupos.push(palabras.slice(i, i + tam).join(' '));
    i += tam;
  }

  const fragment = document.createDocumentFragment();
  grupos.forEach((grupo, index) => {
    const span = document.createElement('span');
    span.className = 'phrase-word';
    span.style.color = pick(COLORS);
    span.style.animationDelay = `${index * 60}ms`;
    span.textContent = grupo;
    fragment.appendChild(span);
  });

  phraseCard.innerHTML = '';
  phraseCard.classList.remove('animate-in');
  void phraseCard.offsetWidth;
  phraseCard.classList.add('animate-in');
  phraseCard.appendChild(fragment);
}

function mostrarFraseAleatoria() {
  if (pool.length === 0) {
    phraseCard.innerHTML = '<span class="empty-message">¡Añade tu primera pregunta!</span>';
    return;
  }
  const item = pickExcluding(pool, indiceMostrado);
  indiceMostrado = pool.indexOf(item);
  renderizarFrase(item.texto);
}

/* ─── Modal añadir ───────────────────────────────── */
function abrirModal() {
  nuevaFraseInput.value = '';
  nuevaFraseInput.classList.remove('input-error');
  modalOverlay.classList.add('is-open');
  setTimeout(() => nuevaFraseInput.focus(), 50);
}

function cerrarModal() {
  modalOverlay.classList.remove('is-open');
}

async function guardarFrase() {
  const texto = nuevaFraseInput.value.trim();
  if (!texto) {
    nuevaFraseInput.classList.remove('input-error');
    void nuevaFraseInput.offsetWidth;
    nuevaFraseInput.classList.add('input-error');
    return;
  }

  cerrarModal();

  try {
    const nuevo = await sbInsertar(texto);
    pool.push(nuevo);
    guardarCache();
    indiceMostrado = pool.length - 2;
    mostrarFraseAleatoria();
  } catch {
    alert('No se pudo guardar. Comprueba tu conexión.');
  }
}

/* ─── Modal lista ────────────────────────────────── */
function abrirLista() {
  listaFrases.innerHTML = '';
  pool.forEach((item) => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = item.texto;
    const btn = document.createElement('button');
    btn.className = 'btn-borrar';
    btn.title = 'Eliminar';
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
    btn.addEventListener('click', () => borrarFrase(item.id));
    li.appendChild(span);
    li.appendChild(btn);
    listaFrases.appendChild(li);
  });
  modalLista.classList.add('is-open');
}

function cerrarLista() {
  modalLista.classList.remove('is-open');
}

async function borrarFrase(id) {
  try {
    await sbBorrar(id);
    pool = pool.filter(item => item.id !== id);
    indiceMostrado = -1;
    guardarCache();
    abrirLista();
    if (pool.length === 0) {
      cerrarLista();
      mostrarFraseAleatoria();
    }
  } catch {
    alert('No se pudo borrar. Comprueba tu conexión.');
  }
}

/* ─── Caché offline ──────────────────────────────── */
function guardarCache() {
  localStorage.setItem(CACHE_KEY, JSON.stringify(pool));
}

function cargarCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/* ─── Eventos ────────────────────────────────────── */
btnNuevaFrase.addEventListener('click', mostrarFraseAleatoria);
btnAnadirFrase.addEventListener('click', abrirModal);
btnVerFrases.addEventListener('click', abrirLista);
btnGuardarFrase.addEventListener('click', guardarFrase);
btnCerrarModal.addEventListener('click', cerrarModal);
btnCerrarLista.addEventListener('click', cerrarLista);

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) cerrarModal();
});
modalLista.addEventListener('click', (e) => {
  if (e.target === modalLista) cerrarLista();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { cerrarModal(); cerrarLista(); }
});

nuevaFraseInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); guardarFrase(); }
});

nuevaFraseInput.addEventListener('input', () => {
  nuevaFraseInput.classList.remove('input-error');
});

/* ─── Init ───────────────────────────────────────── */
async function init() {
  try {
    let data = await sbCargar();

    // Primera vez: sembrar con frases.json
    if (data.length === 0) {
      const res = await fetch('frases.json');
      const textos = await res.json();
      await sbInsertarVarios(textos);
      data = await sbCargar();
    }

    pool = data;
    guardarCache();
  } catch {
    // Sin conexión: usar caché
    modoOffline = true;
    pool = cargarCache();
    if (pool.length === 0) {
      // Último recurso: frases.json localmente
      try {
        const res = await fetch('frases.json');
        const textos = await res.json();
        pool = textos.map((texto, i) => ({ id: -(i + 1), texto }));
      } catch { pool = []; }
    }
  }

  mostrarFraseAleatoria();
}

init();

/* ─── Service Worker ─────────────────────────────── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js');
  });
}
