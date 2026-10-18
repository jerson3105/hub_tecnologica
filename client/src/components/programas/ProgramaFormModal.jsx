import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal, { ModalPie } from '../Modal';
import Button from '../ui/Button';
import { Field, Input, Select, Textarea } from '../ui/Field';
import { ESTADOS_PROGRAMA } from '../../constants/estados';

const VACIO = { nombre: '', descripcion: '', fecha_inicio: '', fecha_fin: '', frecuencia_seguimiento: 'semanal', estado: 'planificado' };

// Crear o editar un programa. Se monta al abrirse, así el formulario parte siempre del programa
// recibido (o vacío). `onGuardado` recibe el programa guardado.
const ProgramaFormModal = ({ programa = null, onClose, onGuardado }) => {
  const editando = !!programa;
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(() => (programa ? {
    nombre: programa.nombre,
    descripcion: programa.descripcion || '',
    fecha_inicio: programa.fecha_inicio,
    fecha_fin: programa.fecha_fin,
    frecuencia_seguimiento: programa.frecuencia_seguimiento,
    estado: programa.estado
  } : VACIO));
  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const { data } = editando
        ? await api.put(`/programas/${programa.id}`, form)
        : await api.post('/programas', form);
      toast.success(editando ? 'Programa actualizado' : 'Programa creado');
      onGuardado?.(data.programa);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={editando ? 'Editar programa' : 'Nuevo programa'} size="lg">
      <form onSubmit={guardar} className="space-y-5">
        <Field label="Nombre" requerido>
          <Input type="text" value={form.nombre} onChange={cambiar('nombre')} placeholder="Ej: Incubación 2026-II" required />
        </Field>
        <Field label="Descripción">
          <Textarea value={form.descripcion} onChange={cambiar('descripcion')} rows={3} className="resize-y" placeholder="Objetivo del programa, a quién va dirigido…" />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Fecha de inicio" requerido>
            <Input type="date" value={form.fecha_inicio} onChange={cambiar('fecha_inicio')} required />
          </Field>
          <Field label="Fecha de fin" requerido>
            <Input type="date" value={form.fecha_fin} min={form.fecha_inicio || undefined} onChange={cambiar('fecha_fin')} required />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Frecuencia de seguimiento">
            <Select value={form.frecuencia_seguimiento} onChange={cambiar('frecuencia_seguimiento')}>
              <option value="semanal">Semanal</option>
              <option value="quincenal">Quincenal</option>
            </Select>
          </Field>
          {editando && (
            <Field label="Estado">
              <Select value={form.estado} onChange={cambiar('estado')}>
                {Object.entries(ESTADOS_PROGRAMA).map(([valor, { label }]) => <option key={valor} value={valor}>{label}</option>)}
              </Select>
            </Field>
          )}
        </div>
        <ModalPie>
          <Button variante="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" cargando={guardando}>{editando ? 'Guardar cambios' : 'Crear programa'}</Button>
        </ModalPie>
      </form>
    </Modal>
  );
};

export default ProgramaFormModal;
