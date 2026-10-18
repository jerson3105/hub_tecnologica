import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal, { ModalPie } from '../Modal';
import Button from '../ui/Button';
import { Field, Input, Select, Textarea } from '../ui/Field';
import { useProgramas } from '../../hooks/useQueryHooks';
import { ESTADOS_EMPRENDIMIENTO } from '../../constants/estados';

// Crear o editar un emprendimiento. Se monta al abrirse, así el formulario parte siempre del
// emprendimiento recibido (o vacío). Al crear no se preselecciona programa: elegir uno por
// descuido dejaba el emprendimiento en el programa equivocado.
const EmprendimientoFormModal = ({ emprendimiento = null, programaInicial = '', onClose, onGuardado }) => {
  const editando = !!emprendimiento;
  const { data: programas = [] } = useProgramas();
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(() => (emprendimiento ? {
    nombre: emprendimiento.nombre,
    descripcion: emprendimiento.descripcion || '',
    sector: emprendimiento.sector || '',
    programa_id: emprendimiento.programa_id || emprendimiento.programa?.id || '',
    estado: emprendimiento.estado || 'activo'
  } : { nombre: '', descripcion: '', sector: '', programa_id: programaInicial, estado: 'activo' }));
  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const { data } = editando
        ? await api.put(`/emprendimientos/${emprendimiento.id}`, form)
        : await api.post('/emprendimientos', form);
      toast.success(editando ? 'Emprendimiento actualizado' : 'Emprendimiento creado');
      onGuardado?.(data.emprendimiento);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const activos = programas.filter((p) => p.activo !== false || String(p.id) === String(form.programa_id));

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={editando ? 'Editar emprendimiento' : 'Nuevo emprendimiento'}
      descripcion={editando ? null : 'Después podrás agregar a su equipo desde la pestaña Equipo.'}
    >
      <form onSubmit={guardar} className="space-y-5">
        <Field label="Nombre" requerido>
          <Input type="text" value={form.nombre} onChange={cambiar('nombre')} placeholder="Ej: AgroIca" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Programa" requerido>
            <Select value={form.programa_id} onChange={cambiar('programa_id')}>
              <option value="">Selecciona un programa</option>
              {activos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </Select>
          </Field>
          <Field label="Sector">
            <Input type="text" value={form.sector} onChange={cambiar('sector')} placeholder="Ej: Agroindustria" />
          </Field>
        </div>
        <Field label="Descripción" ayuda="Qué hace y para quién, en una o dos frases.">
          <Textarea value={form.descripcion} onChange={cambiar('descripcion')} rows={3} className="resize-y" />
        </Field>
        {editando && (
          <Field label="Estado" ayuda="Un emprendimiento retirado deja de aparecer en la cartera y en las sesiones nuevas.">
            <Select value={form.estado} onChange={cambiar('estado')}>
              {Object.entries(ESTADOS_EMPRENDIMIENTO).map(([valor, { label }]) => <option key={valor} value={valor}>{label}</option>)}
            </Select>
          </Field>
        )}
        <ModalPie>
          <Button variante="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" cargando={guardando}>{editando ? 'Guardar cambios' : 'Crear emprendimiento'}</Button>
        </ModalPie>
      </form>
    </Modal>
  );
};

export default EmprendimientoFormModal;
