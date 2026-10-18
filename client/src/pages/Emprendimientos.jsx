import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';
import IntegranteFields from '../components/IntegranteFields';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { Field, Input, Select, Textarea } from '../components/ui/Field';
import { clasesBoton, FILTRO_CLS } from '../components/ui/estilos';
import { Plus, Edit, Trash2, Eye, Rocket, UserPlus, X, Users, FolderKanban, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEmprendimientos, useProgramas, useInvalidate } from '../hooks/useQueryHooks';
import { DATOS_INTEGRANTE_VACIOS } from '../constants/integrantes';
import { ESTADOS_EMPRENDIMIENTO, estadoDe } from '../constants/estados';

const formIntegranteVacio = { ...DATOS_INTEGRANTE_VACIOS, rol_emprendimiento: '', es_lider: false };

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
  const [guardando, setGuardando] = useState(false);
  const [empSeleccionado, setEmpSeleccionado] = useState(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '', sector: '', programa_id: '', estado: 'activo' });
  const [formIntegrante, setFormIntegrante] = useState({ ...formIntegranteVacio });
  const [agregando, setAgregando] = useState(false);
  const [modoIntegrante, setModoIntegrante] = useState('existente');
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [cargandoUsuariosDisponibles, setCargandoUsuariosDisponibles] = useState(false);
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [usuarioSeleccionadoId, setUsuarioSeleccionadoId] = useState('');

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
    setGuardando(true);
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
    } finally {
      setGuardando(false);
    }
  };

  const retirar = async (emp) => {
    if (!confirm(`¿Marcar "${emp.nombre}" como retirado? Podrás cambiar su estado al editarlo.`)) return;
    try {
      await api.delete(`/emprendimientos/${emp.id}`);
      toast.success('Emprendimiento marcado como retirado');
      invalidate('emprendimientos');
    } catch {
      toast.error('No se pudo retirar el emprendimiento');
    }
  };

  const cerrarModalIntegrante = () => {
    setModalIntegrante(false);
    setEmpSeleccionado(null);
    setFormIntegrante({ ...formIntegranteVacio });
    setModoIntegrante('existente');
    setUsuariosDisponibles([]);
    setBusquedaUsuario('');
    setUsuarioSeleccionadoId('');
  };

  const cargarUsuariosDisponibles = async (emprendimientoId) => {
    setCargandoUsuariosDisponibles(true);
    try {
      const res = await api.get(`/emprendimientos/${emprendimientoId}/usuarios-disponibles`);
      const disponibles = res.data.usuarios || [];
      setUsuariosDisponibles(disponibles);
      if (disponibles.length === 0) {
        setModoIntegrante('nuevo');
      }
    } catch (error) {
      setUsuariosDisponibles([]);
      setModoIntegrante('nuevo');
      toast.error(error.response?.data?.mensaje || 'No se pudo cargar la lista de usuarios');
    } finally {
      setCargandoUsuariosDisponibles(false);
    }
  };

  const abrirModalIntegrante = async (emp) => {
    setEmpSeleccionado(emp);
    setFormIntegrante({ ...formIntegranteVacio });
    setModoIntegrante('existente');
    setUsuariosDisponibles([]);
    setBusquedaUsuario('');
    setUsuarioSeleccionadoId('');
    setModalIntegrante(true);
    await cargarUsuariosDisponibles(emp.id);
  };

  const agregarIntegrante = async (e) => {
    e.preventDefault();
    if (modoIntegrante === 'existente' && !usuarioSeleccionadoId) {
      toast.error('Selecciona un usuario emprendedor para asignarlo');
      return;
    }

    if (modoIntegrante === 'nuevo' && (!formIntegrante.nombre || !formIntegrante.apellido || !formIntegrante.email)) {
      toast.error('Nombre, apellido y correo son requeridos');
      return;
    }

    setAgregando(true);
    try {
      const payload = modoIntegrante === 'existente'
        ? {
            usuario_id: usuarioSeleccionadoId,
            rol_emprendimiento: formIntegrante.rol_emprendimiento,
            es_lider: formIntegrante.es_lider
          }
        : formIntegrante;

      await api.post(`/emprendimientos/${empSeleccionado.id}/integrantes`, payload);
      toast.success(modoIntegrante === 'existente' ? 'Usuario asignado exitosamente' : 'Integrante agregado exitosamente');
      cerrarModalIntegrante();
      invalidate('emprendimientos', 'usuarios');
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al agregar integrante');
    } finally {
      setAgregando(false);
    }
  };

  const setIntField = (field, value) => {
    setFormIntegrante(prev => ({ ...prev, [field]: value }));
  };

  const busquedaUsuarioNormalizada = busquedaUsuario.trim().toLowerCase();
  const usuariosDisponiblesFiltrados = usuariosDisponibles.filter((usuario) => {
    if (!busquedaUsuarioNormalizada) return true;

    const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`.toLowerCase();
    return nombreCompleto.includes(busquedaUsuarioNormalizada) || usuario.email.toLowerCase().includes(busquedaUsuarioNormalizada);
  });
  const usuarioSeleccionado = usuariosDisponibles.find((usuario) => String(usuario.id) === String(usuarioSeleccionadoId));

  const eliminarIntegrante = async (empId, integrante) => {
    if (!confirm(`¿Quitar a ${integrante.usuario?.nombre || 'este integrante'} del emprendimiento?`)) return;
    try {
      await api.delete(`/emprendimientos/${empId}/integrantes/${integrante.id}`);
      toast.success('Integrante eliminado');
      invalidate('emprendimientos');
    } catch {
      toast.error('Error al eliminar integrante');
    }
  };

  if (cargando) {
    return <div className="flex items-center justify-center h-64" role="status" aria-label="Cargando"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div></div>;
  }

  // Agrupar emprendimientos por programa cuando no hay filtro
  const emprendimientosAgrupados = !filtroPrograma
    ? programas.map(prog => ({
        programa: prog,
        items: emprendimientos.filter(emp => emp.programa_id === prog.id || emp.programa?.id === prog.id)
      })).filter(g => g.items.length > 0)
    : null;

  const renderEmprendimiento = (emp) => {
    const estado = estadoDe(ESTADOS_EMPRENDIMIENTO, emp.estado);
    return (
      <div key={emp.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:border-brand-cyan/20 transition-all duration-200">
        <div className="h-1 bg-gradient-to-r from-brand-green to-brand-cyan" aria-hidden="true"></div>
        <div className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center text-brand-green-ink font-bold text-lg shrink-0" aria-hidden="true">
                {emp.nombre?.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-brand-dark text-lg">{emp.nombre}</h3>
                  <Badge tono={estado.tono} punto>{estado.label}</Badge>
                </div>
                {filtroPrograma && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <FolderKanban size={12} className="text-brand-cyan-ink" aria-hidden="true" />
                    <span>{emp.programa?.nombre}</span>
                    {emp.sector && <><span aria-hidden="true">·</span><span>{emp.sector}</span></>}
                  </div>
                )}
                {!filtroPrograma && emp.sector && (
                  <p className="text-sm text-gray-500">{emp.sector}</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:ml-0">
              <Button variante="secondary" tamanio="sm" icono={UserPlus} onClick={() => abrirModalIntegrante(emp)}>
                Integrante
              </Button>
              <Link to={`/emprendimientos/${emp.id}`} className={clasesBoton({ variante: 'secondary', tamanio: 'sm' })}>
                <Eye size={14} aria-hidden="true" /> Ver
              </Link>
              <IconButton label={`Editar ${emp.nombre}`} icono={Edit} tamanioIcono={15} tono="purple" onClick={() => abrirModal(emp)} />
              {emp.estado !== 'retirado' && (
                <IconButton label={`Marcar ${emp.nombre} como retirado`} icono={Trash2} tamanioIcono={15} tono="danger" onClick={() => retirar(emp)} />
              )}
            </div>
          </div>
          {emp.descripcion && <p className="text-sm text-gray-600 mb-3 sm:ml-13">{emp.descripcion}</p>}
          {emp.integrantes?.length > 0 && (
            <div className="border-t border-gray-50 pt-3 sm:ml-13">
              <p className="eyebrow mb-2 flex items-center gap-1">
                <Users size={11} aria-hidden="true" /> Integrantes
              </p>
              <ul className="flex flex-wrap gap-2">
                {emp.integrantes.map((int) => (
                  <li key={int.id} className="flex items-center gap-1.5 bg-gray-50 hover:bg-brand-cyan/5 pl-3 pr-1 py-1 rounded-xl text-sm transition-colors">
                    {int.es_lider && <Badge tono="purple" forma="tag">Líder</Badge>}
                    <span className="text-brand-dark font-medium">{int.usuario?.nombre} {int.usuario?.apellido}</span>
                    {int.rol_emprendimiento && <span className="text-gray-500 text-xs">({int.rol_emprendimiento})</span>}
                    <button
                      type="button"
                      onClick={() => eliminarIntegrante(emp.id, int)}
                      aria-label={`Quitar a ${int.usuario?.nombre || 'integrante'} ${int.usuario?.apellido || ''} del emprendimiento`}
                      title="Quitar integrante"
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
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
            <div className="p-2 bg-brand-green/10 rounded-xl"><Rocket size={22} className="text-brand-green-ink" aria-hidden="true" /></div>
            Emprendimientos
          </h1>
          <p className="text-gray-500 mt-1 sm:ml-12">Gestión de emprendimientos e integrantes</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select aria-label="Filtrar por programa" value={filtroPrograma} onChange={(e) => setFiltroPrograma(e.target.value)} className={FILTRO_CLS}>
            <option value="">Todos los programas</option>
            {programas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <Button icono={Plus} onClick={() => abrirModal()}>Nuevo</Button>
        </div>
      </div>

      {emprendimientos.length === 0 ? (
        <EmptyState
          icono={Rocket}
          tono="green"
          titulo={filtroPrograma ? 'Este programa no tiene emprendimientos' : 'No hay emprendimientos registrados'}
          descripcion={filtroPrograma ? 'Elige otro programa o crea un emprendimiento nuevo.' : 'Crea tu primer emprendimiento para comenzar'}
          accion={<Button icono={Plus} onClick={() => abrirModal()}>Crear emprendimiento</Button>}
        />
      ) : emprendimientosAgrupados ? (
        // Vista agrupada por programa
        <div className="space-y-8">
          {emprendimientosAgrupados.map(grupo => (
            <section key={grupo.programa.id} aria-labelledby={`programa-${grupo.programa.id}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-brand-purple/10 flex items-center justify-center" aria-hidden="true">
                  <FolderKanban size={16} className="text-brand-purple" />
                </div>
                <div>
                  <h2 id={`programa-${grupo.programa.id}`} className="text-lg font-semibold text-brand-dark">{grupo.programa.nombre}</h2>
                  <p className="text-xs text-gray-500">{grupo.items.length} emprendimiento{grupo.items.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="space-y-4 pl-2 border-l-2 border-brand-purple/20">
                {grupo.items.map(renderEmprendimiento)}
              </div>
            </section>
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
          <Field label="Nombre" requerido>
            <Input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </Field>
          <Field label="Descripción">
            <Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={3} className="resize-none" />
          </Field>
          <Field label="Sector">
            <Input type="text" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} placeholder="Ej: Tecnología, Alimentos..." />
          </Field>
          <Field label="Programa" requerido>
            <Select value={form.programa_id} onChange={(e) => setForm({ ...form, programa_id: e.target.value })}>
              <option value="">Seleccionar programa</option>
              {programas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </Select>
          </Field>
          {editando && (
            <Field label="Estado">
              <Select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                {Object.entries(ESTADOS_EMPRENDIMIENTO).map(([valor, { label }]) => (
                  <option key={valor} value={valor}>{label}</option>
                ))}
              </Select>
            </Field>
          )}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-5 border-t border-gray-100">
            <Button variante="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" cargando={guardando}>{editando ? 'Actualizar' : 'Crear'}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Integrante */}
      <Modal isOpen={modalIntegrante} onClose={cerrarModalIntegrante} title={`Agregar Integrante a ${empSeleccionado?.nombre || ''}`} size="xl">
        <form onSubmit={agregarIntegrante} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1.5" role="radiogroup" aria-label="Forma de agregar el integrante">
            {[
              { valor: 'existente', texto: 'Asignar usuario existente' },
              { valor: 'nuevo', texto: 'Crear y asignar nuevo usuario' }
            ].map(op => (
              <button
                key={op.valor}
                type="button"
                role="radio"
                aria-checked={modoIntegrante === op.valor}
                onClick={() => setModoIntegrante(op.valor)}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                  modoIntegrante === op.valor ? 'bg-white text-brand-dark shadow-sm' : 'text-gray-600 hover:text-brand-dark'
                }`}
              >
                {op.texto}
              </button>
            ))}
          </div>

          {modoIntegrante === 'existente' ? (
            <div className="space-y-5">
              <p className="text-sm text-gray-600 bg-brand-cyan/5 border border-brand-cyan/10 p-3 rounded-xl">Selecciona un usuario emprendedor ya creado para vincularlo a este emprendimiento. Los administradores y los usuarios que ya pertenecen a otro proyecto no aparecen en esta lista.</p>

              <div>
                <label htmlFor="buscar-usuario-integrante" className="block text-sm font-semibold text-brand-dark mb-1.5">Buscar usuario</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" aria-hidden="true" />
                  <Input
                    id="buscar-usuario-integrante"
                    type="search"
                    value={busquedaUsuario}
                    onChange={(e) => setBusquedaUsuario(e.target.value)}
                    placeholder="Buscar por nombre o correo..."
                    className="pl-10"
                  />
                </div>
              </div>

              <fieldset>
                <legend className="block text-sm font-semibold text-brand-dark mb-1.5">Usuarios disponibles</legend>
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-gray-200 p-2" role="radiogroup" aria-label="Usuarios disponibles">
                  {cargandoUsuariosDisponibles ? (
                    <div className="flex items-center justify-center py-10" role="status" aria-label="Cargando usuarios">
                      <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-brand-cyan"></div>
                    </div>
                  ) : usuariosDisponiblesFiltrados.length > 0 ? (
                    usuariosDisponiblesFiltrados.map((usuario) => {
                      const seleccionado = String(usuario.id) === String(usuarioSeleccionadoId);
                      return (
                        <button
                          key={usuario.id}
                          type="button"
                          role="radio"
                          aria-checked={seleccionado}
                          onClick={() => setUsuarioSeleccionadoId(String(usuario.id))}
                          className={`w-full rounded-xl border px-4 py-3 text-left transition-all ${
                            seleccionado
                              ? 'border-brand-cyan-ink bg-brand-cyan/5 shadow-sm'
                              : 'border-gray-100 hover:border-brand-cyan/30 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium text-brand-dark">{usuario.nombre} {usuario.apellido}</p>
                              <p className="text-sm text-gray-500 break-all">{usuario.email}</p>
                              {(usuario.telefono || usuario.cargo) && (
                                <p className="mt-1 text-xs text-gray-500">
                                  {[usuario.telefono, usuario.cargo].filter(Boolean).join(' · ')}
                                </p>
                              )}
                            </div>
                            {seleccionado && <Badge tono="cyan">Seleccionado</Badge>}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-sm text-gray-500">
                      {usuariosDisponibles.length === 0 ? 'No hay usuarios emprendedores disponibles para este emprendimiento.' : 'No se encontraron usuarios con esa búsqueda.'}
                    </div>
                  )}
                </div>
              </fieldset>

              {usuarioSeleccionado && (
                <div className="rounded-xl border border-brand-cyan/15 bg-brand-cyan/5 px-4 py-3 text-sm text-brand-dark" aria-live="polite">
                  Se asignará a <span className="font-semibold">{usuarioSeleccionado.nombre} {usuarioSeleccionado.apellido}</span> usando su perfil actual.
                </div>
              )}
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 bg-brand-cyan/5 border border-brand-cyan/10 p-3 rounded-xl">Ingresa los datos del nuevo integrante. Si el correo ya existe y pertenece a un emprendedor sin equipo, se vinculará automáticamente.</p>
              <IntegranteFields valores={formIntegrante} onCambio={setIntField} requerido={modoIntegrante === 'nuevo'} />
            </>
          )}

          <fieldset className="space-y-4">
            <legend className="eyebrow mb-3">Rol en el emprendimiento</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Rol en el emprendimiento">
                <Input type="text" value={formIntegrante.rol_emprendimiento} onChange={(e) => setIntField('rol_emprendimiento', e.target.value)} placeholder="Ej: Co-fundador, Desarrollador..." />
              </Field>
            </div>
            <div className="bg-brand-purple/5 border border-brand-purple/10 rounded-xl p-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formIntegrante.es_lider} onChange={(e) => setIntField('es_lider', e.target.checked)} aria-describedby="ayuda-lider" className="size-4 accent-brand-purple" />
                <span className="text-sm font-semibold text-brand-dark">Es líder del emprendimiento</span>
              </label>
              <p id="ayuda-lider" className="text-xs text-gray-500 mt-1 ml-6">El líder puede agregar más miembros a su equipo</p>
            </div>
          </fieldset>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-5 border-t border-gray-100">
            <Button variante="ghost" onClick={cerrarModalIntegrante}>Cancelar</Button>
            <Button type="submit" cargando={agregando} icono={UserPlus}>
              {agregando ? 'Guardando...' : modoIntegrante === 'existente' ? 'Asignar Usuario' : 'Agregar Integrante'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Emprendimientos;
