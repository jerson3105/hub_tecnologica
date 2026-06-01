import { useState, useMemo } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { Plus, Edit, KeyRound, Users, UserCheck, UserX, Copy, Search, ChevronLeft, ChevronRight, FolderKanban, UserPlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { useInvalidate } from '../hooks/useQueryHooks';

const INPUT_CLS = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all text-sm';
const LABEL_CLS = 'block text-sm font-semibold text-brand-dark mb-1.5';
const FORM_ASIGNACION_VACIO = { emprendimiento_id: '', rol_emprendimiento: '', es_lider: false };

const Usuarios = () => {
  const [filtroRol, setFiltroRol] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [busquedaInput, setBusquedaInput] = useState('');
  const [pagina, setPagina] = useState(1);
  const limite = 15;
  const invalidate = useInvalidate();
  
  const usrParams = useMemo(() => {
    const params = { page: pagina, limit: limite };
    if (filtroRol) params.rol = filtroRol;
    if (busqueda) params.busqueda = busqueda;
    return params;
  }, [filtroRol, busqueda, pagina]);

  const { data, isLoading: cargando } = useQuery({
    queryKey: ['usuarios', usrParams],
    queryFn: () => api.get('/auth/usuarios', { params: usrParams }).then(r => r.data)
  });

  const usuarios = useMemo(() => data?.data || [], [data]);
  const totalPaginas = data?.pagination?.totalPages || 1;
  const totalUsuarios = data?.pagination?.total || 0;
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPassword, setModalPassword] = useState(null);
  const [usuarioAsignacionesId, setUsuarioAsignacionesId] = useState(null);
  const [editando, setEditando] = useState(null);
  const [passwordGenerado, setPasswordGenerado] = useState('');
  const [formAsignacion, setFormAsignacion] = useState({ ...FORM_ASIGNACION_VACIO });
  const [guardandoAsignacion, setGuardandoAsignacion] = useState(false);
  const [quitandoAsignacionId, setQuitandoAsignacionId] = useState(null);
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', telefono: '', rol: 'emprendedor',
    dni: '', edad: '', fecha_nacimiento: '', direccion: '', distrito: '',
    provincia: '', ciudad: '', linkedin: '', genero: '', area: '', cargo: '', dedicacion: ''
  });

  const formVacio = {
    nombre: '', apellido: '', email: '', telefono: '', rol: 'emprendedor',
    dni: '', edad: '', fecha_nacimiento: '', direccion: '', distrito: '',
    provincia: '', ciudad: '', linkedin: '', genero: '', area: '', cargo: '', dedicacion: ''
  };

  const usuarioAsignaciones = useMemo(
    () => usuarios.find((usuario) => usuario.id === usuarioAsignacionesId) || null,
    [usuarios, usuarioAsignacionesId]
  );

  const { data: emprendimientosActivos = [], isLoading: cargandoEmprendimientosActivos } = useQuery({
    queryKey: ['emprendimientos', 'activos-asignacion', usuarioAsignacionesId],
    enabled: !!usuarioAsignacionesId,
    queryFn: () => api.get('/emprendimientos').then(r => r.data.emprendimientos || [])
  });

  const emprendimientosDisponibles = useMemo(() => {
    const idsAsignados = new Set((usuarioAsignaciones?.integrantes || []).map((integrante) => integrante.emprendimiento?.id).filter(Boolean));
    return emprendimientosActivos.filter((emprendimiento) => emprendimiento.estado !== 'retirado' && !idsAsignados.has(emprendimiento.id));
  }, [emprendimientosActivos, usuarioAsignaciones]);

  const abrirModal = (usuario = null) => {
    if (usuario) {
      setEditando(usuario);
      setForm({
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        telefono: usuario.telefono || '',
        rol: usuario.rol,
        dni: usuario.dni || '',
        edad: usuario.edad || '',
        fecha_nacimiento: usuario.fecha_nacimiento || '',
        direccion: usuario.direccion || '',
        distrito: usuario.distrito || '',
        provincia: usuario.provincia || '',
        ciudad: usuario.ciudad || '',
        linkedin: usuario.linkedin || '',
        genero: usuario.genero || '',
        area: usuario.area || '',
        cargo: usuario.cargo || '',
        dedicacion: usuario.dedicacion || ''
      });
    } else {
      setEditando(null);
      setForm({ ...formVacio });
    }
    setPasswordGenerado('');
    setModalOpen(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await api.put(`/auth/usuarios/${editando.id}`, form);
        toast.success('Usuario actualizado');
        setModalOpen(false);
      } else {
        const res = await api.post('/auth/registrar', form);
        setPasswordGenerado(res.data.passwordTemporal);
        toast.success('Usuario creado');
      }
      invalidate('usuarios');
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al guardar');
    }
  };

  const resetearPassword = async (id) => {
    try {
      const res = await api.post(`/auth/usuarios/${id}/resetear-password`);
      setModalPassword(res.data.passwordTemporal);
      toast.success('Contraseña reseteada');
    } catch {
      toast.error('Error al resetear contraseña');
    }
  };

  const toggleActivo = async (usuario) => {
    try {
      await api.put(`/auth/usuarios/${usuario.id}`, { activo: !usuario.activo });
      toast.success(usuario.activo ? 'Usuario desactivado' : 'Usuario activado');
      invalidate('usuarios');
    } catch {
      toast.error('Error al actualizar estado');
    }
  };

  const copiarAlPortapapeles = (texto) => {
    navigator.clipboard.writeText(texto);
    toast.success('Copiado al portapapeles');
  };

  const abrirModalAsignaciones = (usuario) => {
    if (usuario.rol !== 'emprendedor') {
      return;
    }

    setUsuarioAsignacionesId(usuario.id);
    setFormAsignacion({ ...FORM_ASIGNACION_VACIO });
  };

  const cerrarModalAsignaciones = () => {
    setUsuarioAsignacionesId(null);
    setFormAsignacion({ ...FORM_ASIGNACION_VACIO });
    setQuitandoAsignacionId(null);
  };

  const asignarEmprendimiento = async (e) => {
    e.preventDefault();
    if (!usuarioAsignaciones) return;

    if (!formAsignacion.emprendimiento_id) {
      toast.error('Selecciona un emprendimiento para asignar');
      return;
    }

    setGuardandoAsignacion(true);
    try {
      await api.post(`/emprendimientos/${formAsignacion.emprendimiento_id}/integrantes`, {
        usuario_id: usuarioAsignaciones.id,
        rol_emprendimiento: formAsignacion.rol_emprendimiento,
        es_lider: formAsignacion.es_lider
      });
      toast.success('Emprendimiento asignado correctamente');
      setFormAsignacion({ ...FORM_ASIGNACION_VACIO });
      invalidate('usuarios', 'emprendimientos');
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al asignar emprendimiento');
    } finally {
      setGuardandoAsignacion(false);
    }
  };

  const quitarAsignacion = async (integrante) => {
    const emprendimientoId = integrante.emprendimiento?.id;
    if (!emprendimientoId) {
      toast.error('No se pudo identificar el emprendimiento de esta asignación');
      return;
    }

    if (!window.confirm(`¿Quitar esta asignación de ${integrante.emprendimiento?.nombre}?`)) {
      return;
    }

    setQuitandoAsignacionId(integrante.id);
    try {
      await api.delete(`/emprendimientos/${emprendimientoId}/integrantes/${integrante.id}`);
      toast.success('Asignación eliminada');
      invalidate('usuarios', 'emprendimientos');
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al quitar la asignación');
    } finally {
      setQuitandoAsignacionId(null);
    }
  };

  const handleBuscar = (e) => {
    e.preventDefault();
    setBusqueda(busquedaInput);
    setPagina(1);
  };

  const handleFiltroRol = (valor) => {
    setFiltroRol(valor);
    setPagina(1);
  };

  if (cargando) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
            <div className="p-2 bg-brand-cyan/10 rounded-xl"><Users size={22} className="text-brand-cyan" /></div>
            Usuarios
          </h1>
          <p className="text-gray-400 mt-1 ml-12">Gestión de usuarios del sistema · {totalUsuarios} registrados</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <form onSubmit={handleBuscar} className="relative">
            <input
              type="text"
              value={busquedaInput}
              onChange={(e) => setBusquedaInput(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all w-64"
            />
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          </form>
          <select value={filtroRol} onChange={(e) => handleFiltroRol(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all">
            <option value="">Todos los roles</option>
            <option value="admin">Administradores</option>
            <option value="emprendedor">Emprendedores</option>
          </select>
          <button onClick={() => abrirModal()} className="bg-brand-dark text-white px-5 py-2.5 rounded-xl hover:bg-brand-dark/90 flex items-center gap-2 text-sm font-medium whitespace-nowrap shadow-sm transition-all hover:shadow-md">
            <Plus size={18} /> Nuevo Usuario
          </button>
        </div>
      </div>

      {usuarios.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-brand-cyan/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={32} className="text-brand-cyan" />
          </div>
          <p className="text-gray-500 font-medium">No hay usuarios registrados</p>
          <p className="text-gray-400 text-sm mt-1">Crea el primer usuario para comenzar</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left py-3.5 px-4 font-semibold text-brand-dark/60 text-xs uppercase tracking-wider">Nombre</th>
                  <th className="text-left py-3.5 px-4 font-semibold text-brand-dark/60 text-xs uppercase tracking-wider">Email</th>
                  <th className="text-left py-3.5 px-4 font-semibold text-brand-dark/60 text-xs uppercase tracking-wider">Celular</th>
                  <th className="text-left py-3.5 px-4 font-semibold text-brand-dark/60 text-xs uppercase tracking-wider">Rol</th>
                  <th className="text-left py-3.5 px-4 font-semibold text-brand-dark/60 text-xs uppercase tracking-wider">Programa(s)</th>
                  <th className="text-left py-3.5 px-4 font-semibold text-brand-dark/60 text-xs uppercase tracking-wider">Emprendimiento(s)</th>
                  <th className="text-right py-3.5 px-4 font-semibold text-brand-dark/60 text-xs uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usr) => (
                  <tr key={usr.id} className="border-t border-gray-50 hover:bg-brand-cyan/5 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-brand-cyan/10 rounded-xl flex items-center justify-center text-brand-cyan font-bold text-xs shrink-0">
                          {usr.nombre?.[0]}{usr.apellido?.[0]}
                        </div>
                        <span className="font-medium text-brand-dark">{usr.apellido} {usr.nombre}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">{usr.email}</td>
                    <td className="py-3.5 px-4 text-gray-500">{usr.telefono || '-'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        usr.rol === 'admin' ? 'bg-brand-purple/15 text-brand-purple' : 'bg-brand-green/15 text-brand-green'
                      }`}>{usr.rol === 'admin' ? 'Administrador' : 'Emprendedor'}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {usr.integrantes?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {[...new Set(usr.integrantes.map(i => i.emprendimiento?.programa?.nombre).filter(Boolean))].map((prog, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-brand-purple/10 text-brand-purple rounded-md text-[10px] font-medium">{prog}</span>
                          ))}
                        </div>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      {usr.integrantes?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {usr.integrantes.map((int, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-brand-cyan/10 text-brand-cyan rounded-md text-[10px] font-medium">{int.emprendimiento?.nombre || '-'}</span>
                          ))}
                        </div>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        {usr.rol === 'emprendedor' && (
                          <button onClick={() => abrirModalAsignaciones(usr)} className="p-2 text-brand-cyan hover:bg-brand-cyan/10 rounded-xl transition-colors" title="Gestionar asignaciones">
                            <FolderKanban size={15} />
                          </button>
                        )}
                        <button onClick={() => abrirModal(usr)} className="p-2 text-brand-purple hover:bg-brand-purple/10 rounded-xl transition-colors" title="Editar"><Edit size={15} /></button>
                        <button onClick={() => resetearPassword(usr.id)} className="p-2 text-brand-dark hover:bg-brand-cyan/10 rounded-xl transition-colors" title="Resetear contraseña"><KeyRound size={15} /></button>
                        <button onClick={() => toggleActivo(usr)} className={`p-2 rounded-xl transition-colors ${usr.activo ? 'text-red-400 hover:bg-red-50' : 'text-brand-green hover:bg-brand-green/10'}`} title={usr.activo ? 'Desactivar' : 'Activar'}>
                          {usr.activo ? <UserX size={15} /> : <UserCheck size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Página {pagina} de {totalPaginas}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagina(p => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft size={14} /> Anterior
                </button>
                <button
                  onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Siguiente <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Crear/Editar */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editando ? 'Editar Usuario' : 'Nuevo Usuario'} size="lg">
        <form onSubmit={guardar} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          {passwordGenerado && (
            <div className="bg-brand-green/5 border border-brand-green/20 rounded-xl p-4">
              <p className="text-sm font-semibold text-brand-green mb-1">Usuario creado exitosamente</p>
              <p className="text-sm text-gray-600">Contraseña temporal:</p>
              <div className="flex items-center gap-2 mt-1.5">
                <code className="bg-white px-4 py-1.5 rounded-xl border border-gray-200 text-lg font-mono text-brand-dark">{passwordGenerado}</code>
                <button type="button" onClick={() => copiarAlPortapapeles(passwordGenerado)} className="p-2 text-brand-green hover:bg-brand-green/10 rounded-xl transition-colors">
                  <Copy size={16} />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Comparte esta contraseña con el usuario. Deberá cambiarla al iniciar sesión.</p>
            </div>
          )}

          <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider">Datos Personales</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>Apellidos *</label>
              <input type="text" value={form.apellido} onChange={(e) => setForm({...form, apellido: e.target.value})} required className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Nombres *</label>
              <input type="text" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} required className={INPUT_CLS} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={LABEL_CLS}>DNI</label>
              <input type="text" value={form.dni} onChange={(e) => setForm({...form, dni: e.target.value})} maxLength={20} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Edad</label>
              <input type="number" value={form.edad} onChange={(e) => setForm({...form, edad: e.target.value})} min={0} max={120} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Fecha de Nacimiento</label>
              <input type="date" value={form.fecha_nacimiento} onChange={(e) => setForm({...form, fecha_nacimiento: e.target.value})} className={INPUT_CLS} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>Género</label>
              <select value={form.genero} onChange={(e) => setForm({...form, genero: e.target.value})} className={INPUT_CLS}>
                <option value="">Seleccionar</option>
                <option value="masculino">Hombre</option>
                <option value="femenino">Mujer</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Celular</label>
              <input type="text" value={form.telefono} onChange={(e) => setForm({...form, telefono: e.target.value})} className={INPUT_CLS} />
            </div>
          </div>

          <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider pt-2">Contacto y Ubicación</p>
          <div>
            <label className={LABEL_CLS}>Correo *</label>
            <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Dirección</label>
            <input type="text" value={form.direccion} onChange={(e) => setForm({...form, direccion: e.target.value})} className={INPUT_CLS} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={LABEL_CLS}>Distrito</label>
              <input type="text" value={form.distrito} onChange={(e) => setForm({...form, distrito: e.target.value})} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Provincia</label>
              <input type="text" value={form.provincia} onChange={(e) => setForm({...form, provincia: e.target.value})} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Ciudad</label>
              <input type="text" value={form.ciudad} onChange={(e) => setForm({...form, ciudad: e.target.value})} className={INPUT_CLS} />
            </div>
          </div>
          <div>
            <label className={LABEL_CLS}>LinkedIn</label>
            <input type="url" value={form.linkedin} onChange={(e) => setForm({...form, linkedin: e.target.value})} placeholder="https://linkedin.com/in/..." className={INPUT_CLS} />
          </div>

          <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider pt-2">Rol en el Sistema y Equipo</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>Área</label>
              <input type="text" value={form.area} onChange={(e) => setForm({...form, area: e.target.value})} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Cargo</label>
              <input type="text" value={form.cargo} onChange={(e) => setForm({...form, cargo: e.target.value})} className={INPUT_CLS} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>% de Dedicación</label>
              <input type="number" value={form.dedicacion} onChange={(e) => setForm({...form, dedicacion: e.target.value})} min={0} max={100} placeholder="0-100" className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Rol en el Sistema</label>
              <select value={form.rol} onChange={(e) => setForm({...form, rol: e.target.value})} className={INPUT_CLS}>
                <option value="emprendedor">Emprendedor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">{passwordGenerado ? 'Cerrar' : 'Cancelar'}</button>
            {!passwordGenerado && (
              <button type="submit" className="px-6 py-2.5 text-sm bg-brand-dark text-white rounded-xl hover:bg-brand-dark/90 font-medium shadow-sm transition-all hover:shadow-md">{editando ? 'Actualizar' : 'Crear Usuario'}</button>
            )}
          </div>
        </form>
      </Modal>

      {/* Modal Password Reseteado */}
      <Modal isOpen={!!modalPassword} onClose={() => setModalPassword(null)} title="Contraseña Reseteada" size="sm">
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-500">La nueva contraseña temporal es:</p>
          <div className="flex items-center justify-center gap-2">
            <code className="bg-gray-50 px-5 py-2.5 rounded-xl border border-gray-200 text-xl font-mono text-brand-dark">{modalPassword}</code>
            <button onClick={() => copiarAlPortapapeles(modalPassword)} className="p-2 text-brand-cyan hover:bg-brand-cyan/10 rounded-xl transition-colors">
              <Copy size={18} />
            </button>
          </div>
          <p className="text-xs text-gray-400">Comparte esta contraseña con el usuario.</p>
          <button onClick={() => setModalPassword(null)} className="px-6 py-2.5 text-sm bg-brand-dark text-white rounded-xl hover:bg-brand-dark/90 font-medium shadow-sm transition-all hover:shadow-md">Cerrar</button>
        </div>
      </Modal>

      <Modal isOpen={!!usuarioAsignaciones} onClose={cerrarModalAsignaciones} title={`Asignaciones de ${usuarioAsignaciones?.apellido || ''} ${usuarioAsignaciones?.nombre || ''}`.trim()} size="lg">
        <div className="space-y-5">
          <div className="rounded-2xl border border-brand-cyan/15 bg-brand-cyan/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-cyan">Usuario emprendedor</p>
            <p className="mt-1 text-sm font-semibold text-brand-dark">{usuarioAsignaciones?.apellido} {usuarioAsignaciones?.nombre}</p>
            <p className="text-xs text-gray-500">{usuarioAsignaciones?.email}</p>
          </div>

          <form onSubmit={asignarEmprendimiento} className="space-y-4 rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-brand-dark">
              <UserPlus size={16} className="text-brand-cyan" />
              Asignar a un emprendimiento
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLS}>Emprendimiento</label>
                <select
                  value={formAsignacion.emprendimiento_id}
                  onChange={(e) => setFormAsignacion(prev => ({ ...prev, emprendimiento_id: e.target.value }))}
                  className={INPUT_CLS}
                  disabled={cargandoEmprendimientosActivos || guardandoAsignacion}
                >
                  <option value="">Seleccionar emprendimiento</option>
                  {emprendimientosDisponibles.map((emprendimiento) => (
                    <option key={emprendimiento.id} value={emprendimiento.id}>
                      {emprendimiento.nombre}{emprendimiento.programa?.nombre ? ` · ${emprendimiento.programa.nombre}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL_CLS}>Rol en el emprendimiento</label>
                <input
                  type="text"
                  value={formAsignacion.rol_emprendimiento}
                  onChange={(e) => setFormAsignacion(prev => ({ ...prev, rol_emprendimiento: e.target.value }))}
                  placeholder="Ej: CEO, Co-fundador, Marketing"
                  className={INPUT_CLS}
                />
              </div>
            </div>

            <div className="rounded-xl border border-brand-purple/10 bg-brand-purple/5 p-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formAsignacion.es_lider}
                  onChange={(e) => setFormAsignacion(prev => ({ ...prev, es_lider: e.target.checked }))}
                  className="rounded border-gray-300 text-brand-purple focus:ring-brand-purple"
                />
                <span className="text-sm font-semibold text-brand-dark">Marcar como líder del emprendimiento</span>
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={guardandoAsignacion || cargandoEmprendimientosActivos || emprendimientosDisponibles.length === 0}
                className="px-5 py-2.5 text-sm bg-brand-dark text-white rounded-xl hover:bg-brand-dark/90 disabled:opacity-50 font-medium shadow-sm transition-all hover:shadow-md"
              >
                {guardandoAsignacion ? 'Asignando...' : 'Asignar emprendimiento'}
              </button>
            </div>
          </form>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-brand-dark">
                <FolderKanban size={16} className="text-brand-purple" />
                Asignaciones actuales
              </div>
              <span className="text-xs text-gray-400">{usuarioAsignaciones?.integrantes?.length || 0} asignación(es)</span>
            </div>

            {usuarioAsignaciones?.integrantes?.length > 0 ? (
              <div className="space-y-2">
                {usuarioAsignaciones.integrantes.map((integrante) => (
                  <div key={integrante.id} className="rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-brand-dark">{integrante.emprendimiento?.nombre || 'Sin emprendimiento'}</p>
                        <p className="text-xs text-gray-400 mt-1">{integrante.emprendimiento?.programa?.nombre || 'Sin programa asociado'}</p>
                        {(integrante.rol_emprendimiento || integrante.es_lider) && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {integrante.rol_emprendimiento && (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-cyan/10 text-brand-cyan">{integrante.rol_emprendimiento}</span>
                            )}
                            {integrante.es_lider && (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-purple/10 text-brand-purple">Líder</span>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => quitarAsignacion(integrante)}
                        disabled={quitandoAsignacionId === integrante.id}
                        className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                        title="Quitar asignación"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center">
                <p className="text-sm font-medium text-gray-500">Este usuario todavía no está asignado a ningún emprendimiento</p>
                <p className="text-xs text-gray-400 mt-1">Usa el formulario superior para crear la primera asignación.</p>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Usuarios;
