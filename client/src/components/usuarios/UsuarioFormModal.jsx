import { useState } from 'react';
import { Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal, { ModalPie } from '../Modal';
import IntegranteFields from '../IntegranteFields';
import Button from '../ui/Button';
import Segmentado from '../ui/Segmentado';
import { ETIQUETA_CLS } from '../ui/estilos';
import ContrasenaTemporal from './ContrasenaTemporal';
import AsignarEmprendimiento from './AsignarEmprendimiento';
import { DATOS_INTEGRANTE_VACIOS } from '../../constants/integrantes';
import { ROLES_USUARIO } from '../../constants/estados';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const desdeUsuario = (u) => Object.fromEntries(
  [...Object.keys(DATOS_INTEGRANTE_VACIOS), 'rol'].map((campo) => [campo, u[campo] ?? ''])
);

// Crear o editar un usuario. Al crearlo se muestra su contraseña temporal (solo esa vez) y, si es
// emprendedor, se puede asignar a su emprendimiento sin salir. Se monta al abrirse.
const UsuarioFormModal = ({ usuario = null, esUnoMismo = false, onClose, onGuardado }) => {
  const editando = !!usuario;
  const [form, setForm] = useState(() => (usuario ? desdeUsuario(usuario) : { ...DATOS_INTEGRANTE_VACIOS, rol: 'emprendedor' }));
  const [intentado, setIntentado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [creado, setCreado] = useState(null); // { usuario, password }
  const [asignado, setAsignado] = useState(false);
  const setCampo = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  // No se cambia el propio rol, ni el de quien ya está en un equipo (antes hay que quitarlo)
  const conEquipo = (usuario?.integrantes?.length || 0) > 0;
  const rolFijo = esUnoMismo ? 'No puedes cambiar tu propio rol.' : conEquipo ? 'Para pasarlo al equipo técnico, primero quítalo de su emprendimiento.' : null;
  const faltan = ['nombre', 'apellido', 'email'].filter((c) => !String(form[c] || '').trim());
  const emailInvalido = form.email.trim() && !EMAIL_VALIDO.test(form.email.trim());

  const guardar = async (e) => {
    e.preventDefault();
    setIntentado(true);
    if (faltan.length || emailInvalido) {
      toast.error(emailInvalido ? 'Revisa el correo' : 'Nombres, apellidos y correo son obligatorios');
      return;
    }
    setGuardando(true);
    try {
      const datos = { ...form, email: form.email.trim() };
      if (rolFijo) delete datos.rol;
      if (editando) {
        await api.put(`/auth/usuarios/${usuario.id}`, datos);
        toast.success('Datos guardados');
        onGuardado?.();
        onClose();
      } else {
        const { data } = await api.post('/auth/registrar', datos);
        setCreado({ usuario: data.usuario, password: data.passwordTemporal });
        onGuardado?.();
      }
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  };

  if (creado) {
    const nombre = `${creado.usuario.nombre} ${creado.usuario.apellido}`;
    return (
      <Modal isOpen onClose={onClose} size="lg" title="Usuario creado" descripcion={`${nombre} ya puede entrar con su correo y esta contraseña.`}>
        <div className="space-y-5">
          <ContrasenaTemporal password={creado.password} />
          {creado.usuario.rol === 'emprendedor' && (
            <section aria-labelledby="t-asignar" className="grid gap-3 rounded-card border border-border p-4">
              <h3 id="t-asignar" className="text-sm font-semibold">Su emprendimiento</h3>
              {asignado ? (
                <p className="flex items-center gap-2 text-sm text-success"><Check size={16} aria-hidden="true" />Asignado. Ya aparece en el equipo.</p>
              ) : (
                <>
                  <p className="-mt-1 text-[13px] text-muted-foreground">Asígnalo ahora o más tarde desde su ficha o desde el equipo del emprendimiento.</p>
                  <AsignarEmprendimiento usuario={creado.usuario} onAsignado={() => { setAsignado(true); onGuardado?.(); }} />
                </>
              )}
            </section>
          )}
          <ModalPie>
            <Button onClick={onClose}>Listo</Button>
          </ModalPie>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen onClose={onClose} size="lg" title={editando ? `Editar a ${usuario.nombre} ${usuario.apellido}` : 'Nuevo usuario'}
      descripcion={editando ? null : 'Se genera una contraseña temporal que verás al guardar.'}>
      <form onSubmit={guardar} className="space-y-6" noValidate>
        <div>
          <p className={ETIQUETA_CLS}>Rol</p>
          {rolFijo ? (
            <p className="text-sm"><span className="font-semibold">{ROLES_USUARIO[form.rol]?.label}</span><span className="text-muted-foreground"> · {rolFijo}</span></p>
          ) : (
            <>
              <Segmentado
                etiqueta="Rol"
                valor={form.rol}
                onCambiar={(rol) => setCampo('rol', rol)}
                className="w-full"
                opciones={['emprendedor', 'admin'].map((valor) => ({ valor, texto: ROLES_USUARIO[valor].label }))}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                {form.rol === 'admin' ? 'Gestiona programas, sesiones y seguimiento de todos los emprendimientos.' : 'Ve su emprendimiento, sus sesiones y su plan.'}
              </p>
            </>
          )}
        </div>
        <IntegranteFields valores={form} onCambio={setCampo} />
        {intentado && (faltan.length > 0 || emailInvalido) && (
          <p role="alert" className="text-sm text-danger">
            {emailInvalido ? 'El correo no parece válido.' : `Falta: ${faltan.map((c) => ({ nombre: 'nombres', apellido: 'apellidos', email: 'correo' }[c])).join(', ')}.`}
          </p>
        )}
        <ModalPie>
          <Button variante="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" cargando={guardando}>{editando ? 'Guardar cambios' : 'Crear usuario'}</Button>
        </ModalPie>
      </form>
    </Modal>
  );
};

export default UsuarioFormModal;
