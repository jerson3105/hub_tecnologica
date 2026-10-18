import { useState, useMemo } from 'react';
import api from '../services/api';
import Modal, { ModalPie } from '../components/Modal';
import { Plus, Edit, KeyRound, Users, UserCheck, UserX, Copy, Search, ChevronLeft, ChevronRight, FolderKanban, UserPlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useInvalidate } from '../hooks/useQueryHooks';
import IntegranteFields from '../components/IntegranteFields';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { Field, Input, Select } from '../components/ui/Field';
import { FILTRO_CLS } from '../components/ui/estilos';
import { DATOS_INTEGRANTE_VACIOS } from '../constants/integrantes';
import { ROLES_USUARIO, estadoDe } from '../constants/estados';

const FORM_ASIGNACION_VACIO = { emprendimiento_id: '', rol_emprendimiento: '', es_lider: false };
const FORM_USUARIO_VACIO = { ...DATOS_INTEGRANTE_VACIOS, rol: 'emprendedor' };

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
    queryFn: () => api.get('/auth/usuarios', { params: usrParams }).then(r => r.data),
    // Mantiene la tabla y el buscador visibles al paginar o buscar (antes se reemplazaba toda la página)
    placeholderData: keepPreviousData
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
  const [guardandoUsuario, setGuardandoUsuario] = useState(false);
  const [form, setForm] = useState({ ...FORM_USUARIO_VACIO });

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
    if ((usuarioAsignaciones?.integrantes?.length || 0) > 0) {
      return [];
    }

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
      setForm({ ...FORM_USUARIO_VACIO });
    }
    setPasswordGenerado('');
    setModalOpen(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setGuardandoUsuario(true);
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
    } finally {
      setGuardandoUsuario(false);
    }
  };

  const resetearPassword = async (usuario) => {
    if (!window.confirm(`¿Generar una nueva contraseña temporal para ${usuario.nombre} ${usuario.apellido}? La actual dejará de funcionar.`)) return;
    try {
      const res = await api.post(`/auth/usuarios/${usuario.id}/resetear-password`);
      setModalPassword(res.data.passwordTemporal);
      toast.success('Contraseña reseteada');
    } catch {
      toast.error('Error al resetear contraseña');
    }
  };

  const toggleActivo = async (usuario) => {
    if (usuario.activo && !window.confirm(`¿Desactivar a ${usuario.nombre} ${usuario.apellido}? No podrá iniciar sesión.`)) return;
    try {
      await api.put(`/auth/usuarios/${usuario.id}`, { activo: !usuario.activo });
      toast.success(usuario.activo ? 'Usuario desactivado' : 'Usuario activado');
      invalidate('usuarios');
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al actualizar estado');
    }
  };

  const copiarAlPortapapeles = async (texto) => {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success('Copiado al portapapeles');
    } catch {
      toast.error('No se pudo copiar. Cópialo manualmente.');
    }
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
    return <div className="flex items-center justify-center h-64" role="status" aria-label="Cargando"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div></div>;
  }

  const hayFiltros = !!(busqueda || filtroRol);
  const limpiarFiltros = () => { setBusqueda(''); setBusquedaInput(''); setFiltroRol(''); setPagina(1); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
            <div className="p-2 bg-brand-cyan/10 rounded-xl"><Users size={22} className="text-brand-cyan-ink" aria-hidden="true" /></div>
            Usuarios
          </h1>
          <p className="text-gray-500 mt-1 sm:ml-12">
            Gestión de usuarios del sistema · {totalUsuarios} {hayFiltros ? 'encontrados' : 'registrados'}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <form onSubmit={handleBuscar} className="relative w-full sm:w-64" role="search">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" aria-hidden="true" />
            <Input
              type="search"
              aria-label="Buscar usuarios por nombre o email"
              value={busquedaInput}
              onChange={(e) => setBusquedaInput(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="pl-10"
            />
          </form>
          <select aria-label="Filtrar por rol" value={filtroRol} onChange={(e) => handleFiltroRol(e.target.value)} className={FILTRO_CLS}>
            <option value="">Todos los roles</option>
            <option value="admin">Administradores</option>
            <option value="emprendedor">Emprendedores</option>
          </select>
          <Button icono={Plus} onClick={() => abrirModal()}>Nuevo Usuario</Button>
        </div>
      </div>

      {usuarios.length === 0 ? (
        <EmptyState
          icono={Users}
          titulo={hayFiltros ? 'Ningún usuario coincide con los filtros' : 'No hay usuarios registrados'}
          descripcion={hayFiltros ? 'Prueba con otra búsqueda o quita los filtros.' : 'Crea el primer usuario para comenzar'}
          accion={hayFiltros
            ? <Button variante="secondary" onClick={limpiarFiltros}>Limpiar filtros</Button>
            : <Button icono={Plus} onClick={() => abrirModal()}>Nuevo Usuario</Button>}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Usuarios del sistema</caption>
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th scope="col" className="eyebrow text-left py-3.5 px-4">Nombre</th>
                  <th scope="col" className="eyebrow text-left py-3.5 px-4 hidden sm:table-cell">Email</th>
                  <th scope="col" className="eyebrow text-left py-3.5 px-4 hidden lg:table-cell">Celular</th>
                  <th scope="col" className="eyebrow text-left py-3.5 px-4 hidden md:table-cell">Rol</th>
                  <th scope="col" className="eyebrow text-left py-3.5 px-4 hidden xl:table-cell">Programa(s)</th>
                  <th scope="col" className="eyebrow text-left py-3.5 px-4 hidden md:table-cell">Emprendimiento(s)</th>
                  <th scope="col" className="eyebrow text-right py-3.5 px-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usr) => {
                  const nombre = `${usr.nombre} ${usr.apellido}`;
                  const rol = estadoDe(ROLES_USUARIO, usr.rol);
                  return (
                    <tr key={usr.id} className="border-t border-gray-50 hover:bg-brand-cyan/5 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-brand-cyan/10 rounded-xl flex items-center justify-center text-brand-cyan-ink font-bold text-xs shrink-0" aria-hidden="true">
                            {usr.nombre?.[0]}{usr.apellido?.[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-medium text-brand-dark">{usr.apellido} {usr.nombre}</span>
                              {!usr.activo && <Badge>Inactivo</Badge>}
                            </div>
                            {/* En pantallas pequeñas las columnas ocultas se resumen aquí */}
                            <p className="text-xs text-gray-500 sm:hidden break-all">{usr.email}</p>
                            <p className="text-xs text-gray-500 md:hidden">{rol.label}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 hidden sm:table-cell break-all">{usr.email}</td>
                      <td className="py-3.5 px-4 text-gray-600 hidden lg:table-cell">{usr.telefono || '-'}</td>
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <Badge tono={rol.tono}>{rol.label}</Badge>
                      </td>
                      <td className="py-3.5 px-4 hidden xl:table-cell">
                        {usr.integrantes?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {[...new Set(usr.integrantes.map(i => i.emprendimiento?.programa?.nombre).filter(Boolean))].map((prog) => (
                              <Badge key={prog} tono="purple" forma="tag">{prog}</Badge>
                            ))}
                          </div>
                        ) : <span className="text-gray-500">-</span>}
                      </td>
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        {usr.integrantes?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {usr.integrantes.map((int) => (
                              <Badge key={int.id} tono="cyan" forma="tag">{int.emprendimiento?.nombre || '-'}</Badge>
                            ))}
                          </div>
                        ) : <span className="text-gray-500">-</span>}
                      </td>
                      <td className="py-2 px-2 sm:px-4 text-right">
                        <div className="flex justify-end flex-wrap lg:flex-nowrap gap-0.5">
                          {usr.rol === 'emprendedor' && (
                            <IconButton label={`Gestionar asignaciones de ${nombre}`} icono={FolderKanban} tamanioIcono={15} tono="cyan" onClick={() => abrirModalAsignaciones(usr)} />
                          )}
                          <IconButton label={`Editar a ${nombre}`} icono={Edit} tamanioIcono={15} tono="purple" onClick={() => abrirModal(usr)} />
                          <IconButton label={`Resetear contraseña de ${nombre}`} icono={KeyRound} tamanioIcono={15} tono="brand" onClick={() => resetearPassword(usr)} />
                          <IconButton
                            label={`${usr.activo ? 'Desactivar' : 'Activar'} a ${nombre}`}
                            icono={usr.activo ? UserX : UserCheck}
                            tamanioIcono={15}
                            tono={usr.activo ? 'danger' : 'success'}
                            onClick={() => toggleActivo(usr)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Paginación */}
          {totalPaginas > 1 && (
            <nav className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t border-gray-100" aria-label="Paginación de usuarios">
              <p className="text-sm text-gray-600" aria-live="polite">
                Página {pagina} de {totalPaginas}
              </p>
              <div className="flex gap-2">
                <Button variante="secondary" tamanio="sm" icono={ChevronLeft} onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}>
                  Anterior
                </Button>
                <Button variante="secondary" tamanio="sm" onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}>
                  Siguiente <ChevronRight size={14} aria-hidden="true" />
                </Button>
              </div>
            </nav>
          )}
        </div>
      )}

      {/* Modal Crear/Editar */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editando ? 'Editar Usuario' : 'Nuevo Usuario'} size="lg">
        <form onSubmit={guardar} className="space-y-6">
          {passwordGenerado && (
            <div className="bg-brand-green/5 border border-brand-green/20 rounded-xl p-4" role="status">
              <p className="text-sm font-semibold text-brand-green-ink mb-1">Usuario creado exitosamente</p>
              <p className="text-sm text-gray-600">Contraseña temporal:</p>
              <div className="flex items-center gap-2 mt-1.5">
                <code className="bg-white px-4 py-1.5 rounded-xl border border-gray-200 text-lg font-mono text-brand-dark">{passwordGenerado}</code>
                <IconButton label="Copiar contraseña" icono={Copy} tono="success" onClick={() => copiarAlPortapapeles(passwordGenerado)} />
              </div>
              <p className="text-xs text-gray-500 mt-2">Comparte esta contraseña con el usuario por un canal seguro. Puede cambiarla desde Mi Perfil.</p>
            </div>
          )}

          <IntegranteFields valores={form} onCambio={(campo, valor) => setForm(prev => ({ ...prev, [campo]: valor }))} />

          <fieldset>
            <legend className="eyebrow mb-3">Rol en el sistema</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Rol en el sistema">
                <Select value={form.rol} onChange={(e) => setForm(prev => ({ ...prev, rol: e.target.value }))}>
                  {Object.entries(ROLES_USUARIO).map(([valor, { label }]) => <option key={valor} value={valor}>{label}</option>)}
                </Select>
              </Field>
            </div>
          </fieldset>

          <ModalPie>
            <Button variante="ghost" onClick={() => setModalOpen(false)}>{passwordGenerado ? 'Cerrar' : 'Cancelar'}</Button>
            {!passwordGenerado && (
              <Button type="submit" cargando={guardandoUsuario}>{editando ? 'Actualizar' : 'Crear Usuario'}</Button>
            )}
          </ModalPie>
        </form>
      </Modal>

      {/* Modal Password Reseteado */}
      <Modal isOpen={!!modalPassword} onClose={() => setModalPassword(null)} title="Contraseña Reseteada" size="sm">
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600">La nueva contraseña temporal es:</p>
          <div className="flex items-center justify-center gap-2">
            <code className="bg-gray-50 px-5 py-2.5 rounded-xl border border-gray-200 text-xl font-mono text-brand-dark">{modalPassword}</code>
            <IconButton label="Copiar contraseña" icono={Copy} tamanioIcono={18} tono="cyan" onClick={() => copiarAlPortapapeles(modalPassword)} />
          </div>
          <p className="text-xs text-gray-500">Comparte esta contraseña con el usuario por un canal seguro.</p>
          <Button onClick={() => setModalPassword(null)}>Cerrar</Button>
        </div>
      </Modal>

      <Modal isOpen={!!usuarioAsignaciones} onClose={cerrarModalAsignaciones} title={`Asignaciones de ${usuarioAsignaciones?.apellido || ''} ${usuarioAsignaciones?.nombre || ''}`.trim()} size="lg">
        <div className="space-y-5">
          <div className="rounded-2xl border border-brand-cyan/15 bg-brand-cyan/5 p-4">
            <p className="eyebrow">Usuario emprendedor</p>
            <p className="mt-1 text-sm font-semibold text-brand-dark">{usuarioAsignaciones?.apellido} {usuarioAsignaciones?.nombre}</p>
            <p className="text-xs text-gray-600 break-all">{usuarioAsignaciones?.email}</p>
          </div>

          <form onSubmit={asignarEmprendimiento} className="space-y-4 rounded-2xl border border-gray-100 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-dark">
              <UserPlus size={16} className="text-brand-cyan-ink" aria-hidden="true" />
              Asignar a un emprendimiento
            </h3>

            {(usuarioAsignaciones?.integrantes?.length || 0) > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="note">
                Este usuario ya pertenece a un emprendimiento. Para moverlo a otro, primero elimina su asignación actual.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Emprendimiento">
                <Select
                  value={formAsignacion.emprendimiento_id}
                  onChange={(e) => setFormAsignacion(prev => ({ ...prev, emprendimiento_id: e.target.value }))}
                  disabled={cargandoEmprendimientosActivos || guardandoAsignacion || (usuarioAsignaciones?.integrantes?.length || 0) > 0}
                >
                  <option value="">Seleccionar emprendimiento</option>
                  {emprendimientosDisponibles.map((emprendimiento) => (
                    <option key={emprendimiento.id} value={emprendimiento.id}>
                      {emprendimiento.nombre}{emprendimiento.programa?.nombre ? ` · ${emprendimiento.programa.nombre}` : ''}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Rol en el emprendimiento">
                <Input
                  type="text"
                  value={formAsignacion.rol_emprendimiento}
                  onChange={(e) => setFormAsignacion(prev => ({ ...prev, rol_emprendimiento: e.target.value }))}
                  placeholder="Ej: CEO, Co-fundador, Marketing"
                  disabled={(usuarioAsignaciones?.integrantes?.length || 0) > 0}
                />
              </Field>
            </div>

            <div className="rounded-xl border border-brand-purple/10 bg-brand-purple/5 p-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formAsignacion.es_lider}
                  onChange={(e) => setFormAsignacion(prev => ({ ...prev, es_lider: e.target.checked }))}
                  className="size-4 accent-brand-purple"
                  disabled={(usuarioAsignaciones?.integrantes?.length || 0) > 0}
                />
                <span className="text-sm font-semibold text-brand-dark">Marcar como líder del emprendimiento</span>
              </label>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                cargando={guardandoAsignacion}
                disabled={cargandoEmprendimientosActivos || emprendimientosDisponibles.length === 0}
              >
                {guardandoAsignacion ? 'Asignando...' : 'Asignar emprendimiento'}
              </Button>
            </div>
          </form>

          <section className="space-y-3" aria-labelledby="asignaciones-actuales">
            <div className="flex items-center justify-between">
              <h3 id="asignaciones-actuales" className="flex items-center gap-2 text-sm font-semibold text-brand-dark">
                <FolderKanban size={16} className="text-brand-purple" aria-hidden="true" />
                Asignaciones actuales
              </h3>
              <span className="text-xs text-gray-500">{usuarioAsignaciones?.integrantes?.length || 0} asignación(es)</span>
            </div>

            {usuarioAsignaciones?.integrantes?.length > 0 ? (
              <ul className="space-y-2">
                {usuarioAsignaciones.integrantes.map((integrante) => (
                  <li key={integrante.id} className="rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-brand-dark">{integrante.emprendimiento?.nombre || 'Sin emprendimiento'}</p>
                        <p className="text-xs text-gray-500 mt-1">{integrante.emprendimiento?.programa?.nombre || 'Sin programa asociado'}</p>
                        {(integrante.rol_emprendimiento || integrante.es_lider) && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {integrante.rol_emprendimiento && <Badge tono="cyan">{integrante.rol_emprendimiento}</Badge>}
                            {integrante.es_lider && <Badge tono="purple">Líder</Badge>}
                          </div>
                        )}
                      </div>
                      <IconButton
                        label={`Quitar asignación de ${integrante.emprendimiento?.nombre || 'emprendimiento'}`}
                        icono={X}
                        tono="danger"
                        onClick={() => quitarAsignacion(integrante)}
                        cargando={quitandoAsignacionId === integrante.id}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center">
                <p className="text-sm font-medium text-gray-600">Este usuario todavía no está asignado a ningún emprendimiento</p>
                <p className="text-xs text-gray-500 mt-1">Usa el formulario superior para crear la primera asignación.</p>
              </div>
            )}
          </section>
        </div>
      </Modal>
    </div>
  );
};

export default Usuarios;
