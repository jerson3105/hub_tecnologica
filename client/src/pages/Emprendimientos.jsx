import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';
import { Plus, Edit, Trash2, Eye, Rocket, UserPlus, X, ChevronRight, Users, FolderKanban } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEmprendimientos, useProgramas, useInvalidate } from '../hooks/useQueryHooks';
import { UBIGEO_PERU } from '../data/ubigeo';

const INPUT_CLS = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all text-sm';
const LABEL_CLS = 'block text-sm font-semibold text-brand-dark mb-1.5';

const AREAS_OPCIONES = [
  'CEO',
  'TI (Tecnología)',
  'Investigación y Desarrollo',
  'Marketing',
  'Operaciones',
  'Comercial',
  'Administración'
];

const formIntegranteVacio = {
  nombre: '', apellido: '', dni: '', edad: '', fecha_nacimiento: '', telefono: '',
  email: '', direccion: '', distrito: '', provincia: '', departamento: '', linkedin: '',
  genero: '', area: '', cargo: '', dedicacion: '', rol_emprendimiento: '', es_lider: false
};

const Emprendimientos = () => {
  const [filtroPrograma, setFiltroPrograma] = useState('');
  const empParams = filtroPrograma ? { programa_id: filtroPrograma } : {};
  const { data: emprendimientos = [], isLoading: l1 } = useEmprendimientos(empParams);
  const { data: programas = [], isLoading: l2 } = useProgramas();
  const invalidate = useInvalidate();
  const cargando = l1 || l2;
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIntegrante, setModalIntegrante] = useState(false);
  const [editando, setEditando] = useState(null);
  const [empSeleccionado, setEmpSeleccionado] = useState(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '', sector: '', programa_id: '', estado: 'activo' });
  const [formIntegrante, setFormIntegrante] = useState({ ...formIntegranteVacio });
  const [agregando, setAgregando] = useState(false);

  const abrirModal = (emp = null) => {
    if (emp) {
      setEditando(emp);
      setForm({ nombre: emp.nombre, descripcion: emp.descripcion || '', sector: emp.sector || '', programa_id: emp.programa_id || emp.programa?.id, estado: emp.estado || 'activo' });
    } else {
      setEditando(null);
      setForm({ nombre: '', descripcion: '', sector: '', programa_id: programas[0]?.id || '', estado: 'activo' });
    }
    setModalOpen(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await api.put(`/emprendimientos/${editando.id}`, form);
        toast.success('Emprendimiento actualizado');
      } else {
        await api.post('/emprendimientos', form);
        toast.success('Emprendimiento creado');
      }
      setModalOpen(false);
      invalidate('emprendimientos');
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al guardar');
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Desactivar este emprendimiento?')) return;
    try {
      await api.delete(`/emprendimientos/${id}`);
      toast.success('Emprendimiento desactivado');
      invalidate('emprendimientos');
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const abrirModalIntegrante = (emp) => {
    setEmpSeleccionado(emp);
    setFormIntegrante({ ...formIntegranteVacio });
    setModalIntegrante(true);
  };

  const agregarIntegrante = async (e) => {
    e.preventDefault();
    if (!formIntegrante.nombre || !formIntegrante.apellido || !formIntegrante.email) {
      toast.error('Nombre, apellido y correo son requeridos');
      return;
    }
    setAgregando(true);
    try {
      const payload = {
        ...formIntegrante,
        ciudad: formIntegrante.departamento || ''
      };
      await api.post(`/emprendimientos/${empSeleccionado.id}/integrantes`, payload);
      toast.success('Integrante agregado exitosamente');
      setModalIntegrante(false);
      invalidate('emprendimientos');
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al agregar integrante');
    } finally {
      setAgregando(false);
    }
  };

  const setIntField = (field, value) => {
    setFormIntegrante(prev => ({ ...prev, [field]: value }));
  };

  const depSeleccionado = UBIGEO_PERU.find(d => d.nombre === formIntegrante.departamento);
  const provinciasDisponibles = depSeleccionado?.provincias || [];
  const provSeleccionada = provinciasDisponibles.find(p => p.nombre === formIntegrante.provincia);
  const distritosDisponibles = provSeleccionada?.distritos || [];

  const eliminarIntegrante = async (empId, integranteId) => {
    if (!confirm('¿Eliminar este integrante?')) return;
    try {
      await api.delete(`/emprendimientos/${empId}/integrantes/${integranteId}`);
      toast.success('Integrante eliminado');
      invalidate('emprendimientos');
    } catch (error) {
      toast.error('Error al eliminar integrante');
    }
  };

  if (cargando) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div></div>;
  }

  const estadoEmpConfig = {
    activo: { bg: 'bg-brand-green/15 text-brand-green', dot: 'bg-brand-green' },
    graduado: { bg: 'bg-brand-cyan/15 text-brand-cyan', dot: 'bg-brand-cyan' },
    retirado: { bg: 'bg-red-100 text-red-500', dot: 'bg-red-400' }
  };

  // Agrupar emprendimientos por programa cuando no hay filtro
  const emprendimientosAgrupados = !filtroPrograma
    ? programas.map(prog => ({
        programa: prog,
        items: emprendimientos.filter(emp => emp.programa_id === prog.id || emp.programa?.id === prog.id)
      })).filter(g => g.items.length > 0)
    : null;

  const renderEmprendimiento = (emp) => {
    const estConf = estadoEmpConfig[emp.estado] || estadoEmpConfig.retirado;
    return (
      <div key={emp.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:border-brand-cyan/20 transition-all duration-200">
        <div className="h-1 bg-gradient-to-r from-brand-green to-brand-cyan"></div>
        <div className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center text-brand-green font-bold text-lg shrink-0">
                {emp.nombre?.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-brand-dark text-lg">{emp.nombre}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 capitalize ${estConf.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${estConf.dot}`}></span>
                    {emp.estado}
                  </span>
                </div>
                {filtroPrograma && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-400">
                    <FolderKanban size={12} className="text-brand-cyan" />
                    <span>{emp.programa?.nombre}</span>
                    {emp.sector && <><span className="text-gray-300">·</span><span>{emp.sector}</span></>}
                  </div>
                )}
                {!filtroPrograma && emp.sector && (
                  <p className="text-sm text-gray-400">{emp.sector}</p>
                )}
              </div>
            </div>
            <div className="flex gap-1.5 ml-13 sm:ml-0">
              <button onClick={() => abrirModalIntegrante(emp)} className="px-3 py-2 text-sm text-brand-green hover:bg-brand-green/10 rounded-xl flex items-center gap-1.5 font-medium transition-colors border border-brand-green/20">
                <UserPlus size={14} /> Integrante
              </button>
              <Link to={`/emprendimientos/${emp.id}`} className="px-3 py-2 text-sm text-brand-dark hover:bg-brand-cyan/10 rounded-xl flex items-center gap-1.5 font-medium transition-colors border border-brand-cyan/20">
                <Eye size={14} /> Ver
              </Link>
              <button onClick={() => abrirModal(emp)} className="p-2 text-brand-purple hover:bg-brand-purple/10 rounded-xl transition-colors border border-brand-purple/20">
                <Edit size={14} />
              </button>
              <button onClick={() => eliminar(emp.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors border border-red-100">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          {emp.descripcion && <p className="text-sm text-gray-500 mb-3 ml-13">{emp.descripcion}</p>}
          {emp.integrantes?.length > 0 && (
            <div className="border-t border-gray-50 pt-3 ml-13">
              <p className="text-[10px] font-semibold text-brand-dark/40 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Users size={11} /> Integrantes
              </p>
              <div className="flex flex-wrap gap-2">
                {emp.integrantes.map((int) => (
                  <div key={int.id} className="flex items-center gap-1.5 bg-gray-50 hover:bg-brand-cyan/5 px-3 py-1.5 rounded-xl text-sm transition-colors group">
                    {int.es_lider && <span className="px-1.5 py-0.5 bg-brand-purple/15 text-brand-purple rounded-md text-[10px] font-bold">Líder</span>}
                    <span className="text-brand-dark font-medium">{int.usuario?.nombre} {int.usuario?.apellido}</span>
                    {int.rol_emprendimiento && <span className="text-gray-400 text-xs">({int.rol_emprendimiento})</span>}
                    <button onClick={() => eliminarIntegrante(emp.id, int.id)} className="text-gray-300 hover:text-red-500 ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
            <div className="p-2 bg-brand-green/10 rounded-xl"><Rocket size={22} className="text-brand-green" /></div>
            Emprendimientos
          </h1>
          <p className="text-gray-400 mt-1 ml-12">Gestión de emprendimientos e integrantes</p>
        </div>
        <div className="flex gap-3">
          <select value={filtroPrograma} onChange={(e) => setFiltroPrograma(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all">
            <option value="">Todos los programas</option>
            {programas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <button onClick={() => abrirModal()} className="bg-brand-dark text-white px-5 py-2.5 rounded-xl hover:bg-brand-dark/90 flex items-center gap-2 text-sm font-medium whitespace-nowrap shadow-sm transition-all hover:shadow-md">
            <Plus size={18} /> Nuevo
          </button>
        </div>
      </div>

      {emprendimientos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-brand-green/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Rocket size={32} className="text-brand-green" />
          </div>
          <p className="text-gray-500 font-medium">No hay emprendimientos registrados</p>
          <p className="text-gray-400 text-sm mt-1">Crea tu primer emprendimiento para comenzar</p>
          <button onClick={() => abrirModal()} className="mt-5 bg-brand-dark text-white px-5 py-2 rounded-xl hover:bg-brand-dark/90 text-sm font-medium inline-flex items-center gap-2">
            <Plus size={16} /> Crear emprendimiento
          </button>
        </div>
      ) : emprendimientosAgrupados ? (
        // Vista agrupada por programa
        <div className="space-y-8">
          {emprendimientosAgrupados.map(grupo => (
            <div key={grupo.programa.id}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-brand-purple/10 flex items-center justify-center">
                  <FolderKanban size={16} className="text-brand-purple" />
                </div>
                <div>
                  <h2 className="font-bold text-brand-dark">{grupo.programa.nombre}</h2>
                  <p className="text-xs text-gray-400">{grupo.items.length} emprendimiento{grupo.items.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="space-y-4 pl-2 border-l-2 border-brand-purple/20">
                {grupo.items.map(renderEmprendimiento)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Vista sin agrupar (filtro activo)
        <div className="space-y-4">
          {emprendimientos.map(renderEmprendimiento)}
        </div>
      )}

      {/* Modal Emprendimiento */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editando ? 'Editar Emprendimiento' : 'Nuevo Emprendimiento'}>
        <form onSubmit={guardar} className="space-y-5">
          <div>
            <label className={LABEL_CLS}>Nombre *</label>
            <input type="text" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} required className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Descripción</label>
            <textarea value={form.descripcion} onChange={(e) => setForm({...form, descripcion: e.target.value})} rows={3} className={`${INPUT_CLS} resize-none`} />
          </div>
          <div>
            <label className={LABEL_CLS}>Sector</label>
            <input type="text" value={form.sector} onChange={(e) => setForm({...form, sector: e.target.value})} className={INPUT_CLS} placeholder="Ej: Tecnología, Alimentos..." />
          </div>
          <div>
            <label className={LABEL_CLS}>Programa *</label>
            <select value={form.programa_id} onChange={(e) => setForm({...form, programa_id: e.target.value})} required className={INPUT_CLS}>
              <option value="">Seleccionar programa</option>
              {programas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          {editando && (
            <div>
              <label className={LABEL_CLS}>Estado</label>
              <select value={form.estado} onChange={(e) => setForm({...form, estado: e.target.value})} className={INPUT_CLS}>
                <option value="activo">Activo</option>
                <option value="retirado">Retirado</option>
                <option value="graduado">Graduado</option>
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">Cancelar</button>
            <button type="submit" className="px-6 py-2.5 text-sm bg-brand-dark text-white rounded-xl hover:bg-brand-dark/90 font-medium shadow-sm transition-all hover:shadow-md">{editando ? 'Actualizar' : 'Crear'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal Integrante */}
      <Modal isOpen={modalIntegrante} onClose={() => setModalIntegrante(false)} title={`Agregar Integrante a ${empSeleccionado?.nombre}`} size="xl">
        <form onSubmit={agregarIntegrante} className="space-y-5">
          <p className="text-xs text-brand-dark/60 bg-brand-cyan/5 border border-brand-cyan/10 p-3 rounded-xl">Ingresa los datos del nuevo integrante. Si el correo ya existe, se vinculará al usuario existente.</p>

          <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-widest flex items-center gap-1.5"><Users size={12} /> Datos Personales</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>Nombres *</label>
              <input type="text" value={formIntegrante.nombre} onChange={(e) => setIntField('nombre', e.target.value)} required className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Apellidos *</label>
              <input type="text" value={formIntegrante.apellido} onChange={(e) => setIntField('apellido', e.target.value)} required className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>DNI</label>
              <input type="text" value={formIntegrante.dni} onChange={(e) => setIntField('dni', e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Edad</label>
              <input type="number" value={formIntegrante.edad} onChange={(e) => setIntField('edad', e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Fecha de Nacimiento</label>
              <input type="date" value={formIntegrante.fecha_nacimiento} onChange={(e) => setIntField('fecha_nacimiento', e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Género</label>
              <select value={formIntegrante.genero} onChange={(e) => setIntField('genero', e.target.value)} className={INPUT_CLS}>
                <option value="">Seleccionar</option>
                <option value="masculino">Hombre</option>
                <option value="femenino">Mujer</option>
              </select>
            </div>
          </div>

          <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-widest flex items-center gap-1.5 pt-2"><span className="text-brand-cyan">●</span> Contacto y Ubicación</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>Correo *</label>
              <input type="email" value={formIntegrante.email} onChange={(e) => setIntField('email', e.target.value)} required className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Celular</label>
              <input type="text" value={formIntegrante.telefono} onChange={(e) => setIntField('telefono', e.target.value)} className={INPUT_CLS} />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL_CLS}>Dirección</label>
              <input type="text" value={formIntegrante.direccion} onChange={(e) => setIntField('direccion', e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Departamento</label>
              <select
                value={formIntegrante.departamento}
                onChange={(e) => setFormIntegrante(prev => ({
                  ...prev,
                  departamento: e.target.value,
                  provincia: '',
                  distrito: ''
                }))}
                className={INPUT_CLS}
              >
                <option value="">Seleccionar departamento</option>
                {UBIGEO_PERU.map(dep => (
                  <option key={dep.nombre} value={dep.nombre}>{dep.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Provincia</label>
              <select
                value={formIntegrante.provincia}
                onChange={(e) => setFormIntegrante(prev => ({
                  ...prev,
                  provincia: e.target.value,
                  distrito: ''
                }))}
                className={INPUT_CLS}
                disabled={!formIntegrante.departamento}
              >
                <option value="">Seleccionar provincia</option>
                {provinciasDisponibles.map(prov => (
                  <option key={prov.nombre} value={prov.nombre}>{prov.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Distrito</label>
              <select
                value={formIntegrante.distrito}
                onChange={(e) => setIntField('distrito', e.target.value)}
                className={INPUT_CLS}
                disabled={!formIntegrante.provincia}
              >
                <option value="">Seleccionar distrito</option>
                {distritosDisponibles.map(dist => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>LinkedIn</label>
              <input type="text" value={formIntegrante.linkedin} onChange={(e) => setIntField('linkedin', e.target.value)} placeholder="https://linkedin.com/in/..." className={INPUT_CLS} />
            </div>
          </div>

          <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-widest flex items-center gap-1.5 pt-2"><span className="text-brand-purple">●</span> Rol en el Equipo</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>Área</label>
              <select value={formIntegrante.area} onChange={(e) => setIntField('area', e.target.value)} className={INPUT_CLS}>
                <option value="">Seleccionar área</option>
                {AREAS_OPCIONES.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Cargo</label>
              <input type="text" value={formIntegrante.cargo} onChange={(e) => setIntField('cargo', e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>% de Dedicación</label>
              <input type="number" value={formIntegrante.dedicacion} onChange={(e) => setIntField('dedicacion', e.target.value)} min="0" max="100" placeholder="0-100" className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Rol en el emprendimiento</label>
              <input type="text" value={formIntegrante.rol_emprendimiento} onChange={(e) => setIntField('rol_emprendimiento', e.target.value)} placeholder="Ej: Co-fundador, Desarrollador..." className={INPUT_CLS} />
            </div>
          </div>

          <div className="bg-brand-purple/5 border border-brand-purple/10 rounded-xl p-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formIntegrante.es_lider} onChange={(e) => setIntField('es_lider', e.target.checked)} className="rounded border-gray-300 text-brand-purple focus:ring-brand-purple" />
              <span className="text-sm font-semibold text-brand-dark">Es líder del emprendimiento</span>
            </label>
            <p className="text-xs text-gray-400 mt-1 ml-6">El líder puede agregar más miembros a su equipo</p>
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
            <button type="button" onClick={() => setModalIntegrante(false)} className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">Cancelar</button>
            <button type="submit" disabled={agregando} className="px-6 py-2.5 text-sm bg-brand-dark text-white rounded-xl hover:bg-brand-dark/90 disabled:opacity-50 flex items-center gap-2 font-medium shadow-sm transition-all hover:shadow-md">
              {agregando ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <UserPlus size={16} />}
              {agregando ? 'Agregando...' : 'Agregar Integrante'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Emprendimientos;
