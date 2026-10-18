import { formatFecha } from './fechas';

// One Pager en PDF (A4), con jsPDF cargado bajo demanda. Movido sin cambios desde el detalle del
// emprendimiento para que la página no cargue con el código de dibujo.
export const descargarOnePagerPdf = async (emp, onePager) => {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF('p', 'mm', 'a4');
  const w = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentW = w - margin * 2;
  let y = 0;

  doc.setFillColor(30, 58, 95);
  doc.rect(0, 0, w, 42, 'F');
  doc.setFillColor(45, 85, 140);
  doc.rect(0, 42, w, 6, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(emp.nombre, w / 2, 18, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const subtitulo = [emp.programa?.nombre, emp.sector].filter(Boolean).join(' • ');
  if (subtitulo) doc.text(subtitulo, w / 2, 26, { align: 'center' });

  const contactItems = [];
  if (onePager.correo_proyecto) contactItems.push(onePager.correo_proyecto);
  if (onePager.pagina_web) contactItems.push(onePager.pagina_web);
  if (contactItems.length > 0) {
    doc.setFontSize(8);
    doc.text(contactItems.join('  |  '), w / 2, 34, { align: 'center' });
  }

  const socials = [];
  if (onePager.facebook) socials.push('Facebook');
  if (onePager.instagram) socials.push('Instagram');
  if (onePager.twitter) socials.push('Twitter');
  if (onePager.youtube) socials.push('YouTube');
  if (onePager.linkedin) socials.push('LinkedIn');
  if (socials.length > 0) {
    doc.setFontSize(7);
    doc.text(socials.join('  •  '), w / 2, 39, { align: 'center' });
  }

  y = 54;

  if (onePager.estado_proyecto) {
    doc.setFillColor(230, 240, 255);
    const badgeText = `Estado: ${onePager.estado_proyecto}`;
    const badgeW = doc.getTextWidth(badgeText) + 10;
    doc.roundedRect(margin, y - 4, badgeW, 8, 2, 2, 'F');
    doc.setTextColor(30, 58, 95);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(badgeText, margin + 5, y + 1);
    y += 12;
  }

  if (onePager.descripcion) {
    doc.setFillColor(245, 247, 250);
    const descLines = doc.splitTextToSize(onePager.descripcion, contentW - 10);
    const descH = descLines.length * 4.5 + 8;
    doc.roundedRect(margin, y, contentW, descH, 2, 2, 'F');
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text(descLines, margin + 5, y + 6);
    y += descH + 6;
  }

  const colW = (contentW - 6) / 2;
  const leftX = margin;
  const rightX = margin + colW + 6;

  const drawSection = (title, text, x, startY, width) => {
    if (!text) return startY;
    doc.setFillColor(30, 58, 95);
    doc.roundedRect(x, startY, width, 7, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(title, x + 4, startY + 5);
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, width - 8);
    doc.text(lines, x + 4, startY + 13);
    return startY + 14 + lines.length * 3.8;
  };

  let leftY = y;
  leftY = drawSection('PROBLEMÁTICA / OPORTUNIDAD', onePager.problematica, leftX, leftY, colW);
  leftY = drawSection('SOLUCIÓN / PROPUESTA DE VALOR', onePager.solucion, leftX, leftY + 4, colW);
  leftY = drawSection('MODELO DE NEGOCIO', onePager.modelo_negocio, leftX, leftY + 4, colW);
  leftY = drawSection('NECESIDADES DEL PROYECTO', onePager.necesidades, leftX, leftY + 4, colW);

  let rightY = y;
  rightY = drawSection('MERCADO OBJETIVO', onePager.mercado_objetivo, rightX, rightY, colW);
  rightY = drawSection('VENTAJA COMPETITIVA', onePager.ventaja_competitiva, rightX, rightY + 4, colW);
  rightY = drawSection('HITOS / LOGROS', onePager.hitos, rightX, rightY + 4, colW);
  rightY = drawSection('ESTADO ACTUAL / TRACCIÓN', onePager.estado_actual, rightX, rightY + 4, colW);

  const teamY = Math.max(leftY, rightY) + 8;
  if (emp.integrantes?.length > 0) {
    doc.setFillColor(45, 85, 140);
    doc.roundedRect(margin, teamY, contentW, 7, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('EQUIPO', margin + 4, teamY + 5);
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    let ty = teamY + 14;
    emp.integrantes.forEach((int) => {
      const nombre = `${int.usuario?.nombre || ''} ${int.usuario?.apellido || ''}`.trim();
      const rol = int.rol_emprendimiento || (int.es_lider ? 'Líder' : 'Integrante');
      doc.setFont('helvetica', 'bold');
      doc.text(nombre, margin + 4, ty);
      doc.setFont('helvetica', 'normal');
      doc.text(` — ${rol}`, margin + 4 + doc.getTextWidth(`${nombre} `), ty);
      ty += 5;
    });
  }

  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(30, 58, 95);
  doc.rect(0, pageH - 8, w, 8, 'F');
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(7);
  doc.text(`One Pager — ${emp.nombre} — ${formatFecha(new Date())}`, w / 2, pageH - 3, { align: 'center' });

  doc.save(`OnePager_${emp.nombre.replace(/\s+/g, '_')}.pdf`);
};
