import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Rocket, Users, ClipboardList, FileUp, CalendarDays, AlertCircle, UserPlus, X, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEmprendimientos, useInvalidate } from '../hooks/useQueryHooks';

const INPUT_CLS = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all text-sm';
const LABEL_CLS = 'block text-sm font-semibold text-brand-dark mb-1.5';

const formIntegranteVacio = {
  nombre: '', apellido: '', dni: '', edad: '', fecha_nacimiento: '', telefono: '',
  email: '', direccion: '', distrito: '', provincia: '', ciudad: '', linkedin: '',
  genero: '', area: '', cargo: '', dedicacion: '', rol_emprendimiento: ''
};

const MiEmprendimiento = () => {
  const { usuario } = useAuth();
  const { data: emprendimientos = [], isLoading: cargando } = useEmprendimientos();
  const invalidate = useInvalidate();
  const [modalIntegrante, setModalIntegrante] = useState(false);
  const [empSeleccionado, setEmpSeleccionado] = useState(null);
  const [formIntegrante, setFormIntegrante] = useState({ ...formIntegranteVacio });
  const [agregando, setAgregando] = useState(false);

  const esLiderDe = (emp) => {
    return emp.integrantes?.some(int => int.usuario_id === usuario?.id && int.es_lider);
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
      await api.post(`/emprendimientos/${empSeleccionado.id}/integrantes`, formIntegrante);
      toast.success('Integrante agregado exitosamente');
      setModalIntegrante(false);
      invalidate('emprendimientos');
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al agregar integrante');
    } finally {
      setAgregando(false);
    }
  };

  const setField = (field, value) => {
    setFormIntegrante(prev => ({ ...prev, [field]: value }));
  };

  const eliminarIntegrante = async (empId, integranteId) => {
    if (!confirm('¿Eliminar este integrante del equipo?')) return;
    try {
      await api.delete(`/emprendimientos/${empId}/integrantes/${integranteId}`);
      toast.success('Integrante eliminado');
      invalidate('emprendimientos');
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al eliminar integrante');
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
        <p className="text-gray-400">Aún no has sido asignado a ningún emprendimiento. Contacta al equipo técnico.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
        <div className="p-2 bg-brand-purple/10 rounded-xl"><Rocket size={22} className="text-brand-purple" /></div>
        Mi Emprendimiento
      </h1>

      {emprendimientos.map((emp) => {
        const soyLider = esLiderDe(emp);

        return (
          <div key={emp.id} className="space-y-4">
            {/* Main Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-brand-dark via-brand-purple to-brand-cyan"></div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-brand-dark flex items-center gap-2">
                      <Rocket size={22} className="text-brand-purple" /> {emp.nombre}
                    </h2>
                    <p className="text-gray-400 mt-1 ml-8">{emp.programa?.nombre} {emp.sector ? `· ${emp.sector}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {soyLider && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-600 flex items-center gap-1">
                        <Crown size={11} /> Líder
                      </span>
                    )}
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 ${
                      emp.estado === 'activo' ? 'bg-brand-green/15 text-brand-green' :
                      emp.estado === 'graduado' ? 'bg-brand-cyan/15 text-brand-dark' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        emp.estado === 'activo' ? 'bg-brand-green' :
                        emp.estado === 'graduado' ? 'bg-brand-cyan' :
                        'bg-gray-400'
                      }`}></span>
                      {emp.estado}
                    </span>
                  </div>
                </div>
                {emp.descripcion && <p className="text-gray-600 mb-5 leading-relaxed text-sm">{emp.descripcion}</p>}

                {/* Integrantes */}
                <div className="border-t border-gray-100 pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-brand-dark/60 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <Users size={14} /> Equipo
                    </h3>
                    {soyLider && (
                      <button onClick={() => abrirModalIntegrante(emp)} className="px-3 py-1.5 text-sm text-brand-green hover:bg-brand-green/10 rounded-xl flex items-center gap-1 border border-brand-green/20 font-medium transition-colors">
                        <UserPlus size={14} /> Agregar Integrante
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {emp.integrantes?.map((int) => (
                      <div key={int.id} className="flex items-center gap-2 bg-brand-cyan/5 border border-brand-cyan/10 px-3 py-2 rounded-xl text-sm group hover:bg-brand-cyan/10 transition-colors">
                        <div className="w-7 h-7 bg-brand-cyan/15 rounded-lg flex items-center justify-center text-xs font-bold text-brand-cyan">
                          {int.usuario?.nombre?.[0]}
                        </div>
                        {int.es_lider && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded-md text-[10px] font-semibold">Líder</span>}
                        <span className="text-brand-dark font-medium">{int.usuario?.nombre} {int.usuario?.apellido}</span>
                        {int.rol_emprendimiento && <span className="text-gray-400 text-xs">({int.rol_emprendimiento})</span>}
                        {soyLider && int.usuario_id !== usuario?.id && (
                          <button onClick={() => eliminarIntegrante(emp.id, int.id)} className="text-gray-300 hover:text-red-500 ml-1 transition-colors" title="Eliminar integrante">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    {(!emp.integrantes || emp.integrantes.length === 0) && (
                      <p className="text-sm text-gray-300">Sin integrantes asignados</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link to={`/emprendimientos/${emp.id}`} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-brand-purple/20 transition-all text-center group shadow-sm">
                <div className="w-12 h-12 bg-brand-purple/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-brand-purple/15 transition-colors">
                  <ClipboardList size={22} className="text-brand-purple" />
                </div>
                <p className="font-semibold text-brand-dark">Ver Seguimiento</p>
                <p className="text-xs text-gray-400 mt-1">Historial de avances</p>
              </Link>
              <Link to="/mis-archivos" className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-brand-green/20 transition-all text-center group shadow-sm">
                <div className="w-12 h-12 bg-brand-green/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-brand-green/15 transition-colors">
                  <FileUp size={22} className="text-brand-green" />
                </div>
                <p className="font-semibold text-brand-dark">Mis Archivos</p>
                <p className="text-xs text-gray-400 mt-1">Documentos y entregables</p>
              </Link>
              <Link to="/sesiones" className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-brand-cyan/20 transition-all text-center group shadow-sm">
                <div className="w-12 h-12 bg-brand-cyan/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-brand-cyan/15 transition-colors">
                  <CalendarDays size={22} className="text-brand-cyan" />
                </div>
                <p className="font-semibold text-brand-dark">Sesiones</p>
                <p className="text-xs text-gray-400 mt-1">Grabaciones y talleres</p>
              </Link>
            </div>
          </div>
        );
      })}

      {/* Modal Agregar Integrante */}
      <Modal isOpen={modalIntegrante} onClose={() => setModalIntegrante(false)} title={`Agregar Integrante a ${empSeleccionado?.nombre}`} size="xl">
        <form onSubmit={agregarIntegrante} className="space-y-5">
          <p className="text-xs text-gray-500 bg-brand-cyan/5 border border-brand-cyan/10 p-3 rounded-xl">Ingresa los datos del nuevo integrante. Se creará una cuenta automáticamente.</p>

          <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider">Datos Personales</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>Nombres *</label>
              <input type="text" value={formIntegrante.nombre} onChange={(e) => setField('nombre', e.target.value)} required className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Apellidos *</label>
              <input type="text" value={formIntegrante.apellido} onChange={(e) => setField('apellido', e.target.value)} required className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>DNI</label>
              <input type="text" value={formIntegrante.dni} onChange={(e) => setField('dni', e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Edad</label>
              <input type="number" value={formIntegrante.edad} onChange={(e) => setField('edad', e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Fecha de Nacimiento</label>
              <input type="date" value={formIntegrante.fecha_nacimiento} onChange={(e) => setField('fecha_nacimiento', e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Género</label>
              <select value={formIntegrante.genero} onChange={(e) => setField('genero', e.target.value)} className={INPUT_CLS}>
                <option value="">Seleccionar</option>
                <option value="masculino">Hombre</option>
                <option value="femenino">Mujer</option>
              </select>
            </div>
          </div>

          <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider pt-2">Contacto y Ubicación</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>Correo *</label>
              <input type="email" value={formIntegrante.email} onChange={(e) => setField('email', e.target.value)} required className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Celular</label>
              <input type="text" value={formIntegrante.telefono} onChange={(e) => setField('telefono', e.target.value)} className={INPUT_CLS} />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL_CLS}>Dirección</label>
              <input type="text" value={formIntegrante.direccion} onChange={(e) => setField('direccion', e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Distrito</label>
              <input type="text" value={formIntegrante.distrito} onChange={(e) => setField('distrito', e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Provincia</label>
              <input type="text" value={formIntegrante.provincia} onChange={(e) => setField('provincia', e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Ciudad</label>
              <input type="text" value={formIntegrante.ciudad} onChange={(e) => setField('ciudad', e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>LinkedIn</label>
              <input type="text" value={formIntegrante.linkedin} onChange={(e) => setField('linkedin', e.target.value)} placeholder="https://linkedin.com/in/..." className={INPUT_CLS} />
            </div>
          </div>

          <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider pt-2">Rol en el Equipo</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>Área</label>
              <input type="text" value={formIntegrante.area} onChange={(e) => setField('area', e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Cargo</label>
              <input type="text" value={formIntegrante.cargo} onChange={(e) => setField('cargo', e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>% de Dedicación</label>
              <input type="number" value={formIntegrante.dedicacion} onChange={(e) => setField('dedicacion', e.target.value)} min="0" max="100" placeholder="0-100" className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Rol en el emprendimiento</label>
              <input type="text" value={formIntegrante.rol_emprendimiento} onChange={(e) => setField('rol_emprendimiento', e.target.value)} placeholder="Ej: Co-fundador, Desarrollador..." className={INPUT_CLS} />
            </div>
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

export default MiEmprendimiento;
