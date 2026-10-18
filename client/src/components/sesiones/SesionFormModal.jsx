import { useState } from 'react';
import { Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal, { ModalPie } from '../Modal';
import Button from '../ui/Button';
import Segmentado from '../ui/Segmentado';
import { Field, Input, Select, Textarea } from '../ui/Field';
import { ETIQUETA_CLS } from '../ui/estilos';
import { useProgramas } from '../../hooks/useQueryHooks';
import { TIPOS_CREABLES, TIPOS_SESION, MODALIDADES } from '../../constants/sesiones';
import { hora } from '../../utils/sesiones';
import { esFutura } from '../../utils/fechas';

const hoyIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const desdeSesion = (s) => ({
  programa_ids: s.programas?.map((p) => p.id) || (s.programa?.id ? [s.programa.id] : []),
  tipo: s.tipo,
  titulo: s.titulo,
  descripcion: s.descripcion || '',
  fecha: s.fecha,
  hora_inicio: hora(s.hora_inicio),
  hora_fin: hora(s.hora_fin),
  modalidad: s.modalidad || '',
  lugar: s.lugar || '',
  enlace_reunion: s.enlace_reunion || '',
  enlace_grabacion: s.enlace_grabacion || ''
});

// Crear o editar una sesión. Se monta al abrirse. No se preselecciona programa (salvo que se
// llegue desde uno): elegirlo por descuido dejaba la sesión en el programa equivocado.
const SesionFormModal = ({ sesion = null, programaInicial = null, onClose, onGuardado }) => {
  const editando = !!sesion;
  const { data: programas = [] } = useProgramas();
  const [guardando, setGuardando] = useState(false);
  const [intentado, setIntentado] = useState(false);
  const [form, setForm] = useState(() => (sesion ? desdeSesion(sesion) : {
    programa_ids: programaInicial ? [Number(programaInicial)] : [],
    tipo: 'uno_a_uno_programa',
    titulo: '', descripcion: '', fecha: '', hora_inicio: '', hora_fin: '',
    modalidad: '', lugar: '', enlace_reunion: '', enlace_grabacion: ''
  }));
  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const alternarPrograma = (id) => setForm((f) => ({
    ...f,
    programa_ids: f.programa_ids.includes(id) ? f.programa_ids.filter((p) => p !== id) : [...f.programa_ids, id]
  }));

  const visibles = programas.filter((p) => p.activo !== false || form.programa_ids.includes(p.id));
  const tipos = editando && !TIPOS_CREABLES.includes(form.tipo) ? [form.tipo, ...TIPOS_CREABLES] : TIPOS_CREABLES;
  const conLugar = ['presencial', 'hibrida'].includes(form.modalidad);
  const conEnlace = ['virtual', 'hibrida'].includes(form.modalidad);
  const errorProgramas = intentado && form.programa_ids.length === 0 ? 'Elige al menos un programa' : null;
  const errorHoras = form.hora_inicio && form.hora_fin && form.hora_fin <= form.hora_inicio ? 'Debe ser posterior a la hora de inicio' : null;
  const errorTitulo = intentado && !form.titulo.trim() ? 'Escribe un título' : null;
  const errorFecha = intentado && !form.fecha ? 'Elige la fecha' : null;
  const fechaPasada = !editando && form.fecha && form.fecha < hoyIso();

  const guardar = async (e) => {
    e.preventDefault();
    setIntentado(true);
    if (form.programa_ids.length === 0 || errorHoras || !form.titulo.trim() || !form.fecha) return;
    setGuardando(true);
    try {
      const datos = {
        ...form,
        // Lo que no aplica a la modalidad elegida no se guarda
        lugar: conLugar ? form.lugar : '',
        enlace_reunion: conEnlace ? form.enlace_reunion : ''
      };
      const { data } = editando ? await api.put(`/sesiones/${sesion.id}`, datos) : await api.post('/sesiones', datos);
      toast.success(editando ? 'Sesión actualizada' : 'Sesión creada');
      onGuardado?.(data.sesion);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} size="lg" title={editando ? 'Editar sesión' : 'Nueva sesión'}
      descripcion={editando ? null : 'Al crearla, cada emprendimiento de los programas elegidos queda listo para registrar su seguimiento.'}>
      <form onSubmit={guardar} className="space-y-5" noValidate>
        <fieldset aria-describedby={errorProgramas ? 'error-programas' : undefined}>
          <legend className={ETIQUETA_CLS}>Programas <span className="text-danger" aria-hidden="true">*</span></legend>
          <div className="flex flex-wrap gap-2">
            {visibles.map((p) => {
              const activo = form.programa_ids.includes(p.id);
              return (
                <label
                  key={p.id}
                  className={`inline-flex min-h-10 cursor-pointer select-none items-center gap-2 rounded-control border px-3 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${
                    activo ? 'border-primary bg-info-soft font-medium text-foreground' : 'border-input text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <input type="checkbox" checked={activo} onChange={() => alternarPrograma(p.id)} className="sr-only" />
                  <span className={`grid size-4 place-items-center rounded-[4px] border ${activo ? 'border-primary bg-primary text-primary-foreground' : 'border-input'}`} aria-hidden="true">
                    {activo && <Check size={11} strokeWidth={3} />}
                  </span>
                  {p.nombre}
                </label>
              );
            })}
          </div>
          {errorProgramas && <p id="error-programas" role="alert" className="mt-1.5 text-xs text-danger">{errorProgramas}</p>}
        </fieldset>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
          <Field label="Tipo" requerido>
            <Select value={form.tipo} onChange={cambiar('tipo')}>
              {tipos.map((t) => <option key={t} value={t}>{TIPOS_SESION[t]?.label || t}</option>)}
            </Select>
          </Field>
          <Field label="Título" requerido error={errorTitulo}>
            <Input type="text" value={form.titulo} onChange={cambiar('titulo')} placeholder={form.tipo === 'taller' ? 'Ej: Taller de costos' : 'Ej: Ronda 1 a 1 #7'} required />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Fecha" requerido error={errorFecha} ayuda={fechaPasada ? 'Fecha pasada: quedará como realizada y pendiente de registro.' : undefined}>
            <Input type="date" value={form.fecha} onChange={cambiar('fecha')} required />
          </Field>
          <Field label="Hora de inicio">
            <Input type="time" value={form.hora_inicio} onChange={cambiar('hora_inicio')} step={300} />
          </Field>
          <Field label="Hora de fin" error={errorHoras}>
            <Input type="time" value={form.hora_fin} onChange={cambiar('hora_fin')} step={300} min={form.hora_inicio || undefined} />
          </Field>
        </div>

        <div className="grid gap-3">
          <span className={ETIQUETA_CLS} aria-hidden="true">Modalidad</span>
          <Segmentado
            etiqueta="Modalidad"
            valor={form.modalidad}
            onCambiar={(valor) => setForm((f) => ({ ...f, modalidad: valor }))}
            className="w-full overflow-x-auto [scrollbar-width:none]"
            opciones={[{ valor: '', texto: 'Por definir' }, ...Object.entries(MODALIDADES).map(([valor, m]) => ({ valor, texto: m.label }))]}
          />
          {(conLugar || conEnlace) && (
            <div className={`grid gap-4 ${conLugar && conEnlace ? 'sm:grid-cols-2' : ''}`}>
              {conLugar && (
                <Field label="Lugar">
                  <Input type="text" value={form.lugar} onChange={cambiar('lugar')} placeholder="Ej: Cámara de Comercio de Ica" maxLength={200} />
                </Field>
              )}
              {conEnlace && (
                <Field label="Enlace de la reunión" ayuda="Meet, Zoom o Teams. Aparecerá el botón «Unirse».">
                  <Input type="url" value={form.enlace_reunion} onChange={cambiar('enlace_reunion')} placeholder="https://" />
                </Field>
              )}
            </div>
          )}
        </div>

        <Field label="Descripción" ayuda="Objetivo o agenda de la sesión (opcional).">
          <Textarea value={form.descripcion} onChange={cambiar('descripcion')} rows={3} className="resize-y" />
        </Field>

        {editando && !esFutura(form.fecha) && (
          <Field label="Enlace de la grabación">
            <Input type="url" value={form.enlace_grabacion} onChange={cambiar('enlace_grabacion')} placeholder="https://" />
          </Field>
        )}

        <ModalPie>
          <Button variante="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" cargando={guardando}>{editando ? 'Guardar cambios' : 'Crear sesión'}</Button>
        </ModalPie>
      </form>
    </Modal>
  );
};

export default SesionFormModal;
