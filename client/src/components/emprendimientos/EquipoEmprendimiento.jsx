import { useState } from 'react';
import { UserPlus, UserMinus, Mail, Phone, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import IntegranteModal from './IntegranteModal';
import { TARJETA_CLS, TITULO_BLOQUE_CLS, CHIP_CLS, FONDO_TONO, BOTON_PRIMARIO_CLS, iconoBotonCls } from '../ui/estilosSemanticos';

const iniciales = (u) => `${u?.nombre?.[0] || ''}${u?.apellido?.[0] || ''}`.toUpperCase() || '?';

// Integrantes del emprendimiento. El equipo técnico puede agregar y quitar; el resto solo ve.
const EquipoEmprendimiento = ({ emprendimiento, esAdmin, onCambio }) => {
  const [agregando, setAgregando] = useState(false);
  const integrantes = [...(emprendimiento.integrantes || [])].sort((a, b) => Number(b.es_lider) - Number(a.es_lider));

  const quitar = async (integrante) => {
    const nombre = `${integrante.usuario?.nombre || ''} ${integrante.usuario?.apellido || ''}`.trim() || 'este integrante';
    if (!window.confirm(`¿Quitar a ${nombre} del equipo de ${emprendimiento.nombre}? Su usuario no se borra.`)) return;
    try {
      await api.delete(`/emprendimientos/${emprendimiento.id}/integrantes/${integrante.id}`);
      toast.success('Integrante quitado del equipo');
      onCambio?.();
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'No se pudo quitar al integrante');
    }
  };

  const botonAgregar = esAdmin && (
    <button type="button" onClick={() => setAgregando(true)} className={BOTON_PRIMARIO_CLS}>
      <UserPlus size={16} aria-hidden="true" />Agregar integrante
    </button>
  );

  return (
    <section aria-labelledby="t-equipo" className={`${TARJETA_CLS} @container`}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <h2 id="t-equipo" className={TITULO_BLOQUE_CLS}>Equipo</h2>
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
          {integrantes.map((int) => (
            <li key={int.id} className="flex items-start gap-3 border-b border-border p-4 @2xl:odd:border-r">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-programa-soft text-sm font-semibold text-programa-soft-foreground" aria-hidden="true">
                {iniciales(int.usuario)}
              </span>
              <div className="grid min-w-0 flex-1 gap-1">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  {int.usuario?.nombre} {int.usuario?.apellido}
                  {int.es_lider && <span className={`${CHIP_CLS} ${FONDO_TONO.programa}`}>Líder</span>}
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
              {esAdmin && (
                <button
                  type="button"
                  onClick={() => quitar(int)}
                  className={iconoBotonCls('danger')}
                  aria-label={`Quitar a ${int.usuario?.nombre || 'integrante'} ${int.usuario?.apellido || ''} del equipo`}
                  title="Quitar del equipo"
                >
                  <UserMinus size={16} aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {agregando && <IntegranteModal emprendimiento={emprendimiento} onClose={() => setAgregando(false)} onGuardado={onCambio} />}
    </section>
  );
};

export default EquipoEmprendimiento;
