import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { FileText, Download, FolderKanban, Rocket, Star, BarChart3, Users, Briefcase, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { useProgramas, useEmprendimientos } from '../hooks/useQueryHooks';

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
        api.get(`/nps/programa/${programa.id}`).catch(() => ({ data: { respuestas: [], nps: { score: 0, total: 0 } } }))
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
      doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')} • Estado: ${programa.estado === 'en_curso' ? 'En Curso' : programa.estado}`, w / 2, 25, { align: 'center' });

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
          const fecha = new Date(ses.fecha).toLocaleDateString('es-ES');
          const tipo = ses.tipo === 'taller' ? 'Taller' : 'Seguimiento';
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
      doc.text(`Reporte de Programa — ${programa.nombre} — ${new Date().toLocaleDateString('es-ES')}`, w / 2, pageH - 3, { align: 'center' });

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
        api.get(`/one-pager/${emp.id}`).catch(() => ({ data: { onePager: null, completo: false } }))
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
          const fecha = seg.sesion?.fecha ? new Date(seg.sesion.fecha).toLocaleDateString('es-ES') : '';
          const titulo = seg.sesion?.titulo || 'Sin sesión';
          doc.setFont('helvetica', 'bold');
          doc.text(`${titulo} (${fecha})`, margin + 4, y); y += 4;
          doc.setFont('helvetica', 'normal');
          if (seg.realizado) {
            const lines = doc.splitTextToSize(`Realizado: ${seg.realizado}`, contentW - 8);
            doc.text(lines, margin + 8, y); y += lines.length * 3.5;
          }
          if (seg.compromisos) {
            const lines = doc.splitTextToSize(`Compromisos: ${seg.compromisos}`, contentW - 8);
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
      doc.text(`Reporte — ${empDetalle.nombre} — ${new Date().toLocaleDateString('es-ES')}`, w / 2, pageH - 3, { align: 'center' });

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
      doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')}`, w / 2, 25, { align: 'center' });

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
          doc.text(ses.tipo === 'taller' ? 'Taller' : 'Seguimiento', margin + 90, y);
          doc.text(new Date(ses.fecha).toLocaleDateString('es-ES'), margin + 115, y);
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
      doc.text(`Reporte NPS General — ${new Date().toLocaleDateString('es-ES')}`, w / 2, pageH - 3, { align: 'center' });

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
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
          <div className="p-2 bg-brand-purple/10 rounded-xl"><BarChart3 size={22} className="text-brand-purple" /></div>
          Reportes e Indicadores
        </h1>
        <p className="text-gray-400 mt-1 ml-12">Indicadores clave y reportes PDF del sistema</p>
      </div>

      {/* Sección Indicadores */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <div className="p-1.5 bg-brand-purple/10 rounded-lg"><TrendingUp size={18} className="text-brand-purple" /></div>
          <h2 className="text-lg font-semibold text-brand-dark">Indicadores</h2>
        </div>
        <div className="p-5 space-y-6">
          {/* Totales */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Totales Generales</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-brand-cyan/10 to-brand-cyan/5 rounded-xl p-4 border border-brand-cyan/20">
                <div className="flex items-center gap-2 mb-2">
                  <Rocket size={16} className="text-brand-cyan" />
                  <span className="text-xs font-semibold text-brand-dark/60">Emprendimientos</span>
                </div>
                <p className="text-2xl font-bold text-brand-dark">{indicadores?.totales?.emprendimientos || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-brand-purple/10 to-brand-purple/5 rounded-xl p-4 border border-brand-purple/20">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={16} className="text-brand-purple" />
                  <span className="text-xs font-semibold text-brand-dark/60">Mujeres Líderes</span>
                </div>
                <p className="text-2xl font-bold text-brand-dark">{indicadores?.totales?.mujeres_lideres || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-pink-100 to-pink-50 rounded-xl p-4 border border-pink-200">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={16} className="text-pink-500" />
                  <span className="text-xs font-semibold text-brand-dark/60">Mujeres Emprendedoras</span>
                </div>
                <p className="text-2xl font-bold text-brand-dark">{indicadores?.totales?.mujeres_emprendedoras || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-brand-green/10 to-brand-green/5 rounded-xl p-4 border border-brand-green/20">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase size={16} className="text-brand-green" />
                  <span className="text-xs font-semibold text-brand-dark/60">Empleos Generados</span>
                </div>
                <p className="text-2xl font-bold text-brand-dark">{indicadores?.totales?.empleos_generados || 0}</p>
              </div>
            </div>
          </div>

          {/* Por Programa */}
          {indicadores?.por_programa?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Por Programa</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-3 font-semibold text-brand-dark/60 text-xs">Programa</th>
                      <th className="text-center py-2 px-3 font-semibold text-brand-dark/60 text-xs">Emprendimientos</th>
                      <th className="text-center py-2 px-3 font-semibold text-brand-dark/60 text-xs">Mujeres Líderes</th>
                      <th className="text-center py-2 px-3 font-semibold text-brand-dark/60 text-xs">Mujeres Emprend.</th>
                      <th className="text-center py-2 px-3 font-semibold text-brand-dark/60 text-xs">Empleos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {indicadores.por_programa.map(prog => (
                      <tr key={prog.programa_id} className="hover:bg-brand-cyan/5 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-medium text-brand-dark">{prog.programa_nombre}</span>
                          <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                            prog.programa_estado === 'en_curso' ? 'bg-brand-cyan/15 text-brand-dark' :
                            prog.programa_estado === 'finalizado' ? 'bg-brand-green/15 text-brand-green' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {prog.programa_estado === 'en_curso' ? 'En Curso' : prog.programa_estado === 'finalizado' ? 'Finalizado' : 'Planificado'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-brand-dark">{prog.emprendimientos}</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-brand-purple">{prog.mujeres_lideres}</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-pink-500">{prog.mujeres_emprendedoras}</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-brand-green">{prog.empleos_generados}</td>
                      </tr>
                    ))}
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
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-3 rounded-xl">
              <Star size={22} className="text-amber-500" />
            </div>
            <div>
              <h2 className="font-bold text-brand-dark">Reporte NPS General</h2>
              <p className="text-sm text-gray-400">Resumen de evaluaciones NPS por programa y sesión</p>
            </div>
          </div>
          <button
            onClick={generarPDFNps}
            disabled={generando === 'nps'}
            className="px-5 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 flex items-center gap-2 text-sm font-medium disabled:opacity-50 shadow-sm transition-all hover:shadow-md"
          >
            {generando === 'nps' ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Download size={16} />}
            Generar PDF
          </button>
        </div>
      </div>

      {/* Reportes por Programa */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <div className="p-1.5 bg-brand-cyan/10 rounded-lg"><FolderKanban size={18} className="text-brand-cyan" /></div>
          <h2 className="text-lg font-semibold text-brand-dark">Reportes por Programa</h2>
        </div>
        {programas.length === 0 ? (
          <div className="text-center py-10">
            <FolderKanban size={32} className="mx-auto text-gray-200 mb-2" />
            <p className="text-gray-400 text-sm">No hay programas registrados</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {programas.map(prog => (
              <div key={prog.id} className="flex items-center justify-between px-5 py-4 hover:bg-brand-cyan/5 transition-colors">
                <div>
                  <p className="font-semibold text-brand-dark text-sm">{prog.nombre}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <span className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] font-semibold mr-1.5 ${
                      prog.estado === 'en_curso' ? 'bg-brand-cyan/15 text-brand-dark' :
                      prog.estado === 'finalizado' ? 'bg-brand-green/15 text-brand-green' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {prog.estado === 'en_curso' ? 'En Curso' : prog.estado === 'finalizado' ? 'Finalizado' : 'Planificado'}
                    </span>
                    {prog.emprendimientos?.length || 0} emprendimientos
                  </p>
                </div>
                <button
                  onClick={() => generarPDFPrograma(prog)}
                  disabled={generando === `prog-${prog.id}`}
                  className="px-4 py-2 bg-brand-dark text-white rounded-xl hover:bg-brand-dark/90 flex items-center gap-1.5 text-xs font-medium disabled:opacity-50 shadow-sm transition-all hover:shadow-md"
                >
                  {generando === `prog-${prog.id}` ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div> : <Download size={14} />}
                  PDF
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reportes por Emprendimiento */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <div className="p-1.5 bg-brand-green/10 rounded-lg"><Rocket size={18} className="text-brand-green" /></div>
          <h2 className="text-lg font-semibold text-brand-dark">Reportes por Emprendimiento</h2>
        </div>
        {emprendimientos.length === 0 ? (
          <div className="text-center py-10">
            <Rocket size={32} className="mx-auto text-gray-200 mb-2" />
            <p className="text-gray-400 text-sm">No hay emprendimientos registrados</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {emprendimientos.map(emp => (
              <div key={emp.id} className="flex items-center justify-between px-5 py-4 hover:bg-brand-cyan/5 transition-colors">
                <div>
                  <p className="font-semibold text-brand-dark text-sm">{emp.nombre}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {emp.programa?.nombre || '-'}
                    <span className="text-gray-300 mx-1.5">·</span>
                    <span className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${
                      emp.estado === 'activo' ? 'bg-brand-green/15 text-brand-green' :
                      emp.estado === 'retirado' ? 'bg-red-100 text-red-500' :
                      emp.estado === 'graduado' ? 'bg-brand-cyan/15 text-brand-cyan' :
                      'bg-gray-100 text-gray-500'
                    }`}>{emp.estado}</span>
                  </p>
                </div>
                <button
                  onClick={() => generarPDFEmprendimiento(emp)}
                  disabled={generando === `emp-${emp.id}`}
                  className="px-4 py-2 bg-brand-green text-white rounded-xl hover:bg-brand-green/90 flex items-center gap-1.5 text-xs font-medium disabled:opacity-50 shadow-sm transition-all hover:shadow-md"
                >
                  {generando === `emp-${emp.id}` ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div> : <Download size={14} />}
                  PDF
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reportes;
