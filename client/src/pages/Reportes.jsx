import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Download, FolderKanban, Rocket, Star, BarChart3, Users, Briefcase, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { useProgramas, useEmprendimientos } from '../hooks/useQueryHooks';
import { formatFecha } from '../utils/fechas';
import { tipoSesion } from '../constants/sesiones';
import { ESTADOS_PROGRAMA, ESTADOS_EMPRENDIMIENTO, estadoDe } from '../constants/estados';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { textoCompromisos } from '../utils/compromisos';

const Reportes = () => {
  const { data: programas = [], isLoading: l1 } = useProgramas();
  const { data: emprendimientos = [], isLoading: l2 } = useEmprendimientos();
  const { data: indicadores, isLoading: l3 } = useQuery({
    queryKey: ['indicadores'],
    queryFn: () => api.get('/indicadores').then(r => r.data)
  });
  const cargando = l1 || l2 || l3;
  const [generando, setGenerando] = useState(null);

  const generarPDFPrograma = async (programa) => {
    setGenerando(`prog-${programa.id}`);
    try {
      const [sesRes, npsRes] = await Promise.all([
        api.get('/sesiones', { params: { programa_id: programa.id } }),
        api.get(`/nps/programa/${programa.id}`)
      ]);
      const sesiones = sesRes.data.sesiones || [];
      const nps = npsRes.data.nps || { score: 0, total: 0, promotores: 0, pasivos: 0, detractores: 0 };
      const emps = emprendimientos.filter(e => e.programa_id === programa.id);

      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF('p', 'mm', 'a4');
      const w = doc.internal.pageSize.getWidth();
      const margin = 15;
      const contentW = w - margin * 2;

      // Header
      doc.setFillColor(30, 58, 95);
      doc.rect(0, 0, w, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(`Reporte: ${programa.nombre}`, w / 2, 16, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generado el ${formatFecha(new Date())} • Estado: ${programa.estado === 'en_curso' ? 'En Curso' : programa.estado}`, w / 2, 25, { align: 'center' });

      let y = 45;

      // Stats row
      const statsW = contentW / 3;
      const drawStat = (label, value, x) => {
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(x, y, statsW - 4, 18, 2, 2, 'F');
        doc.setTextColor(30, 58, 95);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(String(value), x + (statsW - 4) / 2, y + 9, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120);
        doc.text(label, x + (statsW - 4) / 2, y + 15, { align: 'center' });
      };
      drawStat('Emprendimientos', emps.length, margin);
      drawStat('Sesiones', sesiones.length, margin + statsW);
      drawStat('NPS Score', nps.score || 0, margin + statsW * 2);
      y += 26;

      // Emprendimientos
      if (emps.length > 0) {
        doc.setFillColor(30, 58, 95);
        doc.roundedRect(margin, y, contentW, 7, 1.5, 1.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('EMPRENDIMIENTOS', margin + 4, y + 5);
        y += 12;
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        emps.forEach(emp => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.setFont('helvetica', 'bold');
          doc.text(`• ${emp.nombre}`, margin + 4, y);
          doc.setFont('helvetica', 'normal');
          doc.text(` — ${emp.estado || 'activo'} ${emp.sector ? '• ' + emp.sector : ''}`, margin + 4 + doc.getTextWidth(`• ${emp.nombre} `), y);
          y += 5;
        });
        y += 6;
      }

      // Sesiones
      if (sesiones.length > 0) {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFillColor(30, 58, 95);
        doc.roundedRect(margin, y, contentW, 7, 1.5, 1.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('SESIONES', margin + 4, y + 5);
        y += 12;
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(8);
        sesiones.forEach(ses => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.setFont('helvetica', 'bold');
          doc.text(`• ${ses.titulo}`, margin + 4, y);
          doc.setFont('helvetica', 'normal');
          const fecha = formatFecha(ses.fecha);
          const tipo = tipoSesion(ses.tipo).label;
          doc.text(` — ${fecha} • ${tipo}`, margin + 4 + doc.getTextWidth(`• ${ses.titulo} `), y);
          y += 5;
        });
        y += 6;
      }

      // NPS
      if (nps.total > 0) {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFillColor(45, 85, 140);
        doc.roundedRect(margin, y, contentW, 7, 1.5, 1.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('RESUMEN NPS', margin + 4, y + 5);
        y += 12;
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total de respuestas: ${nps.total}`, margin + 4, y); y += 5;
        doc.text(`NPS Score: ${nps.score}`, margin + 4, y); y += 5;
        doc.text(`Promotores (9-10): ${nps.promotores}  |  Pasivos (7-8): ${nps.pasivos}  |  Detractores (0-6): ${nps.detractores}`, margin + 4, y);
      }

      // Footer
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFillColor(30, 58, 95);
      doc.rect(0, pageH - 8, w, 8, 'F');
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(7);
      doc.text(`Reporte de Programa — ${programa.nombre} — ${formatFecha(new Date())}`, w / 2, pageH - 3, { align: 'center' });

      doc.save(`Reporte_${programa.nombre.replace(/\s+/g, '_')}.pdf`);
      toast.success('Reporte generado');
    } catch (error) {
      console.error(error);
      toast.error('Error al generar reporte');
    } finally {
      setGenerando(null);
    }
  };

  const generarPDFEmprendimiento = async (emp) => {
    setGenerando(`emp-${emp.id}`);
    try {
      const [empRes, opRes] = await Promise.all([
        api.get(`/emprendimientos/${emp.id}`),
        api.get(`/one-pager/${emp.id}`)
      ]);
      const empDetalle = empRes.data.emprendimiento;
      const onePager = opRes.data.onePager;
      const opCompleto = opRes.data.completo;

      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF('p', 'mm', 'a4');
      const w = doc.internal.pageSize.getWidth();
      const margin = 15;
      const contentW = w - margin * 2;

      // Header
      doc.setFillColor(30, 58, 95);
      doc.rect(0, 0, w, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(empDetalle.nombre, w / 2, 16, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const sub = [empDetalle.programa?.nombre, empDetalle.sector, empDetalle.estado].filter(Boolean).join(' • ');
      doc.text(sub, w / 2, 25, { align: 'center' });

      let y = 45;

      // Integrantes
      if (empDetalle.integrantes?.length > 0) {
        doc.setFillColor(30, 58, 95);
        doc.roundedRect(margin, y, contentW, 7, 1.5, 1.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('EQUIPO', margin + 4, y + 5);
        y += 12;
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(8);
        empDetalle.integrantes.forEach(int => {
          const nombre = `${int.usuario?.nombre || ''} ${int.usuario?.apellido || ''}`.trim();
          const rol = int.rol_emprendimiento || (int.es_lider ? 'Líder' : 'Integrante');
          doc.setFont('helvetica', 'bold');
          doc.text(`• ${nombre}`, margin + 4, y);
          doc.setFont('helvetica', 'normal');
          doc.text(` — ${rol} (${int.usuario?.email || ''})`, margin + 4 + doc.getTextWidth(`• ${nombre} `), y);
          y += 5;
        });
        y += 6;
      }

      // One Pager status
      doc.setFillColor(45, 85, 140);
      doc.roundedRect(margin, y, contentW, 7, 1.5, 1.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('ONE PAGER', margin + 4, y + 5);
      y += 12;
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      if (onePager) {
        doc.text(`Estado: ${opCompleto ? 'Completo' : 'Incompleto'} | Etapa: ${onePager.estado_proyecto || '-'}`, margin + 4, y); y += 5;
        if (onePager.descripcion) {
          const lines = doc.splitTextToSize(`Descripción: ${onePager.descripcion}`, contentW - 8);
          doc.text(lines, margin + 4, y); y += lines.length * 4;
        }
        if (onePager.problematica) {
          const lines = doc.splitTextToSize(`Problemática: ${onePager.problematica}`, contentW - 8);
          doc.text(lines, margin + 4, y); y += lines.length * 4;
        }
        if (onePager.solucion) {
          const lines = doc.splitTextToSize(`Solución: ${onePager.solucion}`, contentW - 8);
          doc.text(lines, margin + 4, y); y += lines.length * 4;
        }
      } else {
        doc.text('El emprendedor aún no ha completado su One Pager.', margin + 4, y); y += 5;
      }
      y += 6;

      // Seguimientos
      if (empDetalle.seguimientos?.length > 0) {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFillColor(30, 58, 95);
        doc.roundedRect(margin, y, contentW, 7, 1.5, 1.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`SEGUIMIENTOS (${empDetalle.seguimientos.length})`, margin + 4, y + 5);
        y += 12;
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(8);
        empDetalle.seguimientos.forEach(seg => {
          if (y > 265) { doc.addPage(); y = 20; }
          const fecha = seg.sesion?.fecha ? formatFecha(seg.sesion.fecha) : '';
          const titulo = seg.sesion?.titulo || 'Sin sesión';
          doc.setFont('helvetica', 'bold');
          doc.text(`${titulo} (${fecha})`, margin + 4, y); y += 4;
          doc.setFont('helvetica', 'normal');
          if (seg.realizado) {
            const lines = doc.splitTextToSize(`Realizado: ${seg.realizado}`, contentW - 8);
            doc.text(lines, margin + 8, y); y += lines.length * 3.5;
          }
          const compromisosTexto = textoCompromisos(seg);
          if (compromisosTexto) {
            const lines = doc.splitTextToSize(`Compromisos: ${compromisosTexto}`, contentW - 8);
            doc.text(lines, margin + 8, y); y += lines.length * 3.5;
          }
          y += 3;
        });
      }

      // Footer
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFillColor(30, 58, 95);
      doc.rect(0, pageH - 8, w, 8, 'F');
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(7);
      doc.text(`Reporte — ${empDetalle.nombre} — ${formatFecha(new Date())}`, w / 2, pageH - 3, { align: 'center' });

      doc.save(`Reporte_${empDetalle.nombre.replace(/\s+/g, '_')}.pdf`);
      toast.success('Reporte generado');
    } catch (error) {
      console.error(error);
      toast.error('Error al generar reporte');
    } finally {
      setGenerando(null);
    }
  };

  const generarPDFNps = async () => {
    setGenerando('nps');
    try {
      const [npsResRes, npsPromRes, sesRes] = await Promise.all([
        api.get('/nps/resumen'),
        api.get('/nps/promedios'),
        api.get('/sesiones')
      ]);
      const resumen = npsResRes.data.resumen || [];
      const promedios = npsPromRes.data.promedios || {};
      const sesiones = sesRes.data.sesiones || [];

      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF('p', 'mm', 'a4');
      const w = doc.internal.pageSize.getWidth();
      const margin = 15;
      const contentW = w - margin * 2;

      // Header
      doc.setFillColor(30, 58, 95);
      doc.rect(0, 0, w, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Reporte NPS General', w / 2, 16, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generado el ${formatFecha(new Date())}`, w / 2, 25, { align: 'center' });

      let y = 45;

      // NPS por programa
      doc.setFillColor(30, 58, 95);
      doc.roundedRect(margin, y, contentW, 7, 1.5, 1.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('NPS POR PROGRAMA', margin + 4, y + 5);
      y += 12;

      if (resumen.length > 0) {
        doc.setFontSize(8);
        resumen.forEach(item => {
          doc.setTextColor(50, 50, 50);
          doc.setFont('helvetica', 'bold');
          doc.text(item.programa_nombre, margin + 4, y);
          doc.setFont('helvetica', 'normal');
          doc.text(`  NPS Score: ${item.nps_score}  |  Respuestas: ${item.total_respuestas}`, margin + 4 + doc.getTextWidth(item.programa_nombre + ' '), y);
          y += 6;
        });
      } else {
        doc.setTextColor(120, 120, 120);
        doc.setFontSize(8);
        doc.text('No hay datos NPS disponibles.', margin + 4, y);
        y += 6;
      }
      y += 6;

      // NPS por sesión
      const sesionesConNps = sesiones.filter(s => promedios[s.id]);
      if (sesionesConNps.length > 0) {
        doc.setFillColor(45, 85, 140);
        doc.roundedRect(margin, y, contentW, 7, 1.5, 1.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('NPS POR SESIÓN', margin + 4, y + 5);
        y += 12;

        // Table header
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text('Sesión', margin + 4, y);
        doc.text('Tipo', margin + 90, y);
        doc.text('Fecha', margin + 115, y);
        doc.text('Promedio', margin + 145, y);
        doc.text('Resp.', margin + 165, y);
        y += 2;
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, margin + contentW, y);
        y += 4;

        doc.setFontSize(8);
        doc.setTextColor(50, 50, 50);
        sesionesConNps.forEach(ses => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.setFont('helvetica', 'normal');
          const titulo = ses.titulo.length > 40 ? ses.titulo.substring(0, 37) + '...' : ses.titulo;
          doc.text(titulo, margin + 4, y);
          doc.text(tipoSesion(ses.tipo).label, margin + 90, y);
          doc.text(formatFecha(ses.fecha), margin + 115, y);
          doc.setFont('helvetica', 'bold');
          doc.text(`${promedios[ses.id].promedio}/10`, margin + 145, y);
          doc.setFont('helvetica', 'normal');
          doc.text(String(promedios[ses.id].total), margin + 165, y);
          y += 5;
        });
      }

      // Footer
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFillColor(30, 58, 95);
      doc.rect(0, pageH - 8, w, 8, 'F');
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(7);
      doc.text(`Reporte NPS General — ${formatFecha(new Date())}`, w / 2, pageH - 3, { align: 'center' });

      doc.save(`Reporte_NPS_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Reporte NPS generado');
    } catch (error) {
      console.error(error);
      toast.error('Error al generar reporte');
    } finally {
      setGenerando(null);
    }
  };

  if (cargando) {
    return <div className="flex items-center justify-center h-64" role="status" aria-label="Cargando"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
          <div className="p-2 bg-brand-purple/10 rounded-xl"><BarChart3 size={22} className="text-brand-purple" aria-hidden="true" /></div>
          Reportes e Indicadores
        </h1>
        <p className="text-gray-500 mt-1 sm:ml-12">Indicadores clave y reportes PDF del sistema</p>
      </div>

      {/* Sección Indicadores */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <div className="p-1.5 bg-brand-purple/10 rounded-lg"><TrendingUp size={18} className="text-brand-purple" aria-hidden="true" /></div>
          <h2 className="text-lg font-semibold text-brand-dark">Indicadores</h2>
        </div>
        <div className="p-5 space-y-6">
          {/* Totales */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Totales Generales</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-brand-cyan/10 to-brand-cyan/5 rounded-xl p-4 border border-brand-cyan/20">
                <div className="flex items-center gap-2 mb-2">
                  <Rocket size={16} className="text-brand-cyan-ink shrink-0" aria-hidden="true" />
                  <span className="text-xs font-semibold text-gray-600">Emprendimientos</span>
                </div>
                <p className="text-2xl font-bold text-brand-dark">{indicadores?.totales?.emprendimientos || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-brand-purple/10 to-brand-purple/5 rounded-xl p-4 border border-brand-purple/20">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={16} className="text-brand-purple shrink-0" aria-hidden="true" />
                  <span className="text-xs font-semibold text-gray-600">Mujeres Líderes</span>
                </div>
                <p className="text-2xl font-bold text-brand-dark">{indicadores?.totales?.mujeres_lideres || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-pink-100 to-pink-50 rounded-xl p-4 border border-pink-200">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={16} className="text-pink-500 shrink-0" aria-hidden="true" />
                  <span className="text-xs font-semibold text-gray-600">Mujeres Emprendedoras</span>
                </div>
                <p className="text-2xl font-bold text-brand-dark">{indicadores?.totales?.mujeres_emprendedoras || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-brand-green/10 to-brand-green/5 rounded-xl p-4 border border-brand-green/20">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase size={16} className="text-brand-green-ink shrink-0" aria-hidden="true" />
                  <span className="text-xs font-semibold text-gray-600">Empleos Generados</span>
                </div>
                <p className="text-2xl font-bold text-brand-dark">{indicadores?.totales?.empleos_generados || 0}</p>
              </div>
            </div>
          </div>

          {/* Por Programa */}
          {indicadores?.por_programa?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Por Programa</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">Indicadores por programa</caption>
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th scope="col" className="text-left py-2 px-3 font-semibold text-gray-600 text-xs">Programa</th>
                      <th scope="col" className="text-center py-2 px-3 font-semibold text-gray-600 text-xs">Emprendimientos</th>
                      <th scope="col" className="text-center py-2 px-3 font-semibold text-gray-600 text-xs hidden md:table-cell">Mujeres Líderes</th>
                      <th scope="col" className="text-center py-2 px-3 font-semibold text-gray-600 text-xs hidden md:table-cell">Mujeres Emprend.</th>
                      <th scope="col" className="text-center py-2 px-3 font-semibold text-gray-600 text-xs hidden md:table-cell">Empleos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {indicadores.por_programa.map(prog => {
                      const estado = estadoDe(ESTADOS_PROGRAMA, prog.programa_estado);
                      return (
                        <tr key={prog.programa_id} className="hover:bg-brand-cyan/5 transition-colors">
                          <td className="py-2.5 px-3">
                            <span className="font-medium text-brand-dark">{prog.programa_nombre}</span>
                            <Badge tono={estado.tono} forma="tag" className="ml-2">{estado.label}</Badge>
                            {/* Resumen de las columnas ocultas en pantallas pequeñas */}
                            <p className="text-xs text-gray-500 mt-1 md:hidden">
                              Mujeres líderes: {prog.mujeres_lideres} · Mujeres emprend.: {prog.mujeres_emprendedoras} · Empleos: {prog.empleos_generados}
                            </p>
                          </td>
                          <td className="py-2.5 px-3 text-center font-semibold text-brand-dark">{prog.emprendimientos}</td>
                          <td className="py-2.5 px-3 text-center font-semibold text-brand-purple hidden md:table-cell">{prog.mujeres_lideres}</td>
                          <td className="py-2.5 px-3 text-center font-semibold text-pink-600 hidden md:table-cell">{prog.mujeres_emprendedoras}</td>
                          <td className="py-2.5 px-3 text-center font-semibold text-brand-green-ink hidden md:table-cell">{prog.empleos_generados}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reporte NPS General */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-amber-400 to-amber-500"></div>
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-3 rounded-xl shrink-0">
              <Star size={22} className="text-amber-500" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-bold text-brand-dark">Reporte NPS General</h2>
              <p className="text-sm text-gray-500">Resumen de evaluaciones NPS por programa y sesión</p>
            </div>
          </div>
          <Button variante="amber" icono={Download} cargando={generando === 'nps'} onClick={generarPDFNps}>
            Generar PDF
          </Button>
        </div>
      </div>

      {/* Reportes por Programa */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <div className="p-1.5 bg-brand-cyan/10 rounded-lg"><FolderKanban size={18} className="text-brand-cyan-ink" aria-hidden="true" /></div>
          <h2 className="text-lg font-semibold text-brand-dark">Reportes por Programa</h2>
        </div>
        {programas.length === 0 ? (
          <EmptyState icono={FolderKanban} tono="cyan" compacto titulo="No hay programas registrados" sinMarco />
        ) : (
          <div className="divide-y divide-gray-50">
            {programas.map(prog => {
              const estado = estadoDe(ESTADOS_PROGRAMA, prog.estado);
              return (
                <div key={prog.id} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-brand-cyan/5 transition-colors">
                  <div className="min-w-0">
                    <p className="font-semibold text-brand-dark text-sm">{prog.nombre}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      <Badge tono={estado.tono} forma="tag" className="mr-1.5">{estado.label}</Badge>
                      {prog.emprendimientos?.length || 0} emprendimientos
                    </p>
                  </div>
                  <Button
                    tamanio="sm"
                    icono={Download}
                    cargando={generando === `prog-${prog.id}`}
                    onClick={() => generarPDFPrograma(prog)}
                    aria-label={`Generar PDF de ${prog.nombre}`}
                    className="shrink-0"
                  >
                    PDF
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reportes por Emprendimiento */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <div className="p-1.5 bg-brand-green/10 rounded-lg"><Rocket size={18} className="text-brand-green-ink" aria-hidden="true" /></div>
          <h2 className="text-lg font-semibold text-brand-dark">Reportes por Emprendimiento</h2>
        </div>
        {emprendimientos.length === 0 ? (
          <EmptyState icono={Rocket} tono="green" compacto titulo="No hay emprendimientos registrados" sinMarco />
        ) : (
          <div className="divide-y divide-gray-50">
            {emprendimientos.map(emp => {
              const estado = estadoDe(ESTADOS_EMPRENDIMIENTO, emp.estado);
              return (
                <div key={emp.id} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-brand-cyan/5 transition-colors">
                  <div className="min-w-0">
                    <p className="font-semibold text-brand-dark text-sm">{emp.nombre}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {emp.programa?.nombre || '-'}
                      <span className="text-gray-500 mx-1.5" aria-hidden="true">·</span>
                      <Badge tono={estado.tono} forma="tag">{estado.label}</Badge>
                    </p>
                  </div>
                  <Button
                    variante="success"
                    tamanio="sm"
                    icono={Download}
                    cargando={generando === `emp-${emp.id}`}
                    onClick={() => generarPDFEmprendimiento(emp)}
                    aria-label={`Generar PDF de ${emp.nombre}`}
                    className="shrink-0"
                  >
                    PDF
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reportes;
