import { useState } from 'react';
import api from '../services/api';
import { resolveMentorPhotoUrl } from '../services/media';
import Modal from '../components/Modal';
import { GraduationCap, Plus, Edit3, Trash2, Linkedin, Calendar, Search, X, Camera, Globe, Briefcase, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMentores, useInvalidate } from '../hooks/useQueryHooks';

const INPUT_CLS = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all text-sm';
const LABEL_CLS = 'block text-sm font-semibold text-brand-dark mb-1.5';

const SESIONES_OPTIONS = [
  'Unit Economics', 'Modelos de negocio', 'Growth Marketing', 'Análisis de mercado',
  'Elevator Pitch', 'Innovación social', 'Inteligencia artificial', 'Pricing'
];

const STARTUPS_OPTIONS = [
  'Agritech', 'Biotech', 'Civictech', 'Construcción y vivienda', 'E-commerce', 'Edtech',
  'Energía y tecnología limpia', 'Fintech', 'Foodtech', 'Home Services',
  'Industrias culturales y creativas', 'Información y comunicaciones', 'Insuretech',
  'Logística y transporte', 'Manufactura', 'Medios y entretenimiento', 'MineTech', 'ModaTech', 'Otros'
];

const ODS_OPTIONS = [
  '1. Fin de la pobreza', '2. Hambre Cero', '3. Salud y Bienestar', '4. Educación de calidad',
  '5. Igualdad de género', '6. Agua limpia y saneamiento', '7. Energía asequible y no contaminante',
  '8. Trabajo decente y crecimiento económico', '9. Industria, innovación e infraestructura',
  '10. Reducción de las desigualdades', '11. Ciudades y comunidades sostenibles',
  '12. Producción y consumo responsables', '13. Acción por el clima', '14. Vida submarina',
  '15. Vida de ecosistemas terrestres', '16. Paz, justicia e instituciones sólidas',
  '17. Alianzas para lograr los objetivos'
];

const parseJSON = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') { try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; } }
  return [];
};

