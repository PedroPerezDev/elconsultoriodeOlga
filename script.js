/* ─── Constantes ────────────────────────────────── */
const COLORS = ['#C2608E', '#7AAFC4', '#5BA08A', '#A07ABF', '#C47A5A', '#3D2B3D'];
const LS_KEY       = 'frases_usuario';
const LS_BORRADAS  = 'frases_borradas';

const FALLBACK_FRASES = [
  'El arte es mentira que dice la verdad',
  'Brilla tanto que necesiten gafas de sol',
  'Más glitter menos filtros',
  'Hazlo con pasión o no lo hagas',
  'Tu única competencia eres tú de ayer'
];

/* ─── Estado ─────────────────────────────────────── */
let pool = [];
let indiceMostrado = -1;

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

/* ─── Carga de datos ─────────────────────────────── */
async function cargarFrasesIniciales() {
  try {
    const res = await fetch('frases.json');
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json();
    return Array.isArray(data) ? data : FALLBACK_FRASES;
  } catch {
    return FALLBACK_FRASES;
  }
}

function cargarDesdeLS() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function guardarEnLS(frases) {
  localStorage.setItem(LS_KEY, JSON.stringify(frases));
}

function cargarBorradas() {
  try {
    const raw = localStorage.getItem(LS_BORRADAS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function guardarBorradas(borradas) {
  localStorage.setItem(LS_BORRADAS, JSON.stringify(borradas));
}

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

/* ─── Renderizado tipográfico ────────────────────── */
function renderizarFrase(texto) {
  const palabras = texto.trim().split(/\s+/);
  const grupos = [];

  let i = 0;
  while (i < palabras.length) {
    const tamGrupo = Math.min(
      Math.ceil(Math.random() * 3),   // 1, 2 o 3 palabras
      palabras.length - i
    );
    grupos.push(palabras.slice(i, i + tamGrupo).join(' '));
    i += tamGrupo;
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
  // Force reflow para reiniciar la animación
  void phraseCard.offsetWidth;
  phraseCard.classList.add('animate-in');
  phraseCard.appendChild(fragment);
}

function mostrarFraseAleatoria() {
  if (pool.length === 0) {
    phraseCard.innerHTML = '<span class="empty-message">¡Añade tu primera frase!</span>';
    return;
  }

  const nuevaFrase = pickExcluding(pool, indiceMostrado);
  indiceMostrado = pool.indexOf(nuevaFrase);
  renderizarFrase(nuevaFrase);
}

/* ─── Modal ──────────────────────────────────────── */
function abrirModal() {
  nuevaFraseInput.value = '';
  nuevaFraseInput.classList.remove('input-error');
  modalOverlay.classList.add('is-open');
  setTimeout(() => nuevaFraseInput.focus(), 50);
}

function cerrarModal() {
  modalOverlay.classList.remove('is-open');
}

function guardarFrase() {
  const texto = nuevaFraseInput.value.trim();
  if (!texto) {
    nuevaFraseInput.classList.remove('input-error');
    void nuevaFraseInput.offsetWidth; // reflow para reiniciar animación
    nuevaFraseInput.classList.add('input-error');
    return;
  }

  // Obtener frases del usuario y añadir la nueva
  const frasesUsuario = cargarDesdeLS();
  frasesUsuario.push(texto);
  guardarEnLS(frasesUsuario);

  // Actualizar pool con la nueva frase
  pool.push(texto);
  indiceMostrado = -1; // reset para permitir mostrar la nueva

  cerrarModal();
  // Mostrar directamente la frase recién añadida
  indiceMostrado = pool.length - 2; // forzar que se elija la última
  mostrarFraseAleatoria();
}

/* ─── Modal lista ────────────────────────────────── */
function abrirLista() {
  listaFrases.innerHTML = '';
  pool.forEach((frase) => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = frase;
    const btn = document.createElement('button');
    btn.className = 'btn-borrar';
    btn.title = 'Eliminar';
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
    btn.addEventListener('click', () => borrarFrase(frase));
    li.appendChild(span);
    li.appendChild(btn);
    listaFrases.appendChild(li);
  });
  modalLista.classList.add('is-open');
}

function cerrarLista() {
  modalLista.classList.remove('is-open');
}

function borrarFrase(frase) {
  // Quitar del pool
  pool = pool.filter(f => f !== frase);
  indiceMostrado = -1;

  // Si era frase de usuario, quitar del LS
  const frasesUsuario = cargarDesdeLS().filter(f => f !== frase);
  guardarEnLS(frasesUsuario);

  // Si era frase inicial, añadir a borradas
  const borradas = cargarBorradas();
  if (!borradas.includes(frase)) {
    borradas.push(frase);
    guardarBorradas(borradas);
  }

  // Refrescar la lista
  abrirLista();

  // Si ya no hay frases, mostrar mensaje
  if (pool.length === 0) {
    cerrarLista();
    mostrarFraseAleatoria();
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
  if (e.key === 'Escape') {
    cerrarModal();
    cerrarLista();
  }
});

nuevaFraseInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    guardarFrase();
  }
});

// Quitar clase error al escribir
nuevaFraseInput.addEventListener('input', () => {
  nuevaFraseInput.classList.remove('input-error');
});

/* ─── Init ───────────────────────────────────────── */
async function init() {
  const frasesIniciales = await cargarFrasesIniciales();
  const frasesUsuario   = cargarDesdeLS();
  const borradas        = cargarBorradas();
  pool = [...frasesIniciales, ...frasesUsuario].filter(f => !borradas.includes(f));
  mostrarFraseAleatoria();
}

init();

/* ─── Service Worker ─────────────────────────────── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js');
  });
}
