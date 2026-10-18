import { useEffect, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal, { ModalPie } from '../Modal';
import Button from '../ui/Button';
import CasillasChip from '../ui/CasillasChip';
import { Field, Input, Textarea } from '../ui/Field';
import { resolveMentorPhotoUrl } from '../../services/media';
import { TEMAS_MENTORIA, SECTORES_MENTORIA, ODS_MENTORIA, listaDe } from '../../constants/mentores';

const URL_VALIDA = /^https?:\/\/\S+$/i;
const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FOTO = 5 * 1024 * 1024;

const desdeMentor = (m) => ({
  nombre: m?.nombre || '',
  apellido: m?.apellido || '',
  linkedin: m?.linkedin || '',
  calendly: m?.calendly || '',
  biografia: m?.biografia || '',
  sesiones: listaDe(m?.sesiones),
  startups: listaDe(m?.startups),
  ods: listaDe(m?.ods)
});

// Crear o editar un mentor (con foto). Se monta al abrirse.
const MentorFormModal = ({ mentor = null, onClose, onGuardado }) => {
  const editando = !!mentor;
  const [form, setForm] = useState(() => desdeMentor(mentor));
  const [foto, setFoto] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState(() => resolveMentorPhotoUrl(mentor?.foto));
  const [intentado, setIntentado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const alternar = (campo) => (valor) => setForm((f) => ({
    ...f,
    [campo]: f[campo].includes(valor) ? f[campo].filter((v) => v !== valor) : [...f[campo], valor]
  }));

  // La vista previa de un archivo local se libera al cambiarla o al cerrar
  useEffect(() => () => {
    if (vistaPrevia?.startsWith('blob:')) URL.revokeObjectURL(vistaPrevia);
  }, [vistaPrevia]);

  const elegirFoto = (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    if (!TIPOS_FOTO.includes(archivo.type) || archivo.size > MAX_FOTO) {
      toast.error('La foto debe ser JPG, PNG, GIF o WEBP de hasta 5 MB');
      e.target.value = '';
      return;
    }
    setFoto(archivo);
    setVistaPrevia(URL.createObjectURL(archivo));
  };

  const errores = {
    nombre: intentado && !form.nombre.trim() ? 'Escribe el nombre' : null,
    apellido: intentado && !form.apellido.trim() ? 'Escribe el apellido' : null,
    linkedin: intentado && !URL_VALIDA.test(form.linkedin.trim()) ? 'Pega el enlace completo, con https://' : null,
    calendly: intentado && form.calendly.trim() && !URL_VALIDA.test(form.calendly.trim()) ? 'Debe empezar por https://' : null
  };

  const guardar = async (e) => {
    e.preventDefault();
    setIntentado(true);
    const f = { ...form, nombre: form.nombre.trim(), apellido: form.apellido.trim(), linkedin: form.linkedin.trim(), calendly: form.calendly.trim() };
    if (!f.nombre || !f.apellido || !URL_VALIDA.test(f.linkedin) || (f.calendly && !URL_VALIDA.test(f.calendly))) return;
    setGuardando(true);
    try {
      const datos = new FormData();
      ['nombre', 'apellido', 'linkedin', 'calendly', 'biografia'].forEach((c) => datos.append(c, f[c]));
      ['sesiones', 'startups', 'ods'].forEach((c) => datos.append(c, JSON.stringify(f[c])));
      if (foto) datos.append('foto', foto);
      const opciones = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (editando) await api.put(`/mentores/${mentor.id}`, datos, opciones);
      else await api.post('/mentores', datos, opciones);
      toast.success(editando ? 'Mentor actualizado' : 'Mentor agregado a la red');
      onGuardado?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} size="lg" title={editando ? `Editar a ${mentor.nombre} ${mentor.apellido}` : 'Nuevo mentor'}
      descripcion={editando ? null : 'Los emprendedores lo verán en la red de mentores y podrán agendar con él.'}>
      <form onSubmit={guardar} className="space-y-6" noValidate>
        <div className="flex flex-wrap items-center gap-4">
          {vistaPrevia ? (
            <img src={vistaPrevia} alt="Vista previa de la foto" className="size-20 shrink-0 rounded-card object-cover" />
          ) : (
            <span className="grid size-20 shrink-0 place-items-center rounded-card border border-dashed border-input bg-muted text-muted-foreground" aria-hidden="true">
              <ImagePlus size={24} />
            </span>
          )}
          <Field label="Foto" ayuda="JPG, PNG, GIF o WEBP, hasta 5 MB. Mejor cuadrada." className="min-w-0 flex-1">
            <Input type="file" accept={TIPOS_FOTO.join(',')} onChange={elegirFoto} className="file:mr-3 file:rounded-control file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium" />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre" requerido error={errores.nombre}>
            <Input value={form.nombre} onChange={cambiar('nombre')} autoComplete="off" />
          </Field>
          <Field label="Apellido" requerido error={errores.apellido}>
            <Input value={form.apellido} onChange={cambiar('apellido')} autoComplete="off" />
          </Field>
          <Field label="LinkedIn" requerido error={errores.linkedin}>
            <Input type="url" inputMode="url" value={form.linkedin} onChange={cambiar('linkedin')} placeholder="https://linkedin.com/in/…" />
          </Field>
          <Field label="Enlace de agenda" ayuda="Calendly u otro. Habilita el botón «Agendar»." error={errores.calendly}>
            <Input type="url" inputMode="url" value={form.calendly} onChange={cambiar('calendly')} placeholder="https://calendly.com/…" />
          </Field>
        </div>

        <Field label="Biografía" ayuda="Experiencia y en qué puede ayudar, en pocas líneas.">
          <Textarea value={form.biografia} onChange={cambiar('biografia')} rows={4} className="min-h-24 resize-y" />
        </Field>

        <CasillasChip etiqueta="Temas que trabaja" opciones={TEMAS_MENTORIA} seleccion={form.sesiones} onAlternar={alternar('sesiones')} />
        <CasillasChip etiqueta="Sectores" opciones={SECTORES_MENTORIA} seleccion={form.startups} onAlternar={alternar('startups')} />
        <CasillasChip etiqueta="ODS en los que se especializa" opciones={ODS_MENTORIA} seleccion={form.ods} onAlternar={alternar('ods')} />

        <ModalPie>
          <Button variante="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" cargando={guardando}>{editando ? 'Guardar cambios' : 'Agregar mentor'}</Button>
        </ModalPie>
      </form>
    </Modal>
  );
};

export default MentorFormModal;