const Mentores = () => {
  const { data: mentores = [], isLoading: cargando } = useMentores();
  const invalidate = useInvalidate();
  const [busqueda, setBusqueda] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [form, setForm] = useState({
    nombre: '', apellido: '', linkedin: '', calendly: '', biografia: '',
    foto: null, sesiones: [], startups: [], ods: []
  });

  const abrirModal = (mentor = null) => {
    if (mentor) {
      setEditando(mentor);
      setForm({
        nombre: mentor.nombre, apellido: mentor.apellido,
        linkedin: mentor.linkedin, calendly: mentor.calendly || '',
        biografia: mentor.biografia || '', foto: null,
        sesiones: parseJSON(mentor.sesiones), startups: parseJSON(mentor.startups), ods: parseJSON(mentor.ods)
      });
      setFotoPreview(resolveMentorPhotoUrl(mentor.foto));
    } else {
      setEditando(null);
      setForm({ nombre: '', apellido: '', linkedin: '', calendly: '', biografia: '', foto: null, sesiones: [], startups: [], ods: [] });
      setFotoPreview(null);
    }
    setModalOpen(true);
  };

  const handleFoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, foto: file });
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const toggleArray = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.apellido || !form.linkedin) {
      toast.error('Nombre, apellido y LinkedIn son requeridos');
      return;
    }

    setGuardando(true);
    try {
      const formData = new FormData();
      formData.append('nombre', form.nombre);
      formData.append('apellido', form.apellido);
      formData.append('linkedin', form.linkedin);
      formData.append('calendly', form.calendly);
      formData.append('biografia', form.biografia);
      formData.append('sesiones', JSON.stringify(form.sesiones));
      formData.append('startups', JSON.stringify(form.startups));
      formData.append('ods', JSON.stringify(form.ods));
      if (form.foto) formData.append('foto', form.foto);

      if (editando) {
        await api.put(`/mentores/${editando.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Mentor actualizado');
      } else {
        await api.post('/mentores', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Mentor creado');
      }
      setModalOpen(false);
      invalidate('mentores');
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Desactivar este mentor?')) return;
    try {
      await api.delete(`/mentores/${id}`);
      toast.success('Mentor desactivado');
      invalidate('mentores');
    } catch {
      toast.error('Error al desactivar mentor');
    }
  };

  const mentoresFiltrados = mentores.filter(m =>
    m.activo && (`${m.nombre} ${m.apellido}`.toLowerCase().includes(busqueda.toLowerCase()))
  );

  if (cargando) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
            <div className="p-2 bg-brand-purple/10 rounded-xl"><GraduationCap size={22} className="text-brand-purple" /></div>
            Mentores
          </h1>
          <p className="text-gray-400 mt-1 ml-12">Red de mentores - HUB TecnológICA</p>
        </div>
        <button onClick={() => abrirModal()} className="bg-brand-dark text-white px-5 py-2.5 rounded-xl hover:bg-brand-dark/90 flex items-center gap-2 text-sm font-medium shadow-sm transition-all hover:shadow-md">
          <Plus size={18} /> Nuevo Mentor
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar mentor..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all text-sm"
        />
      </div>

      {/* Mentors grid */}
      {mentoresFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-brand-purple/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={32} className="text-brand-purple" />
          </div>
          <p className="text-gray-500 font-medium">No hay mentores registrados</p>
          <button onClick={() => abrirModal()} className="mt-3 text-brand-cyan hover:text-brand-dark text-sm font-medium transition-colors">Agregar primer mentor</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {mentoresFiltrados.map(mentor => (
            <div key={mentor.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-purple/20 transition-all overflow-hidden">
              {/* Card content */}
              <div className="p-5">
                {/* Header: Photo + Actions */}
                <div className="flex items-start gap-4">
                  {mentor.foto ? (
                    <img src={resolveMentorPhotoUrl(mentor.foto)} alt={mentor.nombre} className="w-20 h-20 rounded-2xl object-cover shadow-md flex-shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-brand-purple/10 flex items-center justify-center shadow-md flex-shrink-0">
                      <span className="text-2xl font-bold text-brand-purple">{mentor.nombre.charAt(0)}{mentor.apellido.charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-brand-dark text-lg leading-tight">{mentor.nombre} {mentor.apellido}</h3>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => abrirModal(mentor)} className="p-1.5 text-brand-purple hover:bg-brand-purple/10 rounded-lg transition-colors"><Edit3 size={14} /></button>
                        <button onClick={() => eliminar(mentor.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <a href={mentor.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-cyan hover:text-brand-dark flex items-center gap-1 font-medium transition-colors">
                        <Linkedin size={12} /> LinkedIn
                      </a>
                      {mentor.calendly && (
                        <a href={mentor.calendly} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-green hover:text-brand-dark flex items-center gap-1 font-medium transition-colors">
                          <Calendar size={12} /> Calendly
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {mentor.biografia && (
                  <p className="text-xs text-gray-400 mt-3 line-clamp-2 leading-relaxed">{mentor.biografia}</p>
                )}

                {/* Tags */}
                <div className="mt-3 space-y-2">
                  {(() => { const arr = parseJSON(mentor.sesiones); return arr.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {arr.slice(0, 3).map(s => (
                        <span key={s} className="px-2 py-0.5 text-[10px] font-semibold bg-brand-cyan/10 text-brand-cyan rounded-md">{s}</span>
                      ))}
                      {arr.length > 3 && <span className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-400 rounded-md">+{arr.length - 3}</span>}
                    </div>
                  ) : null; })()}
                  {(() => { const arr = parseJSON(mentor.startups); return arr.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {arr.slice(0, 3).map(s => (
                        <span key={s} className="px-2 py-0.5 text-[10px] font-semibold bg-brand-green/10 text-brand-green rounded-md">{s}</span>
                      ))}
                      {arr.length > 3 && <span className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-400 rounded-md">+{arr.length - 3}</span>}
                    </div>
                  ) : null; })()}
                  {(() => { const arr = parseJSON(mentor.ods); return arr.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {arr.slice(0, 2).map(o => (
                        <span key={o} className="px-2 py-0.5 text-[10px] font-semibold bg-brand-purple/10 text-brand-purple rounded-md">{o}</span>
                      ))}
                      {arr.length > 2 && <span className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-400 rounded-md">+{arr.length - 2}</span>}
                    </div>
                  ) : null; })()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editando ? 'Editar Mentor' : 'Nuevo Mentor'}>
        <form onSubmit={guardar} className="space-y-5">
          {/* Photo */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {fotoPreview ? (
                <img src={fotoPreview} alt="Preview" className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-100" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-brand-purple/10 flex items-center justify-center border-2 border-dashed border-brand-purple/20">
                  <Camera size={24} className="text-brand-purple/40" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className={LABEL_CLS}>Fotografía</label>
              <input type="file" accept="image/*" onChange={handleFoto} className={INPUT_CLS} />
              <p className="text-[10px] text-gray-400 mt-1">JPG, PNG o WEBP. Máximo 5MB</p>
            </div>
          </div>

          {/* Name fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>Nombre *</label>
              <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className={INPUT_CLS} placeholder="Nombre" required />
            </div>
            <div>
              <label className={LABEL_CLS}>Apellido *</label>
              <input type="text" value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} className={INPUT_CLS} placeholder="Apellido" required />
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>LinkedIn *</label>
              <input type="url" value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} className={INPUT_CLS} placeholder="https://linkedin.com/in/..." required />
            </div>
            <div>
              <label className={LABEL_CLS}>Calendly <span className="text-gray-400 font-normal">(opcional)</span></label>
              <input type="url" value={form.calendly} onChange={(e) => setForm({ ...form, calendly: e.target.value })} className={INPUT_CLS} placeholder="https://calendly.com/..." />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className={LABEL_CLS}>Biografía</label>
            <textarea value={form.biografia} onChange={(e) => setForm({ ...form, biografia: e.target.value })} className={`${INPUT_CLS} min-h-[80px] resize-none`} placeholder="Breve descripción del mentor..." />
          </div>

          {/* Sesiones checkboxes */}
          <div>
            <label className={LABEL_CLS}>
              <span className="flex items-center gap-1.5"><Briefcase size={14} className="text-brand-cyan" /> ¿Qué sesiones puede trabajar?</span>
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {SESIONES_OPTIONS.map(opt => (
                <label key={opt} className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all text-sm ${
                  form.sesiones.includes(opt) ? 'border-brand-cyan/30 bg-brand-cyan/5 text-brand-dark' : 'border-gray-100 hover:border-gray-200 text-gray-500'
                }`}>
                  <input type="checkbox" checked={form.sesiones.includes(opt)} onChange={() => toggleArray('sesiones', opt)} className="sr-only" />
                  <div className={`w-4 h-4 rounded flex items-center justify-center border-2 transition-all shrink-0 ${
                    form.sesiones.includes(opt) ? 'bg-brand-cyan border-brand-cyan' : 'border-gray-300'
                  }`}>
                    {form.sesiones.includes(opt) && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  {opt}
                </label>
              ))}
            </div>
          </div>

          {/* Startups checkboxes */}
          <div>
            <label className={LABEL_CLS}>
              <span className="flex items-center gap-1.5"><Globe size={14} className="text-brand-green" /> Startups que puede trabajar</span>
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {STARTUPS_OPTIONS.map(opt => (
                <label key={opt} className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all text-sm ${
                  form.startups.includes(opt) ? 'border-brand-green/30 bg-brand-green/5 text-brand-dark' : 'border-gray-100 hover:border-gray-200 text-gray-500'
                }`}>
                  <input type="checkbox" checked={form.startups.includes(opt)} onChange={() => toggleArray('startups', opt)} className="sr-only" />
                  <div className={`w-4 h-4 rounded flex items-center justify-center border-2 transition-all shrink-0 ${
                    form.startups.includes(opt) ? 'bg-brand-green border-brand-green' : 'border-gray-300'
                  }`}>
                    {form.startups.includes(opt) && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  {opt}
                </label>
              ))}
            </div>
          </div>

          {/* ODS checkboxes */}
          <div>
            <label className={LABEL_CLS}>
              <span className="flex items-center gap-1.5"><Target size={14} className="text-brand-purple" /> ODS en los que se especializa</span>
            </label>
            <div className="grid grid-cols-1 gap-2 mt-1">
              {ODS_OPTIONS.map(opt => (
                <label key={opt} className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all text-sm ${
                  form.ods.includes(opt) ? 'border-brand-purple/30 bg-brand-purple/5 text-brand-dark' : 'border-gray-100 hover:border-gray-200 text-gray-500'
                }`}>
                  <input type="checkbox" checked={form.ods.includes(opt)} onChange={() => toggleArray('ods', opt)} className="sr-only" />
                  <div className={`w-4 h-4 rounded flex items-center justify-center border-2 transition-all shrink-0 ${
                    form.ods.includes(opt) ? 'bg-brand-purple border-brand-purple' : 'border-gray-300'
                  }`}>
                    {form.ods.includes(opt) && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  {opt}
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">Cancelar</button>
            <button type="submit" disabled={guardando} className="px-6 py-2.5 text-sm bg-brand-dark text-white rounded-xl hover:bg-brand-dark/90 disabled:opacity-50 flex items-center gap-2 font-medium shadow-sm transition-all hover:shadow-md">
              {guardando ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Plus size={16} />}
              {guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear Mentor')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Mentores;
