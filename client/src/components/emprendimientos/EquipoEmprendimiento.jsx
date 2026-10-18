import { useState } from 'react';
import { UserPlus, UserMinus, Mail, Phone, Users, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal, { ModalPie } from '../Modal';
import Button from '../ui/Button';
import IntegranteModal from './IntegranteModal';
import ContrasenaTemporal from '../usuarios/ContrasenaTemporal';
import { TARJETA_CLS, TITULO_BLOQUE_CLS, CHIP_CLS, FONDO_TONO, BOTON_PRIMARIO_CLS, iconoBotonCls } from '../ui/estilosSemanticos';

const iniciales = (u) => `${u?.nombre?.[0] || ''}${u?.apellido?.[0] || ''}`.toUpperCase() || '?';
const nombreDe = (int) => `${int.usuario?.nombre || ''} ${int.usuario?.apellido || ''}`.trim() || 'este integrante';

// Integrantes del emprendimiento. Gestionan el equipo técnico (agrega usuarios existentes o nuevos)
// y el líder (solo crea cuentas nuevas): quitar a alguien y darle una contraseña temporal nueva.
// Nadie se gestiona a sí mismo desde aquí. El resto del equipo solo ve.
const EquipoEmprendimiento = ({ emprendimiento, esAdmin, esLider = false, usuarioId, onCambio }) => {
  const [agregando, setAgregando] = useState(false);
  const [password, setPassword] = useState(null); // { nombre, password }
  const [ocupado, setOcupado] = useState(null);
  const gestiona = esAdmin || esLider;
  const integrantes = [...(emprendimiento.integrantes || [])].sort((a, b) => Number(b.es_lider) - Number(a.es_lider));

  const quitar = async (int) => {
    if (!window.confirm(`¿Quitar a ${nombreDe(int)} del equipo de ${emprendimiento.nombre}? Su cuenta no se borra.`)) return;
    setOcupado(`q${int.id}`);
    try {
      await api.delete(`/emprendimientos/${emprendimiento.id}/integrantes/${int.id}`);
      toast.success('Integrante quitado del equipo');
      onCambio?.();
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'No se pudo quitar al integrante');
    } finally {
      setOcupado(null);
    }
  };

  const restablecer = async (int) => {
    if (!window.confirm(`¿Generar una contraseña temporal nueva para ${nombreDe(int)}? La actual dejará de funcionar.`)) return;
    setOcupado(`p${int.id}`);
    try {
      const { data } = await api.post(`/emprendimientos/${emprendimiento.id}/integrantes/${int.id}/resetear-password`);
      setPassword({ nombre: nombreDe(int), password: data.passwordTemporal });
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'No se pudo generar la contraseña');
    } finally {
      setOcupado(null);
    }
  };

  const botonAgregar = gestiona && (
    <button type="button" onClick={() => setAgregando(true)} className={BOTON_PRIMARIO_CLS}>
      <UserPlus size={16} aria-hidden="true" />Agregar integrante
    </button>
  );

  return (
    <section aria-labelledby="t-equipo" className={`${TARJETA_CLS} @container`}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div>
          <h2 id="t-equipo" className={TITULO_BLOQUE_CLS}>Equipo</h2>
          {esLider && !esAdmin && <p className="text-[13px] text-muted-foreground">Como líder puedes sumar integrantes y darles una contraseña nueva si la olvidan.</p>}
        </div>
        {integrantes.length > 0 && botonAgregar}
      </div>
      {integrantes.length === 0 ? (
        <div className="grid justify-items-center gap-3 border-t border-border px-5 py-10 text-center">
          <span className="grid size-12 place-items-center rounded-card bg-muted text-muted-foreground"><Users size={24} aria-hidden="true" /></span>
          <p className="font-semibold">Aún no hay integrantes</p>
          {esAdmin && <p className="text-sm text-muted-foreground">Asigna un emprendedor existente o crea su usuario.</p>}
          {botonAgregar}
        </div>
      ) : (
        <ul className="grid border-t border-border @2xl:grid-cols-2">
          {integrantes.map((int) => {
            const yo = int.usuario_id === usuarioId;
            const nombre = nombreDe(int);
            return (
              <li key={int.id} className="flex items-start gap-3 border-b border-border p-4 @2xl:odd:border-r">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-programa-soft text-sm font-semibold text-programa-soft-foreground" aria-hidden="true">
                  {iniciales(int.usuario)}
                </span>
                <div className="grid min-w-0 flex-1 gap-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    {nombre}
                    {int.es_lider && <span className={`${CHIP_CLS} ${FONDO_TONO.programa}`}>Líder</span>}
                    {yo && <span className={`${CHIP_CLS} ${FONDO_TONO.neutral}`}>Tú</span>}
                  </p>
                  {int.rol_emprendimiento && <p className="text-[13px] text-muted-foreground">{int.rol_emprendimiento}</p>}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                    {int.usuario?.email && (
                      <a href={`mailto:${int.usuario.email}`} className="inline-flex min-w-0 items-center gap-1.5 text-link hover:underline">
                        <Mail size={13} className="shrink-0" aria-hidden="true" /><span className="truncate">{int.usuario.email}</span>
                      </a>
                    )}
                    {int.usuario?.telefono && (
                      <a href={`tel:${int.usuario.telefono}`} className="inline-flex items-center gap-1.5 text-link hover:underline">
                        <Phone size={13} aria-hidden="true" />{int.usuario.telefono}
                      </a>
                    )}
                  </div>
                </div>
                {gestiona && !yo && (
                  <div className="flex shrink-0">
                    <button type="button" onClick={() => restablecer(int)} disabled={!!ocupado} className={iconoBotonCls()} title="Contraseña temporal nueva">
                      <KeyRound size={16} aria-hidden="true" /><span className="sr-only">Generar una contraseña temporal nueva para {nombre}</span>
                    </button>
                    <button type="button" onClick={() => quitar(int)} disabled={!!ocupado} className={iconoBotonCls('danger')} title="Quitar del equipo">
                      <UserMinus size={16} aria-hidden="true" /><span className="sr-only">Quitar a {nombre} del equipo</span>
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {agregando && (
        <IntegranteModal emprendimiento={emprendimiento} soloNuevo={!esAdmin} onClose={() => setAgregando(false)} onGuardado={onCambio} />
      )}
      {password && (
        <Modal isOpen onClose={() => setPassword(null)} size="md" title="Contraseña temporal nueva" descripcion={`${password.nombre} ya puede entrar con su correo y esta contraseña.`}>
          <div className="space-y-5">
            <ContrasenaTemporal password={password.password} />
            <ModalPie><Button onClick={() => setPassword(null)}>Listo</Button></ModalPie>
          </div>
        </Modal>
      )}
    </section>
  );
};

export default EquipoEmprendimiento;
