import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api, { descargarArchivo } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Users, ClipboardList, FileUp, TrendingUp, FileText, Globe, ExternalLink, AlertCircle, CheckCircle2, Download, Video, LayoutGrid, MessageSquare, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const EmprendimientoDetalle = () => {
  const { id } = useParams();
  const { esAdmin } = useAuth();
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const [bmcSeleccionada, setBmcSeleccionada] = useState(null);
  const [bmcFeedback, setBmcFeedback] = useState('');
  const [enviandoFeedback, setEnviandoFeedback] = useState(false);

  const { data: emp, isLoading: l1 } = useQuery({
    queryKey: ['emprendimiento', id],
    queryFn: () => api.get(`/emprendimientos/${id}`).then(r => r.data.emprendimiento),
    enabled: !!id
  });

  const { data: opData } = useQuery({
    queryKey: ['onePager', id],
    queryFn: () => api.get(`/one-pager/${id}`).then(r => r.data).catch(() => ({ onePager: null, completo: false })),
    enabled: !!id
  });
  const onePager = opData?.onePager || null;
  const opCompleto = opData?.completo || false;

  const { data: bmcVersiones = [] } = useQuery({
    queryKey: ['bmcVersiones', id],
    queryFn: async () => {
      const res = await api.get(`/bmc/emprendimiento/${id}`).catch(() => ({ data: { versiones: [] } }));
      const vers = res.data.versiones || [];
      if (vers.length > 0 && !bmcSeleccionada) {
        const fullBmc = await api.get(`/bmc/${vers[0].id}`);
        setBmcSeleccionada(fullBmc.data.bmc);
        setBmcFeedback(fullBmc.data.bmc.feedback || '');
      }
      return vers;
    },
    enabled: !!id
  });

  const cargando = l1;

  const generarPDF = async () => {
    if (!emp || !onePager) return;
    setGenerandoPdf(true);
    try {
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
      doc.text(`One Pager — ${emp.nombre} — ${new Date().toLocaleDateString('es-ES')}`, w / 2, pageH - 3, { align: 'center' });

      doc.save(`OnePager_${emp.nombre.replace(/\s+/g, '_')}.pdf`);
      toast.success('PDF generado exitosamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar el PDF');
    } finally {
      setGenerandoPdf(false);
    }
  };

  const seleccionarBmc = async (bmcId) => {
    try {
      const res = await api.get(`/bmc/${bmcId}`);
      setBmcSeleccionada(res.data.bmc);
      setBmcFeedback(res.data.bmc.feedback || '');
    } catch {
      toast.error('Error al cargar versión BMC');
    }
  };

  const enviarFeedbackBmc = async () => {
    if (!bmcSeleccionada) return;
    setEnviandoFeedback(true);
    try {
      await api.put(`/bmc/${bmcSeleccionada.id}/feedback`, { feedback: bmcFeedback });
      toast.success('Feedback enviado');
      setBmcSeleccionada(prev => ({ ...prev, feedback: bmcFeedback, feedback_fecha: new Date().toISOString() }));
    } catch {
      toast.error('Error al enviar feedback');
    } finally {
      setEnviandoFeedback(false);
    }
  };

  const BMC_BLOQUES = [
    { key: 'socios_clave', label: 'Socios Clave', color: 'border-brand-purple/20 bg-brand-purple/5' },
    { key: 'actividades_clave', label: 'Actividades Clave', color: 'border-brand-cyan/20 bg-brand-cyan/5' },
    { key: 'recursos_clave', label: 'Recursos Clave', color: 'border-brand-cyan/20 bg-brand-cyan/5' },
    { key: 'propuesta_valor', label: 'Propuesta de Valor', color: 'border-amber-200 bg-amber-50' },
    { key: 'relacion_clientes', label: 'Relación con Clientes', color: 'border-brand-green/20 bg-brand-green/5' },
    { key: 'canales', label: 'Canales', color: 'border-brand-green/20 bg-brand-green/5' },
    { key: 'segmento_clientes', label: 'Segmento de Clientes', color: 'border-red-200 bg-red-50' },
    { key: 'estructura_costos', label: 'Estructura de Costos', color: 'border-orange-200 bg-orange-50' },
    { key: 'fuentes_ingresos', label: 'Fuentes de Ingresos', color: 'border-brand-green/20 bg-brand-green/5' },
  ];

  if (cargando) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div></div>;
  }

  if (!emp) {
    return <div className="text-center py-12 text-gray-500">Emprendimiento no encontrado</div>;
  }

  const estadoAvanceMap = {
    sin_iniciar: { label: 'Sin Iniciar', color: 'bg-gray-100 text-gray-600' },
    en_progreso: { label: 'En Progreso', color: 'bg-brand-cyan/15 text-brand-dark' },
    avanzado: { label: 'Avanzado', color: 'bg-brand-green/15 text-brand-green' },
    completado: { label: 'Completado', color: 'bg-brand-green/20 text-brand-green' }
  };

  const estadoEmpConfig = {
    activo: { bg: 'bg-brand-green/15 text-brand-green', dot: 'bg-brand-green' },
    graduado: { bg: 'bg-brand-cyan/15 text-brand-cyan', dot: 'bg-brand-cyan' },
    retirado: { bg: 'bg-red-100 text-red-500', dot: 'bg-red-400' }
  };
  const estConf = estadoEmpConfig[emp.estado] || estadoEmpConfig.retirado;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark to-brand-purple rounded-2xl opacity-95"></div>
        <div className="relative px-6 py-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <Link to={esAdmin ? '/emprendimientos' : '/mi-emprendimiento'} className="text-white/50 hover:text-white transition-colors"><ArrowLeft size={22} /></Link>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 bg-white/15 text-white capitalize`}>
              <span className={`w-1.5 h-1.5 rounded-full ${estConf.dot}`}></span>
              {emp.estado}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">{emp.nombre}</h1>
          <p className="text-white/60 mt-1">{emp.programa?.nombre} {emp.sector ? `· ${emp.sector}` : ''}</p>
        </div>
      </div>

      {emp.descripcion && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-gray-600 leading-relaxed">{emp.descripcion}</p>
        </div>
      )}

      {/* Integrantes */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <div className="p-1.5 bg-brand-cyan/10 rounded-lg"><Users size={18} className="text-brand-cyan" /></div>
          <h2 className="text-lg font-semibold text-brand-dark">Integrantes</h2>
          <span className="ml-1 text-sm text-gray-400">({emp.integrantes?.length || 0})</span>
        </div>
        {emp.integrantes?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-50">
            {emp.integrantes.map((int) => (
              <div key={int.id} className="flex items-center gap-3 p-4 hover:bg-brand-cyan/5 transition-colors">
                <div className="w-10 h-10 bg-brand-cyan/10 rounded-xl flex items-center justify-center text-brand-cyan font-bold text-sm shrink-0">
                  {int.usuario?.nombre?.[0]}{int.usuario?.apellido?.[0]}
                </div>
                <div>
                  <p className="font-medium text-brand-dark">{int.usuario?.nombre} {int.usuario?.apellido}</p>
                  <p className="text-xs text-gray-400">{int.usuario?.email} {int.rol_emprendimiento ? `· ${int.rol_emprendimiento}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users size={32} className="mx-auto text-gray-200 mb-2" />
            <p className="text-gray-400 text-sm">No hay integrantes asignados</p>
          </div>
        )}
      </div>

      {/* Seguimientos */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <div className="p-1.5 bg-brand-purple/10 rounded-lg"><ClipboardList size={18} className="text-brand-purple" /></div>
          <h2 className="text-lg font-semibold text-brand-dark">Historial de Seguimiento</h2>
          <span className="ml-1 text-sm text-gray-400">({emp.seguimientos?.length || 0})</span>
        </div>
        {emp.seguimientos?.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {emp.seguimientos.map((seg) => (
              <div key={seg.id} className="p-5 hover:bg-brand-cyan/5 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    {seg.sesion ? (
                      <Link to={`/sesiones/${seg.sesion.id}`} className="text-sm font-semibold text-brand-dark hover:text-brand-cyan transition-colors">
                        {seg.sesion.titulo}
                      </Link>
                    ) : null}
                    <p className="text-xs text-gray-400">
                      {seg.sesion?.fecha
                        ? new Date(seg.sesion.fecha).toLocaleDateString('es-ES')
                        : new Date(seg.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${estadoAvanceMap[seg.estado_avance]?.color || 'bg-gray-100 text-gray-600'}`}>
                    {estadoAvanceMap[seg.estado_avance]?.label || seg.estado_avance}
                  </span>
                </div>
                {seg.realizado && (
                  <div className="mb-2">
                    <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider">Realizado</p>
                    <p className="text-sm text-gray-700 mt-0.5">{seg.realizado}</p>
                  </div>
                )}
                {seg.compromisos && (
                  <div className="mb-2">
                    <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider">Compromisos</p>
                    <p className="text-sm text-gray-700 mt-0.5">{seg.compromisos}</p>
                  </div>
                )}
                {seg.observaciones && (
                  <div className="mb-2">
                    <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider">Observaciones</p>
                    <p className="text-sm text-gray-700 mt-0.5">{seg.observaciones}</p>
                  </div>
                )}
                {seg.enlace_grabacion && (
                  <div className="flex items-center gap-2 mt-3 bg-brand-cyan/5 border border-brand-cyan/10 rounded-xl px-3 py-2 w-fit">
                    <Video size={14} className="text-brand-cyan" />
                    <a href={seg.enlace_grabacion} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-dark hover:text-brand-cyan font-medium transition-colors">
                      Grabación de la reunión
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ClipboardList size={32} className="mx-auto text-gray-200 mb-2" />
            <p className="text-gray-400 text-sm">No hay registros de seguimiento</p>
          </div>
        )}
      </div>

      {/* One Pager */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-brand-dark/5 rounded-lg"><FileText size={18} className="text-brand-dark" /></div>
            <h2 className="text-lg font-semibold text-brand-dark">One Pager</h2>
          </div>
          {onePager && opCompleto && (
            <button onClick={generarPDF} disabled={generandoPdf} className="px-4 py-2 bg-brand-green text-white rounded-xl hover:bg-brand-green/90 flex items-center gap-2 text-xs font-semibold disabled:opacity-50 shadow-sm transition-all">
              {generandoPdf ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div> : <Download size={14} />}
              Descargar PDF
            </button>
          )}
        </div>
        {onePager ? (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              {opCompleto ? (
                <span className="flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold bg-brand-green/15 text-brand-green rounded-full"><CheckCircle2 size={12} /> Completo</span>
              ) : (
                <span className="flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold bg-amber-100 text-amber-700 rounded-full"><AlertCircle size={12} /> Incompleto</span>
              )}
              {onePager.estado_proyecto && (
                <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-brand-cyan/15 text-brand-dark rounded-full">{onePager.estado_proyecto}</span>
              )}
            </div>
            {onePager.descripcion && (
              <div className="p-4 bg-brand-cyan/5 border border-brand-cyan/10 rounded-xl">
                <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-1">Descripción</p>
                <p className="text-sm text-gray-700 leading-relaxed">{onePager.descripcion}</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {onePager.problematica && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-1">Problemática / Oportunidad</p>
                  <p className="text-sm text-gray-700">{onePager.problematica}</p>
                </div>
              )}
              {onePager.solucion && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-1">Solución / Propuesta de Valor</p>
                  <p className="text-sm text-gray-700">{onePager.solucion}</p>
                </div>
              )}
              {onePager.modelo_negocio && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-1">Modelo de Negocio</p>
                  <p className="text-sm text-gray-700">{onePager.modelo_negocio}</p>
                </div>
              )}
              {onePager.mercado_objetivo && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-1">Mercado Objetivo</p>
                  <p className="text-sm text-gray-700">{onePager.mercado_objetivo}</p>
                </div>
              )}
              {onePager.ventaja_competitiva && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-1">Ventaja Competitiva</p>
                  <p className="text-sm text-gray-700">{onePager.ventaja_competitiva}</p>
                </div>
              )}
              {onePager.hitos && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-1">Hitos / Logros</p>
                  <p className="text-sm text-gray-700">{onePager.hitos}</p>
                </div>
              )}
              {onePager.estado_actual && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-1">Estado Actual</p>
                  <p className="text-sm text-gray-700">{onePager.estado_actual}</p>
                </div>
              )}
              {onePager.necesidades && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-1">Necesidades</p>
                  <p className="text-sm text-gray-700">{onePager.necesidades}</p>
                </div>
              )}
            </div>
            {/* Redes */}
            {(onePager.correo_proyecto || onePager.pagina_web || onePager.facebook || onePager.instagram || onePager.linkedin || onePager.youtube) && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-2">Contacto y Redes</p>
                <div className="flex flex-wrap gap-2">
                  {onePager.correo_proyecto && <span className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-medium text-brand-dark">📧 {onePager.correo_proyecto}</span>}
                  {onePager.pagina_web && <a href={onePager.pagina_web} target="_blank" rel="noopener noreferrer" className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-brand-cyan hover:bg-brand-cyan/5 font-medium transition-colors">🌐 Web</a>}
                  {onePager.facebook && <a href={onePager.facebook} target="_blank" rel="noopener noreferrer" className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-brand-cyan hover:bg-brand-cyan/5 font-medium transition-colors">Facebook</a>}
                  {onePager.instagram && <a href={onePager.instagram} target="_blank" rel="noopener noreferrer" className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-pink-600 hover:bg-pink-50 font-medium transition-colors">Instagram</a>}
                  {onePager.youtube && <a href={onePager.youtube} target="_blank" rel="noopener noreferrer" className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 font-medium transition-colors">YouTube</a>}
                  {onePager.linkedin && <a href={onePager.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-brand-cyan hover:bg-brand-cyan/5 font-medium transition-colors">LinkedIn</a>}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-10">
            <AlertCircle size={32} className="mx-auto text-amber-300 mb-2" />
            <p className="text-gray-400 text-sm">El emprendedor aún no ha completado su One Pager.</p>
          </div>
        )}
      </div>

      {/* Business Model Canvas */}
      {esAdmin && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-brand-purple/10 rounded-lg"><LayoutGrid size={18} className="text-brand-purple" /></div>
              <h2 className="text-lg font-semibold text-brand-dark">Business Model Canvas</h2>
            </div>
            {bmcVersiones.length > 0 && (
              <select
                value={bmcSeleccionada?.id || ''}
                onChange={(e) => seleccionarBmc(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all"
              >
                {bmcVersiones.map(v => (
                  <option key={v.id} value={v.id}>v{v.version} — {v.nombre || `Versión ${v.version}`}</option>
                ))}
              </select>
            )}
          </div>

          {bmcSeleccionada ? (
            <div className="p-5 space-y-4">
              {/* Mini canvas read-only */}
              <div className="grid grid-cols-10 gap-1.5 text-xs">
                {/* Row 1 */}
                <div className={`col-span-10 sm:col-span-5 lg:col-span-2 row-span-2 rounded-xl border p-2.5 ${BMC_BLOQUES[0].color}`}>
                  <p className="font-bold text-brand-dark text-[11px] mb-1">{BMC_BLOQUES[0].label}</p>
                  <p className="text-gray-600 whitespace-pre-wrap">{bmcSeleccionada.socios_clave || <span className="text-gray-300 italic">Sin completar</span>}</p>
                </div>
                <div className={`col-span-10 sm:col-span-5 lg:col-span-2 rounded-xl border p-2.5 ${BMC_BLOQUES[1].color}`}>
                  <p className="font-bold text-brand-dark text-[11px] mb-1">{BMC_BLOQUES[1].label}</p>
                  <p className="text-gray-600 whitespace-pre-wrap">{bmcSeleccionada.actividades_clave || <span className="text-gray-300 italic">Sin completar</span>}</p>
                </div>
                <div className={`col-span-10 sm:col-span-5 lg:col-span-2 row-span-2 rounded-xl border p-2.5 ${BMC_BLOQUES[3].color}`}>
                  <p className="font-bold text-brand-dark text-[11px] mb-1">{BMC_BLOQUES[3].label}</p>
                  <p className="text-gray-600 whitespace-pre-wrap">{bmcSeleccionada.propuesta_valor || <span className="text-gray-300 italic">Sin completar</span>}</p>
                </div>
                <div className={`col-span-10 sm:col-span-5 lg:col-span-2 rounded-xl border p-2.5 ${BMC_BLOQUES[4].color}`}>
                  <p className="font-bold text-brand-dark text-[11px] mb-1">{BMC_BLOQUES[4].label}</p>
                  <p className="text-gray-600 whitespace-pre-wrap">{bmcSeleccionada.relacion_clientes || <span className="text-gray-300 italic">Sin completar</span>}</p>
                </div>
                <div className={`col-span-10 sm:col-span-5 lg:col-span-2 row-span-2 rounded-xl border p-2.5 ${BMC_BLOQUES[6].color}`}>
                  <p className="font-bold text-brand-dark text-[11px] mb-1">{BMC_BLOQUES[6].label}</p>
                  <p className="text-gray-600 whitespace-pre-wrap">{bmcSeleccionada.segmento_clientes || <span className="text-gray-300 italic">Sin completar</span>}</p>
                </div>
                <div className={`col-span-10 sm:col-span-5 lg:col-span-2 rounded-xl border p-2.5 ${BMC_BLOQUES[2].color}`}>
                  <p className="font-bold text-brand-dark text-[11px] mb-1">{BMC_BLOQUES[2].label}</p>
                  <p className="text-gray-600 whitespace-pre-wrap">{bmcSeleccionada.recursos_clave || <span className="text-gray-300 italic">Sin completar</span>}</p>
                </div>
                <div className={`col-span-10 sm:col-span-5 lg:col-span-2 rounded-xl border p-2.5 ${BMC_BLOQUES[5].color}`}>
                  <p className="font-bold text-brand-dark text-[11px] mb-1">{BMC_BLOQUES[5].label}</p>
                  <p className="text-gray-600 whitespace-pre-wrap">{bmcSeleccionada.canales || <span className="text-gray-300 italic">Sin completar</span>}</p>
                </div>
                {/* Row 2 */}
                <div className={`col-span-10 lg:col-span-5 rounded-xl border p-2.5 ${BMC_BLOQUES[7].color}`}>
                  <p className="font-bold text-brand-dark text-[11px] mb-1">{BMC_BLOQUES[7].label}</p>
                  <p className="text-gray-600 whitespace-pre-wrap">{bmcSeleccionada.estructura_costos || <span className="text-gray-300 italic">Sin completar</span>}</p>
                </div>
                <div className={`col-span-10 lg:col-span-5 rounded-xl border p-2.5 ${BMC_BLOQUES[8].color}`}>
                  <p className="font-bold text-brand-dark text-[11px] mb-1">{BMC_BLOQUES[8].label}</p>
                  <p className="text-gray-600 whitespace-pre-wrap">{bmcSeleccionada.fuentes_ingresos || <span className="text-gray-300 italic">Sin completar</span>}</p>
                </div>
              </div>

              {/* Feedback existente */}
              {bmcSeleccionada.feedback && bmcSeleccionada.feedback_fecha && (
                <div className="bg-brand-purple/5 border border-brand-purple/10 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-brand-purple uppercase tracking-wider mb-1">
                    Feedback anterior — {new Date(bmcSeleccionada.feedback_fecha).toLocaleDateString('es-ES')}
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{bmcSeleccionada.feedback}</p>
                </div>
              )}

              {/* Formulario de feedback */}
              <div className="border-t border-gray-100 pt-4">
                <label className="text-sm font-semibold text-brand-dark mb-2 flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-brand-purple" /> Feedback para el emprendedor
                </label>
                <textarea
                  value={bmcFeedback}
                  onChange={(e) => setBmcFeedback(e.target.value)}
                  rows={3}
                  placeholder="Escribe tu retroalimentación sobre esta versión del BMC..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none resize-none transition-all mt-2"
                />
                <div className="flex justify-end mt-3">
                  <button
                    onClick={enviarFeedbackBmc}
                    disabled={enviandoFeedback || !bmcFeedback.trim()}
                    className="px-5 py-2.5 bg-brand-dark text-white rounded-xl hover:bg-brand-dark/90 text-sm flex items-center gap-1.5 disabled:opacity-50 font-medium shadow-sm transition-all hover:shadow-md"
                  >
                    <Send size={14} /> {enviandoFeedback ? 'Enviando...' : 'Enviar Feedback'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <LayoutGrid size={32} className="mx-auto text-gray-200 mb-2" />
              <p className="text-gray-400 text-sm">El emprendedor aún no ha creado su Business Model Canvas.</p>
            </div>
          )}
        </div>
      )}

      {/* Archivos del emprendimiento */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <div className="p-1.5 bg-brand-green/10 rounded-lg"><FileUp size={18} className="text-brand-green" /></div>
          <h2 className="text-lg font-semibold text-brand-dark">Archivos del Emprendimiento</h2>
          <span className="ml-1 text-sm text-gray-400">({emp.archivos?.length || 0})</span>
        </div>
        <div className="p-5">
          <p className="text-xs text-gray-400 mb-3">Archivos asignados directamente al emprendimiento. Los archivos de sesiones se encuentran en el detalle de cada sesión.</p>
          {emp.archivos?.length > 0 ? (
            <div className="space-y-2">
              {emp.archivos.map((arch) => {
                const categoriaLabels = { bmc: 'BMC', taller: 'Taller', entregable: 'Entregable', grabacion: 'Grabación', otro: 'Otro' };
                return (
                  <div key={arch.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-brand-cyan/5 hover:border-brand-cyan/20 transition-all group">
                    <div>
                      <p className="font-medium text-brand-dark text-sm">{arch.nombre_original}</p>
                      <p className="text-xs text-gray-400">
                        {categoriaLabels[arch.categoria] || arch.categoria} · {arch.created_at ? new Date(arch.created_at).toLocaleDateString('es-ES') : ''}
                      </p>
                    </div>
                    <button onClick={() => descargarArchivo(arch.id, arch.nombre_original)} className="text-brand-cyan hover:text-brand-dark text-sm font-medium transition-colors flex items-center gap-1">
                      <Download size={14} /> Descargar
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <FileUp size={32} className="mx-auto text-gray-200 mb-2" />
              <p className="text-gray-400 text-sm">No hay archivos subidos directamente al emprendimiento</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmprendimientoDetalle;
