/* ─── Constantes ────────────────────────────────── */
const SIZES   = ['size-xl', 'size-lg', 'size-md', 'size-sm'];
const WEIGHTS = ['weight-black', 'weight-bold', 'weight-regular', 'weight-light'];
const COLORS  = ['#E8A0BF', '#F9D976', '#9DD9D2', '#B5EAD7', '#F6C9A0', '#C3A8E8'];
const LS_KEY  = 'frases_usuario';

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
const modalOverlay    = document.getElementById('modalOverlay');
const nuevaFraseInput = document.getElementById('nuevaFraseInput');
const btnGuardarFrase = document.getElementById('btnGuardarFrase');
const btnCerrarModal  = document.getElementById('btnCerrarModal');

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
    span.className = `phrase-word ${pick(SIZES)} ${pick(WEIGHTS)}`;
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

/* ─── Eventos ────────────────────────────────────── */
btnNuevaFrase.addEventListener('click', mostrarFraseAleatoria);
btnAnadirFrase.addEventListener('click', abrirModal);
btnGuardarFrase.addEventListener('click', guardarFrase);
btnCerrarModal.addEventListener('click', cerrarModal);

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) cerrarModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOverlay.classList.contains('is-open')) {
    cerrarModal();
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
  pool = [...frasesIniciales, ...frasesUsuario];
  mostrarFraseAleatoria();
}

init();
