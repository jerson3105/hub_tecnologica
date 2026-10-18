import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Rocket, Users, ClipboardList, FileUp, CalendarDays, AlertCircle, UserPlus, X, Crown, KeyRound, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEmprendimientos, useInvalidate } from '../hooks/useQueryHooks';
import IntegranteFields from '../components/IntegranteFields';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import Badge from '../components/ui/Badge';
import { Field, Input } from '../components/ui/Field';
import { DATOS_INTEGRANTE_VACIOS } from '../constants/integrantes';
import { ESTADOS_EMPRENDIMIENTO, estadoDe } from '../constants/estados';

const formIntegranteVacio = { ...DATOS_INTEGRANTE_VACIOS, rol_emprendimiento: '' };

const MiEmprendimiento = () => {
  const { usuario } = useAuth();
  const { data: emprendimientos = [], isLoading: cargando } = useEmprendimientos();
  const invalidate = useInvalidate();
  const [modalIntegrante, setModalIntegrante] = useState(false);
  const [empSeleccionado, setEmpSeleccionado] = useState(null);
  const [formIntegrante, setFormIntegrante] = useState({ ...formIntegranteVacio });
  const [agregando, setAgregando] = useState(false);
  const [modalPassword, setModalPassword] = useState(null);

  const esLiderDe = (emp) => {
    return emp.integrantes?.some(int => int.usuario_id === usuario?.id && int.es_lider);
  };

  const abrirModalIntegrante = (emp) => {
    setEmpSeleccionado(emp);
    setFormIntegrante({ ...formIntegranteVacio });
    setModalIntegrante(true);
  };

  const copiarAlPortapapeles = async (texto) => {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success('Contraseña copiada');
    } catch {
      toast.error('No se pudo copiar la contraseña');
    }
  };

  const agregarIntegrante = async (e) => {
    e.preventDefault();
    if (!formIntegrante.nombre || !formIntegrante.apellido || !formIntegrante.email) {
      toast.error('Nombre, apellido y correo son requeridos');
      return;
    }
    setAgregando(true);
    try {
      const { data } = await api.post(`/emprendimientos/${empSeleccionado.id}/integrantes`, formIntegrante);
      const nombreUsuario = [data.usuario?.nombre, data.usuario?.apellido].filter(Boolean).join(' ');

      if (data.passwordTemporal) {
        toast.success('Integrante agregado y cuenta creada');
        setModalPassword({
          titulo: 'Cuenta creada',
          descripcion: `Comparte esta contraseña temporal con ${nombreUsuario || 'el integrante'}.`,
          password: data.passwordTemporal
        });
      } else if (data.usuarioCreado === false) {
        toast.success('Integrante agregado. Se vinculó una cuenta existente');
      } else {
        toast.success('Integrante agregado exitosamente');
      }

      setModalIntegrante(false);
      setFormIntegrante({ ...formIntegranteVacio });
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

  const resetearPasswordIntegrante = async (empId, integrante) => {
    const nombreUsuario = [integrante.usuario?.nombre, integrante.usuario?.apellido].filter(Boolean).join(' ');
    if (!confirm(`¿Generar una nueva contraseña temporal para ${nombreUsuario || 'este integrante'}?`)) return;

    try {
      const { data } = await api.post(`/emprendimientos/${empId}/integrantes/${integrante.id}/resetear-password`);
      toast.success('Contraseña temporal generada');
      setModalPassword({
        titulo: 'Contraseña reseteada',
        descripcion: `Comparte esta nueva contraseña temporal con ${nombreUsuario || 'el integrante'}.`,
        password: data.passwordTemporal
      });
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al resetear la contraseña');
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
        <p className="text-gray-500">Aún no has sido asignado a ningún emprendimiento. Contacta al equipo técnico.</p>
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
                    <p className="text-gray-500 mt-1 sm:ml-8">{emp.programa?.nombre} {emp.sector ? `· ${emp.sector}` : ''}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {soyLider && <Badge tono="amber" icono={Crown}>Líder</Badge>}
                    <Badge tono={estadoDe(ESTADOS_EMPRENDIMIENTO, emp.estado).tono} punto>
                      {estadoDe(ESTADOS_EMPRENDIMIENTO, emp.estado).label}
                    </Badge>
                  </div>
                </div>
                {emp.descripcion && <p className="text-gray-600 mb-5 leading-relaxed text-sm">{emp.descripcion}</p>}

                {/* Integrantes */}
                <div className="border-t border-gray-100 pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="eyebrow text-sm flex items-center gap-1.5">
                      <Users size={14} /> Equipo
                    </h3>
                    {soyLider && (
                      <Button variante="secondary" tamanio="sm" icono={UserPlus} onClick={() => abrirModalIntegrante(emp)}>
                        Agregar Integrante
                      </Button>
                    )}
                  </div>
                  <ul className="flex flex-wrap gap-2">
                    {emp.integrantes?.map((int) => {
                      const nombre = `${int.usuario?.nombre || ''} ${int.usuario?.apellido || ''}`.trim();
                      return (
                        <li key={int.id} className="flex items-center gap-2 bg-brand-cyan/5 border border-brand-cyan/10 pl-3 pr-1 py-1.5 rounded-xl text-sm hover:bg-brand-cyan/10 transition-colors">
                          <div className="w-7 h-7 bg-brand-cyan/15 rounded-lg flex items-center justify-center text-xs font-bold text-brand-cyan-ink" aria-hidden="true">
                            {int.usuario?.nombre?.[0]}
                          </div>
                          {int.es_lider && <Badge tono="amber" forma="tag">Líder</Badge>}
                          <span className="text-brand-dark font-medium">{nombre}</span>
                          {int.rol_emprendimiento && <span className="text-gray-500 text-xs">({int.rol_emprendimiento})</span>}
                          {soyLider && int.usuario_id !== usuario?.id && (
                            <span className="flex items-center ml-1">
                              <IconButton label={`Generar contraseña temporal para ${nombre}`} icono={KeyRound} tamanioIcono={15} tono="cyan" onClick={() => resetearPasswordIntegrante(emp.id, int)} />
                              <IconButton label={`Quitar a ${nombre} del equipo`} icono={X} tamanioIcono={15} tono="danger" onClick={() => eliminarIntegrante(emp.id, int.id)} />
                            </span>
                          )}
                        </li>
                      );
                    })}
                    {(!emp.integrantes || emp.integrantes.length === 0) && (
                      <li className="text-sm text-gray-500">Sin integrantes asignados</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link to="/mi-seguimiento" className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-brand-purple/20 transition-all text-center group shadow-sm">
                <div className="w-12 h-12 bg-brand-purple/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-brand-purple/15 transition-colors">
                  <ClipboardList size={22} className="text-brand-purple" />
                </div>
                <p className="font-semibold text-brand-dark">Ver Seguimiento</p>
                <p className="text-xs text-gray-500 mt-1">Historial de avances</p>
              </Link>
              <Link to="/mis-archivos" className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-brand-green/20 transition-all text-center group shadow-sm">
                <div className="w-12 h-12 bg-brand-green/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-brand-green/15 transition-colors">
                  <FileUp size={22} className="text-brand-green-ink" />
                </div>
                <p className="font-semibold text-brand-dark">Mis Materiales</p>
                <p className="text-xs text-gray-500 mt-1">Enlaces y recursos compartidos</p>
              </Link>
              <Link to="/sesiones" className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-brand-cyan/20 transition-all text-center group shadow-sm">
                <div className="w-12 h-12 bg-brand-cyan/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-brand-cyan/15 transition-colors">
                  <CalendarDays size={22} className="text-brand-cyan-ink" />
                </div>
                <p className="font-semibold text-brand-dark">Sesiones</p>
                <p className="text-xs text-gray-500 mt-1">Grabaciones y talleres</p>
              </Link>
            </div>
          </div>
        );
      })}

      {/* Modal Agregar Integrante */}
      <Modal isOpen={modalIntegrante} onClose={() => setModalIntegrante(false)} title={`Agregar Integrante a ${empSeleccionado?.nombre || ''}`} size="xl">
        <form onSubmit={agregarIntegrante} className="space-y-6">
          <p className="text-sm text-gray-600 bg-brand-cyan/5 border border-brand-cyan/10 p-3 rounded-xl">Ingresa los datos del nuevo integrante: se creará su cuenta y verás una contraseña temporal para compartirle. Si la persona ya tiene una cuenta, pide al equipo técnico que la asigne a tu emprendimiento.</p>

          <IntegranteFields valores={formIntegrante} onCambio={setField} />

          <fieldset>
            <legend className="eyebrow mb-3">Rol en el equipo</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Rol en el emprendimiento">
                <Input type="text" value={formIntegrante.rol_emprendimiento} onChange={(e) => setField('rol_emprendimiento', e.target.value)} placeholder="Ej: Co-fundador, Desarrollador..." />
              </Field>
            </div>
          </fieldset>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-5 border-t border-gray-100">
            <Button variante="ghost" onClick={() => setModalIntegrante(false)}>Cancelar</Button>
            <Button type="submit" cargando={agregando} icono={UserPlus}>
              {agregando ? 'Agregando...' : 'Agregar Integrante'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!modalPassword} onClose={() => setModalPassword(null)} title={modalPassword?.titulo || 'Contraseña temporal'} size="sm">
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600">{modalPassword?.descripcion || 'La contraseña temporal es:'}</p>
          <div className="flex items-center justify-center gap-2">
            <code className="bg-gray-50 px-5 py-2.5 rounded-xl border border-gray-200 text-xl font-mono text-brand-dark">{modalPassword?.password}</code>
            <IconButton label="Copiar contraseña" icono={Copy} tamanioIcono={18} tono="cyan" onClick={() => copiarAlPortapapeles(modalPassword?.password || '')} />
          </div>
          <p className="text-xs text-gray-500">Esta contraseña sólo se muestra una vez desde esta vista.</p>
          <Button onClick={() => setModalPassword(null)}>Cerrar</Button>
        </div>
      </Modal>
    </div>
  );
};

export default MiEmprendimiento;
