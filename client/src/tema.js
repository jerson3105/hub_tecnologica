import { useSyncExternalStore } from 'react';

// Tema de la interfaz: «sistema» (sigue al dispositivo), «claro» u «oscuro». Se guarda por
// navegador y se aplica con data-theme en <html>. public/tema.js hace lo mismo antes del primer
// pintado para que no parpadee.

const CLAVE = 'tema';
const TEMAS = ['sistema', 'claro', 'oscuro'];

// Pantallas que aún usan los estilos anteriores (sin roles semánticos): se ven en claro aunque el
// tema sea oscuro. Quitar cada una al rediseñarla (y también de public/tema.js).
export const RUTAS_SOLO_CLARO = ['/login', '/one-pager', '/bmc', '/mi-seguimiento', '/mis-objetivos', '/perfil'];
export const soloClaro = (ruta) => RUTAS_SOLO_CLARO.some((r) => ruta === r || ruta.startsWith(`${r}/`));

const oyentes = new Set();
const consultaOscuro = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

const leer = () => {
  try {
    const guardado = localStorage.getItem(CLAVE);
    return TEMAS.includes(guardado) ? guardado : 'sistema';
  } catch {
    return 'sistema';
  }
};

let tema = typeof window !== 'undefined' ? leer() : 'sistema';
const avisar = () => oyentes.forEach((f) => f());

// Si el tema es «sistema», un cambio del dispositivo (p. ej. modo oscuro al anochecer) se aplica
consultaOscuro?.addEventListener('change', () => { if (tema === 'sistema') avisar(); });
// Otra pestaña cambió el tema
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => { if (e.key === CLAVE) { tema = leer(); avisar(); } });
}

export const esOscuro = (t = tema) => t === 'oscuro' || (t === 'sistema' && !!consultaOscuro?.matches);

export const cambiarTema = (nuevo) => {
  if (!TEMAS.includes(nuevo)) return;
  tema = nuevo;
  try { localStorage.setItem(CLAVE, nuevo); } catch { /* sin almacenamiento: dura la sesión */ }
  avisar();
};

// Aplica el tema a <html> según la ruta actual
export const aplicarTema = (ruta) => {
  document.documentElement.dataset.theme = esOscuro() && !soloClaro(ruta) ? 'dark' : 'light';
};

const suscribir = (f) => { oyentes.add(f); return () => oyentes.delete(f); };
const instantanea = () => `${tema}:${esOscuro() ? 'oscuro' : 'claro'}`;

// { tema: 'sistema' | 'claro' | 'oscuro', oscuro: boolean (el efectivo), cambiarTema }
export const useTema = () => {
  const valor = useSyncExternalStore(suscribir, instantanea, () => 'sistema:claro');
  const [t, efectivo] = valor.split(':');
  return { tema: t, oscuro: efectivo === 'oscuro', cambiarTema };
};
