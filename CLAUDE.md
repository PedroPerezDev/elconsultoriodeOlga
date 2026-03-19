# El Consultorio de Olga

App web de preguntas tipo "¿Qué prefieres?" con estética pastel. Diseñada exclusivamente para móvil.

## Stack

- HTML + CSS + JS puro (sin frameworks, sin build tools)
- Google Fonts: `Bebas Neue` (header) + `Fredoka` (frases)
- Base de datos: **Supabase** (frases en la nube)
- PWA instalable en móvil (manifest + service worker)

## Archivos

| Archivo | Descripción |
|---|---|
| `index.html` | Estructura: header, bocadillo, Olga, botones, modales, footer |
| `style.css` | Paleta pastel, layout mobile-first, bocadillo cómic |
| `script.js` | Lógica completa: Supabase, renderizado, modales, caché offline |
| `frases.json` | 100 preguntas iniciales (se usan para sembrar Supabase) |
| `manifest.json` | Configuración PWA |
| `sw.js` | Service worker para uso offline |
| `imagenes/olga.png` | Mascota principal |
| `imagenes/icon.svg` | Icono de la app (cuadrado rosa con `?`) |

## Supabase

- **Project URL:** `https://yiqzsuwafmpsdhswsics.supabase.co`
- **Tabla:** `frases` con columnas `id` (serial), `texto` (text), `created_at`
- **RLS:** lectura, inserción y borrado públicos
- La clave anon está hardcodeada en `script.js` (es pública por diseño de Supabase)

Para recrear la tabla en Supabase:
```sql
CREATE TABLE frases (
  id SERIAL PRIMARY KEY,
  texto TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE frases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública" ON frases FOR SELECT USING (true);
CREATE POLICY "Inserción pública" ON frases FOR INSERT WITH CHECK (true);
CREATE POLICY "Borrado público" ON frases FOR DELETE USING (true);
```

## Despliegue

- **GitHub Pages:** `https://pedropérezdev.github.io/elconsultoriodeOlga`
- Repo: `https://github.com/PedroPerezDev/elconsultoriodeOlga`
- Rama principal: `main`

Para desplegar: cualquier `git push` a `main` actualiza GitHub Pages automáticamente.

## Layout (mobile-first)

```
[HEADER] — Bebas Neue, fondo rosa pastel #F1B3D6
[BOCADILLO CÓMIC] — frase aleatoria, cola apuntando hacia Olga
[OLGA] — imagen grande, flex:1, ocupa el espacio restante
[BOTONES] — tres círculos: ↻ nueva frase | + añadir | ☰ lista
[FOOTER] — "Desarrollado por Pedro Pérez · 2026"
```

## Paleta de colores

| Variable | Valor | Uso |
|---|---|---|
| `--color-bg` | `#E8B8D4` | Fondo página (malva rosado) |
| `--color-card` | `#F5F0E8` | Fondo bocadillo (crema) |
| `--color-hot-pink` | `#F1B3D6` | Header |
| `--color-yellow` | `#F0F5D8` | Sombra header, borde bocadillo |
| `--color-cyan` | `#B8E8E8` | Botón añadir |
| `--color-orange` | `#F5D4C8` | Acento |
| `--color-white` | `#3D2B3D` | Texto general (morado oscuro) |

Colores de las palabras en JS: `#C2608E #7AAFC4 #5BA08A #A07ABF #C47A5A #3D2B3D`

## Lógica JS

- `pool` — array de `{id, texto}` cargado desde Supabase
- Primera carga con tabla vacía → siembra automática desde `frases.json`
- Sin conexión → caché en `localStorage` bajo la clave `frases_cache`
- Añadir frase → `sbInsertar()` → Supabase INSERT
- Borrar frase → `sbBorrar(id)` → Supabase DELETE
- Anti-repetición: `pickExcluding()` evita mostrar la misma frase dos veces seguidas

## Modales

| ID | Función |
|---|---|
| `#modalOverlay` | Añadir nueva pregunta |
| `#modalLista` | Ver y borrar frases (lista completa) |

## PWA

- Icono: `imagenes/icon.svg` (fondo rosa, `?` blanco)
- Cache SW: versión `consultorio-olga-v3` — incrementar al añadir archivos nuevos
- Offline: sirve desde caché del SW + `localStorage` como fallback de datos

## Preferencias del usuario

- La app es **solo para móvil** — no hay que preocuparse por desktop
- Estética **pastel suave**, no chillona
- Fuente del header: **Bebas Neue** en mayúsculas (intentos anteriores con Pacifico, Lilita One, Nunito rechazados)
- Sin animación en Olga
- Sin sombras en los botones
- Los botones son círculos con iconos SVG (no texto ni caracteres Unicode)
