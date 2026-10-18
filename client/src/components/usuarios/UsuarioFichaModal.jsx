import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, Linkedin, Pencil, KeyRound, UserX, UserCheck, UserMinus, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal, { ModalPie } from '../Modal';
import Button from '../ui/Button';
import ContrasenaTemporal from './ContrasenaTemporal';
import AsignarEmprendimiento from './AsignarEmprendimiento';
import { CHIP_CLS, FONDO_TONO, BOTON_SECUNDARIO_CLS, BOTON_PELIGRO_CLS } from '../ui/estilosSemanticos';
import { ROLES_USUARIO } from '../../constants/estados';
import { GENEROS } from '../../constants/integrantes';
import { formatFecha } from '../../utils/fechas';

const SUBTITULO_CLS = 'text-xs font-semibold uppercase tracking-wide text-muted-foreground';

// Datos personales que tiene el usuario, en el orden en que se leen
const datosDe = (u) => [
  ['DNI', u.dni],
  ['Edad', u.edad ? `${u.edad} años` : null],
  ['Nacimiento', u.fecha_nacimiento ? formatFecha(u.fecha_nacimiento, { day: 'numeric', month: 'long', year: 'numeric' }) : null],
  ['Género', GENEROS.find((g) => g.value === u.genero)?.label || u.genero],
  ['Ubicación', [u.distrito, u.provincia, u.ciudad].filter(Boolean).join(', ')],
  ['Dirección', u.direccion],
  ['Área', u.area],
  ['Cargo', u.cargo],
  ['Dedicación', u.dedicacion !== null && u.dedicacion !== undefined && u.dedicacion !== '' ? `${u.dedicacion} %` : null]
].filter(([, valor]) => valor);

