import { useEffect, useState } from 'react';

// Logo de la marca a partir de public/logo.png, recortado a su contenido (el PNG trae mucho margen
// transparente). La versión «negativa» pasa el texto negro a blanco y conserva el cian de «ICA»:
// es la que va sobre el sidebar oscuro. Provisional hasta tener el logo en SVG (positivo/negativo).

const cache = new Map();

const procesar = async (variante) => {
  const img = new Image();
  // onload y no decode(): decode() no resuelve con la pestaña en segundo plano
  await new Promise((ok, falla) => {
    img.onload = ok;
    img.onerror = () => falla(new Error('No se pudo cargar el logo'));
    img.src = '/logo.png';
  });
  const lienzo = document.createElement('canvas');
  lienzo.width = img.naturalWidth;
  lienzo.height = img.naturalHeight;
  const ctx = lienzo.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const imagen = ctx.getImageData(0, 0, lienzo.width, lienzo.height);
  const { data, width, height } = imagen;
  let [x0, y0, x1, y1] = [width, height, 0, 0];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      if (data[i + 3] <= 8) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      // Negativo: lo oscuro y sin color (el texto) pasa a blanco; el cian se queda
      if (variante === 'negativo') {
        const max = Math.max(data[i], data[i + 1], data[i + 2]);
        const min = Math.min(data[i], data[i + 1], data[i + 2]);
        if (max - min < 40) { data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; }
      }
    }
  }
  if (variante === 'negativo') ctx.putImageData(imagen, 0, 0);
  const recorte = document.createElement('canvas');
  recorte.width = x1 - x0 + 1;
  recorte.height = y1 - y0 + 1;
  recorte.getContext('2d').drawImage(lienzo, x0, y0, recorte.width, recorte.height, 0, 0, recorte.width, recorte.height);
  return recorte.toDataURL('image/png');
};

export const cargarLogo = (variante = 'positivo') => {
  if (!cache.has(variante)) cache.set(variante, procesar(variante).catch((e) => { cache.delete(variante); throw e; }));
  return cache.get(variante);
};

// URL del logo procesado o null mientras se prepara (unos milisegundos)
export const useLogo = (variante = 'positivo') => {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let vigente = true;
    cargarLogo(variante).then((url) => { if (vigente) setSrc(url); }).catch(() => {});
    return () => { vigente = false; };
  }, [variante]);
  return src;
};
