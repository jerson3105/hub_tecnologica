import { useState, useEffect } from 'react';
import api from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { FileText, Save, Globe, Lightbulb, ExternalLink, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEmprendimientos } from '../hooks/useQueryHooks';

const INPUT_CLS = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all text-sm';
const LABEL_CLS = 'block text-sm font-semibold text-brand-dark mb-1.5';

const ESTADOS_PROYECTO = ['Idea', 'Prototipo', 'MVP', 'Operando', 'Escalando'];

const CAMPOS_REQUERIDOS = [
  'estado_proyecto', 'descripcion', 'correo_proyecto',
  'problematica', 'solucion', 'modelo_negocio'
];

const formVacio = {
  estado_proyecto: '', descripcion: '',
  pagina_web: '', facebook: '', instagram: '', twitter: '', youtube: '', linkedin: '',
  otros_links: '', correo_proyecto: '', logo_url: '',
  problematica: '', solucion: '', modelo_negocio: '',
  mercado_objetivo: '', ventaja_competitiva: '', hitos: '', necesidades: '', estado_actual: ''
};

const OnePager = () => {
  const { usuario } = useAuth();
  const { data: emprendimientos = [], isLoading: cargando } = useEmprendimientos();
  const [empSeleccionado, setEmpSeleccionado] = useState(null);
  const [form, setForm] = useState({ ...formVacio });
  const [guardando, setGuardando] = useState(false);
  const [completo, setCompleto] = useState(false);
  const [generandoPdf, setGenerandoPdf] = useState(false);

  // Auto-select first emprendimiento
  useEffect(() => {
    if (emprendimientos.length > 0 && !empSeleccionado) {
      setEmpSeleccionado(emprendimientos[0]);
    }
  }, [emprendimientos]);

  // Load one-pager data when empSeleccionado changes
  const { data: opData } = useQuery({
    queryKey: ['onePager', empSeleccionado?.id],
    queryFn: () => api.get(`/one-pager/${empSeleccionado.id}`).then(r => r.data),
    enabled: !!empSeleccionado?.id
  });

  useEffect(() => {
    if (!opData) return;
    if (opData.onePager) {
      const op = opData.onePager;
      setForm({
        estado_proyecto: op.estado_proyecto || '',
        descripcion: op.descripcion || '',
        pagina_web: op.pagina_web || '',
        facebook: op.facebook || '',
        instagram: op.instagram || '',
        twitter: op.twitter || '',
        youtube: op.youtube || '',
        linkedin: op.linkedin || '',
        otros_links: op.otros_links || '',
        correo_proyecto: op.correo_proyecto || '',
        logo_url: op.logo_url || '',
        problematica: op.problematica || '',
        solucion: op.solucion || '',
        modelo_negocio: op.modelo_negocio || '',
        mercado_objetivo: op.mercado_objetivo || '',
        ventaja_competitiva: op.ventaja_competitiva || '',
        hitos: op.hitos || '',
        necesidades: op.necesidades || '',
        estado_actual: op.estado_actual || ''
      });
      setCompleto(opData.completo);
    } else {
      setForm({ ...formVacio });
      setCompleto(false);
    }
  }, [opData]);

  const setField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!empSeleccionado) return;
    setGuardando(true);
    try {
      const res = await api.put(`/one-pager/${empSeleccionado.id}`, form);
      setCompleto(res.data.completo);
      toast.success('One Pager guardado exitosamente');
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const camposCompletados = CAMPOS_REQUERIDOS.filter(c => form[c]?.trim()).length;
  const totalRequeridos = CAMPOS_REQUERIDOS.length;
  const porcentaje = Math.round((camposCompletados / totalRequeridos) * 100);

  const generarPDF = async () => {
    if (!empSeleccionado) return;
    setGenerandoPdf(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF('p', 'mm', 'a4');
      const w = doc.internal.pageSize.getWidth();
      const margin = 15;
      const contentW = w - margin * 2;
      let y = 0;

      // Header band
      doc.setFillColor(30, 58, 95);
      doc.rect(0, 0, w, 42, 'F');
      doc.setFillColor(45, 85, 140);
      doc.rect(0, 42, w, 6, 'F');

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(empSeleccionado.nombre, w / 2, 18, { align: 'center' });

      // Subtitle
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const subtitulo = [empSeleccionado.programa?.nombre, empSeleccionado.sector].filter(Boolean).join(' • ');
      if (subtitulo) doc.text(subtitulo, w / 2, 26, { align: 'center' });

      // Contact info bar
      const contactItems = [];
      if (form.correo_proyecto) contactItems.push(form.correo_proyecto);
      if (form.pagina_web) contactItems.push(form.pagina_web);
      if (contactItems.length > 0) {
        doc.setFontSize(8);
        doc.text(contactItems.join('  |  '), w / 2, 34, { align: 'center' });
      }

      // Social links
      const socials = [];
      if (form.facebook) socials.push('Facebook');
      if (form.instagram) socials.push('Instagram');
      if (form.twitter) socials.push('Twitter');
      if (form.youtube) socials.push('YouTube');
      if (form.linkedin) socials.push('LinkedIn');
      if (socials.length > 0) {
        doc.setFontSize(7);
        doc.text(socials.join('  •  '), w / 2, 39, { align: 'center' });
      }

      y = 54;

      // Estado badge
      if (form.estado_proyecto) {
        doc.setFillColor(230, 240, 255);
        const badgeText = `Estado: ${form.estado_proyecto}`;
        const badgeW = doc.getTextWidth(badgeText) + 10;
        doc.roundedRect(margin, y - 4, badgeW, 8, 2, 2, 'F');
        doc.setTextColor(30, 58, 95);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(badgeText, margin + 5, y + 1);
        y += 12;
      }

      // Description
      if (form.descripcion) {
        doc.setFillColor(245, 247, 250);
        const descLines = doc.splitTextToSize(form.descripcion, contentW - 10);
        const descH = descLines.length * 4.5 + 8;
        doc.roundedRect(margin, y, contentW, descH, 2, 2, 'F');
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.text(descLines, margin + 5, y + 6);
        y += descH + 6;
      }

      // Two-column layout
      const colW = (contentW - 6) / 2;
      const leftX = margin;
      const rightX = margin + colW + 6;

      const drawSection = (title, text, x, startY, width) => {
        if (!text) return startY;
        // Title
        doc.setFillColor(30, 58, 95);
        doc.roundedRect(x, startY, width, 7, 1.5, 1.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(title, x + 4, startY + 5);
        // Body
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(text, width - 8);
        doc.text(lines, x + 4, startY + 13);
        return startY + 14 + lines.length * 3.8;
      };

      // Left column sections
      let leftY = y;
      leftY = drawSection('PROBLEMÁTICA / OPORTUNIDAD', form.problematica, leftX, leftY, colW);
      leftY = drawSection('SOLUCIÓN / PROPUESTA DE VALOR', form.solucion, leftX, leftY + 4, colW);
      leftY = drawSection('MODELO DE NEGOCIO', form.modelo_negocio, leftX, leftY + 4, colW);
      leftY = drawSection('NECESIDADES DEL PROYECTO', form.necesidades, leftX, leftY + 4, colW);

      // Right column sections
      let rightY = y;
      rightY = drawSection('MERCADO OBJETIVO', form.mercado_objetivo, rightX, rightY, colW);
      rightY = drawSection('VENTAJA COMPETITIVA', form.ventaja_competitiva, rightX, rightY + 4, colW);
      rightY = drawSection('HITOS / LOGROS', form.hitos, rightX, rightY + 4, colW);
      rightY = drawSection('ESTADO ACTUAL / TRACCIÓN', form.estado_actual, rightX, rightY + 4, colW);

      // Team section
      const teamY = Math.max(leftY, rightY) + 8;
      if (empSeleccionado.integrantes?.length > 0) {
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
        empSeleccionado.integrantes.forEach((int) => {
          const nombre = `${int.usuario?.nombre || ''} ${int.usuario?.apellido || ''}`.trim();
          const rol = int.rol_emprendimiento || (int.es_lider ? 'Líder' : 'Integrante');
          doc.setFont('helvetica', 'bold');
          doc.text(`${nombre}`, margin + 4, ty);
          doc.setFont('helvetica', 'normal');
          doc.text(` — ${rol}`, margin + 4 + doc.getTextWidth(`${nombre} `), ty);
          ty += 5;
        });
      }

      // Footer
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFillColor(30, 58, 95);
      doc.rect(0, pageH - 8, w, 8, 'F');
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(7);
      doc.text(`One Pager — ${empSeleccionado.nombre} — ${new Date().toLocaleDateString('es-ES')}`, w / 2, pageH - 3, { align: 'center' });

      doc.save(`OnePager_${empSeleccionado.nombre.replace(/\s+/g, '_')}.pdf`);
      toast.success('PDF generado exitosamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar el PDF');
    } finally {
      setGenerandoPdf(false);
    }
  };

  if (cargando) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div></div>;
  }

  if (emprendimientos.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-brand-purple/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} className="text-brand-purple" />
        </div>
        <h2 className="text-xl font-bold text-brand-dark mb-2">Sin emprendimiento asignado</h2>
        <p className="text-gray-400">Necesitas estar asignado a un emprendimiento para completar el One Pager.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
            <div className="p-2 bg-brand-purple/10 rounded-xl"><FileText size={22} className="text-brand-purple" /></div>
            One Pager
          </h1>
          <p className="text-gray-400 mt-1 ml-12">Completa la información de tu emprendimiento para generar tu One Pager profesional.</p>
        </div>
        {completo && (
          <button
            onClick={generarPDF}
            disabled={generandoPdf}
            className="px-5 py-2.5 bg-brand-green text-white rounded-xl hover:bg-brand-green/90 flex items-center gap-2 text-sm font-medium disabled:opacity-50 shadow-sm transition-all hover:shadow-md"
          >
            {generandoPdf ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Download size={16} />}
            {generandoPdf ? 'Generando...' : 'Descargar PDF'}
          </button>
        )}
      </div>

      {/* Selector de emprendimiento si tiene más de uno */}
      {emprendimientos.length > 1 && (
        <select
          value={empSeleccionado?.id || ''}
          onChange={(e) => setEmpSeleccionado(emprendimientos.find(emp => emp.id === parseInt(e.target.value)))}
          className={INPUT_CLS}
        >
          {emprendimientos.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.nombre}</option>
          ))}
        </select>
      )}

      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-brand-dark">Progreso de campos requeridos</span>
          <span className={`text-sm font-bold ${completo ? 'text-brand-green' : 'text-amber-500'}`}>
            {camposCompletados}/{totalRequeridos} ({porcentaje}%)
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${completo ? 'bg-brand-green' : 'bg-amber-400'}`}
            style={{ width: `${porcentaje}%` }}
          ></div>
        </div>
        {!completo && (
          <p className="text-xs text-amber-500 mt-2.5 flex items-center gap-1">
            <AlertCircle size={12} /> Completa todos los campos requeridos (*) para poder descargar el PDF.
          </p>
        )}
        {completo && (
          <p className="text-xs text-brand-green mt-2.5 flex items-center gap-1 font-medium">
            <CheckCircle2 size={12} /> One Pager completo. Ya puedes descargar el PDF.
          </p>
        )}
      </div>

      {/* Form */}
      <form onSubmit={guardar} className="space-y-6">
        {/* Información General */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <div className="p-1.5 bg-brand-cyan/10 rounded-lg"><Globe size={18} className="text-brand-cyan" /></div>
            <h2 className="text-lg font-semibold text-brand-dark">Información General</h2>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>Nombre del Proyecto</label>
              <input type="text" value={empSeleccionado?.nombre || ''} disabled className="w-full px-4 py-2.5 border border-gray-100 rounded-xl bg-gray-50 text-gray-400 text-sm" />
            </div>
            <div>
              <label className={LABEL_CLS}>Estado del Proyecto *</label>
              <select value={form.estado_proyecto} onChange={(e) => setField('estado_proyecto', e.target.value)} className={INPUT_CLS}>
                <option value="">Seleccionar estado</option>
                {ESTADOS_PROYECTO.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL_CLS}>Descripción del Proyecto *</label>
              <textarea value={form.descripcion} onChange={(e) => setField('descripcion', e.target.value)} rows={3} placeholder="Describe brevemente tu emprendimiento, qué hace y a quién va dirigido..." className={`${INPUT_CLS} resize-none`} />
            </div>
          </div>
        </div>

        {/* Redes y Contacto */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <div className="p-1.5 bg-brand-green/10 rounded-lg"><ExternalLink size={18} className="text-brand-green" /></div>
            <h2 className="text-lg font-semibold text-brand-dark">Redes y Contacto</h2>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>Correo del Proyecto *</label>
              <input type="email" value={form.correo_proyecto} onChange={(e) => setField('correo_proyecto', e.target.value)} placeholder="contacto@miproyecto.com" className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Página Web</label>
              <input type="url" value={form.pagina_web} onChange={(e) => setField('pagina_web', e.target.value)} placeholder="https://..." className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Facebook</label>
              <input type="url" value={form.facebook} onChange={(e) => setField('facebook', e.target.value)} placeholder="https://facebook.com/..." className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Instagram</label>
              <input type="url" value={form.instagram} onChange={(e) => setField('instagram', e.target.value)} placeholder="https://instagram.com/..." className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Twitter / X</label>
              <input type="url" value={form.twitter} onChange={(e) => setField('twitter', e.target.value)} placeholder="https://x.com/..." className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>YouTube</label>
              <input type="url" value={form.youtube} onChange={(e) => setField('youtube', e.target.value)} placeholder="https://youtube.com/..." className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>LinkedIn</label>
              <input type="url" value={form.linkedin} onChange={(e) => setField('linkedin', e.target.value)} placeholder="https://linkedin.com/company/..." className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Logo (enlace)</label>
              <input type="url" value={form.logo_url} onChange={(e) => setField('logo_url', e.target.value)} placeholder="https://drive.google.com/..." className={INPUT_CLS} />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL_CLS}>Otros enlaces</label>
              <input type="text" value={form.otros_links} onChange={(e) => setField('otros_links', e.target.value)} placeholder="Otros enlaces relevantes..." className={INPUT_CLS} />
            </div>
          </div>
        </div>

        {/* Contenido Clave */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <div className="p-1.5 bg-brand-purple/10 rounded-lg"><Lightbulb size={18} className="text-brand-purple" /></div>
            <h2 className="text-lg font-semibold text-brand-dark">Contenido Clave</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className={LABEL_CLS}>Problemática / Oportunidad *</label>
              <textarea value={form.problematica} onChange={(e) => setField('problematica', e.target.value)} rows={3} placeholder="¿Qué problema resuelves? ¿Qué oportunidad identificaste?" className={`${INPUT_CLS} resize-none`} />
            </div>
            <div>
              <label className={LABEL_CLS}>Solución / Propuesta de Valor *</label>
              <textarea value={form.solucion} onChange={(e) => setField('solucion', e.target.value)} rows={3} placeholder="¿Cómo resuelves el problema? ¿Qué valor ofreces?" className={`${INPUT_CLS} resize-none`} />
            </div>
            <div>
              <label className={LABEL_CLS}>Modelo de Negocio *</label>
              <textarea value={form.modelo_negocio} onChange={(e) => setField('modelo_negocio', e.target.value)} rows={3} placeholder="¿Cómo genera ingresos tu emprendimiento?" className={`${INPUT_CLS} resize-none`} />
            </div>
            <div>
              <label className={LABEL_CLS}>Mercado Objetivo</label>
              <textarea value={form.mercado_objetivo} onChange={(e) => setField('mercado_objetivo', e.target.value)} rows={2} placeholder="¿A quién va dirigido? Tamaño del mercado, segmentación..." className={`${INPUT_CLS} resize-none`} />
            </div>
            <div>
              <label className={LABEL_CLS}>Ventaja Competitiva</label>
              <textarea value={form.ventaja_competitiva} onChange={(e) => setField('ventaja_competitiva', e.target.value)} rows={2} placeholder="¿Qué te diferencia de la competencia?" className={`${INPUT_CLS} resize-none`} />
            </div>
            <div>
              <label className={LABEL_CLS}>Hitos / Logros Alcanzados</label>
              <textarea value={form.hitos} onChange={(e) => setField('hitos', e.target.value)} rows={2} placeholder="Logros importantes, métricas, premios..." className={`${INPUT_CLS} resize-none`} />
            </div>
            <div>
              <label className={LABEL_CLS}>Estado Actual / Tracción</label>
              <textarea value={form.estado_actual} onChange={(e) => setField('estado_actual', e.target.value)} rows={2} placeholder="¿En qué punto se encuentra el proyecto actualmente?" className={`${INPUT_CLS} resize-none`} />
            </div>
            <div>
              <label className={LABEL_CLS}>Necesidades del Proyecto</label>
              <textarea value={form.necesidades} onChange={(e) => setField('necesidades', e.target.value)} rows={2} placeholder="Financiamiento, alianzas, mentores, tecnología..." className={`${INPUT_CLS} resize-none`} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs text-gray-400">Los campos marcados con * son requeridos para completar el One Pager.</p>
          <div className="flex items-center gap-3">
            {completo && (
              <button
                type="button"
                onClick={generarPDF}
                disabled={generandoPdf}
                className="px-5 py-2.5 bg-brand-green text-white rounded-xl hover:bg-brand-green/90 flex items-center gap-2 text-sm font-medium disabled:opacity-50 shadow-sm transition-all hover:shadow-md"
              >
                {generandoPdf ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Download size={16} />}
                Descargar PDF
              </button>
            )}
            <button
              type="submit"
              disabled={guardando}
              className="px-6 py-2.5 bg-brand-dark text-white rounded-xl hover:bg-brand-dark/90 flex items-center gap-2 text-sm font-medium disabled:opacity-50 shadow-sm transition-all hover:shadow-md"
            >
              {guardando ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Save size={16} />}
              {guardando ? 'Guardando...' : 'Guardar One Pager'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default OnePager;