// Ficha de un usuario: contacto, emprendimiento, datos y acceso. Desde aquí se edita, se
// restablece la contraseña, se desactiva y se asigna o quita de su equipo.
const UsuarioFichaModal = ({ usuario: u, esUnoMismo, onClose, onEditar, onCambio }) => {
  const [password, setPassword] = useState(null);
  const [ocupado, setOcupado] = useState(null);
  const nombre = `${u.nombre} ${u.apellido}`;
  const rol = ROLES_USUARIO[u.rol] || { label: u.rol };
  const datos = datosDe(u);
  const integrantes = u.integrantes || [];

  const restablecer = async () => {
    if (!window.confirm(`¿Generar una contraseña temporal nueva para ${nombre}? La actual dejará de funcionar.`)) return;
    setOcupado('password');
    try {
      const { data } = await api.post(`/auth/usuarios/${u.id}/resetear-password`);
      setPassword(data.passwordTemporal);
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'No se pudo restablecer la contraseña');
    } finally {
      setOcupado(null);
    }
  };

  const cambiarEstado = async () => {
    if (u.activo && !window.confirm(`¿Desactivar la cuenta de ${nombre}? No podrá iniciar sesión hasta que la reactives. Sus datos se conservan.`)) return;
    setOcupado('estado');
    try {
      await api.put(`/auth/usuarios/${u.id}`, { activo: !u.activo });
      toast.success(u.activo ? 'Cuenta desactivada' : 'Cuenta reactivada');
      onCambio();
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'No se pudo cambiar el estado');
    } finally {
      setOcupado(null);
    }
  };

  const quitarDelEquipo = async (integrante) => {
    const emp = integrante.emprendimiento;
    if (!window.confirm(`¿Quitar a ${nombre} del equipo de ${emp?.nombre}? Su usuario no se borra.`)) return;
    setOcupado(`quitar-${integrante.id}`);
    try {
      await api.delete(`/emprendimientos/${emp.id}/integrantes/${integrante.id}`);
      toast.success('Quitado del equipo');
      onCambio();
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'No se pudo quitar del equipo');
    } finally {
      setOcupado(null);
    }
  };

  return (
    <Modal isOpen onClose={onClose} size="lg" title={nombre} descripcion={[rol.label, u.cargo].filter(Boolean).join(' · ')}>
      <div className="space-y-6">
        {!u.activo && (
          <p className="flex items-start gap-2 rounded-control bg-warning-soft px-3 py-2.5 text-sm text-warning-soft-foreground" role="note">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            Cuenta desactivada: no puede iniciar sesión.
          </p>
        )}

        <section aria-labelledby="f-contacto" className="grid gap-2">
          <h3 id="f-contacto" className={SUBTITULO_CLS}>Contacto</h3>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <a href={`mailto:${u.email}`} className="inline-flex min-w-0 items-center gap-2 text-link hover:underline">
              <Mail size={15} className="shrink-0" aria-hidden="true" /><span className="[overflow-wrap:anywhere]">{u.email}</span>
            </a>
            {u.telefono && (
              <a href={`tel:${u.telefono}`} className="inline-flex items-center gap-2 text-link hover:underline">
                <Phone size={15} aria-hidden="true" />{u.telefono}
              </a>
            )}
            {/^https?:\/\//i.test(u.linkedin || '') && (
              <a href={u.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-link hover:underline">
                <Linkedin size={15} aria-hidden="true" />LinkedIn<span className="sr-only"> (se abre en otra pestaña)</span>
              </a>
            )}
          </div>
        </section>

        {u.rol === 'emprendedor' && (
          <section aria-labelledby="f-emp" className="grid gap-2">
            <h3 id="f-emp" className={SUBTITULO_CLS}>Emprendimiento</h3>
            {integrantes.length > 0 ? integrantes.map((int) => (
              <div key={int.id} className="flex items-start justify-between gap-3 rounded-card border border-border p-3">
                <div className="grid min-w-0 gap-1">
                  <Link to={`/emprendimientos/${int.emprendimiento?.id}?tab=equipo`} className="font-semibold text-link hover:underline">
                    {int.emprendimiento?.nombre}
                  </Link>
                  <p className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
                    {int.es_lider && <span className={`${CHIP_CLS} ${FONDO_TONO.programa}`}>Líder</span>}
                    {int.rol_emprendimiento && <span>{int.rol_emprendimiento}</span>}
                    {int.emprendimiento?.programa?.nombre && <span>{int.emprendimiento.programa.nombre}</span>}
                  </p>
                </div>
                <Button variante="ghost" tamanio="sm" icono={UserMinus} cargando={ocupado === `quitar-${int.id}`} onClick={() => quitarDelEquipo(int)}>
                  Quitar
                </Button>
              </div>
            )) : (
              <div className="grid gap-3 rounded-card border border-dashed border-warning-solid/60 p-3">
                <p className="text-sm"><span className="font-semibold">Sin emprendimiento.</span> <span className="text-muted-foreground">No verá sesiones ni seguimiento hasta que lo asignes.</span></p>
                {u.activo
                  ? <AsignarEmprendimiento usuario={u} onAsignado={onCambio} />
                  : <p className="text-[13px] text-muted-foreground">Reactiva la cuenta para asignarlo.</p>}
              </div>
            )}
          </section>
        )}

        <section aria-labelledby="f-datos" className="grid gap-2">
          <h3 id="f-datos" className={SUBTITULO_CLS}>Datos</h3>
          {datos.length > 0 ? (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {datos.map(([etiqueta, valor]) => (
                <div key={etiqueta} className="flex gap-2">
                  <dt className="w-24 shrink-0 text-muted-foreground">{etiqueta}</dt>
                  <dd className="min-w-0 [overflow-wrap:anywhere]">{valor}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Aún no tiene datos personales. Complétalos con «Editar datos».</p>
          )}
        </section>

        <section aria-labelledby="f-acceso" className="grid gap-3">
          <h3 id="f-acceso" className={SUBTITULO_CLS}>Acceso</h3>
          {password && <ContrasenaTemporal password={password} titulo="Nueva contraseña temporal" />}
          {esUnoMismo ? (
            <p className="text-sm text-muted-foreground">
              Tu contraseña la cambias en <Link to="/perfil" className="font-semibold text-link hover:underline">Mi perfil</Link>.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={restablecer} disabled={!!ocupado} className={`${BOTON_SECUNDARIO_CLS} disabled:opacity-60`}>
                <KeyRound size={16} aria-hidden="true" />Restablecer contraseña
              </button>
              <button
                type="button"
                onClick={cambiarEstado}
                disabled={!!ocupado}
                className={`${u.activo ? BOTON_PELIGRO_CLS : BOTON_SECUNDARIO_CLS} disabled:opacity-60`}
              >
                {u.activo ? <UserX size={16} aria-hidden="true" /> : <UserCheck size={16} aria-hidden="true" />}
                {u.activo ? 'Desactivar cuenta' : 'Reactivar cuenta'}
              </button>
            </div>
          )}
        </section>

        <ModalPie>
          <Button variante="ghost" onClick={onClose}>Cerrar</Button>
          <Button icono={Pencil} onClick={onEditar}>Editar datos</Button>
        </ModalPie>
      </div>
    </Modal>
  );
};

export default UsuarioFichaModal;
