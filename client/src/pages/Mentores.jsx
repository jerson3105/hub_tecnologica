import { useState } from 'react';
import api from '../services/api';
import { resolveMentorPhotoUrl } from '../services/media';
import Modal, { ModalPie } from '../components/Modal';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { Field, Input, Textarea } from '../components/ui/Field';
import { GraduationCap, Plus, Edit3, Archive, RotateCcw, Linkedin, Calendar, Search, Camera, Globe, Briefcase, Target, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMentores, useInvalidate } from '../hooks/useQueryHooks';

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

const FORM_VACIO = { nombre: '', apellido: '', linkedin: '', calendly: '', biografia: '', foto: null, sesiones: [], startups: [], ods: [] };

const parseJSON = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') { try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; } }
  return [];
};

const COLORES_CHIP = {
  cyan: { activo: 'border-brand-cyan-ink/40 bg-brand-cyan/10 text-brand-dark', marca: 'bg-brand-cyan-ink border-brand-cyan-ink' },
  green: { activo: 'border-brand-green-ink/40 bg-brand-green/10 text-brand-dark', marca: 'bg-brand-green-ink border-brand-green-ink' },
  purple: { activo: 'border-brand-purple/40 bg-brand-purple/5 text-brand-dark', marca: 'bg-brand-purple border-brand-purple' }
};

