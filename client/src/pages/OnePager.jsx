import { useState, useEffect } from 'react';
import api from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { FileText, Save, Globe, Lightbulb, ExternalLink, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEmprendimientos, useInvalidate } from '../hooks/useQueryHooks';
import { formatFecha } from '../utils/fechas';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { Field, Input, Select, Textarea } from '../components/ui/Field';

// Los campos "requeridos" lo son para completar el One Pager (y descargar el PDF), no para
// guardar: se marcan con asterisco y aria-required, pero sin `required` para que el formulario
// se pueda guardar a medias como hasta ahora.
const REQUERIDO_PDF = { required: false, 'aria-required': true };

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
  const { data: emprendimientos = [], isLoading: cargando } = useEmprendimientos();
  const invalidate = useInvalidate();
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
      // Actualiza el aviso "Pendiente" del menú lateral
      invalidate('onePagerEstado', 'onePager');
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
      doc.text(`One Pager — ${empSeleccionado.nombre} — ${formatFecha(new Date())}`, w / 2, pageH - 3, { align: 'center' });

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
    return <div className="flex items-center justify-center h-64" role="status" aria-label="Cargando"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div></div>;
  }

  if (emprendimientos.length === 0) {
    return (
      <EmptyState
        icono={AlertCircle}
        tono="purple"
        titulo="Sin emprendimiento asignado"
        descripcion="Necesitas estar asignado a un emprendimiento para completar el One Pager."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
            <div className="p-2 bg-brand-purple/10 rounded-xl"><FileText size={22} className="text-brand-purple" aria-hidden="true" /></div>
            One Pager
          </h1>
          <p className="text-gray-500 mt-1 sm:ml-12">Completa la información de tu emprendimiento para generar tu One Pager profesional.</p>
        </div>
        {completo && (
          <Button variante="success" icono={Download} cargando={generandoPdf} onClick={generarPDF} className="self-start sm:self-auto">
            {generandoPdf ? 'Generando...' : 'Descargar PDF'}
          </Button>
        )}
      </div>

      {/* Selector de emprendimiento si tiene más de uno */}
      {emprendimientos.length > 1 && (
        <Select
          aria-label="Emprendimiento"
          value={empSeleccionado?.id || ''}
          onChange={(e) => setEmpSeleccionado(emprendimientos.find(emp => emp.id === parseInt(e.target.value)))}
        >
          {emprendimientos.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.nombre}</option>
          ))}
        </Select>
      )}

      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-3">
          <span id="progreso-one-pager" className="text-sm font-semibold text-brand-dark">Progreso de campos requeridos</span>
          <span className={`text-sm font-bold ${completo ? 'text-brand-green-ink' : 'text-amber-700'}`}>
            {camposCompletados}/{totalRequeridos} ({porcentaje}%)
          </span>
        </div>
        <div
          className="w-full bg-gray-100 rounded-full h-2.5"
          role="progressbar"
          aria-labelledby="progreso-one-pager"
          aria-valuemin={0}
          aria-valuemax={totalRequeridos}
          aria-valuenow={camposCompletados}
          aria-valuetext={`${camposCompletados} de ${totalRequeridos} campos requeridos (${porcentaje}%)`}
        >
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${completo ? 'bg-brand-green' : 'bg-amber-400'}`}
            style={{ width: `${porcentaje}%` }}
          ></div>
        </div>
        {!completo && (
          <p className="text-xs text-amber-700 mt-2.5 flex items-center gap-1">
            <AlertCircle size={12} className="shrink-0" aria-hidden="true" /> Completa todos los campos requeridos (*) para poder descargar el PDF.
          </p>
        )}
        {completo && (
          <p className="text-xs text-brand-green-ink mt-2.5 flex items-center gap-1 font-medium">
            <CheckCircle2 size={12} className="shrink-0" aria-hidden="true" /> One Pager completo. Ya puedes descargar el PDF.
          </p>
        )}
      </div>

      {/* Form */}
      <form onSubmit={guardar} className="space-y-6">
        {/* Información General */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <div className="p-1.5 bg-brand-cyan/10 rounded-lg"><Globe size={18} className="text-brand-cyan-ink" aria-hidden="true" /></div>
            <h2 className="text-lg font-semibold text-brand-dark">Información General</h2>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nombre del Proyecto">
              <Input type="text" value={empSeleccionado?.nombre || ''} disabled />
            </Field>
            <Field label="Estado del Proyecto" requerido>
              <Select {...REQUERIDO_PDF} value={form.estado_proyecto} onChange={(e) => setField('estado_proyecto', e.target.value)}>
                <option value="">Seleccionar estado</option>
                {ESTADOS_PROYECTO.map(e => <option key={e} value={e}>{e}</option>)}
              </Select>
            </Field>
            <Field label="Descripción del Proyecto" requerido className="sm:col-span-2">
              <Textarea {...REQUERIDO_PDF} value={form.descripcion} onChange={(e) => setField('descripcion', e.target.value)} rows={3} placeholder="Describe brevemente tu emprendimiento, qué hace y a quién va dirigido..." className="resize-y" />
            </Field>
          </div>
        </div>

        {/* Redes y Contacto */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <div className="p-1.5 bg-brand-green/10 rounded-lg"><ExternalLink size={18} className="text-brand-green-ink" aria-hidden="true" /></div>
            <h2 className="text-lg font-semibold text-brand-dark">Redes y Contacto</h2>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Correo del Proyecto" requerido>
              <Input {...REQUERIDO_PDF} type="email" value={form.correo_proyecto} onChange={(e) => setField('correo_proyecto', e.target.value)} placeholder="contacto@miproyecto.com" />
            </Field>
            <Field label="Página Web">
              <Input type="url" value={form.pagina_web} onChange={(e) => setField('pagina_web', e.target.value)} placeholder="https://..." />
            </Field>
            <Field label="Facebook">
              <Input type="url" value={form.facebook} onChange={(e) => setField('facebook', e.target.value)} placeholder="https://facebook.com/..." />
            </Field>
            <Field label="Instagram">
              <Input type="url" value={form.instagram} onChange={(e) => setField('instagram', e.target.value)} placeholder="https://instagram.com/..." />
            </Field>
            <Field label="Twitter / X">
              <Input type="url" value={form.twitter} onChange={(e) => setField('twitter', e.target.value)} placeholder="https://x.com/..." />
            </Field>
            <Field label="YouTube">
              <Input type="url" value={form.youtube} onChange={(e) => setField('youtube', e.target.value)} placeholder="https://youtube.com/..." />
            </Field>
            <Field label="LinkedIn">
              <Input type="url" value={form.linkedin} onChange={(e) => setField('linkedin', e.target.value)} placeholder="https://linkedin.com/company/..." />
            </Field>
            <Field label="Logo (enlace)">
              <Input type="url" value={form.logo_url} onChange={(e) => setField('logo_url', e.target.value)} placeholder="https://drive.google.com/..." />
            </Field>
            <Field label="Otros enlaces" className="sm:col-span-2">
              <Input type="text" value={form.otros_links} onChange={(e) => setField('otros_links', e.target.value)} placeholder="Otros enlaces relevantes..." />
            </Field>
          </div>
        </div>

        {/* Contenido Clave */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <div className="p-1.5 bg-brand-purple/10 rounded-lg"><Lightbulb size={18} className="text-brand-purple" aria-hidden="true" /></div>
            <h2 className="text-lg font-semibold text-brand-dark">Contenido Clave</h2>
          </div>
          <div className="p-5 space-y-4">
            <Field label="Problemática / Oportunidad" requerido>
              <Textarea {...REQUERIDO_PDF} value={form.problematica} onChange={(e) => setField('problematica', e.target.value)} rows={3} placeholder="¿Qué problema resuelves? ¿Qué oportunidad identificaste?" className="resize-y" />
            </Field>
            <Field label="Solución / Propuesta de Valor" requerido>
              <Textarea {...REQUERIDO_PDF} value={form.solucion} onChange={(e) => setField('solucion', e.target.value)} rows={3} placeholder="¿Cómo resuelves el problema? ¿Qué valor ofreces?" className="resize-y" />
            </Field>
            <Field label="Modelo de Negocio" requerido>
              <Textarea {...REQUERIDO_PDF} value={form.modelo_negocio} onChange={(e) => setField('modelo_negocio', e.target.value)} rows={3} placeholder="¿Cómo genera ingresos tu emprendimiento?" className="resize-y" />
            </Field>
            <Field label="Mercado Objetivo">
              <Textarea value={form.mercado_objetivo} onChange={(e) => setField('mercado_objetivo', e.target.value)} rows={2} placeholder="¿A quién va dirigido? Tamaño del mercado, segmentación..." className="resize-y" />
            </Field>
            <Field label="Ventaja Competitiva">
              <Textarea value={form.ventaja_competitiva} onChange={(e) => setField('ventaja_competitiva', e.target.value)} rows={2} placeholder="¿Qué te diferencia de la competencia?" className="resize-y" />
            </Field>
            <Field label="Hitos / Logros Alcanzados">
              <Textarea value={form.hitos} onChange={(e) => setField('hitos', e.target.value)} rows={2} placeholder="Logros importantes, métricas, premios..." className="resize-y" />
            </Field>
            <Field label="Estado Actual / Tracción">
              <Textarea value={form.estado_actual} onChange={(e) => setField('estado_actual', e.target.value)} rows={2} placeholder="¿En qué punto se encuentra el proyecto actualmente?" className="resize-y" />
            </Field>
            <Field label="Necesidades del Proyecto">
              <Textarea value={form.necesidades} onChange={(e) => setField('necesidades', e.target.value)} rows={2} placeholder="Financiamiento, alianzas, mentores, tecnología..." className="resize-y" />
            </Field>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs text-gray-500">Los campos marcados con * son requeridos para completar el One Pager.</p>
          <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3">
            {completo && (
              <Button variante="success" icono={Download} cargando={generandoPdf} onClick={generarPDF}>
                Descargar PDF
              </Button>
            )}
            <Button type="submit" icono={Save} cargando={guardando}>
              {guardando ? 'Guardando...' : 'Guardar One Pager'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default OnePager;
