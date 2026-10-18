import { Font } from '@react-pdf/renderer';
import geist400 from '@fontsource/geist/files/geist-latin-400-normal.woff?url';
import geist500 from '@fontsource/geist/files/geist-latin-500-normal.woff?url';
import geist600 from '@fontsource/geist/files/geist-latin-600-normal.woff?url';
import geist700 from '@fontsource/geist/files/geist-latin-700-normal.woff?url';
import bricolage600 from '@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-600-normal.woff?url';
import bricolage700 from '@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-700-normal.woff?url';

// Marca de los informes PDF: los mismos colores y fuentes que la web (ver index.css y
// rediseno/02-sistema-visual.md). Fondo siempre claro: el PDF se imprime.
export const C = {
  tinta: '#192d36', // petróleo 900 (texto y cabeceras)
  suave: '#4c616b', // muted-foreground
  tenue: '#5e727c',
  borde: '#d6e0e5',
  fondo: '#f3f8fa',
  muted: '#e8eff3',
  blanco: '#ffffff',
  cian: '#64c3d1', // cian de la marca
  cianFuerte: '#258592',
  cianTexto: '#116a75',
  cianSuave: '#d7f3f7',
  verde: '#246d4b',
  verdeSuave: '#daf4e5',
  verdeMarca: '#6ec497',
  morado: '#5a2d8d',
  moradoSuave: '#eee7fb',
  ambar: '#a75605',
  ambarSuave: '#ffeece',
  ambarMarca: '#f5ae2a',
  rojo: '#b51f26',
  rojoSuave: '#ffe4e1',
  azul: '#215da5',
  azulSuave: '#e2eeff'
};

// Paleta de gráficos (misma que la web)
export const SERIE = ['#0191a0', '#ce7702', '#7349a9', '#038052', '#3475c4', '#5e727c'];

let registradas = false;
export const registrarFuentes = () => {
  if (registradas) return;
  Font.register({
    family: 'Geist',
    fonts: [
      { src: geist400, fontWeight: 400 },
      { src: geist500, fontWeight: 500 },
      { src: geist600, fontWeight: 600 },
      { src: geist700, fontWeight: 700 }
    ]
  });
  Font.register({
    family: 'Bricolage',
    fonts: [
      { src: bricolage600, fontWeight: 600 },
      { src: bricolage700, fontWeight: 700 }
    ]
  });
  // Sin guiones automáticos: partían mal las palabras en castellano
  Font.registerHyphenationCallback((palabra) => [palabra]);
  registradas = true;
};

// onload y no decode(): decode() no resuelve en una pestaña en segundo plano. Con límite de
// espera: una imagen externa que no responde no debe dejar el PDF colgado.
const cargarImagen = (src, { anonima = false, espera = 8000 } = {}) => new Promise((ok, falla) => {
  const img = new Image();
  // Sin CORS el navegador no deja leer la imagen en un canvas: así falla ya al cargarla
  if (anonima) img.crossOrigin = 'anonymous';
  const limite = setTimeout(() => falla(new Error('La imagen tardó demasiado')), espera);
  img.onload = () => { clearTimeout(limite); ok(img); };
  img.onerror = () => { clearTimeout(limite); falla(new Error('No se pudo cargar la imagen')); };
  img.src = src;
});

// El logo (public/logo.png) tiene mucho margen transparente arriba: se recorta a su contenido
// una vez y se reutiliza como data URL.
let logoRecortado = null;
export const cargarLogo = async () => {
  if (logoRecortado) return logoRecortado;
  const img = await cargarImagen('/logo.png');
  const lienzo = document.createElement('canvas');
  lienzo.width = img.naturalWidth;
  lienzo.height = img.naturalHeight;
  const ctx = lienzo.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, lienzo.width, lienzo.height);
  let [x0, y0, x1, y1] = [width, height, 0, 0];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  const recorte = document.createElement('canvas');
  recorte.width = x1 - x0 + 1;
  recorte.height = y1 - y0 + 1;
  recorte.getContext('2d').drawImage(lienzo, x0, y0, recorte.width, recorte.height, 0, 0, recorte.width, recorte.height);
  logoRecortado = { src: recorte.toDataURL('image/png'), proporcion: recorte.width / recorte.height };
  return logoRecortado;
};

// Un enlace de Google Drive («…/file/d/ID/view», «…/open?id=ID») abre la página del archivo, no la
// imagen: se prueba antes su versión directa.
const ID_DRIVE = /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:.*&)?id=)([\w-]+)/;
const LADO_MAXIMO = 480;

// Logo del proyecto (el enlace que pega el equipo en su One Pager). Pasa por un canvas, reducido,
// para dárselo a react-pdf como data URL. Si no carga (no es una imagen, el servidor no permite
// CORS o no responde) devuelve null y el PDF sale sin él.
export const cargarImagenExterna = async (url) => {
  const enlace = (url || '').trim();
  if (!enlace) return null;
  const direccion = /^https?:\/\//i.test(enlace) ? enlace : `https://${enlace}`;
  const idDrive = ID_DRIVE.exec(direccion)?.[1];
  const candidatos = idDrive ? [`https://lh3.googleusercontent.com/d/${idDrive}`, direccion] : [direccion];
  for (const src of candidatos) {
    try {
      const img = await cargarImagen(src, { anonima: true });
      if (!img.naturalWidth || !img.naturalHeight) continue;
      const escala = Math.min(1, LADO_MAXIMO / Math.max(img.naturalWidth, img.naturalHeight));
      const lienzo = document.createElement('canvas');
      lienzo.width = Math.max(1, Math.round(img.naturalWidth * escala));
      lienzo.height = Math.max(1, Math.round(img.naturalHeight * escala));
      lienzo.getContext('2d').drawImage(img, 0, 0, lienzo.width, lienzo.height);
      return { src: lienzo.toDataURL('image/png'), proporcion: lienzo.width / lienzo.height };
    } catch {
      // siguiente candidato
    }
  }
  return null;
};
