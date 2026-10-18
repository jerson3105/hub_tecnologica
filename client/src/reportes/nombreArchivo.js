// Nombre de archivo sin tildes ni espacios: «Informe-avance-Incubacion-2026-I-2026-10-18.pdf».
// Aparte de pdf/: este módulo se carga con la página y no debe arrastrar react-pdf.
export const nombreArchivo = (partes) => `${partes.filter(Boolean).join('-')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^A-Za-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}.pdf`;