// Grupo de casillas con aspecto de chip. El checkbox real es sr-only, así que el foco
// se muestra en el label con has-[:focus-visible].
const GrupoChips = ({ titulo, icono, opciones, seleccion, onToggle, color, columnas = 'sm:grid-cols-2' }) => {
  const Icono = icono;
  const colores = COLORES_CHIP[color];
  return (
    <fieldset>
      <legend className="block text-sm font-semibold text-brand-dark mb-1.5">
        <span className="flex items-center gap-1.5"><Icono size={14} aria-hidden="true" /> {titulo}</span>
      </legend>
      <div className={`grid grid-cols-1 ${columnas} gap-2 mt-1`}>
        {opciones.map(opt => {
          const marcado = seleccion.includes(opt);
          return (
            <label
              key={opt}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-colors text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-cyan-ink ${
                marcado ? colores.activo : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <input type="checkbox" checked={marcado} onChange={() => onToggle(opt)} className="sr-only" />
              <span className={`w-4 h-4 rounded flex items-center justify-center border-2 transition-colors shrink-0 ${marcado ? colores.marca : 'border-gray-400'}`} aria-hidden="true">
                {marcado && <Check size={10} strokeWidth={3} className="text-white" />}
              </span>
              {opt}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};

const Etiquetas = ({ items, max, tono }) => {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {items.slice(0, max).map(s => <Badge key={s} tono={tono} forma="tag">{s}</Badge>)}
      {items.length > max && <Badge forma="tag">+{items.length - max}</Badge>}
    </div>
  );
};

const Mentores = () => {
  const { data: mentores = [], isLoading: cargando } = useMentores();
  const invalidate = useInvalidate();
  const [busqueda, setBusqueda] = useState('');
  const [verInactivos, setVerInactivos] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [form, setForm] = useState({ ...FORM_VACIO });

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
      setForm({ ...FORM_VACIO });
      setFotoPreview(null);
    }
    setModalOpen(true);
  };

  const handleFoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm(prev => ({ ...prev, foto: file }));
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

  const cambiarActivo = async (mentor) => {
    const nombre = `${mentor.nombre} ${mentor.apellido}`;
    if (mentor.activo && !window.confirm(`¿Desactivar a ${nombre}? Dejará de aparecer para los emprendedores. Podrás reactivarlo desde "Ver inactivos".`)) return;
    try {
      if (mentor.activo) {
        await api.delete(`/mentores/${mentor.id}`);
        toast.success('Mentor desactivado');
      } else {
        await api.put(`/mentores/${mentor.id}`, { activo: true });
        toast.success('Mentor reactivado');
      }
      invalidate('mentores');
    } catch {
      toast.error('No se pudo actualizar el mentor');
    }
  };

  const totalInactivos = mentores.filter(m => !m.activo).length;
  const mentoresFiltrados = mentores.filter(m =>
    (verInactivos ? !m.activo : m.activo) && (`${m.nombre} ${m.apellido}`.toLowerCase().includes(busqueda.toLowerCase()))
  );

  if (cargando) {
    return <div className="flex items-center justify-center h-64" role="status" aria-label="Cargando"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
            <div className="p-2 bg-brand-purple/10 rounded-xl"><GraduationCap size={22} className="text-brand-purple" aria-hidden="true" /></div>
            Mentores
          </h1>
          <p className="text-gray-500 mt-1 sm:ml-12">Red de mentores - HUB TecnológICA</p>
        </div>
        <Button icono={Plus} onClick={() => abrirModal()}>Nuevo Mentor</Button>
      </div>

      {/* Search + filtro */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" aria-hidden="true" />
          <Input
            type="search"
            aria-label="Buscar mentor por nombre"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar mentor..."
            className="pl-10"
          />
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={verInactivos} onChange={(e) => setVerInactivos(e.target.checked)} className="size-4 accent-brand-purple" />
          Ver inactivos ({totalInactivos})
        </label>
      </div>

      {/* Mentors grid */}
      {mentoresFiltrados.length === 0 ? (
        <EmptyState
          icono={GraduationCap}
          tono="purple"
          titulo={busqueda ? 'Ningún mentor coincide con la búsqueda' : verInactivos ? 'No hay mentores inactivos' : 'No hay mentores registrados'}
          accion={busqueda
            ? <Button variante="secondary" onClick={() => setBusqueda('')}>Limpiar búsqueda</Button>
            : verInactivos
              ? <Button variante="secondary" onClick={() => setVerInactivos(false)}>Ver mentores activos</Button>
              : <Button icono={Plus} onClick={() => abrirModal()}>Agregar primer mentor</Button>}
        />
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {mentoresFiltrados.map(mentor => {
            const nombre = `${mentor.nombre} ${mentor.apellido}`;
            return (
              <li key={mentor.id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-purple/20 transition-all overflow-hidden ${mentor.activo ? '' : 'opacity-80'}`}>
                <div className="p-5">
                  {/* Header: Photo + Actions */}
                  <div className="flex items-start gap-4">
                    {mentor.foto ? (
                      <img src={resolveMentorPhotoUrl(mentor.foto)} alt={`Foto de ${nombre}`} className="w-20 h-20 rounded-2xl object-cover shadow-md flex-shrink-0" />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-brand-purple/10 flex items-center justify-center shadow-md flex-shrink-0" aria-hidden="true">
                        <span className="text-2xl font-bold text-brand-purple">{mentor.nombre.charAt(0)}{mentor.apellido.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-brand-dark text-lg leading-tight">
                          {nombre}
                          {!mentor.activo && <Badge className="ml-2 align-middle">Inactivo</Badge>}
                        </h3>
                        <div className="flex flex-shrink-0 -mr-2 -mt-2">
                          <IconButton label={`Editar a ${nombre}`} icono={Edit3} tamanioIcono={15} tono="purple" onClick={() => abrirModal(mentor)} />
                          {mentor.activo ? (
                            <IconButton label={`Desactivar a ${nombre}`} icono={Archive} tamanioIcono={15} tono="danger" onClick={() => cambiarActivo(mentor)} />
                          ) : (
                            <IconButton label={`Reactivar a ${nombre}`} icono={RotateCcw} tamanioIcono={15} tono="success" onClick={() => cambiarActivo(mentor)} />
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        <a href={mentor.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-cyan-ink hover:underline flex items-center gap-1 font-medium">
                          <Linkedin size={13} aria-hidden="true" /> LinkedIn
                        </a>
                        {mentor.calendly && (
                          <a href={mentor.calendly} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-green-ink hover:underline flex items-center gap-1 font-medium">
                            <Calendar size={13} aria-hidden="true" /> Calendly
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {mentor.biografia && (
                    <p className="text-sm text-gray-600 mt-3 line-clamp-2 leading-relaxed">{mentor.biografia}</p>
                  )}

                  {/* Tags */}
                  <div className="mt-3 space-y-2">
                    <Etiquetas items={parseJSON(mentor.sesiones)} max={3} tono="cyan" />
                    <Etiquetas items={parseJSON(mentor.startups)} max={3} tono="green" />
                    <Etiquetas items={parseJSON(mentor.ods)} max={2} tono="purple" />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editando ? 'Editar Mentor' : 'Nuevo Mentor'} size="lg">
        <form onSubmit={guardar} className="space-y-5">
          {/* Photo */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {fotoPreview ? (
              <img src={fotoPreview} alt="Vista previa de la foto" className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-100" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-brand-purple/10 flex items-center justify-center border-2 border-dashed border-brand-purple/30" aria-hidden="true">
                <Camera size={24} className="text-brand-purple/60" />
              </div>
            )}
            <Field label="Fotografía" ayuda="JPG, PNG, GIF o WEBP. Máximo 5MB" className="flex-1">
              <Input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleFoto} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nombre" requerido>
              <Input type="text" value={form.nombre} onChange={(e) => setForm(prev => ({ ...prev, nombre: e.target.value }))} autoComplete="off" />
            </Field>
            <Field label="Apellido" requerido>
              <Input type="text" value={form.apellido} onChange={(e) => setForm(prev => ({ ...prev, apellido: e.target.value }))} autoComplete="off" />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="LinkedIn" requerido>
              <Input type="url" value={form.linkedin} onChange={(e) => setForm(prev => ({ ...prev, linkedin: e.target.value }))} placeholder="https://linkedin.com/in/..." />
            </Field>
            <Field label="Calendly (opcional)">
              <Input type="url" value={form.calendly} onChange={(e) => setForm(prev => ({ ...prev, calendly: e.target.value }))} placeholder="https://calendly.com/..." />
            </Field>
          </div>

          <Field label="Biografía">
            <Textarea value={form.biografia} onChange={(e) => setForm(prev => ({ ...prev, biografia: e.target.value }))} className="min-h-[80px] resize-y" placeholder="Breve descripción del mentor..." />
          </Field>

          <GrupoChips titulo="¿Qué sesiones puede trabajar?" icono={Briefcase} opciones={SESIONES_OPTIONS} seleccion={form.sesiones} onToggle={(v) => toggleArray('sesiones', v)} color="cyan" />
          <GrupoChips titulo="Startups que puede trabajar" icono={Globe} opciones={STARTUPS_OPTIONS} seleccion={form.startups} onToggle={(v) => toggleArray('startups', v)} color="green" />
          <GrupoChips titulo="ODS en los que se especializa" icono={Target} opciones={ODS_OPTIONS} seleccion={form.ods} onToggle={(v) => toggleArray('ods', v)} color="purple" columnas="" />

          <ModalPie>
            <Button variante="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" cargando={guardando} icono={editando ? Check : Plus}>
              {guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear Mentor')}
            </Button>
          </ModalPie>
        </form>
      </Modal>
    </div>
  );
};

export default Mentores;
