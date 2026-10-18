import { useState } from 'react';
import { Linkedin, CalendarPlus, Pencil, Archive, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal, { ModalPie } from '../Modal';
import Button from '../ui/Button';
import FotoMentor from './FotoMentor';
import { CHIP_CLS, FONDO_TONO, BOTON_PRIMARIO_CLS, BOTON_SECUNDARIO_CLS, BOTON_PELIGRO_CLS } from '../ui/estilosSemanticos';
import { listaDe } from '../../constants/mentores';

const SUBTITULO_CLS = 'text-xs font-semibold uppercase tracking-wide text-muted-foreground';
const esEnlace = (url) => /^https?:\/\//i.test(url || '');

const Etiquetas = ({ id, titulo, items, tono }) => items.length > 0 && (
  <section aria-labelledby={id} className="grid gap-2">
    <h3 id={id} className={SUBTITULO_CLS}>{titulo}</h3>
    <ul className="flex flex-wrap gap-1.5">
      {items.map((t) => <li key={t} className={`${CHIP_CLS} ${FONDO_TONO[tono]}`}>{t}</li>)}
    </ul>
  </section>
);

// Ficha del mentor. El emprendedor ve todo su perfil y agenda; el equipo técnico además edita
// y desactiva o reactiva (desactivar lo oculta a los emprendedores, no lo borra).
const MentorFichaModal = ({ mentor: m, esAdmin, onClose, onEditar, onCambio }) => {
  const [ocupado, setOcupado] = useState(false);
  const nombre = `${m.nombre} ${m.apellido}`;

  const cambiarEstado = async () => {
    if (m.activo && !window.confirm(`¿Desactivar a ${nombre}? Dejará de aparecer para los emprendedores; podrás reactivarlo.`)) return;
    setOcupado(true);
    try {
      if (m.activo) await api.delete(`/mentores/${m.id}`);
      else await api.put(`/mentores/${m.id}`, { activo: true });
      toast.success(m.activo ? 'Mentor desactivado' : 'Mentor reactivado');
      onCambio();
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'No se pudo cambiar el estado');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} size="lg" title={nombre} descripcion={m.activo ? 'Mentor de la red' : 'Inactivo: los emprendedores no lo ven'}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <FotoMentor mentor={m} tamanio="lg" />
          <div className="flex flex-wrap gap-2">
            {m.activo && esEnlace(m.calendly) && (
              <a href={m.calendly} target="_blank" rel="noopener noreferrer" className={BOTON_PRIMARIO_CLS}>
                <CalendarPlus size={16} aria-hidden="true" />Agendar sesión<span className="sr-only"> (se abre en otra pestaña)</span>
              </a>
            )}
            {esEnlace(m.linkedin) && (
              <a href={m.linkedin} target="_blank" rel="noopener noreferrer" className={BOTON_SECUNDARIO_CLS}>
                <Linkedin size={16} aria-hidden="true" />LinkedIn<span className="sr-only"> (se abre en otra pestaña)</span>
              </a>
            )}
          </div>
        </div>
        {!esEnlace(m.calendly) && (
          <p className="-mt-3 text-[13px] text-muted-foreground">
            {esAdmin ? 'Sin enlace de agenda: los emprendedores solo pueden escribirle por LinkedIn.' : 'Aún no tiene agenda en línea: escríbele por LinkedIn.'}
          </p>
        )}

        {m.biografia && (
          <section aria-labelledby="m-bio" className="grid gap-2">
            <h3 id="m-bio" className={SUBTITULO_CLS}>Sobre {m.nombre}</h3>
            <p className="whitespace-pre-line text-sm leading-relaxed">{m.biografia}</p>
          </section>
        )}
        <Etiquetas id="m-temas" titulo="Temas que trabaja" items={listaDe(m.sesiones)} tono="info" />
        <Etiquetas id="m-sectores" titulo="Sectores" items={listaDe(m.startups)} tono="success" />
        <Etiquetas id="m-ods" titulo="ODS" items={listaDe(m.ods)} tono="programa" />

        <ModalPie>
          <Button variante="ghost" onClick={onClose}>Cerrar</Button>
          {esAdmin && (
            <>
              <button type="button" onClick={cambiarEstado} disabled={ocupado} className={`${m.activo ? BOTON_PELIGRO_CLS : BOTON_SECUNDARIO_CLS} disabled:opacity-60`}>
                {m.activo ? <Archive size={16} aria-hidden="true" /> : <RotateCcw size={16} aria-hidden="true" />}
                {m.activo ? 'Desactivar' : 'Reactivar'}
              </button>
              <Button icono={Pencil} onClick={onEditar}>Editar</Button>
            </>
          )}
        </ModalPie>
      </div>
    </Modal>
  );
};

export default MentorFichaModal;
